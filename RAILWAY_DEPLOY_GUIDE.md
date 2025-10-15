# 🚀 Guia de Deploy no Railway

## 📋 Passo a Passo Completo

### 1. **Preparar o Repositório**

```bash
# Já feito - repositório Git criado na pasta websocket-server/
cd /Users/nicolascunha/Downloads/CgiwtTSd/websocket-server
git status
```

### 2. **Criar Repositório no GitHub**

1. **Acesse [GitHub](https://github.com)**
2. **Clique em "New repository"**
3. **Nome**: `trackmax-websocket-server`
4. **Descrição**: `WebSocket server for Trackmax Traccar API`
5. **Público** (para Railway gratuito)
6. **NÃO** marque "Add README" (já temos)
7. **Clique "Create repository"**

### 3. **Conectar ao GitHub**

```bash
# Adicionar remote do GitHub
git remote add origin https://github.com/SEU_USUARIO/trackmax-websocket-server.git

# Renomear branch para main
git branch -M main

# Push para GitHub
git push -u origin main
```

### 4. **Deploy no Railway**

1. **Acesse [Railway](https://railway.app)**
2. **Login** com sua conta
3. **Clique "New Project"**
4. **Selecione "Deploy from GitHub repo"**
5. **Escolha o repositório** `trackmax-websocket-server`
6. **Clique "Deploy Now"**

### 5. **Configurar Variáveis de Ambiente**

No Railway Dashboard:

1. **Vá para "Variables"**
2. **Adicione**:
   - `TRACCAR_WS_URL` = `ws://35.230.168.225:8082/api/events`
   - `PORT` = `3000` (opcional, Railway define automaticamente)

### 6. **Verificar Deploy**

1. **Aguarde o build** (2-3 minutos)
2. **Clique na URL** gerada pelo Railway
3. **Teste**:
   - `https://seu-projeto.railway.app/health`
   - `https://seu-projeto.railway.app/status`

### 7. **Configurar no Frontend**

Atualizar a configuração da API:

```typescript
// src/config/api.ts
export const getApiUrl = (): string => {
  // ... código existente ...
  
  if (window.location.protocol === 'https:' && window.location.hostname !== 'localhost') {
    // Use Cloudflare Worker proxy for production (supports WebSocket)
    const cloudflareProxyUrl = 'https://trackmax-proxy.trackmax-proxy.workers.dev/api';
    console.log('🔧 getApiUrl - Using Cloudflare Worker proxy:', cloudflareProxyUrl);
    return cloudflareProxyUrl;
  }
  
  return FALLBACK_API_PATH;
};

// Nova função para WebSocket
export const getWebSocketUrl = (): string => {
  if (typeof window !== 'undefined' && window.location.protocol === 'https:' && window.location.hostname !== 'localhost') {
    return 'https://SEU_PROJETO.railway.app'; // Substitua pela URL do Railway
  }
  return 'ws://localhost:3000';
};
```

### 8. **Testar WebSocket**

```javascript
// No frontend
import { useWebSocketEvents } from './hooks/useWebSocketEvents';

const { isConnected, events } = useWebSocketEvents({
  serverUrl: 'https://SEU_PROJETO.railway.app',
  onEvent: (event) => {
    console.log('WebSocket Event:', event);
  }
});
```

## 🔧 Comandos Rápidos

```bash
# 1. Preparar repositório
cd /Users/nicolascunha/Downloads/CgiwtTSd/websocket-server
git add .gitignore
git commit -m "Add .gitignore"

# 2. Conectar ao GitHub (substitua SEU_USUARIO)
git remote add origin https://github.com/SEU_USUARIO/trackmax-websocket-server.git
git branch -M main
git push -u origin main

# 3. Deploy no Railway
# - Acesse railway.app
# - New Project > Deploy from GitHub
# - Selecione o repositório
# - Configure variáveis
# - Deploy!
```

## 📊 Verificação

Após o deploy, teste:

```bash
# Health check
curl https://seu-projeto.railway.app/health

# Status
curl https://seu-projeto.railway.app/status

# WebSocket (no browser)
const ws = new WebSocket('wss://seu-projeto.railway.app');
ws.onopen = () => console.log('Conectado!');
```

## 🎯 Próximos Passos

1. ✅ **Deploy no Railway**
2. ✅ **Configurar variáveis**
3. ✅ **Testar endpoints**
4. ✅ **Atualizar frontend**
5. ✅ **Testar WebSocket**

**Tempo estimado: 10-15 minutos** 🚀
