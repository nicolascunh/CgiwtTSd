#!/bin/bash

# Script para deploy no Railway
echo "🚀 Preparando deploy do WebSocket Server para Railway..."

# Verificar se estamos na pasta correta
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script na pasta websocket-server/"
    exit 1
fi

# Verificar se git está configurado
if ! git config user.name > /dev/null 2>&1; then
    echo "❌ Erro: Configure o Git primeiro:"
    echo "git config --global user.name 'Seu Nome'"
    echo "git config --global user.email 'seu@email.com'"
    exit 1
fi

echo "✅ Git configurado"

# Verificar se há mudanças não commitadas
if [ -n "$(git status --porcelain)" ]; then
    echo "📝 Há mudanças não commitadas. Fazendo commit..."
    git add .
    git commit -m "Update before Railway deploy"
fi

echo "✅ Repositório Git pronto"

# Verificar se remote origin existe
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "📋 Para conectar ao GitHub:"
    echo "1. Crie um repositório no GitHub: trackmax-websocket-server"
    echo "2. Execute:"
    echo "   git remote add origin https://github.com/SEU_USUARIO/trackmax-websocket-server.git"
    echo "   git branch -M main"
    echo "   git push -u origin main"
    echo ""
    echo "3. Depois acesse railway.app e faça o deploy"
    exit 0
fi

echo "✅ Remote origin configurado"

# Push para GitHub
echo "📤 Fazendo push para GitHub..."
git push origin main

echo "✅ Push concluído!"
echo ""
echo "🎯 Próximos passos:"
echo "1. Acesse https://railway.app"
echo "2. New Project > Deploy from GitHub repo"
echo "3. Selecione: trackmax-websocket-server"
echo "4. Configure variáveis:"
echo "   - TRACCAR_WS_URL = ws://35.230.168.225:8082/api/events"
echo "5. Deploy!"
echo ""
echo "🔗 Após o deploy, atualize o frontend com a URL do Railway"
