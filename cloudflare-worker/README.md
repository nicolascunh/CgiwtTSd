# Trackmax Cloudflare Worker Proxy

Este diretório contém um Worker que atua como proxy para a API Traccar, liberando CORS e mantendo as requisições simples na aplicação em React.

## Passos para configurar

1. **Criar conta gratuita na Cloudflare**  
   Acesse https://dash.cloudflare.com/sign-up e conclua o cadastro.

2. **Instalar o Wrangler**  
   ```bash
   npm install -g wrangler
   ```

3. **Autenticar no Wrangler**  
   ```bash
   wrangler login
   ```

4. **Publicar o Worker**  
   ```bash
   cd cloudflare-worker
   wrangler publish
   ```

   O comando gera uma URL parecida com `https://trackmax-proxy.<subdomínio>.workers.dev`.

5. **(Opcional) Ajustar a URL da API de destino**  
   Se precisar trocar o host da API, configure a variável `TARGET_API_BASE` no painel da Cloudflare ou edite `wrangler.toml`.

6. **Configurar a aplicação React**  
   Crie um arquivo `.env.production` (ou configure no Firebase Hosting) com:
   ```
   VITE_TRACKMAX_PROXY_URL=https://trackmax-proxy.<subdomínio>.workers.dev/api
   ```

   Em ambiente de desenvolvimento local nada muda, o app continua apontando direto para `http://35.230.168.225:8082/api`.

7. **Rebuild & deploy**  
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

Pronto! Com isso, o app usa o Worker na produção sem custo adicional.
