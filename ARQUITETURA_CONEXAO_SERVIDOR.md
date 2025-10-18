# 🏗️ Arquitetura de Conexão com o Servidor - TrackMax Dashboard

## 📋 Resumo da Arquitetura

Nossa aplicação utiliza uma arquitetura de múltiplas camadas com proxies para conectar ao servidor Traccar, garantindo compatibilidade CORS e flexibilidade de deployment.

## 🎯 Componentes Principais

### 1. **Frontend (React + Vite)**
- **Localização:** `src/`
- **Tecnologias:** React, TypeScript, Ant Design, Tailwind CSS
- **Deploy:** Firebase Hosting + Netlify
- **URLs:**
  - Firebase: `https://dashboard-trackmax-web.web.app`
  - Netlify: `https://dashboard-trackmax.netlify.app`

### 2. **Servidor Traccar (Backend)**
- **URL:** `http://35.230.168.225:8082/api`
- **Autenticação:** Basic Auth
- **Endpoints principais:**
  - `/api/server` - Informações do servidor
  - `/api/devices` - Lista de dispositivos
  - `/api/positions` - Posições dos veículos
  - `/api/reports/events` - Eventos do sistema

### 3. **Proxies (Camada Intermediária)**

#### 3.1 Cloudflare Worker
- **URL:** `https://trackmax-proxy.trackmax-proxy.workers.dev/api`
- **Função:** Proxy principal com CORS configurado
- **Status:** ✅ Ativo (produção)
- **Configuração:** `cloudflare-worker/src/index.ts`

#### 3.2 Netlify Functions
- **URL:** `https://dashboard-trackmax.netlify.app/api`
- **Função:** Proxy alternativo com rate limiting
- **Status:** ⚠️ Problemas CORS (temporariamente inativo)
- **Configuração:** `netlify/functions/proxy.ts`

## 🔄 Fluxo de Conexão

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Proxy Layer    │    │  Traccar Server │
│   (React App)   │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │ 1. API Request        │                       │
         ├──────────────────────►│                       │
         │                       │ 2. Forward Request    │
         │                       ├──────────────────────►│
         │                       │                       │
         │                       │ 3. Response           │
         │                       ◄──────────────────────┤
         │ 4. JSON Response      │                       │
         ◄──────────────────────┤                       │
```

## 🛠️ Configuração de API

### Arquivo: `src/config/api.ts`
```typescript
// Configuração dinâmica baseada no ambiente
export const getApiUrlSync = (): string => {
  if (typeof window === "undefined") {
    return CLOUDFLARE_WORKER_URL; // SSR
  }

  const hostname = window.location.hostname;
  const port = window.location.port;

  // Localhost - conexão direta
  if (isLocalhost(hostname) || ["3003", "5173", "4173"].includes(port)) {
    return DIRECT_API_URL; // http://35.230.168.225:8082/api
  }

  // Produção - via proxy
  return CLOUDFLARE_WORKER_URL; // https://trackmax-proxy.trackmax-proxy.workers.dev/api
};
```

## 🔐 Autenticação

### Sistema: Basic Auth
```typescript
// Headers de autenticação
const credentials = btoa(`${username}:${password}`);
headers["Authorization"] = `Basic ${credentials}`;
```

### Fluxo de Login:
1. **Frontend** → Envia credenciais para `/api/server`
2. **Proxy** → Repassa com Basic Auth para Traccar
3. **Traccar** → Valida credenciais
4. **Frontend** → Armazena credenciais no localStorage

## 📡 Tipos de Conexão

### 1. **Conexão Direta (Localhost)**
```
Frontend → Traccar Server
http://localhost:5173 → http://35.230.168.225:8082/api
```

### 2. **Conexão via Proxy (Produção)**
```
Frontend → Cloudflare Worker → Traccar Server
https://dashboard-trackmax-web.web.app → https://trackmax-proxy.trackmax-proxy.workers.dev/api → http://35.230.168.225:8082/api
```

## 🚀 Deploy e URLs

### Frontend Deployments:
- **Firebase Hosting:** `https://dashboard-trackmax-web.web.app`
- **Netlify:** `https://dashboard-trackmax.netlify.app`

### Proxy Deployments:
- **Cloudflare Worker:** `https://trackmax-proxy.trackmax-proxy.workers.dev/api`
- **Netlify Functions:** `https://dashboard-trackmax.netlify.app/api`

## 🔧 Configurações de CORS

### Cloudflare Worker:
```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": origin,
  "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept, Authorization",
  "Access-Control-Allow-Credentials": "true"
};
```

### Netlify Functions:
```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": origin,
  "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept, Authorization, X-Requested-With, Origin",
  "Access-Control-Allow-Credentials": "true"
};
```

## 📊 Status Atual

### ✅ Funcionando:
- Frontend no Firebase Hosting
- Cloudflare Worker como proxy principal
- Autenticação Basic Auth
- Conexão direta no localhost

### ⚠️ Problemas Resolvidos:
- CORS no Netlify Functions
- TypeScript compilation errors
- Missing dependencies
- Submodule issues

### 🔄 Em Desenvolvimento:
- Otimização de rate limiting
- Melhoria de performance para grandes frotas
- Implementação de WebSocket real-time

## 🎯 Próximos Passos

1. **Otimização:** Melhorar performance para 2000+ dispositivos
2. **WebSocket:** Implementar conexão real-time
3. **Cache:** Implementar cache inteligente
4. **Monitoramento:** Adicionar métricas de performance
5. **Backup:** Configurar proxy de fallback

---

**Última atualização:** 16 de Outubro de 2025
**Status:** ✅ Sistema funcionando em produção



