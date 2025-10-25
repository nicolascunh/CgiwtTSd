# 📊 Lógica de Métricas de Veículos - TrackMax

## 📋 Índice
1. [Horas de Motor](#1-horas-de-motor)
2. [Tempo de Condução](#2-tempo-de-condução)
3. [Alerta de Condução Contínua](#3-alerta-de-condução-contínua)
4. [Tempo em Marcha Lenta](#4-tempo-em-marcha-lenta)
5. [Custo em Marcha Lenta](#5-custo-em-marcha-lenta)
6. [Fluxo de Cálculo](#6-fluxo-de-cálculo)
7. [Constantes Configuradas](#7-constantes-configuradas)

---

## 1. Horas de Motor

### 📝 Definição
Tempo total com ignição ligada, independente do veículo estar em movimento ou parado.

### 🔧 Implementação
```typescript
// Constantes
const MIN_IDLE_SECONDS = 180;  // 3 minutos
const MIN_DRIVING_SPEED_KMH = 5; // Velocidade mínima

// Cálculo
let ignitionSeconds = 0;

for (let i = 0; i < devicePositions.length - 1; i++) {
  const current = devicePositions[i];
  const next = devicePositions[i + 1];
  
  const deltaSeconds = (nextTime - currentTime) / 1000;
  const ignition = toBoolean(currentAttrs?.ignition);
  
  if (ignition) {
    ignitionSeconds += deltaSeconds;
  }
}

// Conversão para horas
const engineHours = ignitionSeconds / 3600;
```

### 🎯 Critério
- **Condição**: `ignition === true`
- **Cálculo**: Soma de todos os intervalos de tempo (deltaSeconds) onde a ignição estava ligada
- **Fonte de Dados**: Prioriza dados do servidor Traccar (via relatório de viagens), com fallback para cálculo manual

### ⚠️ Observações Importantes
1. **Priorização do Traccar**: O sistema sempre prioriza `engineHours` vindo do servidor Traccar quando há viagens registradas
2. **Fallback Manual**: O cálculo manual só é usado quando não há viagens no período selecionado
3. **Precisão**: Considera a diferença de tempo entre posições consecutivas

---

## 2. Tempo de Condução

### 📝 Definição
Tempo em que o veículo está em movimento com velocidade superior a 5 km/h.

### 🔧 Implementação
```typescript
let drivingSeconds = 0;

for (let i = 0; i < devicePositions.length - 1; i++) {
  const speedMeters = typeof current.speed === 'number' ? current.speed : 0;
  const speedKmh = speedMeters * 3.6; // Conversão m/s para km/h
  
  if (ignition && speedKmh > MIN_DRIVING_SPEED_KMH) {
    drivingSeconds += deltaSeconds;
    currentIdleStreak = 0; // Reseta contador de marcha lenta
  }
}

const drivingHours = drivingSeconds / 3600;
```

### 🎯 Critérios
1. **Ignição ligada**: `ignition === true`
2. **Velocidade mínima**: `speedKmh > 5 km/h`
3. **Reset de marcha lenta**: Quando o veículo está em movimento, reseta o contador de marcha lenta consecutiva

### 📊 Conversão de Velocidade
- **Entrada**: Velocidade em metros por segundo (m/s)
- **Conversão**: `speedKmh = speedMeters * 3.6`
- **Unidade Final**: Quilômetros por hora (km/h)

---

## 3. Alerta de Condução Contínua

### 📝 Definição
Detecta viagens com duração superior a 5 horas e 30 minutos, indicando possível fadiga do motorista.

### 🔧 Implementação
```typescript
// Constante
const MIN_CONTINUOUS_DRIVING_HOURS = 5.5; // 5h30min

// Filtro de viagens longas
const longTrips = trips.filter(trip => {
  const durationHours = normalizeDurationHours(trip.duration || 0);
  return durationHours >= MIN_CONTINUOUS_DRIVING_HOURS;
});

// Normalização (Traccar retorna duração em milissegundos)
function normalizeDurationHours(duration: number): number {
  const MILLISECONDS_PER_HOUR = 1000 * 60 * 60;
  return duration / MILLISECONDS_PER_HOUR;
}
```

### 🎯 Critérios
- **Limite**: 5 horas e 30 minutos (5.5 horas)
- **Fonte**: Relatório de viagens do Traccar
- **Propósito**: Segurança e conformidade com leis de trânsito

### 📢 Alertas Gerados
```typescript
const alertsData = {
  hasAlerts: longTripsCount > 0,
  totalAlerts: longTripsCount,
  vehicles: Array.from(tripsPerVehicle.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5), // Top 5 veículos
  tripsPerVehicle: Map<string, number>
};
```

### ⚠️ Aplicação Prática
- **Lei de Motoristas**: CNH profissional requer descanso após 5h30 de condução
- **Segurança**: Reduz riscos de acidentes por fadiga
- **Gestão**: Identifica necessidade de rodízio de motoristas

---

## 4. Tempo em Marcha Lenta

### 📝 Definição
Tempo em que o veículo está com ignição ligada, velocidade zero e permanece nessa condição por mais de 3 minutos consecutivos.

### 🔧 Implementação
```typescript
let idleSeconds = 0;
let currentIdleStreak = 0; // Controle de sequência

for (let i = 0; i < devicePositions.length - 1; i++) {
  const speedKmh = speedMeters * 3.6;
  
  if (ignition) {
    // Marcha lenta: ignição ligada + 0 km/h
    if (speedKmh === 0) {
      currentIdleStreak += deltaSeconds;
      
      // Só conta se passar de 3 minutos contínuos
      if (currentIdleStreak >= MIN_IDLE_SECONDS) {
        idleSeconds += deltaSeconds;
      }
    } 
    // Velocidade entre 0 e 5 km/h: não conta como condução nem idle
    else if (speedKmh <= MIN_DRIVING_SPEED_KMH) {
      currentIdleStreak = 0;
    }
    // Velocidade > 5 km/h: reseta o contador
    else {
      currentIdleStreak = 0;
    }
  } else {
    currentIdleStreak = 0; // Ignição desligada: reseta
  }
}

const idleHours = idleSeconds / 3600;
```

### 🎯 Critérios Detalhados

#### ✅ Conta como Marcha Lenta
1. **Ignição ligada**: `ignition === true`
2. **Velocidade zero**: `speedKmh === 0`
3. **Tempo contínuo mínimo**: `≥ 3 minutos (180 segundos)`

#### ❌ NÃO Conta como Marcha Lenta
1. **Velocidade > 0 e ≤ 5 km/h**: Zona neutra (não é condução nem idle)
2. **Velocidade > 5 km/h**: Considerado em movimento
3. **Ignição desligada**: Veículo completamente desligado
4. **Tempo < 3 minutos**: Paradas curtas (semáforos, trânsito)

### 📊 Lógica de Reset
```typescript
// Reseta o contador de marcha lenta quando:
if (speedKmh > 0 && speedKmh <= MIN_DRIVING_SPEED_KMH) {
  currentIdleStreak = 0; // Movimento lento
}

if (speedKmh > MIN_DRIVING_SPEED_KMH) {
  currentIdleStreak = 0; // Em movimento
}

if (!ignition) {
  currentIdleStreak = 0; // Desligado
}
```

### 🎨 Exemplo Prático

| Tempo | Ignição | Velocidade | Streak Acumulado | Conta Idle? | Motivo |
|-------|---------|------------|------------------|-------------|--------|
| 0min  | ✅ Ligada | 0 km/h | 0s | ❌ | Ainda não passou 3 min |
| 1min  | ✅ Ligada | 0 km/h | 60s | ❌ | Ainda não passou 3 min |
| 2min  | ✅ Ligada | 0 km/h | 120s | ❌ | Ainda não passou 3 min |
| 3min  | ✅ Ligada | 0 km/h | 180s | ✅ | Passou 3 min consecutivos |
| 4min  | ✅ Ligada | 0 km/h | 240s | ✅ | Continua parado |
| 5min  | ✅ Ligada | 10 km/h | 0s (reset) | ❌ | Voltou a se mover |
| 6min  | ✅ Ligada | 0 km/h | 60s | ❌ | Novo streak < 3 min |

---

## 5. Custo em Marcha Lenta

### 📝 Definição
Cálculo financeiro do desperdício de combustível durante o tempo em marcha lenta.

### 🔧 Implementação
```typescript
// Constantes de consumo (Litros/hora)
const FLEET_IDLE_FUEL_RATE = 1.5; // Frota mista (média)

// Por tipo de veículo:
// - Carro leve: 0.6 a 1.0 L/h
// - Caminhonete/diesel: 1.0 a 2.0 L/h
// - Caminhão pesado: 2.5 a 4.0 L/h

// Cálculo do custo
const totalIdleHours = totals.idle; // Soma de todos os veículos
const avgIdleConsumption = 0.8; // L/h (média para o card geral)
const fuelPrice = 5.50; // R$/L (configurável)

const idleFuelLiters = totalIdleHours * FLEET_IDLE_FUEL_RATE;
const totalIdleCost = idleFuelLiters * fuelPrice;
```

### 📊 Fórmula Completa
```
Custo Total = Tempo Marcha Lenta (h) × Consumo Médio (L/h) × Preço Combustível (R$/L)

Exemplo:
- Tempo em idle: 10 horas
- Consumo médio: 1.5 L/h
- Preço: R$ 5,50/L
- Custo = 10h × 1.5 L/h × R$ 5,50 = R$ 82,50
```

### 🎯 Dados Necessários

#### 1. Tempo Total de Marcha Lenta
- **Fonte**: Calculado das posições do rastreador
- **Unidade**: Horas
- **Critério**: Ignição ligada + 0 km/h após 3 minutos contínuos

#### 2. Consumo Médio em Marcha Lenta
**Por tipo de motor**:
```typescript
const consumptionRates = {
  carroLeve: {
    min: 0.6,  // L/h
    max: 1.0,  // L/h
    medio: 0.8 // L/h
  },
  caminhonete: {
    min: 1.0,  // L/h
    max: 2.0,  // L/h
    medio: 1.5 // L/h
  },
  caminhao: {
    min: 2.5,  // L/h
    max: 4.0,  // L/h
    medio: 3.25 // L/h
  }
};
```

#### 3. Preço do Combustível
- **Configurável**: Sim
- **Padrão**: R$ 5,50/L
- **Permite Override**: Por veículo individual
- **Interface**: Input numérico no dashboard

### 💡 Configuração Personalizada
```typescript
// Preço global
const [fuelPrice, setFuelPrice] = useState<number>(5.5);

// Preço por veículo (override)
const [fuelPriceOverrides, setFuelPriceOverrides] = useState<Record<number, number>>({});

// Função para obter preço efetivo
const getEffectiveFuelPrice = (deviceId: number) => 
  fuelPriceOverrides[deviceId] ?? fuelPrice;
```

### 📈 Cálculo por Veículo
```typescript
deviceMetricsArray.forEach(({ device, idleHours }) => {
  const vehicleFuelPrice = getEffectiveFuelPrice(device.id);
  const idleConsumption = 0.8; // Ou específico por tipo de veículo
  const vehicleIdleCost = idleHours * idleConsumption * vehicleFuelPrice;
  
  console.log(`Veículo ${device.name}:
    - Tempo idle: ${idleHours.toFixed(2)}h
    - Consumo: ${(idleHours * idleConsumption).toFixed(2)}L
    - Custo: R$ ${vehicleIdleCost.toFixed(2)}
  `);
});
```

---

## 6. Fluxo de Cálculo

### 📊 Diagrama de Fluxo

```
┌─────────────────────────────────────────────────────────────┐
│                    INÍCIO DO CÁLCULO                        │
│            (Para cada veículo no período)                   │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  1. Obter Posições do Veículo no Período Selecionado       │
│     - Filtrar por deviceId                                  │
│     - Filtrar por dateRange                                 │
│     - Ordenar por timestamp                                 │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  2. Iterar Entre Posições Consecutivas                     │
│     for (i = 0; i < positions.length - 1; i++)             │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  3. Calcular Intervalo de Tempo (deltaSeconds)             │
│     deltaSeconds = (nextTime - currentTime) / 1000          │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  4. Verificar Estado da Ignição                             │
│     ignition = toBoolean(position.attributes.ignition)      │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
              ┌───────┴────────┐
              │  Ignição?      │
              └───────┬────────┘
        NÃO ──────────┼──────────── SIM
        │             │             │
        ▼             │             ▼
   Reseta idle       │      ┌─────────────────────────┐
   currentIdleStreak = 0    │  ✅ Conta Horas Motor  │
        │             │      │  ignitionSeconds += Δt  │
        │             │      └──────────┬──────────────┘
        │             │                 │
        │             │                 ▼
        │             │      ┌─────────────────────────┐
        │             │      │  5. Calcular Velocidade │
        │             │      │  speedKmh = speed * 3.6 │
        │             │      └──────────┬──────────────┘
        │             │                 │
        │             │                 ▼
        │             │         ┌───────┴────────┐
        │             │         │  Velocidade?   │
        │             │         └───────┬────────┘
        │             │                 │
        │             │    ┌────────────┼────────────┐
        │             │    │            │            │
        │             │    ▼            ▼            ▼
        │             │  = 0 km/h   0-5 km/h     > 5 km/h
        │             │    │            │            │
        │             │    ▼            ▼            ▼
        │             │ ┌──────┐   ┌────────┐   ┌──────────┐
        │             │ │Streak│   │ Reset  │   │✅ Condução│
        │             │ │  ++  │   │Streak  │   │drivingSeconds│
        │             │ └──┬───┘   └────────┘   └──────────┘
        │             │    │                          │
        │             │    ▼                          ▼
        │             │ ┌────────────┐          Reset Streak
        │             │ │Streak ≥ 3min?│            = 0
        │             │ └──┬────┬────┘
        │             │    │SIM │NÃO
        │             │    ▼    └────────┐
        │             │ ┌──────────┐     │
        │             │ │✅ Idle   │     │
        │             │ │idleSeconds│    │
        │             │ │   += Δt  │     │
        │             │ └──────────┘     │
        └─────────────┴──────────────────┴──────────────────────┐
                                                                 │
                                                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│  6. Converter para Horas                                        │
│     engineHours = ignitionSeconds / 3600                        │
│     drivingHours = drivingSeconds / 3600                        │
│     idleHours = idleSeconds / 3600                              │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│  7. Priorizar Dados do Traccar                                  │
│     if (tripStats?.engineHours > 0)                             │
│       usar tripStats.engineHours                                │
│     else                                                         │
│       usar cálculo manual                                       │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│  8. Calcular Custos                                             │
│     idleFuelLiters = idleHours × consumptionRate               │
│     idleCost = idleFuelLiters × fuelPrice                      │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│  9. Verificar Alertas de Condução Contínua                     │
│     if (tripDuration ≥ 5.5 hours)                              │
│       adicionar à lista de alertas                             │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ARMAZENAR MÉTRICAS                           │
│     deviceMetrics.set(device.id, {                              │
│       distanceKm, trips, engineHours,                           │
│       drivingHours, idleHours, fuel                             │
│     })                                                          │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FIM DO CÁLCULO                               │
└─────────────────────────────────────────────────────────────────┘
```

### 🔄 Exemplo de Iteração

```typescript
// Posição atual e próxima
Position 1: {
  time: "2024-01-01 10:00:00",
  speed: 0,
  attributes: { ignition: true }
}

Position 2: {
  time: "2024-01-01 10:05:00",
  speed: 0,
  attributes: { ignition: true }
}

// Cálculo
deltaSeconds = 300s (5 minutos)
speedKmh = 0
ignition = true
currentIdleStreak = 300s

// Como 300s > 180s (3 min):
✅ idleSeconds += 300
✅ ignitionSeconds += 300
❌ drivingSeconds (velocidade = 0)
```

---

## 7. Constantes Configuradas

### 📌 Constantes de Tempo
```typescript
const MIN_IDLE_SECONDS = 180;  // 3 minutos (180 segundos)
const MIN_DRIVING_SPEED_KMH = 5;  // Velocidade mínima para considerar "em movimento"
const MIN_CONTINUOUS_DRIVING_HOURS = 5.5;  // 5h30min - alerta de fadiga
```

### 📌 Constantes de Consumo
```typescript
// Taxa de consumo em marcha lenta (Litros/hora)
const FLEET_IDLE_FUEL_RATE = 1.5;  // Frota mista (média)
const avgIdleConsumption = 0.8;  // Média para cálculos gerais

// Por tipo de veículo
const consumptionByType = {
  carroLeve: 0.8,      // 0.6 - 1.0 L/h
  caminhonete: 1.5,    // 1.0 - 2.0 L/h
  caminhao: 3.25       // 2.5 - 4.0 L/h
};
```

### 📌 Constantes de Preço
```typescript
const defaultFuelPrice = 5.50;  // R$/litro (padrão)
// Permite override por veículo individual
```

### 📌 Constantes de Exibição
```typescript
const MILLISECONDS_PER_HOUR = 1000 * 60 * 60;  // Conversão ms → horas
const staleThresholdMs = 30 * 60 * 1000;  // 30 minutos (posição obsoleta)
const EVENTS_PER_PAGE = 5;  // Paginação de eventos
```

---

## 8. Otimizações e Boas Práticas

### ⚡ Performance

1. **Uso de useMemo**
```typescript
const deviceMetrics = useMemo(() => {
  // Cálculos pesados
}, [effectiveDevices, positions, tripStatsMap, rangeStartDate, rangeEndDate]);
```

2. **Filtros de Data Antecipados**
```typescript
// Ignorar positions fora do período
if (currentTime < startTime || currentTime > endTime) {
  positionsOutOfRange++;
  continue;
}
```

3. **Priorização de Dados**
```typescript
// Sempre preferir dados do Traccar
if (tripStats?.engineHours && tripStats.engineHours > 0) {
  engineHours = tripStats.engineHours; // ✅ Dados do servidor
} else {
  engineHours = ignitionSeconds / 3600; // ⚠️ Fallback manual
}
```

### 🐛 Debugging

```typescript
console.log(`🔍 DEBUG - Device ${device.name} final metrics:`, {
  engineHours: `${engineHours.toFixed(2)}h`,
  drivingHours: `${totalDrivingHoursPerDevice.toFixed(2)}h`,
  idleHours: `${totalIdleHoursPerDevice.toFixed(2)}h`,
  distanceKm: `${distanceKm.toFixed(2)}km`,
  fontes: {
    engineHours: tripStats?.engineHours ? 
      `✅ Traccar (${tripStats.trips} viagens)` : 
      '⚠️ Cálculo manual (sem trips)',
    drivingHours: drivingHours > 0 ? 
      '✅ Positions (velocidade > 5 km/h)' : 
      `⚠️ Trips fallback`,
    idleHours: idleHours > 0 ? 
      '✅ Positions (0 km/h após 3 min)' : 
      `⚠️ Trips fallback`
  }
});
```

### ✅ Validações

1. **Validação de Tempo**
```typescript
if (!Number.isFinite(currentTime) || !Number.isFinite(nextTime) || nextTime <= currentTime) {
  continue; // Pular posições inválidas
}
```

2. **Validação de Delta**
```typescript
if (deltaSeconds <= 0) {
  continue; // Pular intervalos inválidos
}
```

3. **Validação de Velocidade**
```typescript
const speedMeters = typeof current.speed === 'number' ? current.speed : 0;
const speedKmh = speedMeters * 3.6; // Conversão segura
```

---

## 9. Arquivos Relacionados

### 📁 Estrutura de Arquivos
```
src/
├── components/
│   └── Dashboard.tsx          # Implementação principal (linhas 960-1243)
├── hooks/
│   ├── useTrackmaxApi.ts      # API de comunicação com Traccar
│   ├── useDebounce.ts         # Debounce para filtros
│   └── useRateLimit.ts        # Controle de rate limiting
├── types.ts                   # Tipos TypeScript (Device, Position, Trip)
└── utils/
    ├── speedUtils.ts          # Conversões de velocidade
    └── eventMapping.ts        # Mapeamento de eventos

docs/
├── TRACCAR_API_REFERENCE.md   # Referência da API Traccar
└── TRACCAR_ARCHITECTURE.md    # Arquitetura do sistema
```

### 🔗 Linhas de Código Importantes
- **Constantes**: Linhas 963-964
- **Loop Principal**: Linhas 977-1045
- **Horas de Motor**: Linhas 1013-1014
- **Tempo de Condução**: Linhas 1016-1020
- **Marcha Lenta**: Linhas 1022-1032
- **Priorização Traccar**: Linhas 1060-1073
- **Alerta 5h30**: Linhas 1214-1243
- **Custo Idle**: Linhas 1194-1197, 1735-1752

---

## 10. Conclusão

Este documento detalha toda a lógica de cálculo das métricas do sistema TrackMax. A implementação é robusta, com fallbacks apropriados e priorização de dados do servidor quando disponíveis.

### 🎯 Principais Características:
- ✅ Cálculos precisos baseados em posições GPS reais
- ✅ Priorização de dados do servidor Traccar
- ✅ Fallbacks seguros quando dados não estão disponíveis
- ✅ Detecção de fadiga de motorista (> 5h30)
- ✅ Cálculo de custos de marcha lenta personalizável
- ✅ Debugging extensivo para troubleshooting
- ✅ Performance otimizada com useMemo e filtros

### 📊 Métricas Disponíveis:
1. **Horas de Motor** - Tempo total com ignição ligada
2. **Tempo de Condução** - Tempo em movimento (> 5 km/h)
3. **Tempo em Marcha Lenta** - Parado com motor ligado (> 3 min)
4. **Distância Percorrida** - Quilometragem total
5. **Número de Viagens** - Contagem de viagens
6. **Consumo de Combustível** - Litros consumidos
7. **Custo de Combustível** - Valor monetário gasto
8. **Alertas de Fadiga** - Viagens > 5h30

---

**Última Atualização**: Janeiro 2024  
**Versão**: 1.0.0  
**Autor**: Sistema TrackMax

