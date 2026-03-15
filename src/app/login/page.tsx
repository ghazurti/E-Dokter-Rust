"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, Lock, ArrowRight, Activity, ShieldCheck, Stethoscope, MapPin } from 'lucide-react'
import { setAuthSessionAction } from './actions'

interface Poliklinik {
  kd_poli: string;
  nm_poli: string;
}

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [kdPoli, setKdPoli] = useState('')
  const [polikliniks, setPolikliniks] = useState<Poliklinik[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    async function fetchPoli() {
      try {
        const serviceUrl = process.env.NEXT_PUBLIC_RUST_SERVICE_URL || 'http://localhost:3001'
        const res = await fetch(`${serviceUrl}/poliklinik`)
        if (res.ok) {
          const data = await res.json()
          setPolikliniks(data)
        }
      } catch (err) {
        console.error("Failed to fetch poliklinik:", err)
      }
    }
    fetchPoli()
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!kdPoli) {
      setError('Silakan pilih Poliklinik terlebih dahulu')
      setLoading(false)
      return
    }

    try {
      const serviceUrl = process.env.NEXT_PUBLIC_RUST_SERVICE_URL || 'http://localhost:3001'
      const response = await fetch(`${serviceUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, kd_poli: kdPoli }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Username atau Password salah')
      }

      const data = await response.json()
      // Store session in cookies (server-side) and local storage (client-side)
      await setAuthSessionAction({ 
        token: data.token, 
        kd_dokter: data.kd_dokter, 
        nm_dokter: data.nm_dokter, 
        kd_poli: data.kd_poli, 
        nm_poli: data.nm_poli 
      })
      
      localStorage.setItem('kd_dokter', data.kd_dokter)
      localStorage.setItem('nm_dokter', data.nm_dokter)
      localStorage.setItem('kd_poli', data.kd_poli)
      localStorage.setItem('nm_poli', data.nm_poli)
      localStorage.setItem('token', data.token)
      
      if (data.kd_poli === 'IGDK') {
        window.location.href = '/igd'
      } else {
        window.location.href = '/'
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] animate-pulse delay-700"></div>

      <div className="w-full max-w-[1200px] grid lg:grid-cols-2 bg-white/5 backdrop-blur-3xl rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden relative z-10">
        
        {/* Left Side: Branding & Info */}
        <div className="p-16 lg:flex flex-col justify-between hidden bg-gradient-to-br from-emerald-600 to-teal-800 relative">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-12">
               <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-xl">
                  <Activity className="w-7 h-7" />
               </div>
               <span className="text-3xl font-black text-white tracking-tighter uppercase">E-Dokter <span className="text-emerald-300">Pro</span></span>
            </div>
            
            <h1 className="text-5xl font-black text-white leading-tight mb-8">
              Transformasi Digital <br />
              <span className="text-emerald-300">Layanan Medis</span> Anda.
            </h1>
            
            <div className="space-y-6">
              <FeatureItem icon={ShieldCheck} title="Akses Terenkripsi" desc="Keamanan data pasien prioritas utama kami dengan standar SIK Nasional." />
              <FeatureItem icon={Stethoscope} title="Modul Pemeriksaan Lengkap" desc="SOAP terintegrasi dengan ICD-10 dan E-Resep dalam satu dashboard." />
            </div>
          </div>

          <div className="relative z-10 pt-12 border-t border-white/10">
             <p className="text-emerald-100/60 text-xs font-bold uppercase tracking-[0.2em] mb-2">Didukung oleh</p>
             <p className="text-white font-black text-sm tracking-widest uppercase">Khanza SIK • Rust Backend Engine</p>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="p-12 lg:p-24 flex flex-col justify-center bg-white/5 relative">
          <div className="max-w-md mx-auto w-full">
            <div className="mb-12">
              <h2 className="text-3xl font-black text-white mb-3">Selamat Datang, Dok!</h2>
              <p className="text-slate-400 font-medium">Silakan masuk menggunakan kredensial SIMRS Anda.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-2xl text-sm font-bold animate-in slide-in-from-top-2 duration-300">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Username / Kode Dokter</label>
                <div className="relative group">
                  <User className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                  <input 
                    type="text"
                    required
                    placeholder="Contoh: D0001"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-16 pr-6 text-white font-bold outline-none focus:border-emerald-500/50 focus:bg-white/[0.08] transition-all placeholder:text-slate-600"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Poliklinik Unit</label>
                <div className="relative group">
                  <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                  <select 
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-16 pr-6 text-white font-bold outline-none focus:border-emerald-500/50 focus:bg-white/[0.08] transition-all appearance-none cursor-pointer"
                    value={kdPoli}
                    onChange={(e) => setKdPoli(e.target.value)}
                  >
                    <option value="" className="bg-[#0f172a]">-- Pilih Poliklinik --</option>
                    {polikliniks.map(p => (
                      <option key={p.kd_poli} value={p.kd_poli} className="bg-[#0f172a]">{p.nm_poli}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Password SIMRS</label>
                <div className="relative group">
                  <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                  <input 
                    type="password"
                    required
                    placeholder="••••••••"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-16 pr-6 text-white font-bold outline-none focus:border-emerald-500/50 focus:bg-white/[0.08] transition-all placeholder:text-slate-600"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between px-1">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" className="hidden" />
                  <div className="w-5 h-5 rounded-lg bg-white/5 border border-white/10 group-focus-within:border-emerald-500 flex items-center justify-center transition-all">
                    <div className="w-2 h-2 bg-emerald-500 rounded-sm opacity-0 group-hover:opacity-50 transition-opacity"></div>
                  </div>
                  <span className="text-xs font-bold text-slate-500">Ingat Saya</span>
                </label>
                <a href="#" className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors">Lupa Password?</a>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-5 rounded-[1.2rem] shadow-2xl shadow-emerald-500/20 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 disabled:active:scale-100"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    LOGIN SEKARANG
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-12 text-center">
               <p className="text-xs font-bold text-slate-500">
                 Kesulitan Masuk? <span className="text-white">Hubungi IT Support RS</span>
               </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function FeatureItem({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="flex gap-5">
      <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-white shrink-0">
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <h3 className="text-white font-black text-lg mb-1">{title}</h3>
        <p className="text-emerald-100/60 text-sm leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}
