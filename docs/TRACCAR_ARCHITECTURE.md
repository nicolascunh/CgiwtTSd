# Arquitetura de Conexão – TrackMax ⇄ Traccar

```
┌──────────────────────────┐
│      Usuário / Browser    │
│  (dashboard-trackmax...)  │
└────────────┬──────────────┘
             │ HTTPS
             ▼
┌──────────────────────────┐
│      Firebase Hosting     │
│  SPA (build Vite/Refine)  │
└────────────┬──────────────┘
             │ Requisicoes /api/*
             ▼
┌──────────────────────────┐
│      Netlify Functions    │
│    proxy.ts (HTTP)        │
│    sse-proxy.ts (SSE)     │
│    websocket-proxy.ts     │
│  - Valida CORS            │
│  - Replica headers        │
│  - Loga Authorization     │
└────────────┬──────────────┘
             │ HTTP (Basic Auth)
             ▼
┌──────────────────────────┐
│         Traccar           │
│   http://35.230.168.225   │
│   Porta 8082 /api         │
│   (Jetty + MySQL)         │
└──────────────────────────┘
```

## Fluxo de dados

1. O usuário acessa `https://dashboard-trackmax-web.web.app` (Firebase Hosting).
2. A SPA carrega e todas as chamadas são feitas para caminhos relativos `/api/...`.
3. No Firebase, o rewrite direciona `/api` para `https://dashboard-trackmax.netlify.app/api`, que é servido pela Netlify Function (`proxy.ts`).
4. A função `proxy.ts`:
   - Normaliza o caminho (remove `/api` e prefixos internos).
   - Replica headers, incluindo `Authorization: Basic base64(user:pass)`.
   - Encaminha a requisição ao Traccar (`http://35.230.168.225:8082/api/...`).
   - Devolve a resposta para o navegador, adicionando cabeçalhos CORS permissivos.
5. Funções auxiliares (`sse-proxy.ts`, `websocket-proxy.ts`) estão prontas para futuros fluxos de SSE/WebSocket.

## Interações principais

| Origem | Destino | Rota | Objetivo |
|--------|---------|------|----------|
| SPA → Proxy | `POST /api/session` | Iniciar sessão, receber cookie `trackmax.sid`. |
| SPA → Proxy | `GET /api/session` | Validar sessão e obter usuário. |
| SPA → Proxy | `GET /api/devices` | Listar ativos. |
| SPA → Proxy | `GET /api/positions` | Buscar posições/telemetria recente. |
| SPA → Proxy | `GET /api/reports/events` | Consultar histórico de eventos. |
| Proxy → Traccar | Todas acima | Repassa requisições com cookie `JSESSIONID`. |

## Considerações

- **Sessão**: credenciais são validadas uma única vez (`POST /session`) e o proxy define o cookie `trackmax.sid` (`HttpOnly; Secure; SameSite=None`). Apenas o identificador de usuário (`auth-user`) permanece no `localStorage`.
- **Netlify** registra logs das requisições sem armazenar headers sensíveis (Authorization é omitido).
- **Limitações**: sem rate limit explícito, mas Netlify Functions têm quotas e o Traccar pode ser sensível a burst de requests.
- **Fallback**: em desenvolvimento local (`localhost`), a app chama o Traccar diretamente, sem passar pelo proxy.
