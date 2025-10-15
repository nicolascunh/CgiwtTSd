/**
 * Configuração da API
 * Detecta automaticamente se está em desenvolvimento ou produção
 */

const FALLBACK_API_PATH = '/api';
const resolveEnvProxyUrl = (): string | undefined => {
  try {
    const value = (import.meta as unknown as { env?: Record<string, string | undefined> })?.env?.VITE_TRACKMAX_PROXY_URL;
    if (value && value.trim().length > 0) {
      return value.trim();
    }
  } catch {
    // Ambiente sem import.meta (e.g. testes)
  }
  return undefined;
};
const resolveNetlifyProxyUrl = (): string | undefined => {
  try {
    const value = (import.meta as unknown as { env?: Record<string, string | undefined> })?.env?.VITE_NETLIFY_PROXY_URL;
    if (value && value.trim().length > 0) {
      return value.trim();
    }
  } catch {
    // ignore
  }
  return undefined;
};

export const getApiUrl = (): string => {
  const envProxyUrl = resolveEnvProxyUrl();
  if (envProxyUrl) {
    console.log('🔧 getApiUrl - Using VITE_TRACKMAX_PROXY_URL:', envProxyUrl);
    return envProxyUrl;
  }

  if (typeof window !== 'undefined') {
    console.log('🔧 getApiUrl - Hostname:', window.location.hostname);
    console.log('🔧 getApiUrl - Protocol:', window.location.protocol);
    console.log('🔧 getApiUrl - Port:', window.location.port);
    console.log('🔧 getApiUrl - Full location:', window.location.href);

    if (window.location.protocol === 'https:' && window.location.hostname !== 'localhost') {
      // Use Cloudflare Worker proxy for production (supports WebSocket)
      const cloudflareProxyUrl = 'https://trackmax-proxy.trackmax-proxy.workers.dev/api';
      console.log('🔧 getApiUrl - Using Cloudflare Worker proxy:', cloudflareProxyUrl);
      return cloudflareProxyUrl;
    }
  }

  console.log('🔧 getApiUrl - Using fallback:', FALLBACK_API_PATH);
  return FALLBACK_API_PATH;
};

// Log para debug - removido para evitar problemas de inicialização
// const currentHostname = typeof window !== 'undefined' ? window.location.hostname : 'server-side';
// console.log('🔧 API Config - Hostname:', currentHostname);
// console.log('🔧 API Config - getApiUrl():', getApiUrl());
