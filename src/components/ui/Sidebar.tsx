"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Users, ClipboardList, Pill, Settings, LogOut, UserCircle } from 'lucide-react'
import { clearAuthSessionAction } from '@/app/login/actions'

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [doctor, setDoctor] = useState({ name: 'Memuat...', code: '', poli: '', kd_poli: '' })

  useEffect(() => {
    const nm = localStorage.getItem('nm_dokter') || 'Dokter Umum'
    const kd = localStorage.getItem('kd_dokter') || ''
    const pl = localStorage.getItem('nm_poli') || 'Poli Umum'
    const kp = localStorage.getItem('kd_poli') || ''
    setDoctor({ name: nm, code: kd, poli: pl, kd_poli: kp })
  }, [])

  const isIGD = doctor.kd_poli === 'IGDK'

  const menuItems = [
    { icon: LayoutDashboard, label: isIGD ? 'Dashboard IGD' : 'Dashboard', href: isIGD ? '/igd' : '/' },
    { icon: Users, label: isIGD ? 'Pasien IGD' : 'Pasien Rawat Jalan', href: '/pasien-rawat-jalan' },
    { icon: ClipboardList, label: 'Rawat Inap', href: '/pasien-rawat-inap' },
    { icon: Pill, label: 'E-Resep', href: '/resep' },
  ]

  const handleLogout = async () => {
    await clearAuthSessionAction()
    localStorage.clear()
    router.push('/login')
  }

  // Hide sidebar on login page
  if (pathname === '/login') return null

  return (
    <aside className="w-72 bg-white border-r h-screen sticky top-0 flex flex-col shadow-sm">
      <div className="p-8 border-b flex items-center gap-4 bg-slate-50/50">
        <div className="h-10 w-10 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-100">
           <span className="text-white font-black text-xl">E</span>
        </div>
        <div className="flex flex-col">
          <span className="font-black text-lg tracking-tighter leading-none">E-DOKTER</span>
          <span className="text-[10px] font-black text-emerald-600 tracking-widest uppercase mt-1">BLUD RSUD KOTA BAUBAU</span>
        </div>
      </div>
      
      <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 mb-4">Main Navigation</p>
        {menuItems
          .filter((item) => {
            if (item.label === 'Rawat Inap' || item.label === 'E-Resep') {
              if (isIGD) return false
              if (item.label === 'E-Resep') return true
              const poli = doctor.poli.toUpperCase()
              return !poli.includes('UMUM')
            }
            return true
          })
          .map((item) => {
            const isActive = pathname === item.href
            return (
              <Link 
                key={item.label} 
                href={item.href}
                className={`flex items-center gap-4 px-5 py-4 rounded-[1.2rem] transition-all group ${
                  isActive 
                  ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-100' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <item.icon className={`w-5 h-5 transition-transform duration-500 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                <span className="font-bold text-sm">{item.label}</span>
              </Link>
            )
          })}
      </nav>

      <div className="p-6 border-t space-y-4 bg-slate-50/30">
        <div className="flex items-center gap-4 px-4 py-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
           <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
              <UserCircle className="w-6 h-6 text-slate-400" />
           </div>
           <div className="overflow-hidden">
              <p className="font-black text-slate-900 text-sm truncate uppercase tracking-tight">{doctor.name}</p>
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-0.5">{doctor.poli}</p>
           </div>
        </div>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-4 px-5 py-3.5 text-red-500 hover:bg-red-50 rounded-xl transition-all text-xs font-black tracking-widest uppercase group"
        >
          <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Keluar Sistem
        </button>
      </div>
    </aside>
  )
}