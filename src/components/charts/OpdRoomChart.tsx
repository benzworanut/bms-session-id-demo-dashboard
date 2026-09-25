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
import type { OpdRoomWorkload } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/dashboard/EmptyState'

interface OpdRoomChartProps {
  data: OpdRoomWorkload[]
  isLoading: boolean
}

export function OpdRoomChart({ data, isLoading }: OpdRoomChartProps) {
  const chartHeight = Math.max(320, data.length * 42)

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">
          จำนวนผู้ป่วยนอกแยกตามห้องตรวจ OPD
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-5">
        {isLoading ? (
          <Skeleton className="h-[320px] w-full" />
        ) : data.length === 0 ? (
          <EmptyState title="ไม่มีข้อมูลห้องตรวจ OPD" />
        ) : (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 5, right: 55, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
              <YAxis
                type="category"
                dataKey="roomName"
                width={170}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                formatter={((value: unknown) => [Number(value).toLocaleString(), 'ครั้ง']) as never}
              />
              <Bar dataKey="count" name="OPD" fill="hsl(var(--chart-3))" radius={[0, 4, 4, 0]}>
                <LabelList dataKey="count" position="right" fill="hsl(var(--foreground))" fontSize={11} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
