import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { SpecialtyWorkload } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/dashboard/EmptyState'

interface SpecialtyWorkloadChartProps {
  data: SpecialtyWorkload[]
  isLoading: boolean
}

export function SpecialtyWorkloadChart({
  data,
  isLoading,
}: SpecialtyWorkloadChartProps) {
  const chartHeight = Math.max(320, data.length * 36)

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">
          จำนวนผู้ป่วยแยกตามสาขาการรักษา
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        {isLoading ? (
          <Skeleton className="h-[480px] w-full" />
        ) : data.length === 0 ? (
          <EmptyState title="ไม่มีข้อมูลสาขาการรักษา" />
        ) : (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              barGap={0}
              barCategoryGap="0%"
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis type="number" allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="specialty"
                width={130}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                formatter={((value: unknown, name: unknown) => [
                  Number(value).toLocaleString(),
                  name === 'opdCount' ? 'OPD' : 'IPD',
                ]) as never}
              />
              <Legend verticalAlign="top" align="center" wrapperStyle={{ paddingBottom: 4 }} />
              <Bar
                dataKey="opdCount"
                name="OPD"
                fill="#10b981"
                barSize={10}
                radius={[0, 4, 4, 0]}
              >
                <LabelList dataKey="opdCount" position="right" fill="#059669" fontSize={11} />
              </Bar>
              <Bar
                dataKey="ipdCount"
                name="IPD"
                fill="#3b82f6"
                barSize={10}
                radius={[0, 4, 4, 0]}
              >
                <LabelList dataKey="ipdCount" position="right" fill="#2563eb" fontSize={11} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
