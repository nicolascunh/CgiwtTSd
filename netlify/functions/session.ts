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
    "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept, Authorization",
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

const getSessionCookie = (header?: string) => {
  const cookies = parseCookies(header);
  return cookies["trackmax.sid"];
};

const setSessionCookie = (sessionId: string | null) => {
  if (!sessionId) {
    return "trackmax.sid=; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=0";
  }
  return `trackmax.sid=${sessionId}; HttpOnly; Secure; SameSite=None; Path=/`;
};

const createTimeoutController = (timeoutMs: number) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  return { controller, timeout };
};

const upstreamUrl = (path: string) =>
  `${TARGET_API_BASE.replace(/\/$/, "")}${path}`;

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

  if (method === "POST") {
    if (!event.body) {
      return {
        statusCode: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ error: "missing_body" }),
      };
    }

    let credentials: { username?: string; password?: string } = {};
    try {
      credentials = JSON.parse(event.body);
    } catch {
      return {
        statusCode: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ error: "invalid_json" }),
      };
    }

    const { username, password } = credentials;
    if (!username || !password) {
      return {
        statusCode: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ error: "missing_credentials" }),
      };
    }

    const { controller, timeout } = createTimeoutController(10_000);
    try {
      const form = new URLSearchParams();
      form.append("email", username);
      form.append("user", username);
      form.append("password", password);
      const basic = Buffer.from(`${username}:${password}`).toString("base64");

      const response = await fetch(upstreamUrl("/session"), {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          Accept: "application/json",
          Authorization: `Basic ${basic}`,
        },
        body: form.toString(),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const responseBody = await response.text();

      if (!response.ok) {
        return {
          statusCode: response.status,
          headers: {
            ...corsHeaders,
            "Content-Type": response.headers.get("content-type") ?? "application/json",
          },
          body: responseBody,
        };
      }

      const setCookieHeader = response.headers.get("set-cookie");
      const sessionMatch = setCookieHeader?.match(/JSESSIONID=([^;]+)/);
      const sessionId = sessionMatch ? sessionMatch[1] : null;

      const headers = {
        ...corsHeaders,
        "Content-Type": response.headers.get("content-type") ?? "application/json",
      };

      if (sessionId) {
        headers["Set-Cookie"] = setSessionCookie(sessionId);
      }

      return {
        statusCode: 200,
        headers,
        body: responseBody,
      };
    } catch (error: any) {
      clearTimeout(timeout);
      return {
        statusCode: error?.name === "AbortError" ? 504 : 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ error: "session_error", message: error?.message }),
      };
    }
  }

  const sessionId = getSessionCookie(event.headers?.cookie);
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

  if (method === "GET") {
    const { controller, timeout } = createTimeoutController(10_000);
    try {
      const response = await fetch(upstreamUrl("/session"), {
        method: "GET",
        headers: {
          Cookie: `JSESSIONID=${sessionId}`,
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const body = await response.text();

      if (!response.ok) {
        return {
          statusCode: response.status,
          headers: {
            ...corsHeaders,
            "Content-Type": response.headers.get("content-type") ?? "application/json",
          },
          body,
        };
      }

      return {
        statusCode: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": response.headers.get("content-type") ?? "application/json",
        },
        body,
      };
    } catch (error: any) {
      clearTimeout(timeout);
      return {
        statusCode: error?.name === "AbortError" ? 504 : 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ error: "session_error", message: error?.message }),
      };
    }
  }

  if (method === "DELETE") {
    const { controller, timeout } = createTimeoutController(10_000);
    try {
      const response = await fetch(upstreamUrl("/session"), {
        method: "DELETE",
        headers: {
          Cookie: `JSESSIONID=${sessionId}`,
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const headers = {
        ...corsHeaders,
        "Content-Type": response.headers.get("content-type") ?? "application/json",
        "Set-Cookie": setSessionCookie(null),
      };

      const body = await response.text();

      return {
        statusCode: response.ok ? 200 : response.status,
        headers,
        body: response.ok ? JSON.stringify({ ok: true }) : body,
      };
    } catch (error: any) {
      clearTimeout(timeout);
      return {
        statusCode: error?.name === "AbortError" ? 504 : 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Set-Cookie": setSessionCookie(null),
        },
        body: JSON.stringify({ error: "session_error", message: error?.message }),
      };
    }
  }

  return {
    statusCode: 405,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ error: "method_not_allowed" }),
  };
};
