"use client"

import { useEffect, useState, useCallback } from 'react'
import { Activity, AlertCircle, ShieldAlert, ArrowRight, ClipboardCheck } from 'lucide-react'
import { DashboardCharts } from '@/components/dashboard/DashboardCharts'
import Link from 'next/link'

export default function IGDDashboardPage() {
  const [stats, setStats] = useState<any>(null)
  const [antrian, setAntrian] = useState<any[]>([])
  const [chartData, setChartData] = useState<any>({ trend: [], gender: [], status: [] })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [kdDokter, setKdDokter] = useState('')
  const [nmDokter, setNmDokter] = useState('')
  
  const today = new Date().toISOString().split('T')[0]
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  
  const fetchData = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true)
    else setRefreshing(true)
    
    try {
      const serviceUrl = process.env.NEXT_PUBLIC_RUST_SERVICE_URL || 'http://localhost:3001'
      const kd_dokter = localStorage.getItem('kd_dokter') || ''
      const nm_dokter = localStorage.getItem('nm_dokter') || 'Dokter'
      const kd_poli = 'IGDK' 
      
      setKdDokter(kd_dokter)
      setNmDokter(nm_dokter)

      // 1. Fetch Dashboard Analytics for 30 DAYS
      const dashRes = await fetch(`${serviceUrl}/dashboard?poli=${kd_poli}&dokter=${kd_dokter}&tgl_mulai=${thirtyDaysAgo}&tgl_selesai=${today}`)
      const dashData = await dashRes.json()
      
      setStats(dashData.stats)
      
      setChartData({
        trend: dashData.trend,
        gender: dashData.gender.map((g: any) => ({ name: g.jk === 'L' ? 'Laki-laki' : 'Perempuan', value: g.count })),
        status: dashData.status.map((s: any) => ({ status: s.stts, jumlah: s.count }))
      })

      // 2. Fetch IGD Queue for TODAY only (to count status in cards)
      const queueRes = await fetch(`${serviceUrl}/queue?tgl_mulai=${today}&tgl_selesai=${today}&poli=${kd_poli}&dokter=${kd_dokter}`)
      const antrianRaw = await queueRes.json()
      
      setAntrian(antrianRaw)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [today, thirtyDaysAgo])

  useEffect(() => {
    fetchData(true)
  }, [fetchData])

  if (loading) {
     return (
       <div className="flex h-screen items-center justify-center bg-slate-900">
         <div className="flex flex-col items-center gap-4">
           <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
           <p className="font-bold text-rose-100/50 animate-pulse uppercase tracking-[0.3em] text-[10px]">Inisialisasi Dashboard Shift IGD...</p>
         </div>
       </div>
     )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="bg-rose-600 text-white px-3 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase shadow-lg shadow-rose-500/20">Emergency Unit</span>
            <div className="flex items-center gap-2 text-rose-500 font-black text-[10px] tracking-widest uppercase">
               <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
               </span>
               SHIFT AKTIF: {nmDokter.toUpperCase()}
            </div>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
             Dashboard IGD
             <Activity className="w-8 h-8 text-rose-600" />
          </h1>
          <p className="text-slate-500 mt-2 text-lg font-medium italic">Monitoring Pasien Gawat Darurat - Real-time Overview.</p>
        </div>

        <button 
            onClick={() => fetchData()}
            disabled={refreshing}
            className="bg-white text-slate-900 border border-slate-100 px-6 py-3 rounded-2xl font-bold text-sm shadow-xl shadow-slate-100/50 hover:bg-slate-50 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
        >
            {refreshing ? <div className="w-4 h-4 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div> : <Activity className="w-4 h-4" />}
            Refresh Data
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          icon={AlertCircle} 
          label="Total Pasien Hari Ini" 
          value={stats?.rawat_hari_ini?.toString() || '0'} 
          color="bg-rose-600" 
          desc="Pasien IGD terdaftar hari ini"
        />
        <StatCard 
          icon={ShieldAlert} 
          label="Menunggu Dokter" 
          value={antrian.filter(a => a.stts === 'Belum').length.toString()} 
          color="bg-orange-500" 
          desc="Pasien antre pemeriksaan"
        />
        <StatCard 
          icon={ClipboardCheck} 
          label="Triage Selesai" 
          value={antrian.filter(a => a.stts !== 'Belum').length.toString()} 
          color="bg-emerald-600" 
          desc="Total pasien sudah tertangani"
        />
      </div>

      {/* Analytics Charts */}
      <DashboardCharts 
        trendData={chartData.trend} 
        genderData={chartData.gender} 
        statusData={chartData.status} 
      />

      {/* Quick Action */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
         <div className="absolute top-0 right-0 w-64 h-64 bg-rose-600/10 rounded-full blur-3xl -translate-y-32 translate-x-32 group-hover:bg-rose-600/20 transition-all duration-700"></div>
         <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-xl">
               <h2 className="text-3xl font-black text-white tracking-tight mb-4 uppercase">Siap Menangani Pasien?</h2>
               <p className="text-slate-400 font-medium leading-relaxed">
                  Semua data antrean pasien IGD sekarang dikelola secara terpusat di menu Pasien IGD. 
                  Gunakan rentang tanggal untuk melihat riwayat atau antrean shift sebelumnya.
               </p>
            </div>
            <Link 
               href="/pasien-rawat-jalan"
               className="bg-white text-slate-900 px-10 py-5 rounded-[1.5rem] font-black tracking-widest uppercase text-xs hover:bg-rose-500 hover:text-white transition-all shadow-2xl flex items-center gap-4 group/btn"
            >
               Buka Daftar Pasien IGD
               <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-2 transition-transform" />
            </Link>
         </div>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color, desc }: any) {
  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-100/50 hover:shadow-2xl hover:-translate-y-1 transition-all group overflow-hidden relative">
      <div className={`absolute top-0 right-0 w-24 h-24 ${color} opacity-[0.03] rounded-bl-full translate-x-8 -translate-y-8 group-hover:scale-150 transition-transform duration-700`}></div>
      <div className="flex items-center gap-6 relative z-10">
        <div className={`w-16 h-16 rounded-2xl ${color} text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
          <Icon className="w-8 h-8" />
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{label}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-4xl font-black text-slate-900 tracking-tight">{value}</p>
            <span className="text-xs font-bold text-slate-400">PASIEN</span>
          </div>
          <p className="text-[10px] font-medium text-slate-400 mt-2 italic">{desc}</p>
        </div>
      </div>
    </div>
  )
}
