/**
 * Configuração da API - Versão Fixa
 * Força o uso do Cloudflare Worker para resolver o erro 401
 */

// URL fixa do Cloudflare Worker
const CLOUDFLARE_WORKER_URL = 'https://trackmax-proxy.trackmax-proxy.workers.dev/api';

export const getApiUrl = (): string => {
  // SEMPRE usar Cloudflare Worker - não importa o ambiente
  console.log('🔧 getApiUrl - FORÇANDO Cloudflare Worker proxy:', CLOUDFLARE_WORKER_URL);
  return CLOUDFLARE_WORKER_URL;
};

// Exportar também como constante para uso direto
export const API_BASE_URL = CLOUDFLARE_WORKER_URL;