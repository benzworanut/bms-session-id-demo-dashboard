// =============================================================================
// BMS Session KPI Dashboard - KPI Data Fetching Service
// (T042 + T053 + T062 + T070)
// Centralized service for all KPI queries across Overview, Trends,
// Departments/Doctors, and Demographics user stories.
// =============================================================================

import type {
  ConnectionConfig,
  DatabaseType,
  DepartmentWorkload,
  DoctorWorkload,
  InsuranceGroup,
  IpdWardWorkload,
  HourlyDistribution,
  KpiSummary,
  OverviewStats,
  PatientTypeDistribution,
  RecentVisit,
  ReferralStats,
  SqlApiResponse,
  SpecialtyWorkload,
  OpdRoomWorkload,
  OpdDepartmentServiceWorkload,
  OpdDepartmentDiagnosisWorkload,
  VisitTrend,
} from '@/types';

import { queryBuilder } from '@/services/queryBuilder';
import { executeSqlViaApi } from '@/services/bmsSession';

// ---------------------------------------------------------------------------
// Response parsing helper
// ---------------------------------------------------------------------------

/**
 * Map raw {@link SqlApiResponse} rows into a typed array using the supplied
 * mapper function.
 *
 * Returns an empty array when the response contains no data rows.
 */
function parseQueryResponse<T>(
  response: SqlApiResponse,
  mapper: (row: Record<string, unknown>) => T,
): T[] {
  if (!response.data || !Array.isArray(response.data)) {
    return [];
  }
  return response.data.map(mapper);
}

/** Fix Thai names returned as UTF-8 bytes decoded with Windows-874. */
function decodeThaiName(value: string): string {
  if (!value || !/[\u0e00-\u0e7f]/.test(value)) return value;

  const bytes: number[] = [];
  for (const character of value) {
    const codePoint = character.codePointAt(0) ?? 0;
    if (codePoint >= 0x0e01 && codePoint <= 0x0e5b) {
      bytes.push(codePoint - 0x0d60);
    } else if (codePoint <= 0xff) {
      bytes.push(codePoint);
    } else {
      return value;
    }
  }

  try {
    const decoded = new TextDecoder('utf-8', { fatal: true }).decode(
      new Uint8Array(bytes),
    );
    return /[\u0e00-\u0e7f]/.test(decoded) ? decoded : value;
  } catch {
    return value;
  }
}

// ---------------------------------------------------------------------------
// US1 - Overview KPIs
// ---------------------------------------------------------------------------

/**
 * Count of OPD visits for today.
 */
export async function getOpdVisitCount(
  config: ConnectionConfig,
  dbType: DatabaseType,
): Promise<number> {
  const sql = `SELECT COUNT(*) as total FROM ovst WHERE vstdate = ${queryBuilder.currentDate(dbType)}`;
  const response = await executeSqlViaApi(sql, config);
  const rows = parseQueryResponse(response, (row) => Number(row['total'] ?? 0));
  return rows[0] ?? 0;
}

/**
 * Count of currently admitted IPD patients (not yet discharged).
 *
 * The query is identical for MySQL and PostgreSQL.
 */
export async function getIpdPatientCount(
  config: ConnectionConfig,
): Promise<number> {
  const sql = `SELECT COUNT(*) as total FROM ipt WHERE dchdate IS NULL`;
  const response = await executeSqlViaApi(sql, config);
  const rows = parseQueryResponse(response, (row) => Number(row['total'] ?? 0));
  return rows[0] ?? 0;
}

/**
 * Count of ER visits for today.
 */
export async function getErVisitCount(
  config: ConnectionConfig,
  dbType: DatabaseType,
): Promise<number> {
  const sql = `SELECT COUNT(*) as total FROM er_regist WHERE vstdate = ${queryBuilder.currentDate(dbType)}`;
  const response = await executeSqlViaApi(sql, config);
  const rows = parseQueryResponse(response, (row) => Number(row['total'] ?? 0));
  return rows[0] ?? 0;
}

/**
 * Count of distinct departments with visits today.
 */
export async function getActiveDepartmentCount(
  config: ConnectionConfig,
  dbType: DatabaseType,
): Promise<number> {
  const sql =
    `SELECT COUNT(DISTINCT k.depcode) as total ` +
    `FROM ovst o LEFT JOIN kskdepartment k ON o.cur_dep = k.depcode ` +
    `WHERE o.vstdate = ${queryBuilder.currentDate(dbType)}`;
  const response = await executeSqlViaApi(sql, config);
  const rows = parseQueryResponse(response, (row) => Number(row['total'] ?? 0));
  return rows[0] ?? 0;
}

/**
 * Per-department visit counts for today, ordered by volume descending.
 */
export async function getDepartmentWorkload(
  config: ConnectionConfig,
  dbType: DatabaseType,
): Promise<DepartmentWorkload[]> {
  const sql =
    `SELECT k.depcode as department_code, k.department as department_name, COUNT(*) as visit_count ` +
    `FROM ovst o ` +
    `LEFT JOIN opd_dep_queue p ON p.vn = o.vn ` +
    `LEFT JOIN kskdepartment k ON k.depcode = p.depcode ` +
    `WHERE k.depcode <> '999' AND o.vstdate = ${queryBuilder.currentDate(dbType)} ` +
    `GROUP BY k.depcode, k.department ` +
    `ORDER BY visit_count DESC`;
  const response = await executeSqlViaApi(sql, config);
  return parseQueryResponse(response, (row) => ({
    departmentCode: String(row['department_code'] ?? ''),
    departmentName: String(row['department_name'] ?? ''),
    visitCount: Number(row['visit_count'] ?? 0),
  }));
}

/** Today's OPD and currently admitted IPD patients grouped by specialty. */
export async function getSpecialtyWorkload(
  config: ConnectionConfig,
  dbType: DatabaseType,
): Promise<SpecialtyWorkload[]> {
  const sql =
    `SELECT specialty, SUM(opd_count) AS opd_count, SUM(ipd_count) AS ipd_count ` +
    `FROM (` +
    `SELECT COALESCE(s.name, 'ไม่ระบุ') AS specialty, COUNT(o.vn) AS opd_count, 0 AS ipd_count ` +
    `FROM ovst o LEFT JOIN spclty s ON s.spclty = o.spclty ` +
    `WHERE o.vstdate = ${queryBuilder.currentDate(dbType)} ` +
    `GROUP BY s.name ` +
    `UNION ALL ` +
    `SELECT COALESCE(s.name, 'ไม่ระบุ') AS specialty, 0 AS opd_count, COUNT(DISTINCT i.an) AS ipd_count ` +
    `FROM ipt i LEFT JOIN spclty s ON s.spclty = i.spclty ` +
    `WHERE i.dchdate IS NULL ` +
    `GROUP BY s.name` +
    `) x ` +
    `GROUP BY specialty ` +
    `ORDER BY SUM(opd_count + ipd_count) DESC`;
  const response = await executeSqlViaApi(sql, config);
  return parseQueryResponse(response, (row) => ({
    specialty: String(row['specialty'] ?? 'ไม่ระบุ'),
    opdCount: Number(row['opd_count'] ?? 0),
    ipdCount: Number(row['ipd_count'] ?? 0),
  }));
}

/** Today's outpatient visits grouped by treatment-right price group. */
export async function getInsuranceGroups(
  config: ConnectionConfig,
  dbType: DatabaseType,
): Promise<InsuranceGroup[]> {
  const sql =
    `SELECT COALESCE(p2.pttype_price_group_name, 'ไม่ระบุ') AS right_name, ` +
    `COUNT(*) AS count ` +
    `FROM ovst o ` +
    `LEFT JOIN ipt i ON o.hn = i.hn AND o.vstdate = i.regdate AND (o.vn = i.vn OR o.an = i.an) ` +
    `LEFT JOIN pttype p ON p.pttype = o.pttype OR p.pttype = i.pttype  ` +
    `LEFT JOIN pttype_price_group p2 ON p2.pttype_price_group_id = p.pttype_price_group_id ` +
    `WHERE o.vstdate = ${queryBuilder.currentDate(dbType)} OR i.regdate = ${queryBuilder.currentDate(dbType)} ` +
    `GROUP BY p2.pttype_price_group_name ` +
    `ORDER BY count DESC`;
  const response = await executeSqlViaApi(sql, config);
  return parseQueryResponse(response, (row) => ({
    rightName: String(row['right_name'] ?? 'ไม่ระบุ'),
    count: Number(row['count'] ?? 0),
  }));
}

/** OPD visits and Lab/X-ray visits grouped by department. */
export async function getOpdDepartmentServiceWorkload(
  config: ConnectionConfig,
  _dbType: DatabaseType,
  startDate: string,
  endDate: string,
): Promise<OpdDepartmentServiceWorkload[]> {
  void _dbType
  const sql =
    `SELECT COALESCE(d.department, 'ไม่ระบุ') AS department_name, ` +
    `COUNT(DISTINCT o.vn) AS visit_count, ` +
    `COUNT(DISTINCT CASE WHEN l.vn IS NOT NULL THEN o.vn END) AS lab_visit_count, ` +
    `COUNT(DISTINCT CASE WHEN x.vn IS NOT NULL THEN o.vn END) AS xray_visit_count ` +
    `FROM ovst o ` +
    `LEFT JOIN kskdepartment d ON d.depcode = o.main_dep ` +
    `LEFT JOIN (SELECT DISTINCT vn FROM lab_head WHERE order_date >= '${startDate}' AND order_date <= '${endDate}') l ON l.vn = o.vn ` +
    `LEFT JOIN (SELECT DISTINCT vn FROM xray_report WHERE request_date >= '${startDate}' AND request_date <= '${endDate}') x ON x.vn = o.vn ` +
    `WHERE o.vstdate >= '${startDate}' AND o.vstdate <= '${endDate}' ` +
    `GROUP BY d.department ` +
    `ORDER BY visit_count DESC`
  const response = await executeSqlViaApi(sql, config)
  return parseQueryResponse(response, (row) => ({
    departmentName: String(row['department_name'] ?? 'ไม่ระบุ'),
    visitCount: Number(row['visit_count'] ?? 0),
    labVisitCount: Number(row['lab_visit_count'] ?? 0),
    xrayVisitCount: Number(row['xray_visit_count'] ?? 0),
  }))
}

/** OPD diagnosis patients and occurrences grouped by department. */
export async function getOpdDepartmentDiagnosisWorkload(
  config: ConnectionConfig,
  _dbType: DatabaseType,
  startDate: string,
  endDate: string,
): Promise<OpdDepartmentDiagnosisWorkload[]> {
  void _dbType
  const sql =
    `SELECT COALESCE(o.pdx, 'ไม่ระบุ') AS department_name, ` +
    `COUNT(DISTINCT o.hn) AS patient_count, ` +
    `COUNT(*) AS diagnosis_count ` +
    `FROM vn_stat o ` +
    `WHERE o.vstdate >= '${startDate}' AND o.vstdate <= '${endDate}' ` +
    `GROUP BY o.pdx ` +
    `ORDER BY diagnosis_count DESC ` +
    `LIMIT 10`
  const response = await executeSqlViaApi(sql, config)
  return parseQueryResponse(response, (row) => ({
    departmentName: String(row['department_name'] ?? 'ไม่ระบุ'),
    patientCount: Number(row['patient_count'] ?? 0),
    diagnosisCount: Number(row['diagnosis_count'] ?? 0),
  }))
}

/** Currently admitted IPD patients grouped by ward. */
export async function getIpdWardWorkload(
  config: ConnectionConfig,
): Promise<IpdWardWorkload[]> {
  const wardGroup = `CASE
    WHEN w.ward = '33' AND ip.roomno IN ('3301', '3302') THEN 'ตึกคลอด (LR)'
    WHEN w.ward = '33' AND ip.roomno IN ('3303', '3304') THEN 'ตึกผู้ป่วยวิกฤต (ICU)'
    ELSE w.name
  END`;
  const sql =
    `SELECT ${wardGroup} AS ward_name, COUNT(i.an) AS count ` +
    `FROM ipt i ` +
    `LEFT JOIN ward w ON w.ward = i.ward ` +
    `LEFT JOIN iptadm ip ON ip.an = i.an ` +
    `WHERE i.dchdate IS NULL ` +
    `GROUP BY ${wardGroup} ` +
    `ORDER BY count DESC`;
  const response = await executeSqlViaApi(sql, config);
  return parseQueryResponse(response, (row) => ({
    wardName: String(row['ward_name'] ?? 'ไม่ระบุ'),
    count: Number(row['count'] ?? 0),
  }));
}

/** Today's OPD visits grouped by examination room / department. */
export async function getOpdRoomWorkload(
  config: ConnectionConfig,
  dbType: DatabaseType,
): Promise<OpdRoomWorkload[]> {
  const sql =
    `SELECT COALESCE(r.department, 'ไม่ระบุ') AS room_name, COUNT(o.vn) AS count ` +
    `FROM ovst o LEFT JOIN kskdepartment r ON r.depcode = o.main_dep ` +
    `WHERE o.vstdate = ${queryBuilder.currentDate(dbType)} ` +
    `AND o.main_dep IS NOT NULL AND o.an IS NULL ` +
    `GROUP BY r.department ` +
    `ORDER BY count DESC`;
  const response = await executeSqlViaApi(sql, config);
  return parseQueryResponse(response, (row) => ({
    roomName: String(row['room_name'] ?? 'ไม่ระบุ'),
    count: Number(row['count'] ?? 0),
  }));
}

/** OPD visits grouped by examination room for a date range. */
export async function getOpdRoomBreakdown(
  config: ConnectionConfig,
  _dbType: DatabaseType,
  startDate: string,
  endDate: string,
): Promise<OpdRoomWorkload[]> {
  void _dbType;
  const sql =
    `SELECT k.depcode AS department_code, k.department AS department_name, COUNT(*) AS visit_count ` +
    `FROM ovst o ` +
    `LEFT JOIN opd_dep_queue p ON p.vn = o.vn ` +
    `LEFT JOIN kskdepartment k ON k.depcode = p.depcode ` +
    `WHERE o.vstdate >= '${startDate}' AND o.vstdate <= '${endDate}' ` +
    `AND k.depcode <> '999' ` +
    `GROUP BY k.depcode, k.department ` +
    `ORDER BY visit_count DESC`;
  const response = await executeSqlViaApi(sql, config);
  return parseQueryResponse(response, (row) => ({
    roomName: String(row['department_name'] ?? 'ไม่ระบุ'),
    count: Number(row['visit_count'] ?? 0),
  }));
}

/** OPD visits grouped by specialty for a date range. */
export async function getOpdSpecialtyBreakdown(
  config: ConnectionConfig,
  _dbType: DatabaseType,
  startDate: string,
  endDate: string,
): Promise<SpecialtyWorkload[]> {
  void _dbType;
  const sql =
    `SELECT s.spclty AS specialty_code, s.name AS specialty_name, COUNT(*) AS visit_count ` +
    `FROM ovst o ` +
    `LEFT JOIN kskdepartment d ON d.depcode = o.main_dep ` +
    `LEFT JOIN spclty s ON s.spclty = d.spclty ` +
    `WHERE o.vstdate >= '${startDate}' AND o.vstdate <= '${endDate}' ` +
    `GROUP BY s.spclty, s.name ` +
    `ORDER BY visit_count DESC`;
  const response = await executeSqlViaApi(sql, config);
  return parseQueryResponse(response, (row) => ({
    specialty: String(row['specialty_name'] ?? 'ไม่ระบุ'),
    opdCount: Number(row['visit_count'] ?? 0),
    ipdCount: 0,
  }));
}

/** OPD visits grouped by treatment right for a date range. */
export async function getOpdInsuranceBreakdown(
  config: ConnectionConfig,
  _dbType: DatabaseType,
  startDate: string,
  endDate: string,
): Promise<InsuranceGroup[]> {
  void _dbType;
  const sql =
    `SELECT COALESCE(p2.pttype_price_group_name, 'ไม่ระบุ') AS right_name, ` +
    `COUNT(*) AS count ` +
    `FROM ovst o ` +
    `LEFT JOIN pttype p ON p.pttype = o.pttype ` +
    `LEFT JOIN pttype_price_group p2 ON p2.pttype_price_group_id = p.pttype_price_group_id ` +
    `WHERE o.an is null AND o.vstdate >= '${startDate}' AND o.vstdate <= '${endDate}' ` +
    `GROUP BY p2.pttype_price_group_name ` +
    `ORDER BY count DESC`;
  const response = await executeSqlViaApi(sql, config);
  return parseQueryResponse(response, (row) => ({
    rightName: String(row['right_name'] ?? 'ไม่ระบุ'),
    count: Number(row['count'] ?? 0),
  }));
}


/**
 * Aggregate overview KPI summary (all four counts fetched in parallel).
 */
export async function getKpiSummary(
  config: ConnectionConfig,
  dbType: DatabaseType,
): Promise<KpiSummary> {
  const [opdVisitCount, ipdPatientCount, erVisitCount, activeDepartmentCount] =
    await Promise.all([
      getOpdVisitCount(config, dbType),
      getIpdPatientCount(config),
      getErVisitCount(config, dbType),
      getActiveDepartmentCount(config, dbType),
    ]);

  return {
    opdVisitCount,
    ipdPatientCount,
    erVisitCount,
    activeDepartmentCount,
    timestamp: new Date(),
  };
}

// ---------------------------------------------------------------------------
// US2 - Trend KPIs
// ---------------------------------------------------------------------------

/**
 * Daily visit counts grouped by date within the given range.
 */
export async function getDailyVisitTrend(
  config: ConnectionConfig,
  dbType: DatabaseType,
  startDate: string,
  endDate: string,
): Promise<VisitTrend[]> {
  const dateExpr = queryBuilder.dateFormat(dbType, 'vstdate', '%Y-%m-%d');
  const sql =
    `SELECT ${dateExpr} as visit_date, COUNT(*) as visit_count ` +
    `FROM ovst ` +
    `WHERE vstdate >= '${startDate}' AND vstdate <= '${endDate}' ` +
    `GROUP BY ${dateExpr} ` +
    `ORDER BY visit_date ASC`;
  const response = await executeSqlViaApi(sql, config);
  return parseQueryResponse(response, (row) => ({
    date: String(row['visit_date'] ?? ''),
    visitCount: Number(row['visit_count'] ?? 0),
  }));
}

/**
 * Hourly visit distribution for a single date.
 */
export async function getHourlyDistribution(
  config: ConnectionConfig,
  dbType: DatabaseType,
  date: string,
): Promise<HourlyDistribution[]> {
  const hourExpr = queryBuilder.hourExtract(dbType, 'vsttime');
  const sql =
    `SELECT ${hourExpr} as hour_slot, COUNT(*) as count ` +
    `FROM ovst ` +
    `WHERE vstdate = '${date}' ` +
    `GROUP BY ${hourExpr} ` +
    `ORDER BY hour_slot ASC`;
  const response = await executeSqlViaApi(sql, config);
  return parseQueryResponse(response, (row) => ({
    hour: Number(row['hour_slot'] ?? 0),
    visitCount: Number(row['count'] ?? 0),
  }));
}

// ---------------------------------------------------------------------------
// US3 - Department / Doctor KPIs
// ---------------------------------------------------------------------------

/**
 * Department-level visit breakdown for a date range.
 */
export async function getDepartmentBreakdown(
  config: ConnectionConfig,
  _dbType: DatabaseType,
  startDate: string,
  endDate: string,
): Promise<DepartmentWorkload[]> {
  const departmentGroup = `CASE
    WHEN d.depcode IN ('005','156') THEN 'ทันตกรรม'
    WHEN d.depcode = '011' THEN 'ER'
    WHEN d.depcode = '040' THEN 'ฉีดยาทำแผล'
    WHEN d.depcode IN ('137','112','146','154','142','053','026','122','028','121','055','054','057','123','155') THEN 'NCD'
    WHEN d.depcode IN ('135','134','147','041') THEN 'แพทย์แผนไทย แพทย์ทางเลือก'
    WHEN d.depcode IN ('136','141','042','140') THEN 'กายภาพ'
    WHEN d.depcode IN ('107','091') THEN 'ปฐมภูมิ+คลินิกโรคจากการทำงาน'
    WHEN d.depcode IN ('164','163','162') THEN 'หน่วยไต'
    WHEN d.depcode IN ('158','037','034','124','099','159','058','098','045') THEN 'จิตเวชและยาเสพติด'
    WHEN d.depcode IN ('139','118','119') THEN 'ANC'
    WHEN d.depcode IN ('032','105','143') THEN 'Ortho'
    WHEN d.depcode IN ('080','104','132','144','049') THEN 'ศัลยกรรม'
    WHEN d.depcode IN ('029','117','084','148') THEN 'กุมารเวชกรรม'
    WHEN d.depcode IN ('031','120') THEN 'จักษุ'
    WHEN d.depcode IN ('081','114') THEN 'นรีเวช'
    WHEN d.depcode IN ('160','010','161','110','015','151','152','149','150','014','153','157','145','019','020','021','027') THEN 'OPD'
    ELSE 'อื่นๆ'
  END`;
  const sql =
    `SELECT ${departmentGroup} AS dept, COUNT(o.vn) AS count ` +
    `FROM ovst o ` +
    `LEFT JOIN kskdepartment d ON d.depcode = o.main_dep ` +
    `WHERE o.vstdate >= '${startDate}' AND o.vstdate <= '${endDate}' ` +
    `GROUP BY ${departmentGroup} ` +
    `ORDER BY count DESC`;
  const response = await executeSqlViaApi(sql, config);
  return parseQueryResponse(response, (row) => ({
    departmentCode: String(row['dept'] ?? ''),
    departmentName: String(row['dept'] ?? ''),
    visitCount: Number(row['count'] ?? 0),
  }));
}

/**
 * Doctor workload (patient counts) for a date range, optionally filtered by
 * department. Results are capped at 50 rows.
 */
export async function getDoctorWorkload(
  config: ConnectionConfig,
  _dbType: DatabaseType,
  startDate: string,
  endDate: string,
  depcode?: string,
): Promise<DoctorWorkload[]> {
  const depFilter = depcode
    ? ` AND o.cur_dep = '${depcode}'`
    : '';
  const sql =
    `SELECT o.doctor as doctor_code, d.name as doctor_name, COUNT(*) as patient_count ` +
    `FROM ovst o LEFT JOIN doctor d ON o.doctor = d.code ` +
    `WHERE o.vstdate >= '${startDate}' AND o.vstdate <= '${endDate}'${depFilter} ` +
    `GROUP BY o.doctor, d.name ` +
    `ORDER BY patient_count DESC ` +
    `LIMIT 50`;
  const response = await executeSqlViaApi(sql, config);
  return parseQueryResponse(response, (row) => ({
    doctorCode: String(row['doctor_code'] ?? ''),
    doctorName: decodeThaiName(String(row['doctor_name'] ?? '')),
    patientCount: Number(row['patient_count'] ?? 0),
  }));
}

/**
 * Daily visit trend for a specific department within a date range.
 */
export async function getDepartmentDailyTrend(
  config: ConnectionConfig,
  dbType: DatabaseType,
  depcode: string,
  startDate: string,
  endDate: string,
): Promise<VisitTrend[]> {
  const dateExpr = queryBuilder.dateFormat(dbType, 'o.vstdate', '%Y-%m-%d');
  const sql =
    `SELECT ${dateExpr} as visit_date, COUNT(*) as visit_count ` +
    `FROM ovst o ` +
    `WHERE o.vstdate >= '${startDate}' AND o.vstdate <= '${endDate}' ` +
    `AND o.cur_dep = '${depcode}' ` +
    `GROUP BY ${dateExpr} ` +
    `ORDER BY visit_date ASC`;
  const response = await executeSqlViaApi(sql, config);
  return parseQueryResponse(response, (row) => ({
    date: String(row['visit_date'] ?? ''),
    visitCount: Number(row['visit_count'] ?? 0),
  }));
}

// ---------------------------------------------------------------------------
// US4 - Demographics KPIs
// ---------------------------------------------------------------------------

/**
 * Gender distribution for visits within a date range.
 *
 * Attempts the `patient` table first. If the result set is empty (e.g. the
 * table is not populated), falls back to `ovst_patient_record`.
 */
export async function getGenderDistribution(
  config: ConnectionConfig,
  _dbType: DatabaseType,
  startDate: string,
  endDate: string,
): Promise<{ gender: string; count: number; dataSource: 'patient' | 'ovst_patient_record' }[]> {
  // Try patient table first
  const patientCountSql =
    `SELECT COUNT(*) as total ` +
    `FROM ovst o INNER JOIN patient p ON o.hn = p.hn ` +
    `WHERE o.vstdate >= '${startDate}' AND o.vstdate <= '${endDate}'`;
  const countResponse = await executeSqlViaApi(patientCountSql, config);
  const totalRows = parseQueryResponse(countResponse, (row) => Number(row['total'] ?? 0));
  const patientCount = totalRows[0] ?? 0;

  if (patientCount > 0) {
    const sql =
      `SELECT p.sex as gender, COUNT(*) as count ` +
      `FROM ovst o INNER JOIN patient p ON o.hn = p.hn ` +
      `WHERE o.vstdate >= '${startDate}' AND o.vstdate <= '${endDate}' ` +
      `GROUP BY p.sex ` +
      `ORDER BY count DESC`;
    const response = await executeSqlViaApi(sql, config);
    return parseQueryResponse(response, (row) => ({
      gender: String(row['gender'] ?? ''),
      count: Number(row['count'] ?? 0),
      dataSource: 'patient' as const,
    }));
  }

  // Fallback to ovst_patient_record
  const fallbackSql =
    `SELECT opr.sex as gender, COUNT(*) as count ` +
    `FROM ovst o INNER JOIN ovst_patient_record opr ON o.vn = opr.vn ` +
    `WHERE o.vstdate >= '${startDate}' AND o.vstdate <= '${endDate}' ` +
    `GROUP BY opr.sex ` +
    `ORDER BY count DESC`;
  const fallbackResponse = await executeSqlViaApi(fallbackSql, config);
  return parseQueryResponse(fallbackResponse, (row) => ({
    gender: String(row['gender'] ?? ''),
    count: Number(row['count'] ?? 0),
    dataSource: 'ovst_patient_record' as const,
  }));
}

/**
 * Age group distribution for visits within a date range.
 *
 * Groups: Infant (<1), Child (<13), Teenager (<20), Young Adult (<40),
 * Middle Age (<60), Senior (>=60).
 *
 * Uses {@link queryBuilder.ageCalc} to handle MySQL vs PostgreSQL age
 * calculation differences.
 */
export async function getAgeGroupDistribution(
  config: ConnectionConfig,
  dbType: DatabaseType,
  startDate: string,
  endDate: string,
): Promise<{ group: string; count: number }[]> {
  const age = queryBuilder.ageCalc(dbType, 'p.birthday');
  const sql =
    `SELECT ` +
    `CASE ` +
    `  WHEN ${age} < 1 THEN 'Infant' ` +
    `  WHEN ${age} < 13 THEN 'Child' ` +
    `  WHEN ${age} < 20 THEN 'Teenager' ` +
    `  WHEN ${age} < 40 THEN 'Young Adult' ` +
    `  WHEN ${age} < 60 THEN 'Middle Age' ` +
    `  ELSE 'Senior' ` +
    `END as age_group, ` +
    `COUNT(*) as count ` +
    `FROM ovst o INNER JOIN patient p ON o.hn = p.hn ` +
    `WHERE o.vstdate >= '${startDate}' AND o.vstdate <= '${endDate}' ` +
    `AND p.birthday IS NOT NULL ` +
    `GROUP BY age_group ` +
    `ORDER BY count DESC`;
  const response = await executeSqlViaApi(sql, config);
  return parseQueryResponse(response, (row) => ({
    group: String(row['age_group'] ?? ''),
    count: Number(row['count'] ?? 0),
  }));
}

/**
 * Patient type (pttype) distribution for visits within a date range.
 */
export async function getPatientTypeDistribution(
  config: ConnectionConfig,
  _dbType: DatabaseType,
  startDate: string,
  endDate: string,
): Promise<PatientTypeDistribution[]> {
  const sql =
    `SELECT o.pttype as pttype_code, pt.name as pttype_name, COUNT(*) as visit_count ` +
    `FROM ovst o LEFT JOIN pttype pt ON o.pttype = pt.pttype ` +
    `WHERE o.vstdate >= '${startDate}' AND o.vstdate <= '${endDate}' ` +
    `GROUP BY o.pttype, pt.name ` +
    `ORDER BY visit_count DESC`;
  const response = await executeSqlViaApi(sql, config);
  return parseQueryResponse(response, (row) => ({
    pttypeCode: String(row['pttype_code'] ?? ''),
    pttypeName: String(row['pttype_name'] ?? ''),
    visitCount: Number(row['visit_count'] ?? 0),
  }));
}

// ---------------------------------------------------------------------------
// Overview - Extended Stats & Recent Activity
// ---------------------------------------------------------------------------

/**
 * Get recent visits (last 10) with department and doctor names.
 */
export async function getRecentVisits(
  config: ConnectionConfig,
  dbType: DatabaseType,
): Promise<RecentVisit[]> {
  const sql =
    `SELECT o.vn, o.hn, ` +
    `${queryBuilder.dateFormat(dbType, 'o.vstdate', '%Y-%m-%d')} as vstdate, ` +
    `${queryBuilder.castToText(dbType, 'o.vsttime')} as vsttime, ` +
    `COALESCE(k.department, 'Unknown') as department_name, ` +
    `COALESCE(d.name, 'Unknown') as doctor_name ` +
    `FROM ovst o ` +
    `LEFT JOIN kskdepartment k ON o.cur_dep = k.depcode ` +
    `LEFT JOIN doctor d ON o.doctor = d.code ` +
    `ORDER BY o.vstdate DESC, o.vsttime DESC ` +
    `LIMIT 10`;
  const response = await executeSqlViaApi(sql, config);
  return parseQueryResponse(response, (row) => ({
    vn: String(row['vn'] ?? ''),
    hn: String(row['hn'] ?? ''),
    vstdate: String(row['vstdate'] ?? ''),
    vsttime: String(row['vsttime'] ?? ''),
    departmentName: String(row['department_name'] ?? 'Unknown'),
    doctorName: decodeThaiName(String(row['doctor_name'] ?? 'Unknown')),
  }));
}

/**
 * Get overview statistics for the dashboard.
 */
export async function getOverviewStats(
  config: ConnectionConfig,
  dbType: DatabaseType,
): Promise<OverviewStats> {
  // Use simpler approach - run individual queries
  const queries = [
    // Total registered patients (from ovst_patient_record distinct hn)
    `SELECT COUNT(DISTINCT hn) as total FROM ovst_patient_record`,
    // Total visits this month
    `SELECT COUNT(*) as total FROM ovst WHERE ${queryBuilder.dateFormat(dbType, 'vstdate', '%Y-%m')} = ${queryBuilder.dateFormat(dbType, queryBuilder.currentDate(dbType), '%Y-%m')}`,
    // Total visits last month - use a date range approach
    `SELECT COUNT(*) as total FROM ovst WHERE vstdate >= ${queryBuilder.dateSubtract(dbType, 60)} AND vstdate < ${queryBuilder.dateSubtract(dbType, 30)}`,
    // Total active doctors
    `SELECT COUNT(*) as total FROM doctor WHERE active = 'Y' OR active IS NULL`,
    // Total departments
    `SELECT COUNT(*) as total FROM kskdepartment WHERE depcode_active = 'Y' `,
  ];

  const results = await Promise.all(
    queries.map(sql => executeSqlViaApi(sql, config).then(r => {
      const rows = parseQueryResponse(r, (row) => Number(row['total'] ?? 0));
      return rows[0] ?? 0;
    }).catch(() => 0))
  );

  const totalVisitsThisMonth = results[1];
  const daysInMonth = new Date().getDate();

  return {
    totalRegisteredPatients: results[0],
    totalVisitsThisMonth: results[1],
    totalVisitsLastMonth: results[2],
    avgDailyVisitsThisMonth: daysInMonth > 0 ? Math.round(totalVisitsThisMonth / daysInMonth) : 0,
    totalDoctors: results[3],
    totalDepartments: results[4],
  };
}

/** Get today's referral and telemedicine activity. */
export async function getReferralStats(
  config: ConnectionConfig,
  dbType: DatabaseType,
): Promise<ReferralStats> {
  const count = async (sql: string): Promise<number> => {
    try {
      const response = await executeSqlViaApi(sql, config)
      const rows = parseQueryResponse(response, (row) => Number(row['total'] ?? 0))
      return rows[0] ?? 0
    } catch {
      return 0
    }
  }

  const today = queryBuilder.currentDate(dbType)
  const [referOut, referIn, referBack, telemed] = await Promise.all([
    count(`SELECT COUNT(*) as total FROM referout WHERE refer_date = ${today}`),
    count(`SELECT COUNT(*) as total FROM referin WHERE refer_date = ${today}`),
    count(`SELECT COUNT(*) as total FROM referback WHERE refer_date = ${today}`),
    count(`SELECT COUNT(*) as total FROM telemed WHERE vstdate = ${today}`),
  ])

  return { referOut, referIn, referBack, telemed }
}

/** OPD summary cards for a selected date range. */
export async function getOpdSummary(
  config: ConnectionConfig,
  dbType: DatabaseType,
  startDate: string,
  endDate: string,
): Promise<{
  opd: number
  er: number
  ncd: number
  telemed: number
  referOut: number
  opdPatients: number
  labOrders: number
  xrayOrders: number
}> {
  const count = async (sql: string): Promise<number> => {
    try {
      const response = await executeSqlViaApi(sql, config)
      const rows = parseQueryResponse(response, (row) => Number(row['total'] ?? 0))
      return rows[0] ?? 0
    } catch {
      return 0
    }
  }

  const [opd, er, ncd, telemed, referOut, opdPatients, labOrders, xrayOrders] = await Promise.all([
    count(`SELECT COUNT(*) as total FROM ovst WHERE vstdate >= '${startDate}' AND vstdate <= '${endDate}'`),
    count(`SELECT COUNT(*) as total FROM er_regist WHERE vstdate  >= '${startDate}' AND vstdate  <= '${endDate}'`),
    count(`SELECT COUNT(*) as total ` +
          `FROM ovst o LEFT JOIN kskdepartment d ON d.depcode = o.main_dep ` +
          `WHERE o.vstdate >= '${startDate}' AND o.vstdate <= '${endDate}' ` +
          `AND d.depcode IN ('137','112','146','154','142','053','026','122','028','121','055','054','057','123','155')`),
    count(`SELECT COUNT(*) as total FROM ovst o ` +
          `LEFT OUTER JOIN opitemrece op ON op.vn = o.vn ` +
          `WHERE o.ovstist = '10' AND op.icode = '3004738' AND o.vstdate  >= '${startDate}' AND o.vstdate  <= '${endDate}'`),
    count(`SELECT COUNT(*) as total FROM referout WHERE refer_date >= '${startDate}' AND refer_date <= '${endDate}'`),
    count(`SELECT COUNT(DISTINCT hn) as total FROM ovst WHERE vstdate >= '${startDate}' AND vstdate <= '${endDate}'`),
    count(`SELECT COUNT(*) as total FROM lab_head WHERE order_date >= '${startDate}' AND order_date <= '${endDate}'`),
    count(`SELECT COUNT(*) as total FROM xray_report WHERE request_date >= '${startDate}' AND request_date <= '${endDate}'`),
  ])

  void dbType
  return { opd, er, ncd, telemed, referOut, opdPatients, labOrders, xrayOrders }
}

/**
 * Get visit counts for the previous 7 calendar days, excluding today.
 */
export async function getWeeklyMiniTrend(
  config: ConnectionConfig,
  dbType: DatabaseType,
): Promise<VisitTrend[]> {
  const sql =
    `SELECT ${queryBuilder.dateFormat(dbType, 'vstdate', '%Y-%m-%d')} as visit_date, COUNT(*) as visit_count ` +
    `FROM ovst ` +
    `WHERE vstdate >= ${queryBuilder.dateSubtract(dbType, 7)} AND vstdate < ${queryBuilder.currentDate(dbType)} ` +
    `GROUP BY ${queryBuilder.dateFormat(dbType, 'vstdate', '%Y-%m-%d')} ` +
    `ORDER BY visit_date`;
  const response = await executeSqlViaApi(sql, config);
  return parseQueryResponse(response, (row) => ({
    date: String(row['visit_date'] ?? ''),
    visitCount: Number(row['visit_count'] ?? 0),
  }));
}

/**
 * Get top 5 doctors by patient count for the current month.
 */
export async function getTopDoctorsThisMonth(
  config: ConnectionConfig,
  dbType: DatabaseType,
): Promise<DoctorWorkload[]> {
  const sql =
    `SELECT o.doctor as doctor_code, d.name as doctor_name, COUNT(*) as patient_count ` +
    `FROM ovst o ` +
    `LEFT JOIN doctor d ON o.doctor = d.code ` +
    `WHERE ${queryBuilder.dateFormat(dbType, 'o.vstdate', '%Y-%m')} = ${queryBuilder.dateFormat(dbType, queryBuilder.currentDate(dbType), '%Y-%m')} ` +
    `GROUP BY o.doctor, d.name ` +
    `ORDER BY patient_count DESC ` +
    `LIMIT 5`;
  const response = await executeSqlViaApi(sql, config);
  return parseQueryResponse(response, (row) => ({
    doctorCode: String(row['doctor_code'] ?? ''),
    doctorName: decodeThaiName(String(row['doctor_name'] ?? 'Unknown')),
    patientCount: Number(row['patient_count'] ?? 0),
  }));
}

// ---------------------------------------------------------------------------
// Trend Summary & Extended Trend KPIs
// ---------------------------------------------------------------------------

/**
 * Trend summary statistics for a date range.
 */
export interface TrendSummary {
  totalVisits: number
  avgDailyVisits: number
  peakDay: { date: string; count: number } | null
  lowestDay: { date: string; count: number } | null
  totalDays: number
  daysWithVisits: number
}

export function computeTrendSummary(trends: VisitTrend[]): TrendSummary {
  if (trends.length === 0) {
    return { totalVisits: 0, avgDailyVisits: 0, peakDay: null, lowestDay: null, totalDays: 0, daysWithVisits: 0 }
  }
  const totalVisits = trends.reduce((sum, t) => sum + t.visitCount, 0)
  const daysWithVisits = trends.filter(t => t.visitCount > 0).length
  const sorted = [...trends].sort((a, b) => b.visitCount - a.visitCount)
  return {
    totalVisits,
    avgDailyVisits: Math.round(totalVisits / trends.length),
    peakDay: sorted[0] ? { date: sorted[0].date, count: sorted[0].visitCount } : null,
    lowestDay: sorted[sorted.length - 1] ? { date: sorted[sorted.length - 1].date, count: sorted[sorted.length - 1].visitCount } : null,
    totalDays: trends.length,
    daysWithVisits,
  }
}

/**
 * Monthly visit summary for the last 6 months.
 */
export async function getMonthlyVisitSummary(
  config: ConnectionConfig,
  dbType: DatabaseType,
): Promise<{ month: string; visitCount: number }[]> {
  const monthExpr = queryBuilder.dateFormat(dbType, 'vstdate', '%Y-%m');
  const sql =
    `SELECT ${monthExpr} as visit_month, COUNT(*) as visit_count ` +
    `FROM ovst ` +
    `WHERE vstdate >= ${queryBuilder.dateSubtract(dbType, 180)} ` +
    `GROUP BY ${monthExpr} ` +
    `ORDER BY visit_month ASC`;
  const response = await executeSqlViaApi(sql, config);
  return parseQueryResponse(response, (row) => ({
    month: String(row['visit_month'] ?? ''),
    visitCount: Number(row['visit_count'] ?? 0),
  }));
}

/**
 * Visit counts by day of week for a date range.
 */
export async function getVisitsByDayOfWeek(
  config: ConnectionConfig,
  dbType: DatabaseType,
  startDate: string,
  endDate: string,
): Promise<{ dayOfWeek: number; dayName: string; visitCount: number }[]> {
  // Use day of week extraction - MySQL DAYOFWEEK (1=Sun..7=Sat), PostgreSQL EXTRACT(DOW) (0=Sun..6=Sat)
  const dowExpr = dbType === 'mysql'
    ? 'DAYOFWEEK(vstdate)'
    : "EXTRACT(DOW FROM vstdate)::int";
  const sql =
    `SELECT ${dowExpr} as day_of_week, COUNT(*) as visit_count ` +
    `FROM ovst ` +
    `WHERE vstdate >= '${startDate}' AND vstdate <= '${endDate}' ` +
    `GROUP BY ${dowExpr} ` +
    `ORDER BY day_of_week ASC`;
  const response = await executeSqlViaApi(sql, config);

  const dayNames = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];

  return parseQueryResponse(response, (row) => {
    let dow = Number(row['day_of_week'] ?? 0);
    // MySQL: 1=Sun..7=Sat -> normalize to 0=Sun..6=Sat
    if (dbType === 'mysql') dow = dow - 1;
    return {
      dayOfWeek: dow,
      dayName: dayNames[dow] ?? `วัน ${dow}`,
      visitCount: Number(row['visit_count'] ?? 0),
    };
  });
}

/**
 * Top 5 departments by visit count for a date range.
 */
export async function getTopDepartmentsForRange(
  config: ConnectionConfig,
  _dbType: DatabaseType,
  startDate: string,
  endDate: string,
): Promise<DepartmentWorkload[]> {
  const sql =
    `SELECT k.depcode as department_code, k.department as department_name, COUNT(*) as visit_count ` +
    `FROM ovst o LEFT JOIN kskdepartment k ON o.cur_dep = k.depcode ` +
    `WHERE o.vstdate >= '${startDate}' AND o.vstdate <= '${endDate}' ` +
    `GROUP BY k.depcode, k.department ` +
    `ORDER BY visit_count DESC ` +
    `LIMIT 5`;
  const response = await executeSqlViaApi(sql, config);
  return parseQueryResponse(response, (row) => ({
    departmentCode: String(row['department_code'] ?? ''),
    departmentName: String(row['department_name'] ?? ''),
    visitCount: Number(row['visit_count'] ?? 0),
  }));
}

// ---------------------------------------------------------------------------
// Diagnosis, Medication Cost & Death Statistics (Trends page)
// ---------------------------------------------------------------------------

/**
 * Top 10 diagnoses by visit count for a date range.
 * Joins ovstdiag with icd101 for Thai diagnosis names.
 */
export async function getTopDiagnoses(
  config: ConnectionConfig,
  _dbType: DatabaseType,
  startDate: string,
  endDate: string,
): Promise<{ icd10: string; diagnosisName: string; visitCount: number }[]> {
  const sql =
    `SELECT od.icd10, COALESCE(i.tname, i.name, od.icd10) as diagnosis_name, COUNT(*) as visit_count ` +
    `FROM ovstdiag od ` +
    `LEFT JOIN icd101 i ON od.icd10 = i.code ` +
    `WHERE od.vstdate >= '${startDate}' AND od.vstdate <= '${endDate}' ` +
    `GROUP BY od.icd10, i.tname, i.name ` +
    `ORDER BY visit_count DESC ` +
    `LIMIT 10`;
  const response = await executeSqlViaApi(sql, config);
  return parseQueryResponse(response, (row) => ({
    icd10: String(row['icd10'] ?? ''),
    diagnosisName: String(row['diagnosis_name'] ?? ''),
    visitCount: Number(row['visit_count'] ?? 0),
  }));
}

/**
 * Top 10 medications by total cost for a date range.
 * Joins opitemrece with drugitems for drug names.
 */
export async function getTopMedications(
  config: ConnectionConfig,
  _dbType: DatabaseType,
  startDate: string,
  endDate: string,
): Promise<{ drugName: string; totalQty: number; totalCost: number }[]> {
  const sql =
    `SELECT COALESCE(d.name, 'ไม่ระบุ') as drug_name, ` +
    `SUM(op.qty) as total_qty, ` +
    `SUM(op.qty * op.unitprice) as total_cost ` +
    `FROM opitemrece op ` +
    `LEFT JOIN drugitems d ON op.icode = d.icode ` +
    `WHERE op.vstdate >= '${startDate}' AND op.vstdate <= '${endDate}' ` +
    `GROUP BY d.name ` +
    `ORDER BY total_cost DESC ` +
    `LIMIT 10`;
  const response = await executeSqlViaApi(sql, config);
  return parseQueryResponse(response, (row) => ({
    drugName: String(row['drug_name'] ?? 'ไม่ระบุ'),
    totalQty: Number(row['total_qty'] ?? 0),
    totalCost: Number(row['total_cost'] ?? 0),
  }));
}

/**
 * Medication cost summary for a date range.
 */
export async function getMedicationCostSummary(
  config: ConnectionConfig,
  _dbType: DatabaseType,
  startDate: string,
  endDate: string,
): Promise<{ totalItems: number; totalCost: number; uniqueDrugs: number }> {
  const sql =
    `SELECT COUNT(*) as total_items, ` +
    `COALESCE(SUM(qty * unitprice), 0) as total_cost, ` +
    `COUNT(DISTINCT icode) as unique_drugs ` +
    `FROM opitemrece ` +
    `WHERE vstdate >= '${startDate}' AND vstdate <= '${endDate}'`;
  const response = await executeSqlViaApi(sql, config);
  const rows = parseQueryResponse(response, (row) => ({
    totalItems: Number(row['total_items'] ?? 0),
    totalCost: Number(row['total_cost'] ?? 0),
    uniqueDrugs: Number(row['unique_drugs'] ?? 0),
  }));
  return rows[0] ?? { totalItems: 0, totalCost: 0, uniqueDrugs: 0 };
}

/**
 * Death statistics summary.
 */
export async function getDeathSummary(
  config: ConnectionConfig,
  _dbType: DatabaseType,
): Promise<{ totalDeaths: number; thisYearDeaths: number; thisMonthDeaths: number }> {
  void _dbType;
  const currentYear = new Date().getFullYear();
  const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
  const yearStart = `${currentYear}-01-01`;
  const monthStart = `${currentYear}-${currentMonth}-01`;

  const sql =
    `SELECT ` +
    `COUNT(*) as total_deaths, ` +
    `SUM(CASE WHEN death_date >= '${yearStart}' THEN 1 ELSE 0 END) as this_year, ` +
    `SUM(CASE WHEN death_date >= '${monthStart}' THEN 1 ELSE 0 END) as this_month ` +
    `FROM death`;
  const response = await executeSqlViaApi(sql, config);
  const rows = parseQueryResponse(response, (row) => ({
    totalDeaths: Number(row['total_deaths'] ?? 0),
    thisYearDeaths: Number(row['this_year'] ?? 0),
    thisMonthDeaths: Number(row['this_month'] ?? 0),
  }));
  return rows[0] ?? { totalDeaths: 0, thisYearDeaths: 0, thisMonthDeaths: 0 };
}

/**
 * Total diagnosis count and unique ICD10 codes for a date range.
 */
export async function getDiagnosisSummary(
  config: ConnectionConfig,
  _dbType: DatabaseType,
  startDate: string,
  endDate: string,
): Promise<{ totalDiagnoses: number; uniqueCodes: number }> {
  const sql =
    `SELECT COUNT(*) as total_diagnoses, COUNT(DISTINCT icd10) as unique_codes ` +
    `FROM ovstdiag ` +
    `WHERE vstdate >= '${startDate}' AND vstdate <= '${endDate}'`;
  const response = await executeSqlViaApi(sql, config);
  const rows = parseQueryResponse(response, (row) => ({
    totalDiagnoses: Number(row['total_diagnoses'] ?? 0),
    uniqueCodes: Number(row['unique_codes'] ?? 0),
  }));
  return rows[0] ?? { totalDiagnoses: 0, uniqueCodes: 0 };
}


