# Guia de Deploy no Firebase Hosting

## Pré-requisitos

1. **Instalar Firebase CLI**:
   ```bash
   npm install -g firebase-tools
   ```

2. **Fazer login no Firebase**:
   ```bash
   firebase login
   ```

## Configuração do Projeto

### 1. Criar Projeto no Firebase Console

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Clique em "Adicionar projeto"
3. Digite o nome do projeto (ex: `trackmax-app`)
4. Configure as opções conforme necessário
5. Anote o **Project ID** gerado

### 2. Configurar o Projeto Local

1. **Editar `.firebaserc`**:
   ```json
   {
     "projects": {
       "default": "SEU-PROJECT-ID-AQUI"
     }
   }
   ```

2. **Inicializar Firebase Hosting**:
   ```bash
   npm run firebase:init
   ```
   
   Ou manualmente:
   ```bash
   firebase init hosting
   ```

### 3. Configurar Variáveis de Ambiente

Crie um arquivo `.env.production` para as variáveis de produção:

```env
VITE_GOOGLE_MAPS_API_KEY=sua_chave_do_google_maps_aqui
```

## Deploy

### Deploy Completo
```bash
npm run deploy
```

### Deploy Apenas do Hosting
```bash
npm run deploy:hosting
```

### Deploy Manual
```bash
# Build do projeto
npm run build:firebase

# Deploy
firebase deploy
```

## Estrutura de Arquivos

- `firebase.json` - Configuração do Firebase Hosting
- `.firebaserc` - Configuração do projeto Firebase
- `dist/` - Pasta de build (gerada automaticamente)

## Configurações do Hosting

O arquivo `firebase.json` está configurado com:

- **Public directory**: `dist` (pasta de build)
- **SPA routing**: Todas as rotas redirecionam para `index.html`
- **Cache headers**: Arquivos estáticos com cache de 1 ano
- **Ignore patterns**: Node modules e arquivos de configuração

## Domínio Personalizado

1. No Firebase Console, vá para "Hosting"
2. Clique em "Adicionar domínio personalizado"
3. Siga as instruções para configurar DNS

## Monitoramento

- **Firebase Console**: Acesse para ver estatísticas de uso
- **Logs**: Use `firebase functions:log` para ver logs
- **Analytics**: Integre com Google Analytics se necessário

## Troubleshooting

### Erro de Build
```bash
# Limpar cache e reinstalar dependências
rm -rf node_modules package-lock.json
npm install
npm run build:firebase
```

### Erro de Deploy
```bash
# Verificar configuração
firebase projects:list
firebase use --add
```

### Problemas com Rotas
- Verifique se o `firebase.json` tem a configuração de rewrites
- Teste localmente com `firebase serve`

## Comandos Úteis

```bash
# Ver status do projeto
firebase projects:list

# Trocar projeto ativo
firebase use PROJECT_ID

# Servir localmente
firebase serve

# Ver logs
firebase hosting:channel:list

# Rollback
firebase hosting:releases:list
firebase hosting:releases:rollback
```

