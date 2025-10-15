# WebSocket Server para Trackmax

Este servidor Node.js atua como proxy WebSocket para a API Traccar, permitindo comunicação em tempo real.

## 🚀 Deploy Rápido

### Railway (Recomendado)

1. **Fork este repositório** ou copie a pasta `websocket-server`
2. **Acesse [Railway](https://railway.app)**
3. **Conecte seu GitHub** e selecione o repositório
4. **Deploy automático** - Railway detectará o `package.json`
5. **Configure variáveis de ambiente**:
   - `TRACCAR_WS_URL`: `ws://35.230.168.225:8082/api/events`
   - `PORT`: `3000` (automático)

### Render

1. **Acesse [Render](https://render.com)**
2. **New Web Service**
3. **Conecte GitHub** e selecione o repositório
4. **Configure**:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment: `Node`

### Fly.io

```bash
# Instalar flyctl
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Deploy
fly launch
fly deploy
```

## 🔧 Configuração Local

```bash
# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev

# Executar em produção
npm start
```

## 📡 Endpoints

- **WebSocket**: `ws://localhost:3000` (Socket.IO)
- **Health Check**: `GET /health`
- **Status**: `GET /status`

## 🔌 Como Usar no Frontend

```javascript
import { useWebSocketEvents } from './hooks/useWebSocketEvents';

function App() {
  const { 
    isConnected, 
    isTraccarConnected, 
    events, 
    connectionError 
  } = useWebSocketEvents({
    serverUrl: 'https://seu-servidor.railway.app',
    onEvent: (event) => {
      console.log('Novo evento:', event);
    },
    onError: (error) => {
      console.error('Erro:', error);
    }
  });

  return (
    <div>
      <p>Servidor: {isConnected ? '✅' : '❌'}</p>
      <p>Traccar: {isTraccarConnected ? '✅' : '❌'}</p>
      <p>Eventos: {events.length}</p>
    </div>
  );
}
```

## 🛠️ Variáveis de Ambiente

- `TRACCAR_WS_URL`: URL do WebSocket Traccar (padrão: `ws://35.230.168.225:8082/api/events`)
- `PORT`: Porta do servidor (padrão: `3000`)

## 📊 Monitoramento

- **Health Check**: `/health` - Status do servidor
- **Status**: `/status` - Status detalhado
- **Logs**: Console do Railway/Render

## 🔄 Reconexão Automática

- **Traccar**: Reconecta automaticamente se a conexão cair
- **Clientes**: Socket.IO gerencia reconexão automaticamente
- **Ping/Pong**: Mantém conexões vivas

## 🚨 Troubleshooting

### Erro de Conexão Traccar
- Verifique se o IP `35.230.168.225:8082` está acessível
- Confirme se o WebSocket está habilitado no Traccar

### Erro de CORS
- O servidor já está configurado para aceitar todos os origins
- Verifique se não há proxy bloqueando

### Erro de Memória
- O servidor limita eventos a 100 mais recentes
- Considere usar Redis para cache se necessário

## 📈 Escalabilidade

Para alta demanda:
1. **Use Redis** para cache de eventos
2. **Implemente clustering** com PM2
3. **Use load balancer** para múltiplas instâncias
4. **Configure rate limiting** se necessário
