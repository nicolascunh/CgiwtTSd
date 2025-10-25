"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
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
  engineHours: number
  drivingHours: number
  idleHours: number
}

interface InteractiveEngineHoursChartProps {
  data: DataPoint[]
  title?: string
  description?: string
}

const chartConfig = {
  engineHours: {
    label: "Horas de Motor",
    color: "#8b5cf6",
  },
  drivingHours: {
    label: "Tempo de Condução",
    color: "#22c55e",
  },
  idleHours: {
    label: "Marcha Lenta",
    color: "#f97316",
  },
} satisfies ChartConfig

export function InteractiveEngineHoursChart({ 
  data, 
  title = "Horas de Motor e Condução",
  description = "Comparativo de horas de motor, condução e marcha lenta"
}: InteractiveEngineHoursChartProps) {
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

  return (
    <Card>
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1 text-center sm:text-left">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger
            className="w-[160px] rounded-lg sm:ml-auto"
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
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[300px] w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillEngineHours" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-engineHours)"
                  stopOpacity={0.2}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-engineHours)"
                  stopOpacity={0.05}
                />
              </linearGradient>
              <linearGradient id="fillDrivingHours" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-drivingHours)"
                  stopOpacity={0.2}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-drivingHours)"
                  stopOpacity={0.05}
                />
              </linearGradient>
              <linearGradient id="fillIdleHours" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-idleHours)"
                  stopOpacity={0.2}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-idleHours)"
                  stopOpacity={0.05}
                />
              </linearGradient>
            </defs>
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
              cursor={{ strokeOpacity: 0.2 }}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("pt-BR", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })
                  }}
                  formatter={(value, name) => {
                    const labels: Record<string, string> = {
                      engineHours: "Horas de Motor",
                      drivingHours: "Tempo de Condução",
                      idleHours: "Marcha Lenta"
                    }
                    return [`${Number(value).toFixed(2)}h`, labels[name as string] || name]
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="idleHours"
              type="monotone"
              fill="url(#fillIdleHours)"
              stroke="var(--color-idleHours)"
              strokeWidth={2}
              strokeOpacity={0.6}
              stackId="1"
            />
            <Area
              dataKey="drivingHours"
              type="monotone"
              fill="url(#fillDrivingHours)"
              stroke="var(--color-drivingHours)"
              strokeWidth={2}
              strokeOpacity={0.6}
              stackId="1"
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

