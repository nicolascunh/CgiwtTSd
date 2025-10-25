import * as React from "react"
import { Area, AreaChart, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface KPIDataPoint {
  date: string
  value: number
}

interface InteractiveKPICardProps {
  title: string
  description?: string
  currentValue: string | number
  currentLabel: string
  previousValue?: string | number
  previousLabel?: string
  trend?: {
    value: number
    label: string
    isPositive?: boolean
    isNeutral?: boolean
  }
  data: KPIDataPoint[]
  color?: string
  icon?: React.ReactNode
  formatter?: (value: number) => string
  showTimeFilter?: boolean
  className?: string
}

export function InteractiveKPICard({
  title,
  description,
  currentValue,
  currentLabel,
  previousValue,
  previousLabel,
  trend,
  data,
  color = "#3b82f6",
  icon,
  formatter = (val) => val.toFixed(1),
  showTimeFilter = true,
  className = "",
}: InteractiveKPICardProps) {
  const [timeRange, setTimeRange] = React.useState("90d")

  // Filtrar dados baseado no período selecionado
  const filteredData = React.useMemo(() => {
    if (!data || data.length === 0) return []

    let daysToShow = 90
    if (timeRange === "30d") daysToShow = 30
    else if (timeRange === "7d") daysToShow = 7
    else if (timeRange === "all") return data

    return data.slice(-daysToShow)
  }, [data, timeRange])

  // Calcular estatísticas
  const stats = React.useMemo(() => {
    if (!filteredData || filteredData.length === 0) {
      return { total: 0, average: 0, max: 0, min: 0 }
    }

    const values = filteredData.map(d => d.value)
    const total = values.reduce((sum, val) => sum + val, 0)
    const average = total / values.length
    const max = Math.max(...values)
    const min = Math.min(...values)

    return { total, average, max, min }
  }, [filteredData])

  // Determinar ícone de tendência
  const TrendIcon = trend?.isNeutral 
    ? Minus 
    : trend?.isPositive 
      ? TrendingUp 
      : TrendingDown

  const trendColor = trend?.isNeutral
    ? "text-gray-500"
    : trend?.isPositive
      ? "text-green-600"
      : "text-red-600"

  // ID único para o gradiente (sem espaços ou caracteres especiais)
  const gradientId = React.useMemo(() => 
    `gradient-${title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-${Math.random().toString(36).substr(2, 9)}`,
    [title]
  )

  return (
    <Card className={`${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex-1">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          {description && (
            <CardDescription className="text-xs mt-1">
              {description}
            </CardDescription>
          )}
        </div>
        {showTimeFilter && (
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger 
              className="w-[100px] h-8 text-xs"
              aria-label="Selecionar período"
            >
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 dias</SelectItem>
              <SelectItem value="30d">30 dias</SelectItem>
              <SelectItem value="90d">90 dias</SelectItem>
              <SelectItem value="all">Todos</SelectItem>
            </SelectContent>
          </Select>
        )}
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {/* Valor Principal */}
          <div className="flex items-baseline justify-between">
            <div className="flex items-center gap-2">
              {icon && <span className="text-2xl">{icon}</span>}
              <div className="text-3xl font-bold" style={{ color }}>
                {currentValue}
              </div>
            </div>
          </div>

          {/* Label do Período Atual */}
          {currentLabel && (
            <div className="text-xs text-muted-foreground">
              {currentLabel}
            </div>
          )}

          {/* Comparação com Período Anterior */}
          {previousValue !== undefined && previousLabel && (
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">
                {previousLabel}
              </div>
              <div className="text-sm font-medium text-gray-600">
                {previousValue}
              </div>
            </div>
          )}

          {/* Tendência */}
          {trend && (
            <div className={`flex items-center gap-1 text-sm font-medium ${trendColor}`}>
              <TrendIcon className="h-4 w-4" />
              <span>{trend.label}</span>
            </div>
          )}

          {/* Mini Gráfico Sparkline */}
          {filteredData && filteredData.length > 0 && (
            <div className="h-[60px] mt-3">
              <ChartContainer
                config={{
                  value: {
                    label: title,
                    color: color,
                  },
                }}
                className="h-full w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={filteredData}
                    margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
                  >
                    <defs>
                      <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={color} stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <ChartTooltip
                      cursor={{ stroke: color, strokeWidth: 1, strokeOpacity: 0.3 }}
                      content={({ active, payload }) => {
                        if (!active || !payload || !payload.length) return null;
                        
                        const data = payload[0].payload;
                        const dateStr = data.date;
                        const value = data.value;
                        
                        let formattedDate = '';
                        try {
                          const date = new Date(dateStr);
                          if (!isNaN(date.getTime())) {
                            formattedDate = date.toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            });
                          }
                        } catch (e) {
                          formattedDate = dateStr;
                        }
                        
                        return (
                          <div className="rounded-lg border bg-background p-2 shadow-sm">
                            <div className="text-xs text-muted-foreground mb-1">
                              {formattedDate}
                            </div>
                            <div className="text-sm font-bold" style={{ color }}>
                              {formatter(value)}
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke={color}
                      strokeWidth={1.5}
                      strokeOpacity={0.6}
                      fill={`url(#${gradientId})`}
                      isAnimationActive={true}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          )}

          {/* Estatísticas Resumidas */}
          {filteredData && filteredData.length > 0 && (
            <div className="grid grid-cols-3 gap-2 pt-2 border-t text-xs">
              <div>
                <div className="text-muted-foreground">Média</div>
                <div className="font-medium">{formatter(stats.average)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Máx</div>
                <div className="font-medium">{formatter(stats.max)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Mín</div>
                <div className="font-medium">{formatter(stats.min)}</div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

