const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

const isBodyless = (method: string) => method === "GET" || method === "HEAD";

export interface Env {
  TARGET_API_BASE?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const requestUrl = new URL(request.url);
    const method = request.method.toUpperCase();

    if (method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const targetBase = (env.TARGET_API_BASE || "http://35.230.168.225:8082/api").replace(/\/$/, "");
    const incomingPath = requestUrl.pathname.replace(/^\/api/, "");
    const targetUrl = `${targetBase}${incomingPath}${requestUrl.search}`;

    const forwardHeaders = new Headers(request.headers);
    forwardHeaders.delete("host");

    const init: RequestInit = {
      method,
      headers: forwardHeaders,
    };

    if (!isBodyless(method)) {
      init.body = await request.arrayBuffer();
    }

    const upstreamResponse = await fetch(targetUrl, init);
    const responseHeaders = new Headers(upstreamResponse.headers);

    Object.entries(corsHeaders).forEach(([key, value]) => {
      responseHeaders.set(key, value);
    });

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders,
    });
  },
};
