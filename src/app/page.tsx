import { DashboardCharts } from '../components/dashboard/DashboardCharts'
import { Users, ClipboardList, Pill, Activity } from 'lucide-react'
import { cookies } from 'next/headers'

export default async function Page() {
  const cookieStore = await cookies()
  const kd_dokter = cookieStore.get('kd_dokter')?.value
  const kd_poli = cookieStore.get('kd_poli')?.value
  const nm_dokter = cookieStore.get('nm_dokter')?.value || 'Dokter'
  
  try {
    const serviceUrl = process.env.RUST_SERVICE_URL || 'http://localhost:3001';
    
    // Add filters to dashboard request
    const dashboardUrl = new URL(`${serviceUrl}/dashboard`);
    if (kd_dokter) dashboardUrl.searchParams.append('dokter', kd_dokter);
    if (kd_poli) dashboardUrl.searchParams.append('poli', kd_poli);

    const response = await fetch(dashboardUrl.toString(), { cache: 'no-store' });
    
    if (!response.ok) throw new Error('Rust Service error');
    
    const data = await response.json();
    const { stats, trend, gender, status } = data;

    const trendData = trend.map((item: any) => ({
      date: new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
      count: Number(item.count)
    }));

    const genderData = gender.map((item: any) => {
      const jk = (item.jk as string) || '';
      let name = 'Lainnya';
      if (jk === 'L') name = 'Laki-laki';
      else if (jk === 'P') name = 'Perempuan';
      else if (jk.trim() === '') name = 'Belum Diisi';
      
      return { name, value: Number(item.count) };
    });

    const statusData = status.map((item: any) => ({
      status: (item.stts || '').trim() === '' ? 'Lain-Lain' : item.stts,
      jumlah: Number(item.count)
    }));

    return (
      <div className="space-y-8 animate-in fade-in duration-700">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Dashboard Medis</h1>
            <p className="text-slate-500 mt-2 text-lg font-medium">Selamat datang kembali, {nm_dokter}. Data pasien Anda telah siap.</p>
          </div>
          <div className="bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100 flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-emerald-700 text-sm font-bold uppercase tracking-wider">Live System: OK</span>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard icon={Users} label="Total Pasien" value={stats.total_pasien.toLocaleString('id-ID')} color="bg-blue-600" />
          <StatCard icon={Activity} label="Rawat Hari Ini" value={stats.rawat_hari_ini.toLocaleString('id-ID')} color="bg-emerald-600" shadowColor="shadow-emerald-200" />
          <StatCard icon={Pill} label="E-Resep Aktif" value={stats.resep_total.toLocaleString('id-ID')} color="bg-amber-500" shadowColor="shadow-amber-200" />
          <StatCard icon={ClipboardList} label="Status Registrasi" value="Stabil" color="bg-indigo-600" shadowColor="shadow-indigo-200" />
        </div>

        {/* Charts Container */}
        <div className="bg-slate-50/50 p-2 rounded-[2.5rem] border border-slate-100/50">
           <DashboardCharts trendData={trendData} genderData={genderData} statusData={statusData} />
        </div>
      </div>
    )
  } catch (error) {
    console.error(error)
    return (
      <div className="p-12 text-center bg-white rounded-3xl border border-red-100 shadow-2xl shadow-red-100/50 max-w-2xl mx-auto mt-20">
        <div className="bg-red-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 anchor-id-error">
           <Activity className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 mb-4">Koneksi Database Terputus</h1>
        <p className="text-slate-500 leading-relaxed mb-8">Ghazur-AI tidak dapat menjangkau SIMRS Khanza Melalui Microservice Rust. Harap periksa status service Rust Anda.</p>
        <button 
          className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all"
        >
          Harap Muat Ulang Halaman
        </button>
      </div>
    )
  }
}

function StatCard({ icon: Icon, label, value, color, shadowColor = "shadow-blue-100" }: { icon: any, label: string, value: string, color: string, shadowColor?: string }) {
  return (
    <div className={`bg-white p-7 rounded-[2rem] border border-slate-100 shadow-xl ${shadowColor} hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group cursor-default`}>
      <div className="flex items-center gap-5">
        <div className={`p-4 rounded-2xl ${color} text-white shadow-lg group-hover:scale-110 transition-transform duration-500`}>
          <Icon className="w-7 h-7" />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-1">{label}</p>
          <p className="text-3xl font-black text-slate-900 tracking-tight">{value}</p>
        </div>
      </div>
    </div>
  )
}