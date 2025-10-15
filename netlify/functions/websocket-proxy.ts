import type { Handler } from "@netlify/functions";

const TARGET_WS_BASE = process.env.TARGET_WS_BASE ?? "ws://35.230.168.225:8082";
const TARGET_API_BASE = process.env.TARGET_API_BASE ?? "http://35.230.168.225:8082/api";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, Upgrade, Connection, Sec-WebSocket-Key, Sec-WebSocket-Version, Sec-WebSocket-Protocol",
  "Access-Control-Allow-Credentials": "true",
};

const isBodyless = (method: string) => method === "GET" || method === "HEAD";

export const handler: Handler = async (event) => {
  const method = (event.httpMethod || "GET").toUpperCase();

  // Handle CORS preflight
  if (method === "OPTIONS") {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: "",
    };
  }

  // Check if this is a WebSocket upgrade request
  const isWebSocketUpgrade = event.headers?.["upgrade"]?.toLowerCase() === "websocket" ||
                            event.headers?.["Upgrade"]?.toLowerCase() === "websocket";

  if (isWebSocketUpgrade) {
    return handleWebSocketUpgrade(event);
  }

  // Handle regular HTTP requests
  return handleHttpRequest(event);
};

async function handleWebSocketUpgrade(event: any) {
  try {
    const path = event.path?.replace(/^\/.netlify\/functions\/websocket-proxy/, "") ?? "";
    const queryString = event.rawQuery ? `?${event.rawQuery}` : "";
    const targetUrl = `${TARGET_WS_BASE.replace(/\/$/, "")}${path}${queryString}`;

    // For WebSocket upgrades, we need to return a 426 Upgrade Required
    // or handle the WebSocket connection differently
    // Since Netlify Functions don't support persistent WebSocket connections,
    // we'll return a response that indicates the WebSocket endpoint
    
    return {
      statusCode: 426,
      headers: {
        ...corsHeaders,
        "Upgrade": "websocket",
        "Connection": "Upgrade",
        "Sec-WebSocket-Accept": "WebSocket endpoint available",
      },
      body: JSON.stringify({
        message: "WebSocket upgrade requested",
        targetUrl: targetUrl,
        note: "Direct WebSocket connection required to target server"
      }),
    };
  } catch (error) {
    console.error("WebSocket proxy error:", error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: "WebSocket proxy error" }),
    };
  }
}

async function handleHttpRequest(event: any) {
  const method = (event.httpMethod || "GET").toUpperCase();
  const path = event.path?.replace(/^\/.netlify\/functions\/websocket-proxy/, "") ?? "";
  const queryString = event.rawQuery ? `?${event.rawQuery}` : "";
  const targetUrl = `${TARGET_API_BASE.replace(/\/$/, "")}${path}${queryString}`;

  const headers = new Headers();

  if (event.headers) {
    Object.entries(event.headers).forEach(([key, value]) => {
      if (key.toLowerCase() === "host") return;
      if (typeof value === "string") {
        headers.append(key, value);
      }
    });
  }

  const init: RequestInit = { method, headers };

  if (!isBodyless(method) && event.body) {
    init.body = event.isBase64Encoded ? Buffer.from(event.body, "base64") : event.body;
  }

  try {
    const response = await fetch(targetUrl, init);
    const responseHeaders = new Headers(response.headers);

    Object.entries(corsHeaders).forEach(([key, value]) => {
      responseHeaders.set(key, value);
    });

    const bufferedBody = await response.arrayBuffer();

    return {
      statusCode: response.status,
      headers: Object.fromEntries(responseHeaders.entries()),
      body: Buffer.from(bufferedBody).toString("base64"),
      isBase64Encoded: true,
    };
  } catch (error) {
    console.error("HTTP proxy error:", error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: "HTTP proxy error" }),
    };
  }
}
