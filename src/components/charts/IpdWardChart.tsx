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
import type { IpdWardWorkload } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/dashboard/EmptyState'

interface IpdWardChartProps {
  data: IpdWardWorkload[]
  isLoading: boolean
}

export function IpdWardChart({ data, isLoading }: IpdWardChartProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">จำนวนผู้ป่วยในแยกตึก (IPD)</CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        {isLoading ? (
          <Skeleton className="h-[400px] w-full" />
        ) : data.length === 0 ? (
          <EmptyState title="ไม่มีข้อมูลผู้ป่วยใน" />
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data} layout="vertical" margin={{ top: 5, right: 45, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="wardName" width={145} tick={{ fontSize: 12 }} />
              <Tooltip formatter={((value: unknown) => [`${Number(value).toLocaleString()} คน`, 'จำนวน']) as never} />
              <Bar dataKey="count" fill="hsl(var(--chart-3))" radius={[0, 5, 5, 0]}>
                <LabelList dataKey="count" position="right" formatter={(value: unknown) => `${Number(value).toLocaleString()} คน`} fill="hsl(var(--chart-3))" fontSize={11} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
