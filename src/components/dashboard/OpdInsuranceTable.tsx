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
import type { InsuranceGroup } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/dashboard/EmptyState'

interface OpdInsuranceTableProps {
  data: InsuranceGroup[]
  isLoading: boolean
}

export function OpdInsuranceTable({ data, isLoading }: OpdInsuranceTableProps) {
  const chartHeight = Math.max(360, data.length * 44)

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">สิทธิการรักษาของผู้ป่วยนอก (ครั้ง)</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? <Skeleton className="h-[360px] w-full" /> : data.length === 0 ? <EmptyState title="ไม่มีข้อมูลสิทธิการรักษาของผู้ป่วยนอก" /> : (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 8, right: 45, left: 12, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
              <YAxis
                type="category"
                dataKey="rightName"
                width={150}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip formatter={((value: unknown) => [`${Number(value).toLocaleString()} ครั้ง`, 'จำนวน']) as never} />
              <Bar dataKey="count" name="ครั้ง" fill="hsl(var(--chart-3))" radius={[0, 4, 4, 0]}>
                <LabelList dataKey="count" position="right" fill="hsl(var(--foreground))" fontSize={11} formatter={(value: unknown) => Number(value).toLocaleString()} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}