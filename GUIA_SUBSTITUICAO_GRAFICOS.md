# 🔄 Guia de Substituição de Gráficos - Padrão Shadcn

## 📊 Componentes Criados (6 Gráficos Interativos)

Foram criados **6 componentes de gráficos interativos** no padrão Shadcn para substituir os gráficos atuais:

### ✅ Componentes Disponíveis

1. **InteractiveDistanceChart** - Gráfico de área (distância)
2. **InteractiveEngineHoursChart** - Gráfico de área empilhada (motor/condução/idle)
3. **InteractiveFuelChart** - Gráfico de barras (combustível)
4. **InteractiveTripDurationChart** - Gráfico de barras empilhadas (duração viagens)
5. **InteractiveLineChart** - Gráfico de linha genérico
6. **InteractiveBarChart** - Gráfico de barras genérico

---

## 🔄 Mapeamento de Substituição

### 1. `tripDurationChart` → `InteractiveTripDurationChart`

**ANTES** (ExecutiveOverview):
```typescript
const tripDurationChart = useMemo<StackedColumnChartProps>(() => {
  const keys = rangeKeys.slice(-4);
  const data: StackedColumnDatum[] = keys.map((key) => {
    const stats = dailyTripStats.get(key);
    const driving = stats?.drivingHours ?? 0;
    const idle = index >= 0 ? dailyIdleSeries[index] ?? 0 : 0;
    const parked = Math.max(driving * 0.3, 0);
    return {
      label: dayjs(key).format('MMM D'),
      segments: [
        { label: 'Parado', value: parked, color: '#3b82f6' },
        { label: 'Marcha lenta', value: idle, color: '#facc15' },
        { label: 'Em movimento', value: driving, color: '#22c55e' },
      ],
    };
  });
  return { title: 'Duração das viagens', data };
}, [dailyTripStats, rangeKeys, dailyIdleSeries]);
```

**DEPOIS** (Novo Componente Shadcn):
```typescript
// 1. Preparar os dados
const tripDurationData = useMemo(() => {
  return rangeKeys.map((key) => {
    const stats = dailyTripStats.get(key);
    const index = rangeKeys.indexOf(key);
    const driving = stats?.drivingHours ?? 0;
    const idle = index >= 0 ? dailyIdleSeries[index] ?? 0 : 0;
    const eventsSummary = dailyEventSummary.get(key);
    const parked = eventsSummary ? eventsSummary.stops * 0.25 : Math.max(driving * 0.3, 0);
    
    return {
      date: key,
      parked: Number(parked.toFixed(2)),
      idle: Number(idle.toFixed(2)),
      driving: Number(driving.toFixed(2)),
    };
  });
}, [rangeKeys, dailyTripStats, dailyIdleSeries, dailyEventSummary]);

// 2. Renderizar
<InteractiveTripDurationChart 
  data={tripDurationData}
  title="Duração das Viagens"
  description="Tempo parado, em marcha lenta e em movimento"
/>
```

---

### 2. `distanceTrendChart` → `InteractiveLineChart`

**ANTES**:
```typescript
const distanceTrendChart = useMemo<TrendLineChartProps>(() => ({
  title: 'Distância total',
  subtitle: weeklyLabel,
  points: distanceTrendSeries.values.map((value) => Number(value.toFixed(2))),
  labels: distanceTrendSeries.labels,
  accentColor: '#38bdf8',
  formatter: (value) => `${formatNumber(value, 1)} km`,
  yLabel: 'km',
}), [distanceTrendSeries, weeklyLabel]);
```

**DEPOIS**:
```typescript
// 1. Preparar os dados
const distanceLineData = useMemo(() => {
  return rangeKeys.map((key) => ({
    date: key,
    value: dailyTripStats.get(key)?.distanceKm ?? 0
  }));
}, [rangeKeys, dailyTripStats]);

// 2. Renderizar
<InteractiveLineChart 
  data={distanceLineData}
  title="Distância Total"
  description="Quilometragem percorrida pela frota"
  dataKey="value"
  dataLabel="Distância (km)"
  accentColor="#38bdf8"
  formatter={(value) => `${value.toFixed(1)} km`}
  yLabel=" km"
/>
```

---

### 3. `fuelDrainsChart` → `InteractiveBarChart`

**ANTES**:
```typescript
const fuelDrainsChart = useMemo<VerticalBarChartProps>(() => {
  const data = fuelSeries.values.map((value, index) => ({
    label: fuelSeries.labels[index],
    value: Number(value.toFixed(2)),
    color: '#3b82f6',
  }));
  
  return {
    title: 'Consumo de combustível',
    subtitle: weeklyLabel,
    data,
    maxValue: Math.max(...data.map((item) => item.value), 1),
    showValue: false,
  };
}, [fuelSeries, weeklyLabel]);
```

**DEPOIS**:
```typescript
// 1. Preparar os dados
const fuelBarData = useMemo(() => {
  return rangeKeys.map((key) => ({
    date: key,
    value: dailyTripStats.get(key)?.fuelLiters ?? 0
  }));
}, [rangeKeys, dailyTripStats]);

// 2. Renderizar
<InteractiveBarChart 
  data={fuelBarData}
  title="Consumo de Combustível"
  description="Litros consumidos pela frota"
  dataKey="value"
  dataLabel="Combustível (L)"
  accentColor="#3b82f6"
  formatter={(value) => `${value.toFixed(1)}L`}
  yLabel=" L"
/>
```

---

## 🎯 Exemplo Completo de Integração no Dashboard

```typescript
// Dashboard.tsx

import { 
  InteractiveDistanceChart,
  InteractiveEngineHoursChart,
  InteractiveFuelChart,
  InteractiveTripDurationChart,
  InteractiveLineChart,
  InteractiveBarChart
} from '@/components/charts';

// ... dentro do componente Dashboard

// 1️⃣ PREPARAR TODOS OS DADOS
const chartData = useMemo(() => {
  return {
    // Distância - Área
    distance: rangeKeys.map((key) => ({
      date: key,
      distanceKm: dailyTripStats.get(key)?.distanceKm ?? 0
    })),

    // Distância - Linha
    distanceLine: rangeKeys.map((key) => ({
      date: key,
      value: dailyTripStats.get(key)?.distanceKm ?? 0
    })),

    // Horas de Motor
    engineHours: rangeKeys.map((key) => {
      const stats = dailyTripStats.get(key);
      const engineHours = stats?.engineHours ?? 0;
      const drivingHours = stats?.drivingHours ?? 0;
      const idleHours = Math.max(engineHours - drivingHours, 0);
      
      return {
        date: key,
        engineHours,
        drivingHours,
        idleHours
      };
    }),

    // Combustível
    fuel: rangeKeys.map((key) => {
      const fuelLiters = dailyTripStats.get(key)?.fuelLiters ?? 0;
      return {
        date: key,
        fuelLiters,
        fuelCost: fuelLiters * fuelPrice
      };
    }),

    // Combustível - Barras
    fuelBars: rangeKeys.map((key) => ({
      date: key,
      value: dailyTripStats.get(key)?.fuelLiters ?? 0
    })),

    // Duração das Viagens
    tripDuration: rangeKeys.map((key) => {
      const stats = dailyTripStats.get(key);
      const index = rangeKeys.indexOf(key);
      const driving = stats?.drivingHours ?? 0;
      const idle = index >= 0 ? dailyIdleSeries[index] ?? 0 : 0;
      const eventsSummary = dailyEventSummary.get(key);
      const parked = eventsSummary ? eventsSummary.stops * 0.25 : Math.max(driving * 0.3, 0);
      
      return {
        date: key,
        parked: Number(parked.toFixed(2)),
        idle: Number(idle.toFixed(2)),
        driving: Number(driving.toFixed(2)),
      };
    }),
  };
}, [rangeKeys, dailyTripStats, dailyIdleSeries, dailyEventSummary, fuelPrice]);

// 2️⃣ RENDERIZAR OS GRÁFICOS

return (
  <div>
    {/* Seção de Gráficos Interativos */}
    <div style={{ marginBottom: '32px' }}>
      <Title level={3} style={{ marginBottom: '24px', color: '#0f172a' }}>
        📊 Análise Detalhada com Gráficos Interativos
      </Title>
      
      <Row gutter={[24, 24]}>
        {/* Distância - Gráfico de Área */}
        <Col xs={24} lg={12}>
          <InteractiveDistanceChart 
            data={chartData.distance}
            title="Distância Percorrida"
            description="Quilometragem total da frota"
          />
        </Col>

        {/* Combustível - Gráfico de Área com Toggle */}
        <Col xs={24} lg={12}>
          <InteractiveFuelChart 
            data={chartData.fuel}
            title="Consumo de Combustível"
            description="Litros consumidos e custo"
            fuelPrice={fuelPrice}
          />
        </Col>

        {/* Horas de Motor - Gráfico de Área Empilhada */}
        <Col xs={24}>
          <InteractiveEngineHoursChart 
            data={chartData.engineHours}
            title="Análise de Tempo de Uso"
            description="Horas de motor, tempo de condução e marcha lenta"
          />
        </Col>

        {/* Duração das Viagens - Gráfico de Barras Empilhadas */}
        <Col xs={24}>
          <InteractiveTripDurationChart 
            data={chartData.tripDuration}
            title="Duração das Viagens"
            description="Distribuição de tempo: parado, marcha lenta e em movimento"
          />
        </Col>

        {/* Distância - Gráfico de Linha */}
        <Col xs={24} lg={12}>
          <InteractiveLineChart 
            data={chartData.distanceLine}
            title="Tendência de Distância"
            description="Evolução da quilometragem"
            dataKey="value"
            dataLabel="Distância (km)"
            accentColor="#38bdf8"
            formatter={(value) => `${value.toFixed(1)} km`}
            yLabel=" km"
          />
        </Col>

        {/* Combustível - Gráfico de Barras */}
        <Col xs={24} lg={12}>
          <InteractiveBarChart 
            data={chartData.fuelBars}
            title="Consumo Diário de Combustível"
            description="Litros consumidos por dia"
            dataKey="value"
            dataLabel="Combustível (L)"
            accentColor="#3b82f6"
            formatter={(value) => `${value.toFixed(1)}L`}
            yLabel=" L"
          />
        </Col>
      </Row>
    </div>
  </div>
);
```

---

## 🗑️ O que Remover do ExecutiveOverview

Após integrar os novos gráficos, você pode remover do `ExecutiveOverview`:

```typescript
// ❌ REMOVER - Não será mais usado
tripDuration={tripDurationChart}
distanceTrend={distanceTrendChart}
fuelDrains={fuelDrainsChart}
```

E no componente `ExecutiveOverview.tsx`, remover as props correspondentes.

---

## 🎨 Customização das Cores

Defina as cores no seu `globals.css` ou `tailwind.config`:

```css
:root {
  --chart-1: 221 83% 53%;   /* Azul #3b82f6 */
  --chart-2: 142 76% 36%;   /* Verde #22c55e */
  --chart-3: 25 95% 53%;    /* Laranja #f97316 */
  --chart-4: 280 100% 70%;  /* Roxo */
  --chart-5: 340 82% 52%;   /* Rosa */
}

.dark {
  --chart-1: 217 91% 60%;
  --chart-2: 142 76% 46%;
  --chart-3: 25 95% 63%;
  --chart-4: 280 100% 80%;
  --chart-5: 340 82% 62%;
}
```

---

## 📦 Dependências

Certifique-se de ter instalado:

```bash
npm install recharts
npx shadcn-ui@latest add select card
```

---

## ✅ Checklist de Migração

- [ ] Instalar dependências (recharts, shadcn components)
- [ ] Copiar componentes de gráficos para `src/components/charts/`
- [ ] Importar componentes no Dashboard.tsx
- [ ] Preparar dados no formato correto (useMemo)
- [ ] Substituir gráficos antigos pelos novos
- [ ] Remover props antigas do ExecutiveOverview
- [ ] Testar filtros de período
- [ ] Testar responsividade mobile
- [ ] Testar tooltips interativos
- [ ] Ajustar cores se necessário
- [ ] Remover código antigo não utilizado

---

## 🚀 Benefícios da Migração

✅ **Interatividade Total** - Filtros, tooltips, zoom  
✅ **Padrão Shadcn** - Design moderno e consistente  
✅ **Responsivo** - Funciona perfeitamente em mobile  
✅ **Acessível** - ARIA labels e navegação por teclado  
✅ **Performático** - Recharts otimizado  
✅ **Manutenível** - Código limpo e componentizado  
✅ **Tema Claro/Escuro** - Suporte nativo  
✅ **Animações** - Transições suaves  

---

## 📞 Troubleshooting

### Problema: Gráfico não aparece
**Solução**: Verifique se os dados estão no formato correto:
```typescript
// ✅ Correto
{ date: "2024-01-01", value: 100 }

// ❌ Errado
{ label: "2024-01-01", distanceKm: 100 }
```

### Problema: Cores não aparecem
**Solução**: Adicione as variáveis CSS no `globals.css`:
```css
:root {
  --chart-1: 221 83% 53%;
  /* ... */
}
```

### Problema: Tooltip em inglês
**Solução**: Os componentes já usam `pt-BR` por padrão. Verifique se não há override.

---

**Última Atualização**: Janeiro 2024  
**Versão**: 2.0.0  
**Autor**: Sistema TrackMax

