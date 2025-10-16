// Configuração da API - Voltando para Cloudflare Worker devido a problemas CORS no Netlify
const CLOUDFLARE_WORKER_URL = "https://trackmax-proxy.trackmax-proxy.workers.dev/api";
const NETLIFY_PROXY_URL = "https://dashboard-trackmax.netlify.app/api";
const DIRECT_API_URL = "http://35.230.168.225:8082/api";

const isLocalhost = (hostname: string) =>
  hostname === "localhost" ||
  hostname === "127.0.0.1" ||
  hostname.endsWith(".local");

export const getApiUrlSync = (): string => {
  if (typeof window === "undefined") {
    return CLOUDFLARE_WORKER_URL;
  }

  const hostname = window.location.hostname;
  const port = window.location.port;

  if (isLocalhost(hostname) || ["3003", "5173", "4173"].includes(port)) {
    return DIRECT_API_URL;
  }

  // Em produção, usar Cloudflare Worker que tem CORS configurado corretamente
  return CLOUDFLARE_WORKER_URL;
};

export const getApiUrl = async (): Promise<string> => {
  return getApiUrlSync();
};

export const API_BASE_URL = CLOUDFLARE_WORKER_URL;

console.log("🔧 API Config - Base URL:", API_BASE_URL);
console.log("🔄 Voltando para Cloudflare Worker devido a problemas CORS no Netlify");
