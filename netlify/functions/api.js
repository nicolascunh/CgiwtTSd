export const handler = async (event) => {
  const ORIGINS = new Set([
    'https://dashboard-trackmax-web.web.app',
    'https://dashboard-trackmax.netlify.app',
    'http://localhost:5173',
    'http://localhost:3003',
    'http://localhost:8888', // netlify dev
  ]);

  const origin = event.headers.origin || '';
  const allowed = ORIGINS.has(origin) ? origin : '';

  const cors = {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Credentials': 'true',
    'Vary': 'Origin, Access-Control-Request-Headers',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': event.headers['access-control-request-headers'] || 'Content-Type, Authorization, X-Requested-With, Origin',
  };

  // Preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: cors };
  }

  if (!allowed) {
    return { statusCode: 403, headers: cors, body: 'Forbidden Origin' };
  }

  // --- Proxy para Traccar Server ---
  const TRACCAR_BASE_URL = 'http://35.230.168.225:8082/api';
  
  try {
    // Extrair path da requisição
    let path = event.path.replace('/.netlify/functions/api', '');
    
    // Se o path começar com /api, remover o prefixo /api
    if (path.startsWith('/api')) {
      path = path.replace('/api', '');
    }
    
    // Se path estiver vazio ou for apenas '/', usar /server como default
    if (!path || path === '/') {
      path = '/server';
    }
    
    const queryString = event.queryStringParameters ? 
      '?' + new URLSearchParams(event.queryStringParameters).toString() : '';
    
    const targetUrl = `${TRACCAR_BASE_URL}${path}${queryString}`;
    
    console.log(`🔄 Proxying ${event.httpMethod} ${targetUrl}`);
    
    // Preparar headers para o Traccar
    const forwardHeaders = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };
    
    // Preservar Authorization header se presente
    if (event.headers.authorization) {
      forwardHeaders['Authorization'] = event.headers.authorization;
      console.log('🔐 Authorization header preservado');
    }
    
    // Preparar body se presente
    let body = null;
    if (event.body && event.httpMethod !== 'GET' && event.httpMethod !== 'HEAD') {
      body = event.body;
    }
    
    // Fazer requisição para o Traccar
    const response = await fetch(targetUrl, {
      method: event.httpMethod,
      headers: forwardHeaders,
      body: body,
    });
    
    console.log(`📡 Traccar response: ${response.status} ${response.statusText}`);
    
    // Ler resposta
    const responseText = await response.text();
    
    // Retornar resposta com CORS headers
    return {
      statusCode: response.status,
      headers: {
        ...cors,
        'Content-Type': response.headers.get('content-type') || 'application/json',
        'Content-Length': response.headers.get('content-length') || responseText.length.toString(),
      },
      body: responseText,
    };
    
  } catch (error) {
    console.error('❌ Proxy error:', error);
    
    return {
      statusCode: 500,
      headers: {
        ...cors,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: 'Proxy error',
        message: error.message,
        targetUrl: targetUrl,
      }),
    };
  }
};
