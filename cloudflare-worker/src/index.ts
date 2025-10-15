const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, Upgrade, Connection, Sec-WebSocket-Key, Sec-WebSocket-Version, Sec-WebSocket-Protocol",
  // ❌ Remover Access-Control-Allow-Credentials quando Origin é *
};

const isBodyless = (method: string) => method === "GET" || method === "HEAD";

export interface Env {
  TARGET_API_BASE?: string;
  FALLBACK_PROXY_URL?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const requestUrl = new URL(request.url);
    const method = request.method.toUpperCase();

    if (method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // Check if this is a WebSocket upgrade request
    const isWebSocketUpgrade = request.headers.get("upgrade")?.toLowerCase() === "websocket";

    if (isWebSocketUpgrade) {
      return handleWebSocketUpgrade(request, env);
    }

    // Handle regular HTTP requests
    return handleHttpRequest(request, env);
  },
};

async function handleWebSocketUpgrade(request: Request, env: Env): Promise<Response> {
  try {
    const requestUrl = new URL(request.url);
    const targetBase = (env.TARGET_API_BASE || "http://35.230.168.225:8082/api").replace(/\/$/, "");
    const incomingPath = requestUrl.pathname.replace(/^\/api/, "");
    const targetUrl = `${targetBase}${incomingPath}${requestUrl.search}`;

    // For WebSocket, we need to handle the upgrade differently
    // Since Cloudflare Workers can't maintain persistent WebSocket connections,
    // we'll return a response indicating the WebSocket endpoint
    
    return new Response(JSON.stringify({
      message: "WebSocket upgrade requested",
      targetUrl: targetUrl,
      note: "Direct WebSocket connection required to target server",
      status: "upgrade_required"
    }), {
      status: 426,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Upgrade": "websocket",
        "Connection": "Upgrade",
        "Sec-WebSocket-Accept": "WebSocket endpoint available",
      },
    });
  } catch (error) {
    console.error("WebSocket proxy error:", error);
    return new Response(JSON.stringify({ error: "WebSocket proxy error" }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }
}

async function handleHttpRequest(request: Request, env: Env): Promise<Response> {
  const requestUrl = new URL(request.url);
  const method = request.method.toUpperCase();

  // Usar diretamente o servidor Traccar em vez do Netlify proxy
  const targetBase = env.TARGET_API_BASE || "http://35.230.168.225:8082/api";
  const incomingPath = requestUrl.pathname.replace(/^\/api/, "");
  const targetUrl = `${targetBase}${incomingPath}${requestUrl.search}`;

  const forwardHeaders = new Headers(request.headers);
  forwardHeaders.delete("host");
  
  // ✅ Garantir que Authorization header seja preservado
  if (request.headers.get("authorization")) {
    forwardHeaders.set("authorization", request.headers.get("authorization"));
  }

  const init: RequestInit = {
    method,
    headers: forwardHeaders,
  };

  if (!isBodyless(method)) {
    init.body = await request.arrayBuffer();
  }

  try {
    console.log("Proxying directly to Traccar:", targetUrl);
    console.log("Authorization header:", request.headers.get("authorization") ? "Present" : "Missing");
    
    const upstreamResponse = await fetch(targetUrl, init);
    
    // ✅ CORS headers corretos
    const responseHeaders = new Headers(upstreamResponse.headers);
    responseHeaders.set("Access-Control-Allow-Origin", "*");
    responseHeaders.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    responseHeaders.set("Access-Control-Allow-Headers", "Authorization, Content-Type");
    // ❌ Remover Access-Control-Allow-Credentials quando Origin é *

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("HTTP proxy error:", error);
    return new Response(JSON.stringify({ 
      error: "HTTP proxy error", 
      details: error.message,
      targetUrl: targetUrl
    }), {
      status: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
    });
  }
}
