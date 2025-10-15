#!/bin/bash

# Script para testar conectividade e resolver erro 401

echo "🧪 Testando conectividade do sistema TrackMax"
echo "=============================================="

# Verificar se as credenciais foram fornecidas
if [ -z "$1" ] || [ -z "$2" ]; then
    echo "❌ Uso: $0 <usuario> <senha>"
    echo "Exemplo: $0 admin password123"
    exit 1
fi

USERNAME=$1
PASSWORD=$2
CREDENTIALS=$(echo -n "$USERNAME:$PASSWORD" | base64)

echo "🔑 Usuário: $USERNAME"
echo "🔑 Credenciais Base64: $CREDENTIALS"
echo ""

# Teste 1: Conexão direta com Traccar
echo "1️⃣ Testando conexão direta com Traccar..."
echo "URL: http://35.230.168.225:8082/api/server"
echo ""

DIRECT_RESPONSE=$(curl -s -w "\n%{http_code}" -H "Authorization: Basic $CREDENTIALS" \
    "http://35.230.168.225:8082/api/server")

DIRECT_STATUS=$(echo "$DIRECT_RESPONSE" | tail -n1)
DIRECT_BODY=$(echo "$DIRECT_RESPONSE" | head -n -1)

if [ "$DIRECT_STATUS" = "200" ]; then
    echo "✅ Conexão direta: OK (Status: $DIRECT_STATUS)"
else
    echo "❌ Conexão direta: FALHOU (Status: $DIRECT_STATUS)"
    echo "Resposta: $DIRECT_BODY"
fi
echo ""

# Teste 2: Cloudflare Worker
echo "2️⃣ Testando Cloudflare Worker..."
echo "URL: https://trackmax-proxy.trackmax-proxy.workers.dev/api/server"
echo ""

CLOUDFLARE_RESPONSE=$(curl -s -w "\n%{http_code}" -H "Authorization: Basic $CREDENTIALS" \
    "https://trackmax-proxy.trackmax-proxy.workers.dev/api/server")

CLOUDFLARE_STATUS=$(echo "$CLOUDFLARE_RESPONSE" | tail -n1)
CLOUDFLARE_BODY=$(echo "$CLOUDFLARE_RESPONSE" | head -n -1)

if [ "$CLOUDFLARE_STATUS" = "200" ]; then
    echo "✅ Cloudflare Worker: OK (Status: $CLOUDFLARE_STATUS)"
else
    echo "❌ Cloudflare Worker: FALHOU (Status: $CLOUDFLARE_STATUS)"
    echo "Resposta: $CLOUDFLARE_BODY"
fi
echo ""

# Teste 3: Netlify Functions
echo "3️⃣ Testando Netlify Functions..."
echo "URL: https://dashboard-trackmax.netlify.app/.netlify/functions/proxy/server"
echo ""

NETLIFY_RESPONSE=$(curl -s -w "\n%{http_code}" -H "Authorization: Basic $CREDENTIALS" \
    "https://dashboard-trackmax.netlify.app/.netlify/functions/proxy/server")

NETLIFY_STATUS=$(echo "$NETLIFY_RESPONSE" | tail -n1)
NETLIFY_BODY=$(echo "$NETLIFY_RESPONSE" | head -n -1)

if [ "$NETLIFY_STATUS" = "200" ]; then
    echo "✅ Netlify Functions: OK (Status: $NETLIFY_STATUS)"
else
    echo "❌ Netlify Functions: FALHOU (Status: $NETLIFY_STATUS)"
    echo "Resposta: $NETLIFY_BODY"
fi
echo ""

# Resumo
echo "📊 RESUMO DOS TESTES"
echo "==================="
echo "Conexão Direta: $([ "$DIRECT_STATUS" = "200" ] && echo "✅ OK" || echo "❌ FALHOU")"
echo "Cloudflare Worker: $([ "$CLOUDFLARE_STATUS" = "200" ] && echo "✅ OK" || echo "❌ FALHOU")"
echo "Netlify Functions: $([ "$NETLIFY_STATUS" = "200" ] && echo "✅ OK" || echo "❌ FALHOU")"
echo ""

# Recomendações
if [ "$DIRECT_STATUS" = "200" ]; then
    echo "💡 RECOMENDAÇÕES:"
    echo "• O servidor Traccar está funcionando"
    if [ "$CLOUDFLARE_STATUS" != "200" ]; then
        echo "• Problema no Cloudflare Worker - verificar deploy"
    fi
    if [ "$NETLIFY_STATUS" != "200" ]; then
        echo "• Problema no Netlify Functions - verificar deploy"
    fi
else
    echo "💡 RECOMENDAÇÕES:"
    echo "• Verificar se o servidor Traccar está rodando"
    echo "• Verificar credenciais de acesso"
    echo "• Verificar conectividade de rede"
fi

echo ""
echo "🔧 Para debug adicional, verifique:"
echo "• Logs do Cloudflare Worker: https://dash.cloudflare.com/"
echo "• Logs do Netlify: https://app.netlify.com/"
echo "• Console do navegador para logs detalhados"
