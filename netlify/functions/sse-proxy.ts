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

const buildCorsHeaders = (origin?: string | null) => {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Cache-Control, Accept, Authorization",
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

const upstreamUrl = (path: string, queryString: string) =>
  `${TARGET_API_BASE.replace(/\/$/, "")}${path}${queryString}`;

const isSseRequest = (event: any) => {
  const acceptHeader =
    event.headers?.["accept"] || event.headers?.["Accept"] || "";
  return acceptHeader.includes("text/event-stream");
};

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

  let path = event.path ?? "";
  if (path.startsWith("/.netlify/functions/sse-proxy")) {
    path = path.replace(/^\/.netlify\/functions\/sse-proxy/, "");
  }
  if (path.startsWith("/sse")) {
    path = path.replace(/^\/sse/, "");
  }
  if (!path.startsWith("/")) {
    path = `/${path}`;
  }

  const queryString = event.rawQuery ? `?${event.rawQuery}` : "";
  const target = upstreamUrl(path, queryString);

  if (isSseRequest(event)) {
    try {
      const response = await fetch(target, {
        method: method,
        headers: {
          Cookie: `JSESSIONID=${sessionId}`,
          Accept: "text/event-stream",
          "Cache-Control": "no-cache",
        },
      });

      if (!response.ok) {
        return {
          statusCode: response.status,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ error: "sse_upstream_error" }),
        };
      }

      const reader = response.body?.getReader();
      if (!reader) {
        return {
          statusCode: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ error: "sse_no_body" }),
        };
      }

      const chunks: Uint8Array[] = [];
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          chunks.push(value);
        }
      }

      const payload = Buffer.concat(chunks).toString("utf-8");

      return {
        statusCode: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
        body: payload,
      };
    } catch (error: any) {
      console.error("SSE proxy error:", error?.message);
      return {
        statusCode: 504,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ error: "sse_proxy_error", message: error?.message }),
      };
    }
  }

  const upstreamHeaders = new Headers({
    Cookie: `JSESSIONID=${sessionId}`,
  });

  Object.entries(event.headers || {}).forEach(([key, value]) => {
    if (!value) return;
    const lower = key.toLowerCase();
    if (["host", "authorization", "cookie"].includes(lower)) return;
    upstreamHeaders.set(key, value);
  });

  const init: RequestInit = { method, headers: upstreamHeaders };

  if (method !== "GET" && method !== "HEAD" && event.body) {
    init.body = event.isBase64Encoded
      ? Buffer.from(event.body, "base64")
      : event.body;
  }

  try {
    const response = await fetch(target, init);
    const bufferedBody = Buffer.from(await response.arrayBuffer());

    const headers = new Headers(corsHeaders);
    headers.set(
      "Content-Type",
      response.headers.get("content-type") ?? "application/json"
    );

    return {
      statusCode: response.status,
      headers: Object.fromEntries(headers.entries()),
      body: bufferedBody.toString("base64"),
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
};
