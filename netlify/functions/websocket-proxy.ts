import type { Handler } from "@netlify/functions";

const TARGET_WS_BASE =
  process.env.TARGET_WS_BASE ?? "ws://35.230.168.225:8082";
const TARGET_API_BASE =
  process.env.TARGET_API_BASE ?? "http://35.230.168.225:8082/api";

const ALLOWED_ORIGINS = [
  "https://dashboard-trackmax-web.web.app",
  "https://dashboard-trackmax.netlify.app",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
];

const buildCorsHeaders = (origin?: string | null) => {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Accept, Authorization, Upgrade, Connection, Sec-WebSocket-Key, Sec-WebSocket-Version, Sec-WebSocket-Protocol",
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

export const handler: Handler = async (event) => {
  const method = (event.httpMethod || "GET").toUpperCase();
  const origin = event.headers?.origin || event.headers?.Origin || null;
  const corsHeaders = buildCorsHeaders(origin);

  if (method === "OPTIONS") {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: "",
    };
  }

  const sessionId = getSessionId(event.headers?.cookie);
  if (!sessionId) {
    return {
      statusCode: 401,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ error: "not_authenticated" }),
    };
  }

  const upgradeHeader =
    event.headers?.["upgrade"] || event.headers?.["Upgrade"] || "";
  const isWebSocketUpgrade = upgradeHeader.toLowerCase() === "websocket";

  if (isWebSocketUpgrade) {
    return handleWebSocketUpgrade(event, corsHeaders, sessionId);
  }

  return handleHttpRequest(event, corsHeaders, sessionId);
};

async function handleWebSocketUpgrade(
  event: any,
  corsHeaders: Record<string, string>,
  sessionId: string
) {
  try {
    let path = event.path ?? "";
    if (path.startsWith("/.netlify/functions/websocket-proxy")) {
      path = path.replace(/^\/.netlify\/functions\/websocket-proxy/, "");
    }
    if (path.startsWith("/ws")) {
      path = path.replace(/^\/ws/, "");
    }
    if (!path.startsWith("/")) {
      path = `/${path}`;
    }

    const queryString = event.rawQuery ? `?${event.rawQuery}` : "";
    const targetUrl = `${TARGET_WS_BASE.replace(/\/$/, "")}${path}${queryString}`;

    return {
      statusCode: 426,
      headers: {
        ...corsHeaders,
        Upgrade: "websocket",
        Connection: "Upgrade",
        "Set-Cookie": `trackmax.sid=${sessionId}; HttpOnly; Secure; SameSite=None; Path=/`,
      },
      body: JSON.stringify({
        message: "WebSocket upgrade requested",
        targetUrl,
        note: "Estabeleça conexão direta utilizando o mesmo cookie de sessão.",
      }),
    };
  } catch (error: any) {
    console.error("WebSocket proxy error:", error?.message);
    return {
      statusCode: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ error: "websocket_proxy_error", message: error?.message }),
    };
  }
}

async function handleHttpRequest(
  event: any,
  corsHeaders: Record<string, string>,
  sessionId: string
) {
  const method = (event.httpMethod || "GET").toUpperCase();
  let path = event.path ?? "";
  if (path.startsWith("/.netlify/functions/websocket-proxy")) {
    path = path.replace(/^\/.netlify\/functions\/websocket-proxy/, "");
  }
  if (path.startsWith("/ws")) {
    path = path.replace(/^\/ws/, "");
  }
  if (!path.startsWith("/")) {
    path = `/${path}`;
  }

  const queryString = event.rawQuery ? `?${event.rawQuery}` : "";
  const targetUrl = `${TARGET_API_BASE.replace(/\/$/, "")}${path}${queryString}`;

  const headers = new Headers({
    Cookie: `JSESSIONID=${sessionId}`,
  });

  Object.entries(event.headers || {}).forEach(([key, value]) => {
    if (!value) return;
    const lower = key.toLowerCase();
    if (["host", "authorization", "cookie"].includes(lower)) return;
    headers.set(key, value);
  });

  const init: RequestInit = { method, headers };

  if (!isBodyless(method) && event.body) {
    init.body = event.isBase64Encoded
      ? Buffer.from(event.body, "base64")
      : event.body;
  }

  try {
    const response = await fetch(targetUrl, init);
    const bodyBuffer = Buffer.from(await response.arrayBuffer());
    const headersOut = new Headers(corsHeaders);
    headersOut.set(
      "Content-Type",
      response.headers.get("content-type") ?? "application/json"
    );

    return {
      statusCode: response.status,
      headers: Object.fromEntries(headersOut.entries()),
      body: bodyBuffer.toString("base64"),
      isBase64Encoded: true,
    };
  } catch (error: any) {
    console.error("HTTP proxy error:", error?.message);
    return {
      statusCode: 504,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ error: "http_proxy_error", message: error?.message }),
    };
  }
}
