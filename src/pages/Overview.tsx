// =============================================================================
// BMS Session KPI Dashboard - Overview Page (Rich Command Center)
// =============================================================================

import { useState, useCallback, useMemo } from 'react'
import {
  RefreshCw,
  Database,
  Clock,
  Shield,
  Server,
  Globe,
  User,
  Building,
  CalendarDays,
  Users,
  CalendarCheck,
  CalendarMinus,
  BarChart3,
  Stethoscope,
  Building2,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { KpiCardGrid } from '@/components/dashboard/KpiCardGrid'
import { HourlyChart } from '@/components/charts/HourlyChart'
import { OpdDepartmentChart } from '@/components/charts/OpdDepartmentChart'
import { SpecialtyWorkloadChart } from '@/components/charts/SpecialtyWorkloadChart'
import { InsuranceGroupChart } from '@/components/charts/InsuranceGroupChart'
import { IpdWardChart } from '@/components/charts/IpdWardChart'
import { OpdRoomTable } from '@/components/dashboard/OpdRoomTable'
import { useBmsSessionContext } from '@/contexts/BmsSessionContext'
import { useQuery } from '@/hooks/useQuery'
import {
  getOverviewStats,
  getHourlyDistribution,
  getDepartmentBreakdown,
  getSpecialtyWorkload,
  getInsuranceGroups,
  getIpdWardWorkload,
  getOpdRoomWorkload,
} from '@/services/kpiService'
import { formatDate, formatDateISO, formatDateTime } from '@/utils/dateUtils'
import { cn } from '@/lib/utils'

function formatExpiryDays(seconds: number): string {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  if (days > 0) {
    return `${days}d ${hours}h`
  }
  const minutes = Math.floor((seconds % 3600) / 60)
  return `${hours}h ${minutes}m`
}

function truncateUrl(url: string, maxLength = 40): string {
  if (url.length <= maxLength) return url
  return url.substring(0, maxLength) + '...'
}

export default function Overview() {
  const { session, connectionConfig, refreshSession } = useBmsSessionContext()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await refreshSession()
      setLastUpdated(new Date())
    } finally {
      // Small delay so the user sees the spinner
      setTimeout(() => setIsRefreshing(false), 600)
    }
  }, [refreshSession])

  const currentDate = new Date()
  const today = formatDate(currentDate)
  const queryToday = formatDateISO(currentDate)
  const isConnected = connectionConfig !== null && session !== null

  // ---------------------------------------------------------------------------
  // Data queries
  // ---------------------------------------------------------------------------

  const overviewStatsFn = useCallback(
    () => getOverviewStats(connectionConfig!, session!.databaseType),
    [connectionConfig, session],
  )
  const {
    data: overviewStats,
    isLoading: isStatsLoading,
  } = useQuery<Awaited<ReturnType<typeof getOverviewStats>>>({
    queryFn: overviewStatsFn,
    enabled: isConnected,
  })

  const departmentWorkloadFn = useCallback(
    () =>
      getDepartmentBreakdown(
        connectionConfig!,
        session!.databaseType,
        queryToday,
        queryToday,
      ),
    [connectionConfig, session, queryToday],
  )
  const {
    data: departmentWorkload,
    isLoading: isDepartmentWorkloadLoading,
  } = useQuery<Awaited<ReturnType<typeof getDepartmentBreakdown>>>({
    queryFn: departmentWorkloadFn,
    enabled: isConnected,
  })

  const specialtyWorkloadFn = useCallback(
    () => getSpecialtyWorkload(connectionConfig!, session!.databaseType),
    [connectionConfig, session],
  )
  const {
    data: specialtyWorkload,
    isLoading: isSpecialtyWorkloadLoading,
  } = useQuery<Awaited<ReturnType<typeof getSpecialtyWorkload>>>({
    queryFn: specialtyWorkloadFn,
    enabled: isConnected,
  })

  const insuranceGroupsFn = useCallback(
    () => getInsuranceGroups(connectionConfig!, session!.databaseType),
    [connectionConfig, session],
  )
  const {
    data: insuranceGroups,
    isLoading: isInsuranceGroupsLoading,
  } = useQuery<Awaited<ReturnType<typeof getInsuranceGroups>>>({
    queryFn: insuranceGroupsFn,
    enabled: isConnected,
  })

  const hourlyDistributionFn = useCallback(
    () => getHourlyDistribution(connectionConfig!, session!.databaseType, queryToday),
    [connectionConfig, session, queryToday],
  )
  const {
    data: hourlyDistribution,
    isLoading: isHourlyDistributionLoading,
  } = useQuery<Awaited<ReturnType<typeof getHourlyDistribution>>>({
    queryFn: hourlyDistributionFn,
    enabled: isConnected,
  })

  const ipdWardFn = useCallback(
    () => getIpdWardWorkload(connectionConfig!),
    [connectionConfig],
  )
  const {
    data: ipdWards,
    isLoading: isIpdWardsLoading,
  } = useQuery<Awaited<ReturnType<typeof getIpdWardWorkload>>>({
    queryFn: ipdWardFn,
    enabled: isConnected,
  })

  const opdRoomFn = useCallback(
    () => getOpdRoomWorkload(connectionConfig!, session!.databaseType),
    [connectionConfig, session],
  )
  const {
    data: opdRooms,
    isLoading: isOpdRoomsLoading,
  } = useQuery<Awaited<ReturnType<typeof getOpdRoomWorkload>>>({
    queryFn: opdRoomFn,
    enabled: isConnected,
  })

  // ---------------------------------------------------------------------------
  // Derived values
  // ---------------------------------------------------------------------------
  // ---------------------------------------------------------------------------
  // Mini stat card definitions
  // ---------------------------------------------------------------------------
  const miniStats = useMemo(
    () => [
      {
        label: 'ผู้ป่วยทั้งหมด',
        value: overviewStats?.totalRegisteredPatients,
        icon: <Users className="h-4 w-4" />,
      },
      {
        label: 'เข้ารับบริการเดือนนี้',
        value: overviewStats?.totalVisitsThisMonth,
        icon: <CalendarCheck className="h-4 w-4" />,
      },
      {
        label: 'เข้ารับบริการเดือนที่แล้ว',
        value: overviewStats?.totalVisitsLastMonth,
        icon: <CalendarMinus className="h-4 w-4" />,
      },
      {
        label: 'เฉลี่ยต่อวัน',
        value: overviewStats?.avgDailyVisitsThisMonth,
        icon: <BarChart3 className="h-4 w-4" />,
      },
      {
        label: 'บุคลากรทั้งหมด',
        value: overviewStats?.totalDoctors,
        icon: <Stethoscope className="h-4 w-4" />,
      },
      {
        label: 'ห้องตรวจทั้งหมด',
        value: overviewStats?.totalDepartments,
        icon: <Building2 className="h-4 w-4" />,
      },
    ],
    [overviewStats],
  )

  // ---------------------------------------------------------------------------
  // Session info rows helper
  // ---------------------------------------------------------------------------
  const sessionInfoRows: Array<{
    icon: React.ReactNode
    label: string
    value: string | React.ReactNode
  }> = session
    ? [
        {
          icon: <Database className="h-4 w-4" />,
          label: 'ประเภทฐานข้อมูล',
          value: (
            <Badge variant="secondary" className="font-mono text-xs">
              {session.databaseType.toUpperCase()}
            </Badge>
          ),
        },
        {
          icon: <Server className="h-4 w-4" />,
          label: 'ชื่อฐานข้อมูล',
          value: session.databaseName || 'N/A',
        },
        {
          icon: <Clock className="h-4 w-4" />,
          label: 'วันหมดอายุเซสชัน',
          value: `หมดอายุใน ${formatExpiryDays(session.expirySeconds)}`,
        },
        {
          icon: <User className="h-4 w-4" />,
          label: 'ผู้ใช้ / บทบาท',
          value: `${session.userInfo.name} (${session.userInfo.position})`,
        },
        {
          icon: <Building className="h-4 w-4" />,
          label: 'รหัสโรงพยาบาล',
          value: (
            <span className="font-mono text-sm">
              {session.userInfo.hospitalCode || 'N/A'}
            </span>
          ),
        },
        {
          icon: <Shield className="h-4 w-4" />,
          label: 'เวอร์ชันระบบ',
          value: session.systemInfo.version || 'N/A',
        },
        {
          icon: <Globe className="h-4 w-4" />,
          label: 'สภาพแวดล้อม',
          value: (
            <Badge
              variant={
                session.systemInfo.environment?.toLowerCase() === 'production'
                  ? 'default'
                  : 'secondary'
              }
              className="text-xs"
            >
              {session.systemInfo.environment || 'Unknown'}
            </Badge>
          ),
        },
      ]
    : []

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="flex flex-col gap-6">
      {/* ------------------------------------------------------------------- */}
      {/* 1. Welcome Banner                                                    */}
      {/* ------------------------------------------------------------------- */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            ภาพรวมแดชบอร์ด
          </h1>
          <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              {today}
            </span>
            <span className="text-muted-foreground/40">|</span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              อัปเดตล่าสุด {formatDateTime(lastUpdated)}
            </span>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="mt-2 gap-1.5 sm:mt-0"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw
            className={cn('h-3.5 w-3.5', isRefreshing && 'animate-spin')}
          />
          รีเฟรช
        </Button>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* 2. KPI Card Grid                                                     */}
      {/* ------------------------------------------------------------------- */}
      <KpiCardGrid />

      {/* ------------------------------------------------------------------- */}
      {/* 3. Stats Row - 6 mini stat cards                                     */}
      {/* ------------------------------------------------------------------- */}
      <div className="grid grid-cols-3 gap-3 lg:grid-cols-6">
        {miniStats.map((stat) => (
          <Card key={stat.label} className="p-3">
            <CardContent className="flex flex-col items-start gap-1.5 p-0">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground">
                {stat.icon}
              </div>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              {isStatsLoading ? (
                <Skeleton className="h-6 w-16" />
              ) : (
                <p className="text-lg font-bold">
                  {stat.value?.toLocaleString() ?? '0'}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* 4. Hourly Patient Density                                           */}
      {/* ------------------------------------------------------------------- */}
      <HourlyChart
        data={hourlyDistribution ?? []}
        isLoading={isHourlyDistributionLoading}
        selectedDate={today}
      />

      {/* ------------------------------------------------------------------- */}
      {/* 5. Outpatient Department Workload                              */}
      {/* ------------------------------------------------------------------- */}
      <OpdDepartmentChart
        data={departmentWorkload ?? []}
        isLoading={isDepartmentWorkloadLoading}
        compact
      />

      {/* ------------------------------------------------------------------- */}
      {/* 6. Specialty and Treatment-right Charts                              */}
      {/* ------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <SpecialtyWorkloadChart
            data={specialtyWorkload ?? []}
            isLoading={isSpecialtyWorkloadLoading}
          />
        </div>
        <div className="lg:col-span-2">
          <InsuranceGroupChart
            data={insuranceGroups ?? []}
            isLoading={isInsuranceGroupsLoading}
          />
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* 7. IPD Wards and OPD Examination Rooms                              */}
      {/* ------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <IpdWardChart data={ipdWards ?? []} isLoading={isIpdWardsLoading} />
        <OpdRoomTable data={opdRooms ?? []} isLoading={isOpdRoomsLoading} />
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* 8. Session Info + Connection Footer                                  */}
      {/* ------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Session Info Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">ข้อมูลเซสชัน</CardTitle>
            <CardDescription>รายละเอียดการเชื่อมต่อ</CardDescription>
          </CardHeader>
          <CardContent>
            {session ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {sessionInfoRows.map((row, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                      {row.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground">
                        {row.label}
                      </p>
                      <div className="mt-0.5 truncate text-sm font-medium">
                        {row.value}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                ไม่มีเซสชัน กรุณาเชื่อมต่อด้วยรหัสเซสชันเพื่อดูรายละเอียด
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Connection details footer bar */}
      {session && (
        <div className="rounded-lg border border-dashed bg-muted/30 px-4 py-3">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Globe className="h-3 w-3" />
              API: {truncateUrl(session.apiUrl)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3 w-3" />
              เชื่อมต่อเมื่อ: {formatDateTime(session.connectedAt)}
            </span>
            <span className="flex items-center gap-1.5">
              <Database className="h-3 w-3" />
              {session.databaseType.toUpperCase()}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
