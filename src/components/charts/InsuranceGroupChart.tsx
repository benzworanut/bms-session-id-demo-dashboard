import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import type { InsuranceGroup } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/dashboard/EmptyState'

interface InsuranceGroupChartProps {
  data: InsuranceGroup[]
  isLoading: boolean
}

const COLORS = [
  '#3b82f6',
  '#ef4444',
  '#10b981',
  '#f97316',
  '#8b5cf6',
  '#f59e0b',
  '#ec4899',
]

export function InsuranceGroupChart({
  data,
  isLoading,
}: InsuranceGroupChartProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">
          จำนวนผู้ป่วยแยกกลุ่มสิทธิ์การรักษา
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-5">
        {isLoading ? (
          <Skeleton className="h-[460px] w-full" />
        ) : data.length === 0 ? (
          <EmptyState title="ไม่มีข้อมูลกลุ่มสิทธิ์การรักษา" />
        ) : (
          <ResponsiveContainer width="100%" height={460}>
            <PieChart>
              <Pie
                data={data}
                dataKey="count"
                nameKey="rightName"
                cx="50%"
                cy="42%"
                innerRadius={80}
                outerRadius={165}
                paddingAngle={2}
                label={({ cx, cy, midAngle, outerRadius, percent }) => {
                  const radius = Number(outerRadius ?? 0) * 0.72
                  const angle = (-Number(midAngle ?? 0) * Math.PI) / 180
                  const x = Number(cx ?? 0) + radius * Math.cos(angle)
                  const y = Number(cy ?? 0) + radius * Math.sin(angle)
                  return (
                    <text x={x} y={y} fill="#ffffff" fontSize={11} fontWeight={600} textAnchor="middle" dominantBaseline="central">
                      {`${(Number(percent ?? 0) * 100).toFixed(0)}%`}
                    </text>
                  )
                }}
                labelLine={false}
              >
                {data.map((item, index) => (
                  <Cell key={item.rightName} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={((value: unknown) => `${Number(value).toLocaleString()} คน`) as never}
              />
              <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
