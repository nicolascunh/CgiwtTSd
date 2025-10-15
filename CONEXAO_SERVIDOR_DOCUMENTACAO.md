# Documentação: Conexão com Servidor e Atualização de Dados

## Visão Geral da Arquitetura

O sistema TrackMax utiliza uma arquitetura híbrida para conexão com o servidor, combinando múltiplas estratégias de comunicação para garantir robustez e disponibilidade dos dados em tempo real.

## 1. Configuração de API e Detecção de Ambiente

### Arquivo: `src/config/api.ts`

O sistema detecta automaticamente o ambiente e configura a URL da API:

```typescript
export const getApiUrl = (): string => {
  const envProxyUrl = resolveEnvProxyUrl();
  if (envProxyUrl) {
    return envProxyUrl; // VITE_TRACKMAX_PROXY_URL
  }

  if (typeof window !== 'undefined') {
    if (window.location.protocol === 'https:' && window.location.hostname !== 'localhost') {
      // Produção: Cloudflare Worker proxy
      return 'https://trackmax-proxy.trackmax-proxy.workers.dev/api';
    }
  }

  return '/api'; // Desenvolvimento local
};
```

**Estratégias de Conexão:**
1. **Desenvolvimento Local**: `/api` (proxy local)
2. **Produção HTTPS**: Cloudflare Worker proxy
3. **Variável de Ambiente**: `VITE_TRACKMAX_PROXY_URL` (sobrescreve tudo)

## 2. Autenticação

### Arquivo: `src/providers/auth.ts`

**Método**: Basic Authentication
- Credenciais são codificadas em Base64
- Armazenadas no `localStorage`
- Validação através de requisição para `/api/server`

```typescript
const credentials = btoa(`${username}:${password}`);
localStorage.setItem("auth-credentials", credentials);
```

**Headers de Autenticação:**
```typescript
const getAuthHeaders = (): Record<string, string> => {
  const storedCredentials = localStorage.getItem("auth-credentials");
  return storedCredentials ? {
    "Authorization": `Basic ${storedCredentials}`
  } : {};
};
```

## 3. Hooks de Conexão e Dados

### 3.1 Hook Principal: `useTrackmaxApi`

**Arquivo**: `src/hooks/useTrackmaxApi.ts`

**Funcionalidades:**
- Cache de posições (5 minutos)
- Retry com backoff exponencial
- Paginação e batching para grandes volumes
- Tratamento de erros robusto

**Cache de Posições:**
```typescript
const positionsCache = new Map<string, { data: Position[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
```

**Retry com Backoff:**
```typescript
const fetchWithRetry = async (url: string, options: RequestInit, maxRetries: number = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
      
      if (response.status === 500 && attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // Backoff exponencial
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    } catch (error) {
      // Tratamento de erro
    }
  }
};
```

**Batching para Grandes Volumes:**
```typescript
const MAX_DEVICES_PER_REQUEST = 50;

if (deviceIds.length > MAX_DEVICES_PER_REQUEST) {
  // Dividir em lotes e processar sequencialmente
  const batches = [];
  for (let i = 0; i < deviceIds.length; i += MAX_DEVICES_PER_REQUEST) {
    batches.push(deviceIds.slice(i, i + MAX_DEVICES_PER_REQUEST));
  }
}
```

### 3.2 Hook de Tempo Real: `useTrackmaxRealtime`

**Arquivo**: `src/hooks/useTrackmaxRealtime.ts`

**Funcionalidades:**
- Conexão WebSocket nativa
- Reconexão automática
- Callbacks para diferentes tipos de dados

```typescript
const buildWebSocketUrl = (apiUrl: string): string | null => {
  const url = new URL(apiUrl);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${url.toString().replace(/\/$/, '')}/socket`;
};
```

**Reconexão Automática:**
```typescript
socket.onclose = () => {
  if (shouldReconnect) {
    console.warn('⚠️ WebSocket desconectado. Tentando reconectar em 5s...');
    reconnectRef.current = setTimeout(connect, 5000);
  }
};
```

### 3.3 Hook de Eventos WebSocket: `useWebSocketEvents`

**Arquivo**: `src/hooks/useWebSocketEvents.ts`

**Funcionalidades:**
- Socket.IO client
- Ping/pong para manter conexão viva
- Status de conexão Traccar

```typescript
const newSocket = io(serverUrl, {
  transports: ['websocket', 'polling'],
  timeout: 10000,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});
```

### 3.4 Hook de Eventos SSE: `useRealtimeEvents`

**Arquivo**: `src/hooks/useRealtimeEvents.ts`

**Funcionalidades:**
- Server-Sent Events como fallback
- Polling automático em caso de falha
- Gerenciamento de estado de conexão

```typescript
const sse = new EventSource('/sse/events');

sse.onerror = (error) => {
  // Fallback para polling se habilitado
  if (fallbackToPolling) {
    startPolling();
  }
};
```

## 4. Proxies e Infraestrutura

### 4.1 Cloudflare Worker Proxy

**Arquivo**: `cloudflare-worker/src/index.ts`

**Funcionalidades:**
- Proxy HTTP para requisições API
- CORS headers automáticos
- Fallback para Netlify proxy

```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, Upgrade, Connection, Sec-WebSocket-Key, Sec-WebSocket-Version, Sec-WebSocket-Protocol",
  "Access-Control-Allow-Credentials": "true",
};
```

### 4.2 Netlify Functions Proxy

**Arquivo**: `netlify/functions/websocket-proxy.ts`

**Funcionalidades:**
- Proxy para requisições HTTP
- Tratamento de WebSocket upgrades
- CORS automático

### 4.3 Servidor WebSocket Dedicado

**Arquivo**: `websocket-server/server.js`

**Funcionalidades:**
- Socket.IO server
- Conexão com Traccar WebSocket
- Relay de eventos em tempo real

```typescript
const TRACCAR_WS_URL = 'ws://35.230.168.225:8082/api/events';

traccarConnection.on('message', (data) => {
  const event = JSON.parse(data.toString());
  io.emit('traccar-event', event);
});
```

## 5. Componentes de Exibição

### 5.1 Dashboard Principal

**Arquivo**: `src/components/Dashboard.tsx`

**Integração de Hooks:**
```typescript
const { fetchDevices, fetchPositions, loading, error } = useTrackmaxApi();

useTrackmaxRealtime({
  enabled: true,
  onPositions: (positions) => {
    setRealtimePositions(positions);
  },
  onDevices: (devices) => {
    setRealtimeDevices(devices);
  },
  onEvents: (events) => {
    setRealtimeEvents(events);
  }
});
```

### 5.2 Status de Conexão

**Arquivo**: `src/components/WebSocketStatus.tsx`

**Monitoramento:**
- Status WebSocket
- Status SSE
- Contadores de eventos
- Controles de conexão

### 5.3 Cards de Veículos

**Arquivo**: `src/components/VehicleCard.tsx`

**Atualizações em Tempo Real:**
```typescript
const isOnline = new Date(position.deviceTime).getTime() > Date.now() - 5 * 60 * 1000;
const speedKmh = Math.round(position.speed * 3.6);
```

## 6. Fluxo de Dados

### 6.1 Inicialização
1. **Detecção de Ambiente**: `getApiUrl()` determina endpoint
2. **Autenticação**: Validação de credenciais via `/api/server`
3. **Carregamento Inicial**: Dispositivos e posições via `useTrackmaxApi`

### 6.2 Atualizações em Tempo Real
1. **WebSocket Primário**: Conexão direta com Traccar
2. **Fallback SSE**: Server-Sent Events como backup
3. **Polling**: Último recurso para dados críticos

### 6.3 Cache e Performance
1. **Cache de Posições**: 5 minutos para reduzir requisições
2. **Batching**: Máximo 50 dispositivos por requisição
3. **Retry**: Backoff exponencial para falhas temporárias

## 7. Tratamento de Erros

### 7.1 Estratégias de Fallback
1. **WebSocket → SSE → Polling**
2. **Cache expirado como fallback**
3. **Múltiplos proxies (Cloudflare → Netlify)**

### 7.2 Logs e Monitoramento
```typescript
console.log('🔧 getApiUrl - Using Cloudflare Worker proxy:', cloudflareProxyUrl);
console.log('📦 Usando posições do cache:', cached.data.length);
console.log('✅ WebSocket conectado');
```

## 8. Configurações de Ambiente

### 8.1 Variáveis de Ambiente
- `VITE_TRACKMAX_PROXY_URL`: URL customizada do proxy
- `VITE_NETLIFY_PROXY_URL`: URL do proxy Netlify
- `TRACCAR_WS_URL`: URL do WebSocket Traccar

### 8.2 Configurações de Deploy
- **Desenvolvimento**: Proxy local (`/api`)
- **Produção**: Cloudflare Worker + Netlify Functions
- **WebSocket**: Servidor dedicado (Railway/Render)

## 9. Monitoramento e Debug

### 9.1 Componente de Status
- Status de conexão em tempo real
- Contadores de eventos recebidos
- Controles manuais de conexão

### 9.2 Logs Estruturados
- Emojis para categorização visual
- Timestamps automáticos
- Contexto de erro detalhado

## 10. Considerações de Performance

### 10.1 Otimizações Implementadas
- Cache inteligente com TTL
- Batching para grandes volumes
- Retry com backoff exponencial
- Limpeza automática de recursos

### 10.2 Limitações Conhecidas
- WebSocket não suportado em todos os proxies
- Cache pode ficar desatualizado
- Reconexão pode causar perda temporária de dados

---

Esta documentação fornece uma visão completa de como o sistema gerencia conexões, autenticação, cache e atualizações em tempo real, garantindo robustez e performance na exibição dos dados do TrackMax.
