# 🚀 Deploy Direto no Railway (Sem GitHub)

## 📦 **Arquivo ZIP Criado:**
- ✅ `trackmax-websocket-server.zip` - Pronto para upload

## 🎯 **Deploy no Railway (3 minutos):**

### **1. Acesse Railway:**
- Vá para: https://railway.app
- **Login** com sua conta
- Clique **"New Project"**

### **2. Deploy from Folder:**
- Selecione **"Deploy from folder"** ou **"Upload files"**
- **Arraste** o arquivo `trackmax-websocket-server.zip`
- Ou clique **"Browse"** e selecione o ZIP

### **3. Configurar:**
- **Nome do projeto**: `trackmax-websocket-server`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### **4. Variáveis de Ambiente:**
No Railway Dashboard, vá em **"Variables"** e adicione:
- `TRACCAR_WS_URL` = `ws://35.230.168.225:8082/api/events`
- `PORT` = `3000` (opcional)

### **5. Deploy:**
- Clique **"Deploy"**
- Aguarde 2-3 minutos

## 🔧 **Alternativa: Render.com**

Se Railway não funcionar:

### **1. Acesse Render:**
- https://render.com
- **Sign Up** / **Login**

### **2. New Web Service:**
- **Build and deploy from a Git repository**
- **Connect GitHub** (se tiver acesso)
- Ou **"Deploy without Git"**

### **3. Upload:**
- **Upload** o arquivo ZIP
- **Environment**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

## 🎯 **Alternativa: Fly.io**

### **1. Instalar flyctl:**
```bash
curl -L https://fly.io/install.sh | sh
```

### **2. Login:**
```bash
fly auth login
```

### **3. Deploy:**
```bash
cd /Users/nicolascunha/Downloads/CgiwtTSd/websocket-server
fly launch
fly deploy
```

## 📋 **Verificação:**

Após o deploy, teste:
- **Health**: `https://seu-projeto.railway.app/health`
- **Status**: `https://seu-projeto.railway.app/status`

## 🎉 **Próximo Passo:**

Após o deploy funcionar:
1. **Copie a URL** do Railway/Render
2. **Atualize o frontend** com a URL
3. **Teste WebSocket** em tempo real

**Arquivo ZIP criado e pronto para upload!** 🚀
