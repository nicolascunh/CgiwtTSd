"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface DataPoint {
  date: string
  parked: number      // Tempo parado
  idle: number        // Marcha lenta
  driving: number     // Em movimento
}

interface InteractiveTripDurationChartProps {
  data: DataPoint[]
  title?: string
  description?: string
}

const chartConfig = {
  parked: {
    label: "Parado",
    color: "#3b82f6",
  },
  idle: {
    label: "Marcha Lenta",
    color: "#facc15",
  },
  driving: {
    label: "Em Movimento",
    color: "#22c55e",
  },
} satisfies ChartConfig

export function InteractiveTripDurationChart({ 
  data, 
  title = "Duração das Viagens",
  description = "Tempo parado, marcha lenta e em movimento"
}: InteractiveTripDurationChartProps) {
  const [timeRange, setTimeRange] = React.useState("all")

  const filteredData = React.useMemo(() => {
    if (!data || data.length === 0) return []
    
    if (timeRange === "all") return data

    const now = new Date()
    let daysToSubtract = 30

    if (timeRange === "7d") {
      daysToSubtract = 7
    } else if (timeRange === "30d") {
      daysToSubtract = 30
    } else if (timeRange === "90d") {
      daysToSubtract = 90
    }

    const startDate = new Date(now)
    startDate.setDate(startDate.getDate() - daysToSubtract)

    return data.filter((item) => {
      const itemDate = new Date(item.date)
      return itemDate >= startDate
    })
  }, [data, timeRange])

  const totals = React.useMemo(() => {
    return filteredData.reduce((acc, curr) => ({
      parked: acc.parked + curr.parked,
      idle: acc.idle + curr.idle,
      driving: acc.driving + curr.driving,
    }), { parked: 0, idle: 0, driving: 0 })
  }, [filteredData])

  return (
    <Card>
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <div className="flex">
          <div className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-3 py-3 text-left sm:border-l sm:border-t-0 sm:px-4 sm:py-4">
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              Parado
            </span>
            <span className="text-base font-bold leading-none sm:text-xl whitespace-nowrap">
              {totals.parked.toFixed(1)}h
            </span>
          </div>
          <div className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-3 py-3 text-left border-l sm:border-t-0 sm:px-4 sm:py-4">
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              Marcha Lenta
            </span>
            <span className="text-base font-bold leading-none sm:text-xl whitespace-nowrap">
              {totals.idle.toFixed(1)}h
            </span>
          </div>
          <div className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-3 py-3 text-left border-l sm:border-t-0 sm:px-4 sm:py-4">
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              Em Movimento
            </span>
            <span className="text-base font-bold leading-none sm:text-xl whitespace-nowrap">
              {totals.driving.toFixed(1)}h
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <div className="mb-4 flex items-center justify-end gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="w-[160px] rounded-lg"
              aria-label="Selecionar período"
            >
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all" className="rounded-lg">
                Todo o período
              </SelectItem>
              <SelectItem value="90d" className="rounded-lg">
                Últimos 90 dias
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Últimos 30 dias
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Últimos 7 dias
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[300px] w-full"
        >
          <BarChart data={filteredData}>
            <CartesianGrid vertical={false} strokeOpacity={0.3} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("pt-BR", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => `${value.toFixed(0)}h`}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  hideLabel
                  className="w-[200px]"
                  formatter={(value, name, item, index) => (
                    <>
                      <div
                        className="h-2.5 w-2.5 shrink-0 rounded-[2px] bg-(--color-bg)"
                        style={
                          {
                            "--color-bg": `var(--color-${name})`,
                          } as React.CSSProperties
                        }
                      />
                      {chartConfig[name as keyof typeof chartConfig]?.label ||
                        name}
                      <div className="text-foreground ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums">
                        {typeof value === 'number' ? value.toFixed(1) : value}
                        <span className="text-muted-foreground font-normal">
                          h
                        </span>
                      </div>
                      {/* Add total after the last item */}
                      {index === 2 && (
                        <div className="text-foreground mt-1.5 flex basis-full items-center border-t pt-1.5 text-xs font-medium">
                          Total
                          <div className="text-foreground ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums">
                            {((item.payload.parked || 0) + (item.payload.idle || 0) + (item.payload.driving || 0)).toFixed(1)}
                            <span className="text-muted-foreground font-normal">
                              h
                            </span>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                />
              }
            />
            <Bar
              dataKey="parked"
              fill="var(--color-parked)"
              fillOpacity={0.8}
              radius={[0, 0, 0, 0]}
              stackId="stack"
            />
            <Bar
              dataKey="idle"
              fill="var(--color-idle)"
              fillOpacity={0.8}
              radius={[0, 0, 0, 0]}
              stackId="stack"
            />
            <Bar
              dataKey="driving"
              fill="var(--color-driving)"
              fillOpacity={0.8}
              radius={[4, 4, 0, 0]}
              stackId="stack"
            />
            <ChartLegend content={<ChartLegendContent />} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

