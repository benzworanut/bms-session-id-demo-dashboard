import type { OpdRoomWorkload } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/dashboard/EmptyState'

interface OpdRoomTableProps {
  data: OpdRoomWorkload[]
  isLoading: boolean
}

export function OpdRoomTable({ data, isLoading }: OpdRoomTableProps) {
  const maxCount = data.length > 0 ? Math.max(...data.map((item) => item.count)) : 0

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">จำนวนผู้ป่วยนอกแยกห้องตรวจ (OPD)</CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-7 w-full" />
            ))}
          </div>
        ) : data.length === 0 ? (
          <EmptyState title="ไม่มีข้อมูลผู้ป่วยนอก" />
        ) : (
          <div className="max-h-[440px] overflow-y-auto pr-2">
            <div className="grid grid-cols-[2rem_minmax(0,1fr)_4rem] items-center border-b pb-2 text-xs font-semibold text-muted-foreground">
              <span>#</span>
              <span>ห้องตรวจ</span>
              <span className="text-right">จำนวน</span>
            </div>
            <div className="divide-y">
              {data.map((item, index) => (
                <div key={item.roomName} className="grid grid-cols-[2rem_minmax(0,1fr)_4rem] items-center gap-2 py-2 text-sm">
                  <span className="text-xs text-muted-foreground">{index + 1}</span>
                  <div className="min-w-0">
                    <div className="truncate">{item.roomName}</div>
                    <div className="mt-1 h-1.5 rounded-full bg-muted">
                      <div className="h-full rounded-full bg-[hsl(var(--chart-3))]" style={{ width: `${maxCount > 0 ? (item.count / maxCount) * 100 : 0}%` }} />
                    </div>
                  </div>
                  <span className="text-right font-semibold text-[hsl(var(--chart-3))]">{item.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
