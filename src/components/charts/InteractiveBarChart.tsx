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
  value: number
}

interface InteractiveBarChartProps {
  data: DataPoint[]
  title?: string
  description?: string
  dataKey?: string
  dataLabel?: string
  accentColor?: string
  formatter?: (value: number) => string
  yLabel?: string
}

export function InteractiveBarChart({ 
  data, 
  title = "Gráfico de Barras",
  description = "Visualização de dados ao longo do tempo",
  dataKey = "value",
  dataLabel = "Valor",
  accentColor = "hsl(var(--chart-1))",
  formatter = (value) => value.toLocaleString('pt-BR'),
  yLabel = ""
}: InteractiveBarChartProps) {
  const [timeRange, setTimeRange] = React.useState("all")

  const chartConfig = React.useMemo<ChartConfig>(() => ({
    [dataKey]: {
      label: dataLabel,
      color: accentColor,
    },
  }), [dataKey, dataLabel, accentColor])

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

  const total = React.useMemo(() => {
    return filteredData.reduce((sum, item) => sum + item.value, 0)
  }, [filteredData])

  const average = React.useMemo(() => {
    return filteredData.length > 0 ? total / filteredData.length : 0
  }, [filteredData, total])

  const max = React.useMemo(() => {
    return Math.max(...filteredData.map(item => item.value), 0)
  }, [filteredData])

  return (
    <Card>
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <div className="flex">
          <div className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left sm:border-l sm:border-t-0 sm:px-8 sm:py-6">
            <span className="text-xs text-muted-foreground">
              Total
            </span>
            <span className="text-lg font-bold leading-none sm:text-3xl">
              {formatter(total)}
            </span>
          </div>
          <div className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l sm:border-l sm:border-t-0 sm:px-8 sm:py-6">
            <span className="text-xs text-muted-foreground">
              Média
            </span>
            <span className="text-lg font-bold leading-none sm:text-3xl">
              {formatter(average)}
            </span>
          </div>
          <div className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l sm:border-l sm:border-t-0 sm:px-8 sm:py-6">
            <span className="text-xs text-muted-foreground">
              Máximo
            </span>
            <span className="text-lg font-bold leading-none sm:text-3xl">
              {formatter(max)}
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
              tickFormatter={(value) => yLabel ? `${value}${yLabel}` : formatter(value)}
            />
            <ChartTooltip
              cursor={{ fill: "rgba(0, 0, 0, 0.05)" }}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("pt-BR", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })
                  }}
                  formatter={(value) => [formatter(Number(value)), dataLabel]}
                  indicator="dot"
                />
              }
            />
            <Bar
              dataKey="value"
              fill={accentColor}
              fillOpacity={0.8}
              radius={[4, 4, 0, 0]}
            />
            <ChartLegend content={<ChartLegendContent />} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

