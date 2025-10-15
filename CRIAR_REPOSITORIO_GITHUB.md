# 📋 Criar Repositório no GitHub

## 🎯 Passo a Passo:

### 1. **Acesse o GitHub**
- Vá para: https://github.com/nicolascunh
- Clique no botão **"New"** (verde) ou **"+"** → **"New repository"**

### 2. **Configure o Repositório**
- **Repository name**: `trackmax-websocket-server`
- **Description**: `WebSocket server for Trackmax Traccar API`
- **Visibility**: ✅ **Public** (necessário para Railway gratuito)
- **Initialize this repository with**:
  - ❌ **NÃO** marque "Add a README file"
  - ❌ **NÃO** marque "Add .gitignore"
  - ❌ **NÃO** marque "Choose a license"

### 3. **Criar Repositório**
- Clique em **"Create repository"**

### 4. **Após Criar**
O GitHub mostrará instruções. **IGNORE** e execute estes comandos:

```bash
cd /Users/nicolascunha/Downloads/CgiwtTSd/websocket-server
git push -u origin main
```

## 🚀 Comandos Prontos:

Após criar o repositório, execute:

```bash
# 1. Verificar se está na pasta correta
cd /Users/nicolascunha/Downloads/CgiwtTSd/websocket-server

# 2. Fazer push para GitHub
git push -u origin main

# 3. Verificar se funcionou
git remote -v
```

## ✅ Verificação:

Se tudo deu certo, você verá:
- ✅ Push successful
- ✅ Repositório visível em: https://github.com/nicolascunh/trackmax-websocket-server

## 🎯 Próximo Passo:

Após o push funcionar:
1. **Acesse Railway**: https://railway.app
2. **New Project** → **Deploy from GitHub repo**
3. **Selecione**: `trackmax-websocket-server`
4. **Deploy!**

**Tempo estimado: 2 minutos** ⏱️
