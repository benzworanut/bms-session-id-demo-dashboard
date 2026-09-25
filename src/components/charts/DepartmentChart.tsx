// =============================================================================
// BMS Session KPI Dashboard - Department Horizontal Bar Chart (T063)
// =============================================================================

import type { DepartmentWorkload } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/dashboard/EmptyState'
import { cn } from '@/lib/utils'

interface DepartmentChartProps {
  data: DepartmentWorkload[]
  isLoading: boolean
  onDepartmentClick?: (depcode: string) => void
  title?: string
  className?: string
}

export function DepartmentChart({
  data,
  isLoading,
  onDepartmentClick,
  title = 'รายละเอียดการเข้ารับบริการแยกตามห้องตรวจ OPD',
  className,
}: DepartmentChartProps) {
  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------
  if (isLoading) {
    return (
      <Card className={cn(className)}>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">{title}</CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
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
          <CardTitle className="text-xl font-semibold">{title}</CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          <EmptyState title="ไม่มีข้อมูลห้องตรวจ OPD" />
        </CardContent>
      </Card>
    )
  }

  // ---------------------------------------------------------------------------
  // OPD room list
  // ---------------------------------------------------------------------------
  const maxVisitCount = Math.max(...data.map((item) => item.visitCount))

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle className="text-xl font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-5">
        <div className="max-h-[440px] overflow-y-auto pr-2">
          <div className="grid grid-cols-[2rem_minmax(0,1fr)_4rem] items-center border-b pb-2 text-xs font-semibold text-muted-foreground">
            <span>#</span>
            <span>ห้องตรวจ</span>
            <span className="text-right">จำนวน</span>
          </div>
          <div className="divide-y">
            {data.map((item, index) => (
              <button
                key={item.departmentCode}
                type="button"
                className="grid w-full grid-cols-[2rem_minmax(0,1fr)_4rem] items-center gap-2 py-2 text-left text-sm hover:bg-muted"
                onClick={() => onDepartmentClick?.(item.departmentCode)}
              >
                <span className="text-xs text-muted-foreground">{index + 1}</span>
                <span className="min-w-0">
                  <span className="block truncate">{item.departmentName}</span>
                  <span className="mt-1 block h-1.5 rounded-full bg-muted">
                    <span
                      className="block h-full rounded-full bg-[hsl(var(--chart-3))]"
                      style={{ width: `${maxVisitCount > 0 ? (item.visitCount / maxVisitCount) * 100 : 0}%` }}
                    />
                  </span>
                </span>
                <span className="text-right font-semibold text-[hsl(var(--chart-3))]">
                  {item.visitCount.toLocaleString()}
                </span>
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
