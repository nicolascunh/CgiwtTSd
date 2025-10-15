# Soluções para WebSocket em Tempo Real

## 🚫 Limitações Atuais

- **Netlify Functions**: Não suportam WebSocket persistente
- **Cloudflare Workers**: Não mantêm conexões WebSocket abertas  
- **Acesso Direto**: IP `35.230.168.225:8082` bloqueado pelo Cloudflare

## 🔧 Soluções Possíveis

### 1. **Servidor Próprio/VPS** (Recomendado)

#### Opção A: Node.js + Express + Socket.io
```javascript
// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { WebSocket } = require('ws');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Conectar ao Traccar via WebSocket
const traccarWs = new WebSocket('ws://35.230.168.225:8082/api/events');

traccarWs.on('message', (data) => {
  // Retransmitir para todos os clientes conectados
  io.emit('traccar-event', data);
});

io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

server.listen(3000, () => {
  console.log('Servidor WebSocket rodando na porta 3000');
});
```

#### Opção B: Python + FastAPI + WebSockets
```python
# main.py
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import websockets
import json

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Armazenar conexões ativas
active_connections = []

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_connections.append(websocket)
    
    try:
        # Conectar ao Traccar
        async with websockets.connect("ws://35.230.168.225:8082/api/events") as traccar_ws:
            async for message in traccar_ws:
                # Retransmitir para todos os clientes
                for connection in active_connections:
                    try:
                        await connection.send_text(message)
                    except:
                        active_connections.remove(connection)
    except Exception as e:
        print(f"Erro: {e}")
    finally:
        if websocket in active_connections:
            active_connections.remove(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

### 2. **Railway/Render/Fly.io** (Cloud)

#### Railway
```yaml
# railway.json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "node server.js",
    "healthcheckPath": "/health"
  }
}
```

#### Render
```yaml
# render.yaml
services:
  - type: web
    name: trackmax-websocket
    env: node
    buildCommand: npm install
    startCommand: node server.js
    envVars:
      - key: NODE_ENV
        value: production
```

### 3. **Docker + VPS**

#### Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
EXPOSE 3000

CMD ["node", "server.js"]
```

#### docker-compose.yml
```yaml
version: '3.8'
services:
  websocket-proxy:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
```

### 4. **Solução Híbrida** (Mais Simples)

#### Usar Server-Sent Events (SSE) ao invés de WebSocket
```javascript
// No frontend
const eventSource = new EventSource('https://trackmax-proxy.trackmax-proxy.workers.dev/sse/events');

eventSource.onmessage = function(event) {
  const data = JSON.parse(event.data);
  console.log('Evento recebido:', data);
  // Atualizar UI
};

eventSource.onerror = function(event) {
  console.error('Erro no SSE:', event);
  // Reconectar após 5 segundos
  setTimeout(() => {
    eventSource.close();
    // Recriar EventSource
  }, 5000);
};
```

#### Implementar Polling Inteligente
```javascript
// Polling com backoff exponencial
class SmartPolling {
  constructor(apiUrl, onData) {
    this.apiUrl = apiUrl;
    this.onData = onData;
    this.interval = 1000; // 1 segundo inicial
    this.maxInterval = 30000; // 30 segundos máximo
    this.isRunning = false;
  }

  start() {
    this.isRunning = true;
    this.poll();
  }

  stop() {
    this.isRunning = false;
  }

  async poll() {
    if (!this.isRunning) return;

    try {
      const response = await fetch(this.apiUrl);
      const data = await response.json();
      
      this.onData(data);
      this.interval = 1000; // Reset para 1 segundo
    } catch (error) {
      console.error('Erro no polling:', error);
      this.interval = Math.min(this.interval * 2, this.maxInterval);
    }

    setTimeout(() => this.poll(), this.interval);
  }
}

// Uso
const poller = new SmartPolling(
  'https://trackmax-proxy.trackmax-proxy.workers.dev/api/events',
  (data) => {
    console.log('Novos eventos:', data);
    // Atualizar UI
  }
);

poller.start();
```

## 🎯 Recomendação

Para implementação rápida:
1. **Use SSE** (já implementado no worker)
2. **Implemente polling inteligente** como fallback
3. **Considere um servidor próprio** para WebSocket real

Para solução robusta:
1. **Deploy um servidor Node.js** em Railway/Render
2. **Use Socket.io** para WebSocket bidirecional
3. **Configure proxy reverso** se necessário

## 📋 Próximos Passos

1. **Testar SSE** com o worker atual
2. **Implementar polling** como fallback
3. **Considerar servidor próprio** se necessário
4. **Monitorar performance** e latência
