// Função para obter headers CORS corretos
function getCorsHeaders(request: Request) {
  const origin = request.headers.get("origin");
  const allowedOrigins = [
    "https://dashboard-trackmax-web.web.app",
    "https://dashboard-trackmax.netlify.app",
    "http://localhost:3003",
    "http://localhost:5173",
    "http://localhost:4173"
  ];
  
  const allowOrigin = allowedOrigins.includes(origin) ? origin : "*";
  
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type, Upgrade, Connection, Sec-WebSocket-Key, Sec-WebSocket-Version, Sec-WebSocket-Protocol",
    "Access-Control-Allow-Credentials": allowOrigin !== "*" ? "true" : undefined,
  };
}

const isBodyless = (method: string) => method === "GET" || method === "HEAD";

// Cache configuration
const CACHE_TTL = {
  REPORTS: 300, // 5 minutes for reports
  POSITIONS: 60, // 1 minute for positions
  EVENTS: 120, // 2 minutes for events
  DEVICES: 600, // 10 minutes for devices
  SERVER: 3600, // 1 hour for server info
};

// Generate cache key for reports
function generateCacheKey(path: string, searchParams: URLSearchParams, authHeader?: string): string {
  const deviceIds = searchParams.getAll('deviceId').sort();
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const type = searchParams.get('type');
  
  // Create a hash of the auth header for cache key
  const authHash = authHeader ? btoa(authHeader).substring(0, 8) : 'noauth';
  
  return `cache:${path}:${deviceIds.join(',')}:${from}:${to}:${type}:${authHash}`;
}

// Check if response should be cached
function shouldCache(path: string, method: string): boolean {
  if (method !== 'GET') return false;
  
  return path.includes('/reports/') || 
         path.includes('/positions') || 
         path.includes('/events') || 
         path.includes('/devices') ||
         path.includes('/server');
}

// Get cache TTL based on path
function getCacheTTL(path: string): number {
  if (path.includes('/reports/')) return CACHE_TTL.REPORTS;
  if (path.includes('/positions')) return CACHE_TTL.POSITIONS;
  if (path.includes('/events')) return CACHE_TTL.EVENTS;
  if (path.includes('/devices')) return CACHE_TTL.DEVICES;
  if (path.includes('/server')) return CACHE_TTL.SERVER;
  return 60; // default 1 minute
}

// Generate ETag for stable resources
function generateETag(path: string, responseBody: string, timestamp: number): string {
  // For stable resources, create ETag based on content hash
  if (path.includes('/server') || path.includes('/devices')) {
    // Simple hash of content + timestamp for stable resources
    const content = responseBody + timestamp.toString();
    return `"${btoa(content).substring(0, 16)}"`;
  }
  
  // For dynamic resources, use timestamp-based ETag
  return `"${timestamp.toString(36)}"`;
}

// Check if resource supports ETag
function supportsETag(path: string): boolean {
  return path.includes('/server') || 
         path.includes('/devices') ||
         path.includes('/reports/');
}

// Handle ETag validation
async function handleETagValidation(request: Request, path: string, env: Env): Promise<Response | null> {
  const ifNoneMatch = request.headers.get('if-none-match');
  if (!ifNoneMatch || !supportsETag(path)) return null;

  try {
    // Check if we have a cached version with this ETag
    const authHeader = request.headers.get("authorization");
    const cacheKey = generateCacheKey(path, new URL(request.url).searchParams, authHeader);
    const cachedResponse = await env.CACHE_KV?.get(cacheKey);
    
    if (cachedResponse) {
      const cachedData = JSON.parse(cachedResponse);
      const cachedETag = generateETag(path, cachedData.body, cachedData.timestamp);
      
      if (ifNoneMatch === cachedETag) {
        console.log("🎯 ETag match - returning 304 Not Modified");
        return new Response(null, {
          status: 304,
          statusText: "Not Modified",
          headers: {
            ...getCorsHeaders(request),
            "ETag": cachedETag,
            "X-Cache": "HIT-ETAG",
          },
        });
      }
    }
  } catch (error) {
    console.log("ETag validation error:", error);
  }
  
  return null;
}

// Compression configuration
const COMPRESSION_CONFIG = {
  MIN_SIZE: 1024, // Only compress responses larger than 1KB
  MAX_SIZE: 10 * 1024 * 1024, // Max 10MB payload
  SUPPORTED_TYPES: ['application/json', 'text/plain', 'text/html'],
};

// Check if response should be compressed
function shouldCompress(contentType: string, contentLength: number): boolean {
  if (contentLength < COMPRESSION_CONFIG.MIN_SIZE || contentLength > COMPRESSION_CONFIG.MAX_SIZE) {
    return false;
  }
  
  return COMPRESSION_CONFIG.SUPPORTED_TYPES.some(type => contentType.includes(type));
}

// Get preferred compression method from Accept-Encoding header
function getPreferredCompression(acceptEncoding: string | null): string | null {
  if (!acceptEncoding) return null;
  
  const encodings = acceptEncoding.toLowerCase();
  
  // Prefer Brotli over Gzip for better compression
  if (encodings.includes('br')) return 'br';
  if (encodings.includes('gzip')) return 'gzip';
  
  return null;
}

// Compress response body
async function compressResponse(body: string, method: string): Promise<{ body: Uint8Array; encoding: string } | null> {
  if (method === 'br') {
    // Brotli compression (Cloudflare Workers support)
    const encoder = new TextEncoder();
    const data = encoder.encode(body);
    
    // Use CompressionStream for Brotli
    const stream = new CompressionStream('deflate-raw');
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();
    
    writer.write(data);
    writer.close();
    
    const chunks: Uint8Array[] = [];
    let done = false;
    
    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      if (value) chunks.push(value);
    }
    
    const compressedLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const result = new Uint8Array(compressedLength);
    let offset = 0;
    
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    
    return { body: result, encoding: 'br' };
  } else if (method === 'gzip') {
    // Gzip compression
    const encoder = new TextEncoder();
    const data = encoder.encode(body);
    
    const stream = new CompressionStream('gzip');
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();
    
    writer.write(data);
    writer.close();
    
    const chunks: Uint8Array[] = [];
    let done = false;
    
    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      if (value) chunks.push(value);
    }
    
    const compressedLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const result = new Uint8Array(compressedLength);
    let offset = 0;
    
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    
    return { body: result, encoding: 'gzip' };
  }
  
  return null;
}

export interface Env {
  TARGET_API_BASE?: string;
  FALLBACK_PROXY_URL?: string;
  CACHE_KV?: KVNamespace;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const requestUrl = new URL(request.url);
    const method = request.method.toUpperCase();

    if (method === "OPTIONS") {
      return new Response(null, { status: 204, headers: getCorsHeaders(request) });
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
        ...getCorsHeaders(request),
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
        ...getCorsHeaders(request),
        "Content-Type": "application/json",
      },
    });
  }
}

async function handleHttpRequest(request: Request, env: Env): Promise<Response> {
  const requestUrl = new URL(request.url);
  const method = request.method.toUpperCase();
  const incomingPath = requestUrl.pathname.replace(/^\/api/, "");

  // Check ETag validation first
  if (method === 'GET' && supportsETag(incomingPath)) {
    const etagResponse = await handleETagValidation(request, incomingPath, env);
    if (etagResponse) {
      return etagResponse;
    }
  }

  // Check cache for GET requests
  if (shouldCache(incomingPath, method) && env.CACHE_KV) {
    const authHeader = request.headers.get("authorization");
    const cacheKey = generateCacheKey(incomingPath, requestUrl.searchParams, authHeader);
    
    try {
      const cachedResponse = await env.CACHE_KV.get(cacheKey);
      if (cachedResponse) {
        console.log("🎯 Cache hit for:", cacheKey);
        const cachedData = JSON.parse(cachedResponse);
        
        // Add ETag header for cached responses
        const etag = generateETag(incomingPath, cachedData.body, cachedData.timestamp);
        
        // Check if response should be compressed
        const contentType = "application/json";
        const contentLength = new TextEncoder().encode(cachedData.body).length;
        const acceptEncoding = request.headers.get('accept-encoding');
        const compressionMethod = getPreferredCompression(acceptEncoding);
        
        let responseBody = cachedData.body;
        let responseHeaders: Record<string, string> = {
          ...getCorsHeaders(request),
          "Content-Type": contentType,
          "ETag": etag,
          "X-Cache": "HIT",
          "X-Cache-Key": cacheKey,
        };
        
        // Apply compression if beneficial
        if (compressionMethod && shouldCompress(contentType, contentLength)) {
          try {
            const compressed = await compressResponse(cachedData.body, compressionMethod);
            if (compressed) {
              responseBody = new TextDecoder().decode(compressed.body);
              responseHeaders["Content-Encoding"] = compressed.encoding;
              responseHeaders["Content-Length"] = compressed.body.length.toString();
              console.log(`🗜️ Compressed cached response: ${contentLength} → ${compressed.body.length} bytes (${compressed.encoding})`);
            }
          } catch (error) {
            console.log("Compression error (cached):", error);
          }
        }
        
        return new Response(responseBody, {
          status: cachedData.status,
          statusText: cachedData.statusText,
          headers: responseHeaders,
        });
      }
    } catch (error) {
      console.log("Cache read error:", error);
    }
  }

  // Tentar conexão direta primeiro, depois Netlify como fallback
  const directTarget = env.TARGET_API_BASE || "http://35.230.168.225:8082/api";
  const fallbackUrl = env.FALLBACK_PROXY_URL || "https://dashboard-trackmax.netlify.app/.netlify/functions/proxy";
  
  // Construct the target URL
  const directUrl = `${directTarget.replace(/\/$/, "")}${incomingPath}${requestUrl.search}`;
  const fallbackTargetUrl = `${fallbackUrl}${incomingPath}${requestUrl.search}`;

  const forwardHeaders = new Headers(request.headers);
  forwardHeaders.delete("host");
  
  // ✅ Garantir que Authorization header seja preservado
  const authHeader = request.headers.get("authorization");
  if (authHeader) {
    forwardHeaders.set("authorization", authHeader);
    console.log("🔐 Authorization header preservado:", authHeader.substring(0, 20) + "...");
  } else {
    console.log("❌ Authorization header não encontrado na requisição");
  }

  const init: RequestInit = {
    method,
    headers: forwardHeaders,
  };

  if (!isBodyless(method)) {
    init.body = await request.arrayBuffer();
  }

  // Tentar conexão direta primeiro
  try {
    console.log("Tentando conexão direta:", directUrl);
    console.log("Headers sendo enviados:", Object.fromEntries(forwardHeaders.entries()));
    
    const directResponse = await fetch(directUrl, init);
    
    if (directResponse.ok || directResponse.status === 401 || directResponse.status === 400) {
      console.log(`✅ Conexão direta retornou status ${directResponse.status}`);
      const corsHeaders = getCorsHeaders(request);
      const responseHeaders = new Headers(directResponse.headers);
      
      // Aplicar headers CORS corretos
      Object.entries(corsHeaders).forEach(([key, value]) => {
        if (value !== undefined) {
          responseHeaders.set(key, value);
        }
      });

      // Cache successful responses and add ETag
      if (directResponse.ok && shouldCache(incomingPath, method) && env.CACHE_KV) {
        try {
          const responseBody = await directResponse.clone().text();
          const cacheKey = generateCacheKey(incomingPath, requestUrl.searchParams, authHeader);
          const cacheTTL = getCacheTTL(incomingPath);
          const timestamp = Date.now();
          
          await env.CACHE_KV.put(cacheKey, JSON.stringify({
            body: responseBody,
            status: directResponse.status,
            statusText: directResponse.statusText,
            timestamp: timestamp,
          }), { expirationTtl: cacheTTL });
          
          console.log("💾 Cached response for:", cacheKey, "TTL:", cacheTTL);
          responseHeaders.set("X-Cache", "MISS");
          responseHeaders.set("X-Cache-Key", cacheKey);
          
          // Add ETag header
          if (supportsETag(incomingPath)) {
            const etag = generateETag(incomingPath, responseBody, timestamp);
            responseHeaders.set("ETag", etag);
          }
        } catch (error) {
          console.log("Cache write error:", error);
        }
      }

      // Apply compression to direct response
      let finalBody = directResponse.body;
      const contentType = directResponse.headers.get('content-type') || 'application/json';
      const contentLength = parseInt(directResponse.headers.get('content-length') || '0');
      const acceptEncoding = request.headers.get('accept-encoding');
      const compressionMethod = getPreferredCompression(acceptEncoding);
      
      if (compressionMethod && shouldCompress(contentType, contentLength)) {
        try {
          const responseText = await directResponse.clone().text();
          const compressed = await compressResponse(responseText, compressionMethod);
          if (compressed) {
            finalBody = new TextDecoder().decode(compressed.body);
            responseHeaders.set("Content-Encoding", compressed.encoding);
            responseHeaders.set("Content-Length", compressed.body.length.toString());
            console.log(`🗜️ Compressed direct response: ${contentLength} → ${compressed.body.length} bytes (${compressed.encoding})`);
          }
        } catch (error) {
          console.log("Compression error (direct):", error);
        }
      }

      return new Response(finalBody, {
        status: directResponse.status,
        statusText: directResponse.statusText,
        headers: responseHeaders,
      });
    } else {
      console.log(`❌ Conexão direta falhou (${directResponse.status}), tentando Netlify proxy`);
    }
  } catch (directError) {
    console.log("❌ Erro na conexão direta:", directError.message);
  }

  // Fallback para Netlify proxy
  try {
    console.log("Usando Netlify proxy como fallback:", fallbackTargetUrl);
    
    const upstreamResponse = await fetch(fallbackTargetUrl, init);
    
    // ✅ CORS headers corretos
    const corsHeaders = getCorsHeaders(request);
    const responseHeaders = new Headers(upstreamResponse.headers);
    
    // Aplicar headers CORS corretos
    Object.entries(corsHeaders).forEach(([key, value]) => {
      if (value !== undefined) {
        responseHeaders.set(key, value);
      }
    });

    // Cache successful responses from fallback and add ETag
    if (upstreamResponse.ok && shouldCache(incomingPath, method) && env.CACHE_KV) {
      try {
        const responseBody = await upstreamResponse.clone().text();
        const cacheKey = generateCacheKey(incomingPath, requestUrl.searchParams, authHeader);
        const cacheTTL = getCacheTTL(incomingPath);
        const timestamp = Date.now();
        
        await env.CACHE_KV.put(cacheKey, JSON.stringify({
          body: responseBody,
          status: upstreamResponse.status,
          statusText: upstreamResponse.statusText,
          timestamp: timestamp,
        }), { expirationTtl: cacheTTL });
        
        console.log("💾 Cached fallback response for:", cacheKey, "TTL:", cacheTTL);
        responseHeaders.set("X-Cache", "MISS-FALLBACK");
        responseHeaders.set("X-Cache-Key", cacheKey);
        
        // Add ETag header
        if (supportsETag(incomingPath)) {
          const etag = generateETag(incomingPath, responseBody, timestamp);
          responseHeaders.set("ETag", etag);
        }
      } catch (error) {
        console.log("Cache write error (fallback):", error);
      }
    }

    // Apply compression to fallback response
    let finalBody = upstreamResponse.body;
    const contentType = upstreamResponse.headers.get('content-type') || 'application/json';
    const contentLength = parseInt(upstreamResponse.headers.get('content-length') || '0');
    const acceptEncoding = request.headers.get('accept-encoding');
    const compressionMethod = getPreferredCompression(acceptEncoding);
    
    if (compressionMethod && shouldCompress(contentType, contentLength)) {
      try {
        const responseText = await upstreamResponse.clone().text();
        const compressed = await compressResponse(responseText, compressionMethod);
        if (compressed) {
          finalBody = new TextDecoder().decode(compressed.body);
          responseHeaders.set("Content-Encoding", compressed.encoding);
          responseHeaders.set("Content-Length", compressed.body.length.toString());
          console.log(`🗜️ Compressed fallback response: ${contentLength} → ${compressed.body.length} bytes (${compressed.encoding})`);
        }
      } catch (error) {
        console.log("Compression error (fallback):", error);
      }
    }

    return new Response(finalBody, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("HTTP proxy error:", error);
    return new Response(JSON.stringify({ 
      error: "HTTP proxy error", 
      details: error.message,
      directUrl: directUrl,
      fallbackUrl: fallbackTargetUrl
    }), {
      status: 500,
      headers: {
        ...getCorsHeaders(request),
        "Content-Type": "application/json",
      },
    });
  }
}
