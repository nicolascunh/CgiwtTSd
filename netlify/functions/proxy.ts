import type { Handler } from "@netlify/functions";

const TARGET_API_BASE = process.env.TARGET_API_BASE ?? "http://35.230.168.225:8082/api";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  // ❌ Remover Access-Control-Allow-Credentials quando Origin é *
};

const isBodyless = (method: string) => method === "GET" || method === "HEAD";

export const handler: Handler = async (event) => {
  const method = (event.httpMethod || "GET").toUpperCase();

  if (method === "OPTIONS") {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: "",
    };
  }

  const path = event.path?.replace(/^\/.netlify\/functions\/proxy/, "") ?? "";
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

  // ✅ Log para debug
  console.log("Proxying to:", targetUrl);
  console.log("Authorization header:", event.headers?.authorization ? "Present" : "Missing");

  const init: RequestInit = { method, headers };

  if (!isBodyless(method) && event.body) {
    init.body = event.isBase64Encoded ? Buffer.from(event.body, "base64") : event.body;
  }

  try {
    const response = await fetch(targetUrl, init);
    
    return {
      statusCode: response.status,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "Authorization, Content-Type",
      },
      body: Buffer.from(await response.arrayBuffer()).toString("base64"),
      isBase64Encoded: true,
    };
  } catch (error) {
    console.error("Netlify proxy error:", error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        error: "Proxy error", 
        details: error.message,
        targetUrl: targetUrl
      }),
    };
  }
};
