import type { OpdDepartmentServiceWorkload } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/dashboard/EmptyState'

interface OpdDepartmentServiceTableProps {
  data: OpdDepartmentServiceWorkload[]
  isLoading: boolean
}

export function OpdDepartmentServiceTable({ data, isLoading }: OpdDepartmentServiceTableProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">จำนวนการสั่ง Lab / X-ray แยกห้องตรวจ</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[360px] w-full" />
        ) : data.length === 0 ? (
          <EmptyState title="ไม่มีข้อมูลบริการแยกตามแผนก" />
        ) : (
          <div className="max-h-[420px] overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card text-xs text-muted-foreground">
                <tr className="border-b">
                  <th className="p-2 text-left font-medium">แผนก</th>
                  <th className="p-2 text-right font-medium">Visit</th>
                  <th className="p-2 text-right font-medium">Lab</th>
                  <th className="p-2 text-right font-medium">X-ray</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item) => (
                  <tr key={item.departmentName} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="max-w-[18rem] truncate p-2" title={item.departmentName}>{item.departmentName}</td>
                    <td className="p-2 text-right font-semibold">{item.visitCount.toLocaleString()}</td>
                    <td className="p-2 text-right text-amber-600">{item.labVisitCount.toLocaleString()}</td>
                    <td className="p-2 text-right text-cyan-600">{item.xrayVisitCount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}