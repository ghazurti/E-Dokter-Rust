import { 
  Search, 
  BedDouble, 
  Bed,
  Check,
  Stethoscope,
  Activity,
} from 'lucide-react'
import { cookies } from 'next/headers'
import Link from 'next/link'

export default async function CekPasienRanap({
  searchParams,
}: {
  searchParams: Promise<{ tgl_awal?: string; tgl_akhir?: string; keyword?: string; show_lab?: string }>
}) {
  const cookieStore = await cookies()
  const session_kd_dokter = cookieStore.get('kd_dokter')?.value
  const session_nm_poli = cookieStore.get('nm_poli')?.value

  const params = await searchParams
  const todayStr = new Date().toISOString().split('T')[0]
  const tglAwal = params.tgl_awal || todayStr
  const tglAkhir = params.tgl_akhir || todayStr
  const keyword = params.keyword || ''

  const serviceUrl = process.env.RUST_SERVICE_URL || 'http://localhost:3001'

  // Fetch Ranap Patients
  const ranapUrl = new URL(`${serviceUrl}/ranap`)
  ranapUrl.searchParams.append('tgl_awal', tglAwal)
  ranapUrl.searchParams.append('tgl_akhir', tglAkhir)
  if (session_kd_dokter) ranapUrl.searchParams.append('dokter', session_kd_dokter)
  if (keyword) ranapUrl.searchParams.append('keyword', keyword)

  let patients = []
  let errorMsg = null
  try {
    const res = await fetch(ranapUrl.toString(), { cache: 'no-store' })
    if (res.ok) {
      patients = await res.json()
    } else {
      const errorText = await res.text()
      errorMsg = `Backend error: ${res.status} ${errorText}`
      console.error(errorMsg)
    }
  } catch (error: any) {
    errorMsg = `Fetch failed: ${error.message}`
    console.error(errorMsg)
  }

  if (params.show_lab === '1') {
    patients = patients.filter((p: any) => p.has_lab > 0)
  }

  return (
    <div className="min-h-screen bg-[#f1f5f9] p-4 animate-in fade-in duration-500">
      <div className="max-w-7xl mx-auto space-y-4">
        
        {/* Header Section */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <BedDouble className="w-6 h-6 text-blue-600" />
              Monitoring Pasien Rawat Inap
            </h1>
            <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">
               Unit: <span className="text-blue-600">{session_nm_poli || 'Semua Unit'}</span>
            </p>
          </div>
          <div className="text-[10px] font-black bg-blue-600 text-white px-4 py-2 rounded-full uppercase tracking-widest shadow-lg shadow-blue-100">
            {patients.length} Pasien Aktif
          </div>
        </div>

        {/* Filter Periode & Search */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <form className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <span>Periode :</span>
              <input 
                type="date" 
                name="tgl_awal"
                className="border-2 border-slate-100 rounded-xl px-3 py-2 bg-slate-50 text-slate-800 font-bold outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner"
                defaultValue={tglAwal}
              />
              <span className="text-slate-300">s.d.</span>
              <input 
                type="date" 
                name="tgl_akhir"
                className="border-2 border-slate-100 rounded-xl px-3 py-2 bg-slate-50 text-slate-800 font-bold outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner"
                defaultValue={tglAkhir}
              />
              <button type="submit" className="bg-emerald-500 text-white p-2.5 rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100 active:scale-95">
                <Check className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 relative flex items-center gap-4">
              <div className="relative flex-1">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 border-r pr-3 border-slate-200">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Search</span>
                  <Search className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <input 
                  type="text"
                  name="keyword"
                  placeholder="Cari Nama Pasien, No. RM, atau No. Rawat..."
                  className="w-full pl-28 pr-4 py-3 bg-slate-50 border-2 border-slate-50 rounded-2xl text-xs font-bold text-slate-700 focus:border-blue-500 focus:bg-white outline-none transition-all shadow-inner"
                  defaultValue={keyword}
                />
              </div>
              
              <Link 
                href={`?tgl_awal=${tglAwal}&tgl_akhir=${tglAkhir}&keyword=${keyword}&show_lab=1`}
                className="bg-rose-50 border border-rose-100 px-4 py-3 rounded-2xl flex items-center gap-2 hover:bg-rose-100 transition-all group shrink-0"
              >
                <div className="bg-rose-500 p-1.5 rounded-lg group-hover:scale-110 transition-transform">
                  <Activity className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Cek Hasil Lab</span>
              </Link>
            </div>
          </form>
        </div>

        {/* Table List Pasien */}
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl text-xs font-bold flex items-center gap-3">
             <div className="bg-red-100 p-2 rounded-lg">
                <Activity className="w-4 h-4 text-red-600" />
             </div>
             {errorMsg}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white uppercase tracking-widest font-black">
                  <th className="p-4 pl-6 text-[10px]">Informasi Pasien</th>
                  <th className="p-4 text-center text-[10px]">Ruangan & Kamar</th>
                  <th className="p-4 text-center text-[10px]">Tgl Masuk</th>
                  <th className="p-4 text-center text-[10px]">Dokter DPJP</th>
                  <th className="p-4 pr-6 text-center text-[10px] w-40">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {patients.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-20 text-center">
                       <div className="flex flex-col items-center gap-4 opacity-20">
                          <Bed className="w-16 h-16 text-slate-900" />
                          <p className="text-[10px] font-black text-slate-900 uppercase tracking-[0.4em]">Tidak ada pasien rawat inap</p>
                       </div>
                    </td>
                  </tr>
                ) : (
                  patients.map((p: any, i: number) => (
                    <tr key={i} className="hover:bg-blue-50/50 transition-all group">
                      <td className="p-4 pl-6">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                             <p className="font-black text-slate-800 uppercase text-sm group-hover:text-blue-600 transition-colors">{p.nm_pasien}</p>
                             {p.has_lab > 0 && (
                               <div className="flex items-center gap-1 bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full text-[9px] font-black animate-pulse shadow-sm">
                                  <Activity className="w-3 h-3" /> HASIL LAB READY
                               </div>
                             )}
                          </div>
                          <div className="flex items-center gap-2">
                             <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase">{p.no_rkm_medis}</span>
                             <span className="text-[10px] font-mono font-bold text-slate-300">{p.no_rawat}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="inline-flex flex-col items-center bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 shadow-sm">
                           <span className="font-black text-emerald-800 uppercase text-[11px] leading-tight">{p.kamar}</span>
                           <span className="text-[9px] font-black text-emerald-500 uppercase tracking-tighter mt-1">KELAS {p.kelas}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <p className="font-bold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg inline-block border border-slate-100">{p.tgl_masuk}</p>
                      </td>
                      <td className="p-4 text-center">
                        <p className="font-black text-[10px] text-slate-500 uppercase italic bg-slate-100/50 px-3 py-1.5 rounded-lg inline-block">{p.nm_dokter}</p>
                      </td>
                      <td className="p-4 pr-6">
                        <Link 
                          href={`/pemeriksaan/ranap/detail/${p.no_rawat.replace(/\//g, '-')}`}
                          className="w-full bg-slate-900 text-white py-3 rounded-xl text-[10px] font-black hover:bg-blue-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200 active:scale-95 uppercase tracking-widest"
                        >
                          <Stethoscope className="w-4 h-4" />
                          Lakukan Pemeriksaan
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}