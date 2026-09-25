// =============================================================================
// BMS Session KPI Dashboard - Department & Doctor Analytics Page (T065 / US3)
// =============================================================================

import { useState, useCallback } from 'react'
import { useBmsSessionContext } from '@/contexts/BmsSessionContext'
import { useQuery } from '@/hooks/useQuery'
import {
  getDepartmentBreakdown,
  getDoctorWorkload,
  getDepartmentDailyTrend,
  getOpdRoomBreakdown,
  getOpdSpecialtyBreakdown,
  getOpdInsuranceBreakdown,
  getOpdSummary,
  getOpdDepartmentServiceWorkload,
  getOpdDepartmentDiagnosisWorkload,
} from '@/services/kpiService'
import { getDateRange } from '@/utils/dateUtils'
import { DateRangePicker } from '@/components/dashboard/DateRangePicker'
import { OpdDepartmentChart } from '@/components/charts/OpdDepartmentChart'
import { OpdRoomTable } from '@/components/dashboard/OpdRoomTable'
import { OpdSpecialtyChart } from '@/components/charts/OpdSpecialtyChart'
import { OpdDepartmentDiagnosisTable } from '@/components/dashboard/OpdDepartmentDiagnosisTable'
import { OpdInsuranceTable } from '@/components/dashboard/OpdInsuranceTable'
import { OpdDepartmentServiceTable } from '@/components/dashboard/OpdDepartmentServiceTable'
import { DoctorTable } from '@/components/dashboard/DoctorTable'
import { VisitTrendChart } from '@/components/charts/VisitTrendChart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { Activity, HeartPulse, Siren, Video, Send, Users, FlaskConical, ScanLine } from 'lucide-react'
import type { DepartmentWorkload, DoctorWorkload, VisitTrend } from '@/types'

export default function DepartmentAnalytics() {
  const { connectionConfig, session } = useBmsSessionContext()

  // ---------------------------------------------------------------------------
  // Date range state
  // ---------------------------------------------------------------------------
  const defaultRange = getDateRange(30)
  const [startDate, setStartDate] = useState(defaultRange.startDate)
  const [endDate, setEndDate] = useState(defaultRange.endDate)

  // ---------------------------------------------------------------------------
  // Selected department drill-down state
  // ---------------------------------------------------------------------------
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null)
  const [selectedDepartmentName, setSelectedDepartmentName] = useState<string>('')

  // ---------------------------------------------------------------------------
  // Department breakdown query
  // ---------------------------------------------------------------------------
  const departmentQueryFn = useCallback(
    () => getDepartmentBreakdown(connectionConfig!, session!.databaseType, startDate, endDate),
    [connectionConfig, session, startDate, endDate],
  )

  const {
    data: departments,
    isLoading: isDepartmentsLoading,
  } = useQuery<DepartmentWorkload[]>({
    queryFn: departmentQueryFn,
    enabled: connectionConfig !== null && session !== null,
  })

  const roomQueryFn = useCallback(
    () => getOpdRoomBreakdown(connectionConfig!, session!.databaseType, startDate, endDate),
    [connectionConfig, session, startDate, endDate],
  )

  const {
    data: rooms,
    isLoading: isRoomsLoading,
  } = useQuery<Awaited<ReturnType<typeof getOpdRoomBreakdown>>>({
    queryFn: roomQueryFn,
    enabled: connectionConfig !== null && session !== null,
  })

  const specialtyQueryFn = useCallback(
    () => getOpdSpecialtyBreakdown(connectionConfig!, session!.databaseType, startDate, endDate),
    [connectionConfig, session, startDate, endDate],
  )
  const { data: specialties, isLoading: isSpecialtiesLoading } = useQuery<Awaited<ReturnType<typeof getOpdSpecialtyBreakdown>>>({
    queryFn: specialtyQueryFn,
    enabled: connectionConfig !== null && session !== null,
  })

  const insuranceQueryFn = useCallback(
    () => getOpdInsuranceBreakdown(connectionConfig!, session!.databaseType, startDate, endDate),
    [connectionConfig, session, startDate, endDate],
  )
  const { data: insuranceGroups, isLoading: isInsuranceLoading } = useQuery<Awaited<ReturnType<typeof getOpdInsuranceBreakdown>>>({
    queryFn: insuranceQueryFn,
    enabled: connectionConfig !== null && session !== null,
  })

  const serviceWorkloadQueryFn = useCallback(
    () => getOpdDepartmentServiceWorkload(connectionConfig!, session!.databaseType, startDate, endDate),
    [connectionConfig, session, startDate, endDate],
  )
  const { data: serviceWorkload, isLoading: isServiceWorkloadLoading } = useQuery<Awaited<ReturnType<typeof getOpdDepartmentServiceWorkload>>>({
    queryFn: serviceWorkloadQueryFn,
    enabled: connectionConfig !== null && session !== null,
  })

  const diagnosisQueryFn = useCallback(
    () => getOpdDepartmentDiagnosisWorkload(connectionConfig!, session!.databaseType, startDate, endDate),
    [connectionConfig, session, startDate, endDate],
  )
  const { data: diagnosisWorkload, isLoading: isDiagnosisLoading } = useQuery<Awaited<ReturnType<typeof getOpdDepartmentDiagnosisWorkload>>>({
    queryFn: diagnosisQueryFn,
    enabled: connectionConfig !== null && session !== null,
  })

  const summaryQueryFn = useCallback(
    () => getOpdSummary(connectionConfig!, session!.databaseType, startDate, endDate),
    [connectionConfig, session, startDate, endDate],
  )
  const {
    data: opdSummary,
    isLoading: isSummaryLoading,
    isError: isSummaryError,
    error: summaryError,
    execute: retrySummary,
  } = useQuery<Awaited<ReturnType<typeof getOpdSummary>>>({
    queryFn: summaryQueryFn,
    enabled: connectionConfig !== null && session !== null,
  })

  // ---------------------------------------------------------------------------
  // Doctor workload query (filtered by selected department)
  // ---------------------------------------------------------------------------
  const doctorQueryFn = useCallback(
    () =>
      getDoctorWorkload(
        connectionConfig!,
        session!.databaseType,
        startDate,
        endDate,
        selectedDepartment ?? undefined,
      ),
    [connectionConfig, session, startDate, endDate, selectedDepartment],
  )

  const {
    data: doctors,
    isLoading: isDoctorsLoading,
  } = useQuery<DoctorWorkload[]>({
    queryFn: doctorQueryFn,
    enabled: connectionConfig !== null && session !== null && selectedDepartment !== null,
  })

  // ---------------------------------------------------------------------------
  // Department daily trend query (filtered by selected department)
  // ---------------------------------------------------------------------------
  const trendQueryFn = useCallback(
    () =>
      getDepartmentDailyTrend(
        connectionConfig!,
        session!.databaseType,
        selectedDepartment!,
        startDate,
        endDate,
      ),
    [connectionConfig, session, selectedDepartment, startDate, endDate],
  )

  const {
    data: trendData,
    isLoading: isTrendLoading,
  } = useQuery<VisitTrend[]>({
    queryFn: trendQueryFn,
    enabled: connectionConfig !== null && session !== null && selectedDepartment !== null,
  })

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleRangeChange = useCallback((start: string, end: string) => {
    setStartDate(start)
    setEndDate(end)
    // Clear drill-down when date range changes
    setSelectedDepartment(null)
    setSelectedDepartmentName('')
  }, [])

  const handleDepartmentClick = useCallback(
    (depcode: string) => {
      setSelectedDepartment(depcode)
      // Find the department name from the loaded data
      const dept = departments?.find((d) => d.departmentCode === depcode)
      setSelectedDepartmentName(dept?.departmentName ?? depcode)
    },
    [departments],
  )

  const handleClearSelection = useCallback(() => {
    setSelectedDepartment(null)
    setSelectedDepartmentName('')
  }, [])

  // ---------------------------------------------------------------------------
  // Determine overall loading state for the date range picker
  // ---------------------------------------------------------------------------
  const isAnyLoading = isSummaryLoading || isDepartmentsLoading || isRoomsLoading || isSpecialtiesLoading || isInsuranceLoading || isServiceWorkloadLoading || isDiagnosisLoading || isDoctorsLoading || isTrendLoading

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">การวิเคราะห์ OPD</h1>
        <p className="text-sm text-muted-foreground">
          รายละเอียดการเข้ารับบริการแยกตามแผนกและปริมาณงานแพทย์
        </p>
      </div>

      {/* Date range picker */}
      <DateRangePicker
        startDate={startDate}
        endDate={endDate}
        onRangeChange={handleRangeChange}
        isLoading={isAnyLoading}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="ผู้ป่วยนอก (OPD) ครั้ง" value={opdSummary?.opd ?? null} icon={<Activity className="h-5 w-5" />} isLoading={isSummaryLoading} isError={isSummaryError} error={summaryError?.message} onRetry={retrySummary} description="จำนวนผู้รับบริการในช่วงวันที่เลือก" accentColor="text-blue-500" />
        <KpiCard title="ผู้ป่วยนอก (OPD) คน" value={opdSummary?.opdPatients ?? null} icon={<Users className="h-5 w-5" />} isLoading={isSummaryLoading} isError={isSummaryError} error={summaryError?.message} onRetry={retrySummary} description="จำนวนผู้ป่วยนอกไม่ซ้ำคน" accentColor="text-green-500" />
        <KpiCard title="ห้องฉุกเฉิน (ER)" value={opdSummary?.er ?? null} icon={<Siren className="h-5 w-5" />} isLoading={isSummaryLoading} isError={isSummaryError} error={summaryError?.message} onRetry={retrySummary} description="จำนวนผู้รับบริการฉุกเฉิน" accentColor="text-red-500" />
        <KpiCard title="จำนวนผู้รับบริการ NCD" value={opdSummary?.ncd ?? null} icon={<HeartPulse className="h-5 w-5" />} isLoading={isSummaryLoading} isError={isSummaryError} error={summaryError?.message} onRetry={retrySummary} description="จำนวนผู้รับบริการ NCD" accentColor="text-amber-500" />
        <KpiCard title="จำนวนผู้รับบริการ Telemed" value={opdSummary?.telemed ?? null} icon={<Video className="h-5 w-5" />} isLoading={isSummaryLoading} isError={isSummaryError} error={summaryError?.message} onRetry={retrySummary} description="จำนวนบริการ Telemed" accentColor="text-cyan-500" />
        <KpiCard title="สั่ง LAB" value={opdSummary?.labOrders ?? null} icon={<FlaskConical className="h-5 w-5" />} isLoading={isSummaryLoading} isError={isSummaryError} error={summaryError?.message} onRetry={retrySummary} description="จำนวนรายการสั่งตรวจ LAB" accentColor="text-amber-500" />
        <KpiCard title="สั่ง X-ray" value={opdSummary?.xrayOrders ?? null} icon={<ScanLine className="h-5 w-5" />} isLoading={isSummaryLoading} isError={isSummaryError} error={summaryError?.message} onRetry={retrySummary} description="จำนวนรายการสั่งตรวจ X-ray" accentColor="text-cyan-500" />
        <KpiCard title="Refer out" value={opdSummary?.referOut ?? null} icon={<Send className="h-5 w-5" />} isLoading={isSummaryLoading} isError={isSummaryError} error={summaryError?.message} onRetry={retrySummary} description="จำนวนส่งต่อออก" accentColor="text-purple-500" />
    </div>

      {/* OPD workload charts */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <OpdDepartmentServiceTable data={serviceWorkload ?? []} isLoading={isServiceWorkloadLoading} />
        <OpdDepartmentDiagnosisTable data={diagnosisWorkload ?? []} isLoading={isDiagnosisLoading} />
        <OpdDepartmentChart
          data={departments ?? []}
          isLoading={isDepartmentsLoading}
          onDepartmentClick={handleDepartmentClick}
        />
        <OpdRoomTable data={rooms ?? []} isLoading={isRoomsLoading} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <OpdSpecialtyChart data={specialties ?? []} isLoading={isSpecialtiesLoading} />
        <OpdInsuranceTable data={insuranceGroups ?? []} isLoading={isInsuranceLoading} />
      </div>

      {/* Drill-down section: shown when a department is selected */}
      {selectedDepartment && (
        <>
          {/* Selected department header */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-semibold">
                {selectedDepartmentName}
              </CardTitle>
              <Button variant="outline" size="sm" onClick={handleClearSelection}>
                ล้าง
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                แสดงปริมาณงานแพทย์และแนวโน้มรายวันสำหรับแผนกที่เลือก
              </p>
            </CardContent>
          </Card>

          {/* Two-column responsive layout: Doctor table + Visit trend chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">ปริมาณงานแพทย์</CardTitle>
              </CardHeader>
              <CardContent>
                <DoctorTable
                  data={doctors ?? []}
                  isLoading={isDoctorsLoading}
                />
              </CardContent>
            </Card>

            <VisitTrendChart
              data={trendData ?? []}
              isLoading={isTrendLoading}
            />
          </div>
        </>
      )}
    </div>
  )
}
