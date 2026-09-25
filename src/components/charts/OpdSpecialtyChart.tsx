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
import type { SpecialtyWorkload } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/dashboard/EmptyState'

interface OpdSpecialtyChartProps {
  data: SpecialtyWorkload[]
  isLoading: boolean
}

export function OpdSpecialtyChart({ data, isLoading }: OpdSpecialtyChartProps) {
  const chartHeight = 400
  const chartWidth = Math.max(700, data.length * 80)

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">จำนวนผู้ป่วยนอกแยกตามสาขา OPD</CardTitle>
      </CardHeader>
      <CardContent className="pt-5">
        {isLoading ? <Skeleton className="h-[320px] w-full" /> : data.length === 0 ? <EmptyState title="ไม่มีข้อมูลสาขา OPD" /> : (
          <div className="overflow-x-auto">
            <div style={{ minWidth: chartWidth }}>
              <ResponsiveContainer width="100%" height={chartHeight}>
                <BarChart data={data} margin={{ top: 20, right: 20, left: 10, bottom: 75 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    type="category"
                    dataKey="specialty"
                    angle={-35}
                    textAnchor="end"
                    height={85}
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
                  <Tooltip formatter={((value: unknown) => [Number(value).toLocaleString(), 'ครั้ง']) as never} />
                  <Bar dataKey="opdCount" name="OPD" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]}>
                    <LabelList dataKey="opdCount" position="top" fill="hsl(var(--foreground))" fontSize={11} />
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
