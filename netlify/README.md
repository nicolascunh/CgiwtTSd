## Deploy no Netlify com função proxy

1. **Criar conta e instalar CLI**
   ```bash
   npm install -g netlify-cli
   netlify login
   ```

2. **Inicializar o site (primeira vez)**
   ```bash
   netlify init
   ```
   Escolha ou crie um site. O diretório de publicação é `dist/`.

3. **Configurar variáveis de ambiente**
   - `TARGET_API_BASE=http://35.230.168.225:8082/api`
   - `VITE_TRACKMAX_PROXY_URL=/api`
   Configure no painel (*Site settings → Build & deploy → Environment*) ou via CLI:
   ```bash
   netlify env:set TARGET_API_BASE http://35.230.168.225:8082/api
   netlify env:set VITE_TRACKMAX_PROXY_URL /api
   ```

4. **Deploy**
   ```bash
   netlify deploy --build --prod
   ```
   Isso executa `npm run build`, publica os arquivos estáticos em `dist/` e ativa a função `/.netlify/functions/proxy`.

5. **Testar**
   - Front-end: `https://<seu-site>.netlify.app/`
   - API proxy: `https://<seu-site>.netlify.app/.netlify/functions/proxy/server`

Com isso, todas as chamadas a `/api/...` na aplicação serão encaminhadas para a função Netlify, que repassa ao servidor Traccar sem problemas de CORS.
