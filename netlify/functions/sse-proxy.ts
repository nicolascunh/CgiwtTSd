import type { Handler } from "@netlify/functions";

const TARGET_API_BASE = process.env.TARGET_API_BASE ?? "http://35.230.168.225:8082/api";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, Cache-Control",
  "Access-Control-Allow-Credentials": "true",
};

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

  // Check if this is an SSE request
  const acceptHeader = event.headers?.["accept"] || event.headers?.["Accept"] || "";
  const isSSERequest = acceptHeader.includes("text/event-stream");

  if (isSSERequest) {
    return handleSSERequest(event);
  }

  // Handle regular HTTP requests
  return handleHttpRequest(event);
};

async function handleSSERequest(event: any) {
  const path = event.path?.replace(/^\/.netlify\/functions\/sse-proxy/, "") ?? "";
  const queryString = event.rawQuery ? `?${event.rawQuery}` : "";
  const targetUrl = `${TARGET_API_BASE.replace(/\/$/, "")}${path}${queryString}`;

  try {
    // For SSE, we'll make a regular HTTP request and stream the response
    const response = await fetch(targetUrl, {
      method: event.httpMethod || "GET",
      headers: {
        ...event.headers,
        "Accept": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    });

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers: corsHeaders,
        body: JSON.stringify({ error: "SSE request failed" }),
      };
    }

    // Read the response as a stream
    const reader = response.body?.getReader();
    if (!reader) {
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: "No response body" }),
      };
    }

    // For Netlify Functions, we need to return the entire response at once
    // since streaming isn't supported in the same way
    const chunks: Uint8Array[] = [];
    let done = false;

    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      if (value) {
        chunks.push(value);
      }
    }

    const body = Buffer.concat(chunks).toString();

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
      body: body,
    };
  } catch (error) {
    console.error("SSE proxy error:", error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: "SSE proxy error" }),
    };
  }
}

async function handleHttpRequest(event: any) {
  const method = (event.httpMethod || "GET").toUpperCase();
  const path = event.path?.replace(/^\/.netlify\/functions\/sse-proxy/, "") ?? "";
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

  if (method !== "GET" && method !== "HEAD" && event.body) {
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
