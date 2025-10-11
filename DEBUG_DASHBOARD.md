# Debug do Dashboard - Informações Sumidas

## Problema Relatado
As seguintes informações sumiram do dashboard:
- Veículos com deslocamento hoje
- Total percorrido: 0,0 km
- Viagens por dispositivo
- Tempo de ignição & ociosidade
- Consumo estimado
- Performance da Frota

## Logs de Debug Adicionados

Adicionei logs de debug extensivos no arquivo `src/components/Dashboard.tsx` para rastrear o problema:

### 1. Carregamento de Dados (useEffect)
- `🚀 DEBUG - Starting data load...`
- `📱 DEBUG - Devices loaded:` - mostra quantos dispositivos foram carregados
- `📍 DEBUG - Posições carregadas no Dashboard:` - mostra quantas posições foram carregadas
- `🚨 DEBUG - Events loaded:` - mostra quantos eventos foram carregados
- `🛣️ DEBUG - Trips loaded:` - mostra quantas viagens foram carregadas

### 2. Cálculo de Métricas (useMemo)
- `🔍 DEBUG - deviceMetrics calculation:` - mostra os dados de entrada para o cálculo
- `🔍 DEBUG - Processing device [nome] ([id]):` - mostra o processamento de cada dispositivo
- `🔍 DEBUG - Device [nome] final metrics:` - mostra as métricas finais de cada dispositivo

### 3. Agregação de Dados
- `🔍 DEBUG - distanceByDeviceToday:` - mostra os veículos com distância percorrida
- `🔍 DEBUG - Totals calculated:` - mostra os totais calculados
- `🔍 DEBUG - tripsByDeviceList:` - mostra as viagens por dispositivo
- `🔍 DEBUG - engineHoursByDeviceList:` - mostra as horas de ignição por dispositivo
- `🔍 DEBUG - idleByDeviceList:` - mostra as horas ociosas por dispositivo
- `🔍 DEBUG - fuelByDeviceList:` - mostra o consumo por dispositivo
- `🔍 DEBUG - behaviourMetrics:` - mostra as métricas de comportamento

## Como Verificar

1. **Abra o navegador** e acesse http://localhost:3000
2. **Abra o Console** (F12 ou Ctrl+Shift+I / Cmd+Option+I no Mac)
3. **Faça login** no sistema
4. **Observe os logs** no console

### O que procurar nos logs:

#### Se os dados NÃO estão sendo carregados:
- Verifique se `📱 DEBUG - Devices loaded: 0` - isso indica que nenhum dispositivo foi carregado
- Verifique se há erros de API no console (começando com ❌)
- Verifique se as credenciais estão válidas

#### Se os dados ESTÃO sendo carregados mas não aparecem:
- Verifique `🔍 DEBUG - deviceMetrics calculation:` 
  - `allDevicesLength` deve ser > 0
  - `positionsLength` deve ser > 0
  - `tripsLength` pode ser 0 se não houver viagens hoje
- Verifique `🔍 DEBUG - Device [nome] final metrics:` para cada dispositivo
  - `distanceKm` deve ser > 0 se o veículo se moveu
  - `trips` deve ser > 0 se houver viagens
  - `engineHours` deve ser > 0 se o motor esteve ligado
- Verifique `🔍 DEBUG - Totals calculated:`
  - Se `totals.distance` for 0, não há distância percorrida hoje
  - Se `totals.trips` for 0, não há viagens hoje

## Possíveis Causas

### 1. Sem dados de hoje
Se os veículos não se moveram hoje, os valores serão 0. Isso é esperado.

### 2. Problema com o cálculo de tempo
O dashboard considera "hoje" como o período desde 00:00:00 do dia atual. Se as posições não têm timestamps corretos, elas podem não ser contabilizadas.

### 3. Problema com a API de viagens
A API `/reports/trips` pode não estar retornando dados. Verifique os logs de `🛣️ DEBUG - Trips loaded:`.

### 4. Problema com posições
Se não houver posições carregadas (`📍 DEBUG - Posições carregadas no Dashboard: 0`), o dashboard não pode calcular métricas.

## Próximos Passos

Após verificar os logs do console, você poderá identificar onde está o problema:

1. **Se não há dispositivos**: Problema de autenticação ou API
2. **Se não há posições**: Problema com a API de posições ou os dispositivos não enviaram dados
3. **Se não há viagens**: Problema com a API de relatórios ou não há viagens registradas hoje
4. **Se os cálculos estão zerados**: Os veículos realmente não se moveram hoje

## Como Remover os Logs de Debug

Quando o problema for resolvido, você pode remover os logs de debug procurando por `console.log('🔍 DEBUG` no arquivo `src/components/Dashboard.tsx` e removendo essas linhas.

## Status do Servidor

✅ Servidor Vite rodando em http://localhost:3000
✅ API respondendo em http://localhost:3000/api/server
✅ Proxy configurado para http://35.230.168.225:8082

