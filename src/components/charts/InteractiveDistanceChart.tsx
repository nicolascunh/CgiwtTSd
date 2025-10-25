"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
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
  distanceKm: number
}

interface InteractiveDistanceChartProps {
  data: DataPoint[]
  title?: string
  description?: string
}

const chartConfig = {
  distanceKm: {
    label: "Distância (km)",
    color: "#38bdf8",
  },
} satisfies ChartConfig

export function InteractiveDistanceChart({ 
  data, 
  title = "Distância Percorrida",
  description = "Distância total da frota ao longo do tempo"
}: InteractiveDistanceChartProps) {
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
    const total = filteredData.reduce((acc, curr) => acc + curr.distanceKm, 0)
    const average = total / filteredData.length
    const max = Math.max(...filteredData.map(d => d.distanceKm))
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
              {stats.total.toFixed(1)} km
            </span>
          </div>
          <div className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-3 py-3 text-left border-l sm:border-t-0 sm:px-4 sm:py-4">
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              Média
            </span>
            <span className="text-base font-bold leading-none sm:text-xl whitespace-nowrap">
              {stats.average.toFixed(1)} km
            </span>
          </div>
          <div className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-3 py-3 text-left border-l sm:border-t-0 sm:px-4 sm:py-4">
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              Máximo
            </span>
            <span className="text-base font-bold leading-none sm:text-xl whitespace-nowrap">
              {stats.max.toFixed(1)} km
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
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillDistance" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-distanceKm)"
                  stopOpacity={0.2}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-distanceKm)"
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
              tickFormatter={(value) => `${value.toFixed(0)} km`}
            />
            <ChartTooltip
              cursor={{ stroke: "var(--color-distanceKm)", strokeOpacity: 0.2 }}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("pt-BR", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })
                  }}
                  formatter={(value) => [`${Number(value).toFixed(2)} km`, "Distância"]}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="distanceKm"
              type="natural"
              fill="url(#fillDistance)"
              stroke="var(--color-distanceKm)"
              strokeWidth={2}
              strokeOpacity={0.6}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

