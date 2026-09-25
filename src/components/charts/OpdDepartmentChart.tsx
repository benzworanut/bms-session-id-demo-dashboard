import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { DepartmentWorkload } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/dashboard/EmptyState'

interface OpdDepartmentChartProps {
  data: DepartmentWorkload[]
  isLoading: boolean
  onDepartmentClick?: (depcode: string) => void
  compact?: boolean
}

export function OpdDepartmentChart({
  data,
  isLoading,
  onDepartmentClick,
  compact = false,
}: OpdDepartmentChartProps) {
  const chartHeight = compact ? 420 : 400
  const chartWidth = Math.max(700, data.length * 80)

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">
          จำนวนผู้ป่วยนอกแยกตามแผนก OPD
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-5">
        {isLoading ? (
          <Skeleton className={`${compact ? 'h-[360px]' : 'h-[320px]'} w-full`} />
        ) : data.length === 0 ? (
          <EmptyState title="ไม่มีข้อมูลแผนก OPD" />
        ) : (            
          <div className="overflow-x-auto">
            <div style={{ minWidth: chartWidth }}>
              <ResponsiveContainer width="100%" height={chartHeight}>
                <BarChart
                  data={data}
                  margin={{ top: 20, right: 20, left: 10, bottom: compact ? 50 : 80 }}
                  onClick={(state: Record<string, unknown>) => {
                    const activePayload = state?.activePayload as Array<{ payload: DepartmentWorkload }> | undefined
                    const department = activePayload?.[0]?.payload
                    if (department) onDepartmentClick?.(department.departmentCode)
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    type="category"
                    dataKey="departmentName"
                    angle={-35}
                    textAnchor="end"
                    height={compact ? 65 : 90}
                    interval={0}
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
                  <Tooltip
                    formatter={((value: unknown) => [Number(value).toLocaleString(), 'ครั้ง']) as never}
                  />
                  <Bar
                    dataKey="visitCount"
                    name="OPD"
                    fill="hsl(var(--chart-3))"
                    radius={[4, 4, 0, 0]}
                    cursor="pointer"
                  >
                    <LabelList dataKey="visitCount" position="top" fill="hsl(var(--foreground))" fontSize={11} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
