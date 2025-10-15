#!/bin/bash

echo "🚀 Tentando fazer push para GitHub..."

# Verificar se estamos na pasta correta
if [ ! -f "package.json" ]; then
    echo "❌ Execute este script na pasta websocket-server/"
    exit 1
fi

# Tentar fazer push
echo "📤 Fazendo push para GitHub..."
if git push -u origin main; then
    echo "✅ Push realizado com sucesso!"
    echo "🔗 Repositório: https://github.com/nicolascunh/trackmax-websocket-server"
    echo ""
    echo "🎯 Próximo passo:"
    echo "1. Acesse https://railway.app"
    echo "2. New Project > Deploy from GitHub repo"
    echo "3. Selecione: trackmax-websocket-server"
    echo "4. Deploy!"
else
    echo "❌ Erro no push. Verifique se:"
    echo "1. O repositório foi criado no GitHub"
    echo "2. Você tem permissão para push"
    echo "3. A URL está correta"
    echo ""
    echo "🔗 Crie o repositório em: https://github.com/nicolascunh/trackmax-websocket-server"
fi
