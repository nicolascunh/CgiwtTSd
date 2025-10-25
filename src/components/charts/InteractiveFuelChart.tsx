"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
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
  fuelLiters: number
  fuelCost: number
}

interface InteractiveFuelChartProps {
  data: DataPoint[]
  title?: string
  description?: string
  fuelPrice?: number
}

const chartConfig = {
  fuelLiters: {
    label: "Combustível (L)",
    color: "#3b82f6",
  },
  fuelCost: {
    label: "Custo (R$)",
    color: "#10b981",
  },
} satisfies ChartConfig

export function InteractiveFuelChart({ 
  data, 
  title = "Consumo Diário de Combustível",
  description = "Litros de combustível consumidos por dia",
  fuelPrice = 5.5
}: InteractiveFuelChartProps) {
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

  const stats = React.useMemo(() => {
    if (filteredData.length === 0) {
      return { total: 0, average: 0, max: 0 }
    }
    const total = filteredData.reduce((acc, curr) => acc + curr.fuelLiters, 0)
    const average = total / filteredData.length
    const max = Math.max(...filteredData.map(d => d.fuelLiters))
    return { total, average, max }
  }, [filteredData])

  return (
    <Card>
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row h-[120px]">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6 min-w-0">
          <CardTitle className="text-base leading-tight line-clamp-2">{title}</CardTitle>
          <CardDescription className="text-xs leading-tight line-clamp-1">{description}</CardDescription>
        </div>
        <div className="flex">
          <div className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-3 py-3 text-left sm:border-l sm:border-t-0 sm:px-4 sm:py-4">
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              Total
            </span>
            <span className="text-base font-bold leading-none sm:text-xl whitespace-nowrap">
              {stats.total.toFixed(1)}L
            </span>
          </div>
          <div className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-3 py-3 text-left border-l sm:border-t-0 sm:px-4 sm:py-4">
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              Média
            </span>
            <span className="text-base font-bold leading-none sm:text-xl whitespace-nowrap">
              {stats.average.toFixed(1)}L
            </span>
          </div>
          <div className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-3 py-3 text-left border-l sm:border-t-0 sm:px-4 sm:py-4">
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              Máximo
            </span>
            <span className="text-base font-bold leading-none sm:text-xl whitespace-nowrap">
              {stats.max.toFixed(1)}L
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6 pb-6">
        <div className="mb-3 flex items-center justify-end gap-2">
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
          className="aspect-auto h-[280px] w-full"
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
              tickFormatter={(value) => `${value.toFixed(0)}L`}
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
                          L
                        </span>
                      </div>
                    </>
                  )}
                />
              }
            />
            <Bar
              dataKey="fuelLiters"
              fill="var(--color-fuelLiters)"
              fillOpacity={0.8}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

