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
import type { OpdDepartmentDiagnosisWorkload } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/dashboard/EmptyState'

interface OpdDepartmentDiagnosisTableProps {
  data: OpdDepartmentDiagnosisWorkload[]
  isLoading: boolean
}

export function OpdDepartmentDiagnosisTable({ data, isLoading }: OpdDepartmentDiagnosisTableProps) {
  const chartHeight = Math.max(360, data.length * 44)

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">อันดับการวินิจฉัยโรคผู้ป่วยนอก (ครั้ง)</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? <Skeleton className="h-[360px] w-full" /> : data.length === 0 ? <EmptyState title="ไม่มีข้อมูลการวินิจฉัยโรคผู้ป่วยนอก" /> : (
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
                dataKey="departmentName"
                width={170}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip formatter={((value: unknown) => [`${Number(value).toLocaleString()} ครั้ง`, 'การวินิจฉัย']) as never} />
              <Bar dataKey="diagnosisCount" name="ครั้ง" fill="hsl(var(--chart-3))" radius={[0, 4, 4, 0]}>
                <LabelList dataKey="diagnosisCount" position="right" fill="hsl(var(--foreground))" fontSize={11} formatter={(value: unknown) => Number(value).toLocaleString()} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}