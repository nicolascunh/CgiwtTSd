# 📊 Componentes de Gráficos Interativos - Padrão Shadcn

## 🎯 Componentes Criados

Foram criados **3 componentes de gráficos interativos** seguindo o padrão Shadcn UI com Recharts:

### 1. 📈 **InteractiveDistanceChart** - Gráfico de Distância
**Arquivo**: `src/components/charts/InteractiveDistanceChart.tsx`

**Características**:
- Gráfico de área com gradiente
- Filtro de período (7d, 30d, 90d, todos)
- Tooltip interativo com formatação em português
- Legenda customizável

**Dados necessários**:
```typescript
interface DataPoint {
  date: string        // Data no formato ISO ou Date string
  distanceKm: number  // Distância em quilômetros
}
```

### 2. ⚙️ **InteractiveEngineHoursChart** - Gráfico de Horas de Motor
**Arquivo**: `src/components/charts/InteractiveEngineHoursChart.tsx`

**Características**:
- Gráfico de área empilhada (stacked area)
- Mostra 3 métricas: Horas de Motor, Tempo de Condução, Marcha Lenta
- Filtro de período interativo
- Cores diferenciadas para cada métrica

**Dados necessários**:
```typescript
interface DataPoint {
  date: string          // Data no formato ISO ou Date string
  engineHours: number   // Horas de motor totais
  drivingHours: number  // Tempo de condução
  idleHours: number     // Tempo em marcha lenta
}
```

### 3. ⛽ **InteractiveFuelChart** - Gráfico de Combustível
**Arquivo**: `src/components/charts/InteractiveFuelChart.tsx`

**Características**:
- Gráfico de barras
- Alternar entre Litros e Custo (R$)
- Mostra totais no header do card
- Filtro de período

**Dados necessários**:
```typescript
interface DataPoint {
  date: string       // Data no formato ISO ou Date string
  fuelLiters: number // Litros consumidos
  fuelCost: number   // Custo em reais
}
```

---

## 🚀 Como Usar no Dashboard

### Passo 1: Preparar os Dados

No Dashboard.tsx, prepare os dados no formato correto:

```typescript
// Exemplo: Preparar dados de distância
const distanceChartData = useMemo(() => {
  return rangeKeys.map((key) => ({
    date: key, // Formato: "YYYY-MM-DD"
    distanceKm: dailyTripStats.get(key)?.distanceKm ?? 0
  }));
}, [rangeKeys, dailyTripStats]);

// Exemplo: Preparar dados de horas de motor
const engineHoursChartData = useMemo(() => {
  return rangeKeys.map((key) => {
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
  });
}, [rangeKeys, dailyTripStats]);

// Exemplo: Preparar dados de combustível
const fuelChartData = useMemo(() => {
  return rangeKeys.map((key) => {
    const fuelLiters = dailyTripStats.get(key)?.fuelLiters ?? 0;
    return {
      date: key,
      fuelLiters,
      fuelCost: fuelLiters * fuelPrice
    };
  });
}, [rangeKeys, dailyTripStats, fuelPrice]);
```

### Passo 2: Importar os Componentes

```typescript
import { 
  InteractiveDistanceChart,
  InteractiveEngineHoursChart,
  InteractiveFuelChart 
} from '@/components/charts';
```

### Passo 3: Usar no JSX

```tsx
{/* Gráfico de Distância */}
<Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
  <Col xs={24}>
    <InteractiveDistanceChart
      data={distanceChartData}
      title="Distância Percorrida pela Frota"
      description="Total de quilômetros rodados no período"
    />
  </Col>
</Row>

{/* Gráfico de Horas de Motor */}
<Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
  <Col xs={24}>
    <InteractiveEngineHoursChart
      data={engineHoursChartData}
      title="Análise de Tempo de Uso"
      description="Horas de motor, condução e marcha lenta"
    />
  </Col>
</Row>

{/* Gráfico de Combustível */}
<Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
  <Col xs={24}>
    <InteractiveFuelChart
      data={fuelChartData}
      title="Consumo e Custo de Combustível"
      description="Análise de consumo diário da frota"
      fuelPrice={fuelPrice}
    />
  </Col>
</Row>
```

---

## 🎨 Customização

### Cores dos Gráficos

As cores são definidas no `chartConfig` de cada componente e usam variáveis CSS do Shadcn:

```typescript
const chartConfig = {
  distanceKm: {
    label: "Distância (km)",
    color: "hsl(var(--chart-1))", // Azul
  },
  engineHours: {
    label: "Horas de Motor",
    color: "hsl(var(--chart-1))", // Azul
  },
  drivingHours: {
    label: "Tempo de Condução",
    color: "hsl(var(--chart-2))", // Verde
  },
  idleHours: {
    label: "Marcha Lenta",
    color: "hsl(var(--chart-3))", // Laranja
  },
}
```

**Para mudar as cores**, defina as variáveis CSS no seu arquivo de tema:

```css
:root {
  --chart-1: 221 83% 53%;  /* Azul */
  --chart-2: 142 76% 36%;  /* Verde */
  --chart-3: 25 95% 53%;   /* Laranja */
  --chart-4: 280 100% 70%; /* Roxo */
  --chart-5: 340 82% 52%;  /* Rosa */
}
```

### Título e Descrição

Todos os componentes aceitam props opcionais:

```typescript
<InteractiveDistanceChart
  data={data}
  title="Meu Título Customizado"     // Opcional
  description="Minha descrição"       // Opcional
/>
```

### Período de Filtro

Os filtros disponíveis são:
- **"all"** - Todo o período
- **"90d"** - Últimos 90 dias
- **"30d"** - Últimos 30 dias
- **"7d"** - Últimos 7 dias

O componente automaticamente filtra os dados baseado na seleção do usuário.

---

## 📱 Responsividade

Todos os gráficos são **100% responsivos**:

- **Desktop**: Altura de 250-300px com aspect-ratio automático
- **Mobile**: Ajusta automaticamente, labels reduzidas
- **Tooltip**: Adaptado para toque em dispositivos móveis

---

## 🔧 Recursos Interativos

### ✅ Implementados

1. **Filtro de Período** - Dropdown para selecionar intervalo de tempo
2. **Tooltip Interativo** - Hover mostra detalhes de cada ponto
3. **Legenda Dinâmica** - Mostra/oculta séries clicando na legenda
4. **Zoom e Pan** - Recharts permite zoom nativo (pode ser habilitado)
5. **Formatação Localizada** - Datas e números em português BR
6. **Gradientes Suaves** - Visual moderno com gradientes
7. **Animações** - Transições suaves ao carregar e filtrar
8. **Alternância de Métricas** (FuelChart) - Botões para alternar entre Litros e Custo

---

## 🎯 Exemplo Completo de Implementação

```typescript
// Dashboard.tsx

import { 
  InteractiveDistanceChart,
  InteractiveEngineHoursChart,
  InteractiveFuelChart 
} from '@/components/charts';

// ... dentro do componente Dashboard

// Preparar dados
const distanceChartData = useMemo(() => {
  return rangeKeys.map((key) => ({
    date: key,
    distanceKm: dailyTripStats.get(key)?.distanceKm ?? 0
  }));
}, [rangeKeys, dailyTripStats]);

const engineHoursChartData = useMemo(() => {
  return rangeKeys.map((key) => {
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
  });
}, [rangeKeys, dailyTripStats]);

const fuelChartData = useMemo(() => {
  return rangeKeys.map((key) => {
    const fuelLiters = dailyTripStats.get(key)?.fuelLiters ?? 0;
    return {
      date: key,
      fuelLiters,
      fuelCost: fuelLiters * fuelPrice
    };
  });
}, [rangeKeys, dailyTripStats, fuelPrice]);

// Renderizar
return (
  <div>
    {/* ... outros componentes ... */}
    
    {/* Seção de Gráficos Interativos */}
    <div style={{ marginBottom: '32px' }}>
      <Title level={3} style={{ marginBottom: '16px' }}>
        📊 Análise Detalhada
      </Title>
      
      <Row gutter={[24, 24]}>
        <Col xs={24}>
          <InteractiveDistanceChart data={distanceChartData} />
        </Col>
        
        <Col xs={24}>
          <InteractiveEngineHoursChart data={engineHoursChartData} />
        </Col>
        
        <Col xs={24}>
          <InteractiveFuelChart 
            data={fuelChartData}
            fuelPrice={fuelPrice}
          />
        </Col>
      </Row>
    </div>
  </div>
);
```

---

## 📦 Dependências Necessárias

Certifique-se de que o `package.json` contém:

```json
{
  "dependencies": {
    "recharts": "^2.10.0",
    "@radix-ui/react-select": "^2.0.0",
    // ... outras dependências Shadcn
  }
}
```

Se não estiver instalado:

```bash
npm install recharts
npx shadcn-ui@latest add select
```

---

## 🎨 Temas Suportados

Os gráficos funcionam com **modo claro e escuro** automaticamente, usando as variáveis CSS do Shadcn:

```css
/* Modo Claro */
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --border: 214.3 31.8% 91.4%;
  /* ... */
}

/* Modo Escuro */
.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --muted: 217.2 32.6% 17.5%;
  --muted-foreground: 215 20.2% 65.1%;
  --border: 217.2 32.6% 17.5%;
  /* ... */
}
```

---

## ✅ Checklist de Implementação

- [x] Criar componente base Chart (Shadcn)
- [x] Criar InteractiveDistanceChart
- [x] Criar InteractiveEngineHoursChart
- [x] Criar InteractiveFuelChart
- [ ] Integrar no Dashboard.tsx
- [ ] Testar responsividade
- [ ] Testar filtros de período
- [ ] Testar modo claro/escuro
- [ ] Ajustar cores conforme necessário

---

## 🚀 Próximos Passos

1. **Integrar os componentes no Dashboard.tsx**
2. **Substituir os gráficos antigos do ExecutiveOverview** pelos novos
3. **Adicionar mais gráficos** conforme necessário:
   - Gráfico de eficiência de combustível
   - Gráfico de alertas/eventos
   - Gráfico de velocidade média
   - Gráfico de rotas mais utilizadas

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Verificar a documentação do Recharts: https://recharts.org
2. Verificar a documentação do Shadcn: https://ui.shadcn.com
3. Consultar exemplos no código dos componentes criados

---

**Última Atualização**: Janeiro 2024  
**Versão**: 1.0.0  
**Autor**: Sistema TrackMax

