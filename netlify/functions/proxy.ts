import type { Handler } from "@netlify/functions";

const TARGET_API_BASE =
  process.env.TARGET_API_BASE ?? "http://35.230.168.225:8082/api";

const ALLOWED_ORIGINS = [
  "https://dashboard-trackmax-web.web.app",
  "https://dashboard-trackmax.netlify.app",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
];

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 60;

type RateBucket = {
  count: number;
  resetAt: number;
};

const rateBuckets = new Map<string, RateBucket>();

const buildCorsHeaders = (origin?: string | null) => {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept, Authorization, X-Requested-With, Origin",
    "Access-Control-Allow-Credentials": "true",
    "Vary": "Origin",
  };

  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  } else if (!origin) {
    headers["Access-Control-Allow-Origin"] = "null";
  } else {
    headers["Access-Control-Allow-Origin"] = ALLOWED_ORIGINS[0];
  }

  // Log para debug
  console.log("CORS headers built", { origin, headers });
  return headers;
};

const parseCookies = (cookieHeader?: string) => {
  if (!cookieHeader) return {};
  return cookieHeader.split(";").reduce<Record<string, string>>((acc, pair) => {
    const [key, ...rest] = pair.trim().split("=");
    if (!key) return acc;
    acc[key] = rest.join("=");
    return acc;
  }, {});
};

const getSessionId = (cookieHeader?: string) => {
  const cookies = parseCookies(cookieHeader);
  return cookies["trackmax.sid"];
};

const isBodyless = (method: string) => method === "GET" || method === "HEAD";

const checkRateLimit = (key: string): { allowed: boolean; retryAfter?: number } => {
  const now = Date.now();
  const bucket = rateBuckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    rateBuckets.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }

  if (bucket.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count += 1;
  return { allowed: true };
};

const createTimeoutController = (timeoutMs: number) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  return { controller, timeout };
};

export const handler: Handler = async (event) => {
  const method = (event.httpMethod || "GET").toUpperCase();
  const origin = event.headers?.origin || event.headers?.Origin || null;
  const corsHeaders = buildCorsHeaders(origin);

  if (method === "OPTIONS") {
    // Log para debug
    console.log("OPTIONS request received", { origin, corsHeaders });
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: "",
    };
  }

  const clientIp =
    event.headers["x-nf-client-connection-ip"] ||
    event.headers["x-forwarded-for"] ||
    event.headers["client-ip"] ||
    "unknown";
  const rateKey = `${clientIp}:${event.path}`;
  const rateStatus = checkRateLimit(rateKey);
  if (!rateStatus.allowed) {
    return {
      statusCode: 429,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Retry-After": String(rateStatus.retryAfter ?? 60),
      },
      body: JSON.stringify({
        error: "rate_limit_exceeded",
        message: "Too many requests",
      }),
    };
  }

  let path = event.path ?? "";
  if (path.startsWith("/.netlify/functions/proxy")) {
    path = path.replace(/^\/.netlify\/functions\/proxy/, "");
  }
  if (path.startsWith("/api")) {
    path = path.replace(/^\/api/, "");
  }
  if (!path.startsWith("/")) {
    path = `/${path}`;
  }

  const queryString = event.rawQuery ? `?${event.rawQuery}` : "";
  const targetUrl = `${TARGET_API_BASE.replace(/\/$/, "")}${path}${queryString}`;

  const upstreamHeaders = new Headers();

  // Replicar cabeçalhos seguros
  Object.entries(event.headers || {}).forEach(([key, value]) => {
    if (!value) return;
    const lowerKey = key.toLowerCase();
    if (["host", "cookie"].includes(lowerKey)) {
      return;
    }
    upstreamHeaders.set(key, value);
  });

  const sessionId = getSessionId(event.headers?.cookie);
  if (sessionId) {
    upstreamHeaders.set("Cookie", `JSESSIONID=${sessionId}`);
  }

  const init: RequestInit = { method, headers: upstreamHeaders };

  if (!isBodyless(method) && event.body) {
    init.body = event.isBase64Encoded
      ? Buffer.from(event.body, "base64")
      : event.body;
  }

  const { controller, timeout } = createTimeoutController(15_000);
  init.signal = controller.signal;

  try {
    const response = await fetch(targetUrl, init);
    clearTimeout(timeout);

    const responseHeaders = new Headers();
    responseHeaders.set("Content-Type", response.headers.get("content-type") ?? "application/json");
    Object.entries(corsHeaders).forEach(([key, value]) => {
      responseHeaders.set(key, value);
    });

    // Propagar e atualizar sessão se necessário
    const upstreamSetCookie = response.headers.get("set-cookie");
    if (upstreamSetCookie) {
      const match = upstreamSetCookie.match(/JSESSIONID=([^;]+)/);
      if (match) {
        responseHeaders.append(
          "Set-Cookie",
          `trackmax.sid=${match[1]}; HttpOnly; Secure; SameSite=None; Path=/`
        );
      }
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    return {
      statusCode: response.status,
      headers: Object.fromEntries(responseHeaders.entries()),
      body: buffer.toString("base64"),
      isBase64Encoded: true,
    };
  } catch (error: any) {
    clearTimeout(timeout);
    const message = error?.name === "AbortError" ? "Upstream request timed out" : error?.message;
    console.error("Netlify proxy error:", message);
    return {
      statusCode: 504,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        error: "proxy_error",
        message,
        targetUrl,
      }),
    };
  }
};
