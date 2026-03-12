import { QueueTable } from '@/components/pemeriksaan/QueueTable'
import { Calendar, User, MapPin, Activity, ChevronDown } from 'lucide-react'
import { cookies } from 'next/headers'
import Link from 'next/link'

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ tgl?: string; tgl_mulai?: string; tgl_selesai?: string; dokter?: string; poli?: string; show_lab?: string }>
}) {
  const cookieStore = await cookies()
  const session_kd_dokter = cookieStore.get('kd_dokter')?.value
  const session_kd_poli = cookieStore.get('kd_poli')?.value

  const params = await searchParams
  const todayStr = new Date().toISOString().split('T')[0]
  const tgl = params.tgl || todayStr
  const tgl_mulai = params.tgl_mulai || tgl
  const tgl_selesai = params.tgl_selesai || tgl
  const kd_dokter = params.dokter || session_kd_dokter
  const kd_poli = params.poli || session_kd_poli

  const serviceUrl = process.env.RUST_SERVICE_URL || 'http://localhost:3001';

  // Fetch doctors for filter
  const doctorsRes = await fetch(`${serviceUrl}/doctors`, { cache: 'no-store' });
  const daftarDokter = await doctorsRes.json();

  // Fetch Queue based on filters
  const queueUrl = new URL(`${serviceUrl}/queue`);
  queueUrl.searchParams.append('tgl_mulai', tgl_mulai);
  queueUrl.searchParams.append('tgl_selesai', tgl_selesai);
  if (kd_dokter) queueUrl.searchParams.append('dokter', kd_dokter);
  if (kd_poli) queueUrl.searchParams.append('poli', kd_poli);
  
  const queueRes = await fetch(queueUrl.toString(), { cache: 'no-store' });
  const antrianRaw = await queueRes.json();

  // Map flat result to nested structure expected by component
  let antrian = antrianRaw.map((item: any) => ({
    no_rawat: item.no_rawat,
    no_reg: item.no_reg,
    jam_reg: item.jam_reg,
    stts: item.stts,
    pasien: {
      nm_pasien: item.nm_pasien,
      no_rkm_medis: item.no_rkm_medis
    },
    poliklinik_rel: {
      nm_poli: item.nm_poli
    },
    dokter: {
      nm_dokter: item.nm_dokter
    },
    penjab: {
      png_jawab: item.png_jawab
    },
    has_lab: item.has_lab
  }))

  if (params.show_lab === '1') {
    antrian = antrian.filter((item: any) => item.has_lab > 0)
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Pasien Rawat Jalan</h1>
          <p className="text-slate-500 font-medium mt-1">
            Unit: <span className="text-emerald-600 font-bold">{cookieStore.get('nm_poli')?.value || 'Semua Unit'}</span>
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <form className="flex flex-wrap items-center gap-3 bg-white p-1.5 rounded-[1.25rem] border border-slate-100 shadow-sm">
            {session_kd_poli === 'IGDK' ? (
              <>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input 
                    type="date" 
                    name="tgl_mulai"
                    defaultValue={tgl_mulai}
                    className="h-11 pl-11 pr-4 bg-slate-50 border-none rounded-[1rem] text-sm font-bold focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
                  />
                </div>
                <div className="text-slate-300 font-bold text-xs uppercase">S/D</div>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input 
                    type="date" 
                    name="tgl_selesai"
                    defaultValue={tgl_selesai}
                    className="h-11 pl-11 pr-4 bg-slate-50 border-none rounded-[1rem] text-sm font-bold focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
                  />
                </div>
              </>
            ) : (
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input 
                  type="date" 
                  name="tgl"
                  defaultValue={tgl}
                  className="h-11 pl-11 pr-4 bg-slate-50 border-none rounded-[1rem] text-sm font-bold focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
                />
              </div>
            )}
            
            {session_kd_poli !== 'IGDK' && (
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <select 
                  name="dokter"
                  defaultValue={kd_dokter || ""}
                  className="h-11 pl-11 pr-10 bg-slate-50 border-none rounded-[1rem] text-sm font-bold focus:ring-2 focus:ring-emerald-500 appearance-none outline-none w-full md:w-auto min-w-[200px]"
                >
                  <option value="">Semua Dokter</option>
                  {daftarDokter.map((d: any) => (
                    <option key={d.kd_dokter} value={d.kd_dokter}>{d.nm_dokter}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            )}
            
            <button type="submit" className="h-11 bg-emerald-600 text-white px-6 rounded-[1rem] font-bold text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 active:scale-95">
              Terapkan Filter
            </button>
            
            <div className="w-px h-6 bg-slate-100 mx-1 hidden md:block"></div>

            <Link 
              href={`?tgl=${tgl}&tgl_mulai=${tgl_mulai}&tgl_selesai=${tgl_selesai}&dokter=${kd_dokter || ''}&poli=${kd_poli || ''}&show_lab=1`}
              className="h-11 bg-rose-50 border border-rose-100 px-5 rounded-[1rem] flex items-center gap-3 hover:bg-rose-100 transition-all group shrink-0"
            >
              <div className="bg-rose-500 p-1.5 rounded-lg group-hover:scale-110 transition-transform">
                <Activity className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-[11px] font-black text-rose-600 uppercase tracking-widest">Cek Hasil Lab</span>
            </Link>
          </form>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
        <QueueTable data={antrian} kdPoli={session_kd_poli} />
      </div>
    </div>
  )
}
