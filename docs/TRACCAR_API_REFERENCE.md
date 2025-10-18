# Traccar API – TrackMax Deployment

Este documento resume o que foi verificado no servidor Traccar (`Prorrac_V25-06-03`) utilizado pelo projeto TrackMax e aponta alternativas ao endpoint ausente `/api/events`.

## Bases de URL

| Ambiente | Base URL | Observações |
|----------|----------|-------------|
| Desenvolvimento | `http://35.230.168.225:8082/api` | Acesso direto ao Traccar; usar credenciais locais com Basic Auth. |
| Produção | `https://dashboard-trackmax.netlify.app/api` | Proxy HTTP hospedado na Netlify Functions. |

No ambiente de produção as chamadas utilizam sessão: `POST /api/session` devolve cookie `trackmax.sid` (`HttpOnly; Secure; SameSite=None`). O navegador envia o cookie automaticamente em `fetch(..., { credentials: "include" })`.

## Principais endpoints disponíveis

| Endpoint | Método | Status | Uso verificado | Notas |
|----------|--------|--------|----------------|-------|
| `/server` | GET | ✅ 200 | Informações do servidor (`timezone`, `version`, etc.). | Usado para health-check e validar credenciais. |
| `/devices` | GET | ✅ 200 | Lista dispositivos com metadados. | Suporta `limit`, `offset`. |
| `/positions` | GET | ✅ 200 | Últimas posições; aceita `deviceId`, `limit`. | Campo `attributes.alarm` indica alarmes disparados. |
| `/reports/summary` | GET | ✅ 200 | Resumo por período (`distance`, `engineHours`). | Requer `deviceId`, `from`, `to` (ISO 8601). |
| `/reports/trips` | GET | ✅ 200 (sem dados) | Lista viagens por período. | Retorna array vazio se não houver registros. |
| `/reports/events` | GET | ✅ 200 (sem dados) | Retorna eventos históricos para intervalo. | Substitui `/api/events`. |
| `/notifications` | GET | ✅ 200 | Configurações de notificações. | Somente metadados. |
| `/groups`, `/geofences`, `/drivers` | GET | ✅ 200 (pode retornar vazio) | Entidades auxiliares. | Depende de configuração no servidor. |

### Endpoints ausentes / não suportados

| Endpoint | Resultado | Comentário |
|----------|-----------|------------|
| `/events` | ❌ 404 `NotFoundException` | Endpoint removido/desabilitado na versão instalada. |
| `/openapi.json` | ❌ 404 | Documentação automática desativada. |

## Estratégia para substituir `/api/events`

O servidor retorna 404 para `/api/events`. Duas abordagens cobrem o mesmo cenário:

1. **Histórico de eventos** – usar `/api/reports/events`.  
   - Parâmetros aceitos: `deviceId` (múltiplos), `from`, `to`, `type` (opcional).  
   - Exemplo:
     ```bash
     curl -u ndev:2025 \
       "http://35.230.168.225:8082/api/reports/events?deviceId=30565&from=2025-10-14T00:00:00Z&to=2025-10-16T00:00:00Z"
     ```
   - Retorna um array de objetos com campos `type`, `attributes`, `positionId`, `eventTime`, etc. (atualmente pode retornar `[]` se não há eventos no período).

2. **Eventos em tempo quase real** – derivar a partir de `/api/positions`.  
   - Cada posição pode trazer `attributes.alarm` (ex.: `powerCut`, `overspeed`) e outras flags (`motion`, `ignition`, `blocked`).  
   - Para obter os eventos mais recentes por dispositivo:
     ```bash
     curl -u ndev:2025 \
       "http://35.230.168.225:8082/api/positions?deviceId=30565&limit=1"
     ```
   - A aplicação pode mapear `attributes.alarm` para o modelo de evento utilizado na UI.

### Recomendações para o código

- Substituir chamadas diretas a `/api/events` por `/api/reports/events` sempre que for necessário um histórico dentro de um intervalo (`from`/`to`).  
- Para dashboards em tempo real, consultar `/api/positions` com filtros `deviceId` + `limit`, interpretando `attributes.alarm`.  
- Atualizar o `dataProvider` e quaisquer hooks utilitários para aceitar um switch `resource === "events"` → fazer a requisição ao relatório de eventos, retornando dados já normalizados.
- Garantir que as requisições passem pela URL relativa `/api/...` (que no Firebase é redirecionada para a função Netlify).

## Boas práticas ao consumir a API

- **Paginação**: `limit` padrão costuma ser 20; definir explicitamente evita sobrecarregar o servidor.  
- **Intervalos de data**: sempre usar formato ISO 8601 com timezone UTC (`2025-10-15T00:00:00Z`).  
- **Cache-control**: o servidor envia `no-cache`; mantenha caching client-side sob controle da aplicação.  
- **Tratamento de 401**: revisar credenciais armazenadas em `localStorage`. A função proxy loga o prefixo do cabeçalho `Authorization` para auxiliar debug.

## Referências

- [Documentação oficial do Traccar REST](https://www.traccar.org/api-reference/) – descreve endpoints disponíveis na versão open-source.  
- [Relatórios do Traccar](https://www.traccar.org/reports/) – lista relatórios suportados (`events`, `summary`, `trips`, etc.).  
- Logs da função Netlify (`netlify logs:function proxy`) – úteis para depurar respostas 401/404.
