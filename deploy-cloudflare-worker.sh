#!/bin/bash

# Script para deploy do Cloudflare Worker com correções do erro 401

echo "🚀 Iniciando deploy do Cloudflare Worker..."

# Verificar se wrangler está instalado
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler não encontrado. Instalando..."
    npm install -g wrangler
fi

# Navegar para o diretório do worker
cd cloudflare-worker

# Verificar se está logado no Cloudflare
echo "🔐 Verificando autenticação..."
wrangler whoami

if [ $? -ne 0 ]; then
    echo "❌ Não está logado no Cloudflare. Faça login primeiro:"
    echo "wrangler login"
    exit 1
fi

# Fazer deploy
echo "📦 Fazendo deploy do worker..."
wrangler deploy

if [ $? -eq 0 ]; then
    echo "✅ Deploy realizado com sucesso!"
    echo "🔗 URL do worker: https://trackmax-proxy.trackmax-proxy.workers.dev"
    echo ""
    echo "🧪 Para testar:"
    echo "curl -H 'Authorization: Basic \$(echo -n \"usuario:senha\" | base64)' \\"
    echo "     https://trackmax-proxy.trackmax-proxy.workers.dev/api/server"
else
    echo "❌ Erro no deploy"
    exit 1
fi
