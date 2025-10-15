# WebSocket e SSE Proxy para Netlify

Este projeto inclui proxies avançados para suportar comunicação em tempo real com o servidor Traccar.

## Proxies Disponíveis

### 1. Proxy HTTP Padrão (`/api/*`)
- **Função**: `proxy.ts`
- **Rota**: `/api/*`
- **Uso**: Requisições HTTP normais (GET, POST, PUT, DELETE)
- **Exemplo**: `https://dashboard-trackmax.netlify.app/api/devices`

### 2. Proxy WebSocket (`/ws/*`)
- **Função**: `websocket-proxy.ts`
- **Rota**: `/ws/*`
- **Uso**: Tentativas de upgrade para WebSocket
- **Limitação**: Netlify Functions não suporta WebSocket persistente
- **Exemplo**: `https://dashboard-trackmax.netlify.app/ws/events`

### 3. Proxy Server-Sent Events (`/sse/*`)
- **Função**: `sse-proxy.ts`
- **Rota**: `/sse/*`
- **Uso**: Server-Sent Events para comunicação em tempo real
- **Exemplo**: `https://dashboard-trackmax.netlify.app/sse/events`

## Como Usar

### Para WebSocket (Cliente JavaScript)
```javascript
// Tentativa de WebSocket (pode não funcionar devido às limitações do Netlify)
const ws = new WebSocket('wss://dashboard-trackmax.netlify.app/ws/events');

ws.onopen = function() {
    console.log('WebSocket conectado');
};

ws.onmessage = function(event) {
    console.log('Mensagem recebida:', event.data);
};
```

### Para Server-Sent Events (Recomendado)
```javascript
// Server-Sent Events (funciona melhor com Netlify)
const eventSource = new EventSource('https://dashboard-trackmax.netlify.app/sse/events');

eventSource.onmessage = function(event) {
    console.log('Evento recebido:', event.data);
};

eventSource.onerror = function(event) {
    console.error('Erro no SSE:', event);
};
```

### Para Requisições HTTP Normais
```javascript
// Requisições HTTP padrão
fetch('https://dashboard-trackmax.netlify.app/api/devices')
    .then(response => response.json())
    .then(data => console.log(data));
```

## Configuração de Ambiente

As seguintes variáveis de ambiente podem ser configuradas:

- `TARGET_API_BASE`: URL base da API Traccar (padrão: `http://35.230.168.225:8082/api`)
- `TARGET_WS_BASE`: URL base do WebSocket Traccar (padrão: `ws://35.230.168.225:8082`)

## Limitações

1. **WebSocket**: Netlify Functions não suporta conexões WebSocket persistentes
2. **SSE**: Funciona, mas com limitações de timeout (10 segundos para funções gratuitas)
3. **Streaming**: Respostas são buffered devido às limitações do Netlify

## Alternativas Recomendadas

Para comunicação em tempo real robusta, considere:

1. **Polling**: Fazer requisições periódicas para `/api/events`
2. **SSE**: Usar Server-Sent Events com `/sse/events`
3. **WebSocket Externo**: Conectar diretamente ao servidor Traccar (se CORS permitir)

## Deploy

Para fazer deploy dos novos proxies:

```bash
# Build do projeto
npm run build

# Deploy para Netlify
netlify deploy --prod --dir=dist
```

## Testando

Após o deploy, teste os endpoints:

```bash
# Teste HTTP
curl https://dashboard-trackmax.netlify.app/api/devices

# Teste SSE
curl -H "Accept: text/event-stream" https://dashboard-trackmax.netlify.app/sse/events

# Teste WebSocket (pode falhar)
curl -H "Upgrade: websocket" https://dashboard-trackmax.netlify.app/ws/events
```
