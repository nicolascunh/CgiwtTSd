import * as React from "react"
import { Wifi, WifiOff, RefreshCw, AlertCircle } from "lucide-react"
import { Label, Pie, PieChart } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

interface SegmentData {
  label: string
  value: number
  color: string
}

interface ConnectionStatusPieChartProps {
  segments: SegmentData[]
  total: number
  title?: string
  description?: string
  statusLabel?: string
  statusTone?: 'success' | 'warning' | 'danger' | 'info'
}

const iconMap: Record<string, any> = {
  'Online': Wifi,
  'Offline': WifiOff,
  'Atualizando': RefreshCw,
  'Outros': AlertCircle,
}

const iconColorMap: Record<string, string> = {
  'Online': 'text-green-600',
  'Offline': 'text-red-600',
  'Atualizando': 'text-yellow-600',
  'Outros': 'text-gray-500',
}

export function ConnectionStatusPieChart({
  segments,
  total,
  title = "Status da Conexão",
  description = "Total monitorado",
  statusLabel,
  statusTone = 'success'
}: ConnectionStatusPieChartProps) {
  const chartData = React.useMemo(() => 
    segments.map(seg => ({
      name: seg.label,
      value: seg.value,
      fill: seg.color
    }))
  , [segments])

  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {
      value: {
        label: "Veículos",
      },
    }
    segments.forEach(seg => {
      config[seg.label.toLowerCase()] = {
        label: seg.label,
        color: seg.color,
      }
    })
    return config
  }, [segments])

  const statusColors = {
    success: 'text-green-600 bg-green-100',
    warning: 'text-yellow-600 bg-yellow-100',
    danger: 'text-red-600 bg-red-100',
    info: 'text-blue-600 bg-blue-100',
  }

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
        {statusLabel && (
          <div className={`mt-2 px-2 py-1 rounded text-xs font-medium ${statusColors[statusTone]}`}>
            {statusLabel}
          </div>
        )}
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[280px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius={60}
              strokeWidth={5}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {total}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground text-sm"
                        >
                          Dispositivos
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <div className="flex flex-col gap-2 text-sm px-6 pb-4">
        {segments.map((segment) => {
          const Icon = iconMap[segment.label] || AlertCircle
          const iconColor = iconColorMap[segment.label] || 'text-gray-500'
          const percentage = total > 0 ? ((segment.value / total) * 100).toFixed(1) : '0.0'
          
          return (
            <div key={segment.label} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: segment.color }} />
                <span className="text-muted-foreground">{segment.label}</span>
              </div>
              <div className="flex items-center gap-1">
                <Icon className={`h-4 w-4 ${iconColor}`} />
                <span className="font-bold">{segment.value}</span>
                <span className="text-muted-foreground text-xs">({percentage}%)</span>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

