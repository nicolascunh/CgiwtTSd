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
    console.log('🔧 getApiUrl - Port:', window.location.port);
    console.log('🔧 getApiUrl - Full location:', window.location.href);

    if (window.location.protocol === 'https:' && window.location.hostname !== 'localhost') {
      // Use Netlify proxy for production
      const netlifyProxyUrl = 'https://dashboard-trackmax.netlify.app/.netlify/functions/proxy';
      console.log('🔧 getApiUrl - Using Netlify proxy:', netlifyProxyUrl);
      return netlifyProxyUrl;
    }
  }

  return FALLBACK_API_PATH;
};

// Log para debug
const currentHostname = typeof window !== 'undefined' ? window.location.hostname : 'server-side';
console.log('🔧 API Config - Hostname:', currentHostname);
console.log('🔧 API Config - getApiUrl():', getApiUrl());
