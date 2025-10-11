/**
 * Configuração da API
 * Detecta automaticamente se está em desenvolvimento ou produção
 */

export const getApiUrl = (): string => {
  // Sempre usar o endpoint relativo /api para aproveitar o proxy (Vite dev, Netlify functions, etc.)
  if (typeof window !== 'undefined') {
    console.log('🔧 getApiUrl - Hostname:', window.location.hostname);
    console.log('🔧 getApiUrl - Port:', window.location.port);
    console.log('🔧 getApiUrl - Full location:', window.location.href);
  }

  return '/api';
};

// Log para debug
console.log('🔧 API Config - Hostname:', typeof window !== 'undefined' ? window.location.hostname : 'server-side');
console.log('🔧 API Config - getApiUrl():', getApiUrl());
