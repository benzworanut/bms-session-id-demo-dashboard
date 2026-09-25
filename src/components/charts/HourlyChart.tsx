// =============================================================================
// BMS Session KPI Dashboard - Hourly Distribution Chart Component (T055)
// =============================================================================

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import type { HourlyDistribution } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/dashboard/EmptyState'
import { cn } from '@/lib/utils'

interface HourlyChartProps {
  data: HourlyDistribution[]
  isLoading: boolean
  selectedDate?: string
  className?: string
}

/**
 * Formats an hour number (0-23) as "HH:00".
 */
function formatHourLabel(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`
}

export function HourlyChart({
  data,
  isLoading,
  className,
}: HourlyChartProps) {
  const chartTitle = 'สถิติความหนาแน่นของผู้ป่วยรายชั่วโมง'
  const chartData = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    visitCount: data.find((item) => item.hour === hour)?.visitCount ?? 0,
  }))

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------
  if (isLoading) {
    return (
      <Card className={cn(className)}>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">
            {chartTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    )
  }

  // ---------------------------------------------------------------------------
  // Empty state
  // ---------------------------------------------------------------------------
  if (!data || data.length === 0) {
    return (
      <Card className={cn(className)}>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">
            {chartTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState title="ไม่มีข้อมูลรายชั่วโมงสำหรับวันที่นี้" />
        </CardContent>
      </Card>
    )
  }

  // ---------------------------------------------------------------------------
  // Chart
  // ---------------------------------------------------------------------------
  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle className="text-xl font-semibold">
          {chartTitle}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="hour"
              tickFormatter={formatHourLabel}
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              labelFormatter={((hour: unknown) => formatHourLabel(Number(hour))) as never}
              formatter={((value: unknown) => [Number(value).toLocaleString(), 'ครั้ง']) as never}
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid hsl(var(--border))',
                backgroundColor: 'hsl(var(--popover))',
                color: 'hsl(var(--popover-foreground))',
              }}
            />
            <Line
              dataKey="visitCount"
              type="monotone"
              fill="hsl(var(--chart-2))"
              stroke="hsl(var(--chart-2))"
              strokeWidth={2}
              dot={{ r: 3, fill: 'hsl(var(--chart-2))' }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
