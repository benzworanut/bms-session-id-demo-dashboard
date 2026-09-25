import {
  ArrowUpRight,
  Ambulance,
  CalendarClock,
  Database,
  FileHeart,
  Globe2,
  HeartPulse,
  Hospital,
  IdCard,
  Landmark,
  ReceiptText,
  Smartphone,
  TriangleAlert,
  Truck,
  MonitorCog,
} from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'

interface ExternalSystem {
  name: string
  description: string
  url: string
  icon: typeof Globe2
  accent: string
}

const EXTERNAL_SYSTEMS: ExternalSystem[] = [
  { name: 'สสจ.สุราษฎร์ธานี', description: 'สำนักงานสาธารณสุขจังหวัดสุราษฎร์ธานี', url: 'https://surat.moph.go.th/', icon: Landmark, accent: 'bg-emerald-100 text-emerald-700' },
  { name: 'A-MED', description: 'ระบบบริการการแพทย์ฉุกเฉิน', url: 'https://homeward.dms.go.th/login/', icon: Ambulance, accent: 'bg-orange-100 text-orange-700' },
  { name: 'สปสช.', description: 'สำนักงานหลักประกันสุขภาพแห่งชาติ', url: 'https://www.nhso.go.th/', icon: Hospital, accent: 'bg-sky-100 text-sky-700' },
  { name: 'MOPH Refer', description: 'ระบบส่งต่อผู้ป่วยกระทรวงสาธารณสุข', url: 'https://refer.moph.go.th/', icon: ArrowUpRight, accent: 'bg-rose-100 text-rose-700' },
  { name: 'HDC', description: 'ระบบคลังข้อมูลสุขภาพ', url: 'https://hdc.moph.go.th/', icon: Database, accent: 'bg-teal-100 text-teal-700' },
  { name: 'FDH', description: 'ระบบศูนย์กลางข้อมูลด้านการเงิน', url: 'https://fdh.moph.go.th/hospital/', icon: ReceiptText, accent: 'bg-teal-100 text-teal-700' },
  { name: 'เว็บไซต์กระทรวงสาธารณสุข', description: 'ข้อมูลข่าวสารและบริการสาธารณสุข', url: 'https://www.moph.go.th/', icon: Landmark, accent: 'bg-blue-100 text-blue-700' },
  { name: 'หนังสือรับรองความตาย', description: 'สำหรับแพทย์', url: 'https://deathcert.moph.go.th/deathcert/login.html/', icon: FileHeart, accent: 'bg-blue-100 text-blue-700' },
  { name: 'ระบบงานความเสี่ยง', description: 'รายงานและติดตามความเสี่ยงในโรงพยาบาล', url: 'http://irm.kdh.go.th/', icon: TriangleAlert, accent: 'bg-amber-100 text-amber-700' },
  { name: 'สอน.บัดดี้ (Buddy Care)', description: 'การให้บริการดูแลผู้ป่วยที่บ้าน (Home Service) เชิงรุก', url: 'https://buddy-care.org/auth/', icon: HeartPulse, accent: 'bg-fuchsia-100 text-fuchsia-700' },
  { name: 'Health Rider (Telepharma) ', description: 'การให้บริการส่งยา', url: 'https://telepharma-his.one.th/login/', icon: Truck, accent: 'bg-fuchsia-100 text-fuchsia-700' },
  { name: 'QAPP PLUS - SRTH', description: 'ระบบนัดและจองคิวออนไลน์ของโรงพยาบาลสุราษฎร์ธานี', url: 'https://srth-service.com/qapp/login.php/', icon: CalendarClock, accent: 'bg-violet-100 text-violet-700' },
  { name: 'หมอพร้อม Station', description: 'ระบบงานดิจิทัลสำหรับบุคลากรทางการแพทย์และหน่วยบริการสุขภาพ', url: 'https://mohpromtstation.moph.go.th/login/', icon: Smartphone, accent: 'bg-cyan-100 text-cyan-700' },
  { name: 'Provider ID', description: 'ระบบข้อมูลบุคลากรทางการแพทย์', url: 'https://provider.id.th/', icon: IdCard, accent: 'bg-slate-100 text-slate-700' },
  { name: 'ศูนย์รวมลิงก์และระบบบริหารจัดการไอที', description: ' ', url: 'https://kittisak-it.github.io/Dashboard-Monitoring/', icon: MonitorCog, accent: 'bg-slate-100 text-slate-700' },
]

export default function OtherSystems() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <div className="flex items-end justify-between gap-4 border-b pb-5">
        <div>
          <p className="mb-2 text-sm font-medium text-primary">ศูนย์รวมการเข้าถึง</p>
          <h1 className="text-3xl font-bold tracking-tight">ลิงก์เมนูระบบงานอื่นๆ</h1>
          <p className="mt-2 text-sm text-muted-foreground">เข้าสู่ระบบภายนอกที่เกี่ยวข้องกับการปฏิบัติงานของโรงพยาบาล</p>
        </div>
        <Globe2 className="hidden h-12 w-12 text-primary/25 sm:block" aria-hidden="true" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {EXTERNAL_SYSTEMS.map((system) => {
          const Icon = system.icon
          return (
            <a key={system.name} href={system.url} target="_blank" rel="noopener noreferrer" className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={`เปิด ${system.name} ในแท็บใหม่`}>
              <Card className="h-full border-border/70 transition-all duration-200 group-hover:-translate-y-1 group-hover:border-primary/40 group-hover:shadow-lg">
                <CardContent className="flex min-h-32 items-center gap-4 p-5">
                  <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${system.accent}`}><Icon className="h-7 w-7" aria-hidden="true" /></div>
                  <div className="min-w-0 flex-1"><h2 className="font-semibold leading-tight">{system.name}</h2><p className="mt-1 text-sm text-muted-foreground">{system.description}</p></div>
                  <ArrowUpRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden="true" />
                </CardContent>
              </Card>
            </a>
          )
        })}
      </div>
    </div>
  )
}