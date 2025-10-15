# Configuração do Cloudflare Worker

## Worker Publicado

- **URL**: https://trackmax-proxy.trackmax-proxy.workers.dev
- **API Endpoint**: https://trackmax-proxy.trackmax-proxy.workers.dev/api
- **Status**: ✅ Ativo e funcionando

## Configuração

### Variáveis de Ambiente
- `TARGET_API_BASE`: `http://35.230.168.225:8082/api`

### Headers Configurados
- **Host**: `35.230.168.225:8082` (forçado para incluir a porta)
- **CORS**: Habilitado para todos os origins
- **WebSocket**: Suporte para upgrade requests

## Como Usar

### 1. Para Requisições HTTP
```javascript
fetch('https://trackmax-proxy.trackmax-proxy.workers.dev/api/devices')
    .then(response => response.json())
    .then(data => console.log(data));
```

### 2. Para WebSocket (Upgrade)
```javascript
const ws = new WebSocket('wss://trackmax-proxy.trackmax-proxy.workers.dev/api/events');
ws.onmessage = function(event) {
    console.log('Mensagem:', event.data);
};
```

### 3. Configuração no Frontend
Para usar o worker em produção, configure a variável de ambiente:

```bash
# .env.production
VITE_TRACKMAX_PROXY_URL=https://trackmax-proxy.trackmax-proxy.workers.dev/api
```

## Vantagens do Cloudflare Worker

1. **WebSocket Support**: Suporte nativo para WebSocket upgrades
2. **Global CDN**: Distribuição global para baixa latência
3. **CORS**: CORS habilitado automaticamente
4. **Porta 8082**: Acesso interno à porta 8082 sem restrições
5. **Headers**: Host header forçado para `35.230.168.225:8082`

## Limitações

1. **WebSocket Persistente**: Workers não mantêm conexões WebSocket persistentes
2. **CPU Time**: Limite de ~10ms por requisição (plano gratuito)
3. **Memory**: Limite de 128MB de memória

## Testando

```bash
# Teste HTTP
curl https://trackmax-proxy.trackmax-proxy.workers.dev/api/devices

# Teste WebSocket (pode retornar 426 Upgrade Required)
curl -H "Upgrade: websocket" https://trackmax-proxy.trackmax-proxy.workers.dev/api/events
```

## Deploy

Para fazer deploy de atualizações:

```bash
cd cloudflare-worker
wrangler deploy
```
