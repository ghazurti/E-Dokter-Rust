"use client"

import { useState, useEffect } from 'react'
import { Activity, Clock, Shield, AlertTriangle, CheckCircle2, Save } from 'lucide-react'

interface TriageTabProps {
  noRawat: string
  patient: any
  onSave: (data: any) => Promise<void>
  isSaving?: boolean
}

export function TriageTab({ noRawat, patient, onSave, isSaving }: TriageTabProps) {
  const [master, setMaster] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeSubTab, setActiveSubTab] = useState<'primer' | 'sekunder'>('primer')

  const [triageData, setTriageData] = useState({
    data: {
      no_rawat: noRawat,
      tgl_kunjungan: new Date().toISOString(),
      cara_masuk: 'Jalan',
      alat_transportasi: 'Sendiri',
      alasan_kedatangan: 'Datang Sendiri',
      keterangan_kedatangan: '',
      kode_kasus: '004', // Non Trauma
      tekanan_darah: '',
      nadi: '',
      pernapasan: '',
      suhu: '',
      saturasi_o2: '',
      nyeri: '0',
    },
    primer: {
      no_rawat: noRawat,
      keluhan_utama: '',
      kebutuhan_khusus: '-',
      catatan: '',
      plan: 'Ruang Kritis',
      tanggaltriase: new Date().toISOString(),
      nik: '',
    },
    sekunder: {
      no_rawat: noRawat,
      anamnesa_singkat: '',
      catatan: '',
      plan: 'Zona Hijau',
      tanggaltriase: new Date().toISOString(),
      nik: '',
    },
    skala1: [] as string[],
    skala2: [] as string[],
    skala3: [] as string[],
    skala4: [] as string[],
    skala5: [] as string[],
  })

  useEffect(() => {
    async function fetchMaster() {
      try {
        const serviceUrl = process.env.NEXT_PUBLIC_RUST_SERVICE_URL || 'http://localhost:3001'
        const res = await fetch(`${serviceUrl}/triase-igd/master`)
        if (res.ok) {
          const data = await res.json()
          setMaster(data)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchMaster()
  }, [])

  const toggleScale = (scale: string, code: string) => {
    setTriageData(prev => {
      const current = (prev as any)[scale] as string[]
      const updated = current.includes(code)
        ? current.filter(c => c !== code)
        : [...current, code]
      return { ...prev, [scale]: updated }
    })
  }

  if (loading) return <div>Memuat master triase...</div>

  const renderScaleSection = (scaleKey: string, masterKey: string, title: string, color: string) => {
    if (!master || !master[masterKey]) return null
    return (
      <div className={`p-4 rounded-2xl border ${color} space-y-3`}>
        <h4 className="text-xs font-black uppercase tracking-widest">{title}</h4>
        <div className="space-y-2">
          {master[masterKey].map((item: any) => (
            <label key={item.kode_skala1 || item.kode_skala2 || item.kode_skala3 || item.kode_skala4 || item.kode_skala5} 
                   className="flex items-center gap-3 cursor-pointer group">
              <input 
                type="checkbox"
                checked={(triageData[scaleKey as keyof typeof triageData] as string[]).includes(item.kode_skala1 || item.kode_skala2 || item.kode_skala3 || item.kode_skala4 || item.kode_skala5)}
                onChange={() => toggleScale(scaleKey, item.kode_skala1 || item.kode_skala2 || item.kode_skala3 || item.kode_skala4 || item.kode_skala5)}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-[11px] font-medium text-slate-600 group-hover:text-slate-900 transition-colors">
                {item.pengkajian_skala1 || item.pengkajian_skala2 || item.pengkajian_skala3 || item.pengkajian_skala4 || item.pengkajian_skala5}
              </span>
            </label>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Header Info */}
      <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex flex-wrap gap-6 items-center">
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cara Masuk</label>
          <select 
            value={triageData.data.cara_masuk}
            onChange={e => setTriageData({...triageData, data: {...triageData.data, cara_masuk: e.target.value}})}
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:border-blue-500"
          >
            <option value="Jalan">Jalan</option>
            <option value="Brankar">Brankar</option>
            <option value="Kursi Roda">Kursi Roda</option>
            <option value="Digendong">Digendong</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Transportasi</label>
          <select 
            value={triageData.data.alat_transportasi}
            onChange={e => setTriageData({...triageData, data: {...triageData.data, alat_transportasi: e.target.value}})}
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:border-blue-500"
          >
            <option value="-">-</option>
            <option value="AGD">AGD</option>
            <option value="Sendiri">Sendiri</option>
            <option value="Swasta">Swasta</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Alasan Kedatangan</label>
          <select 
            value={triageData.data.alasan_kedatangan}
            onChange={e => setTriageData({...triageData, data: {...triageData.data, alasan_kedatangan: e.target.value}})}
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:border-blue-500"
          >
            {['Datang Sendiri','Polisi','Rujukan','Bidan','Puskesmas','Rumah Sakit','Poliklinik','Faskes Lain','-'].map(o => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1 flex-1 min-w-[200px]">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Macam Kasus</label>
          <select 
            value={triageData.data.kode_kasus}
            onChange={e => setTriageData({...triageData, data: {...triageData.data, kode_kasus: e.target.value}})}
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:border-blue-500"
          >
            {master?.kasus?.map((k: any) => (
              <option key={k.kode_kasus} value={k.kode_kasus}>{k.macam_kasus}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Triage Tabs */}
      <div className="flex gap-4 border-b border-slate-100">
        <button 
          onClick={() => setActiveSubTab('primer')}
          className={`px-8 py-4 text-sm font-black transition-all border-b-2 ${activeSubTab === 'primer' ? 'border-red-500 text-red-600 bg-red-50/30' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          TRIASE PRIMER (STABILISASI)
        </button>
        <button 
          onClick={() => setActiveSubTab('sekunder')}
          className={`px-8 py-4 text-sm font-black transition-all border-b-2 ${activeSubTab === 'sekunder' ? 'border-amber-500 text-amber-600 bg-amber-50/30' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          TRIASE SEKUNDER (LANJUTAN)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="space-y-8">
          <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
            <h3 className="text-sm font-black text-slate-900 tracking-widest uppercase flex items-center gap-3">
              <Activity className="w-5 h-5 text-blue-500" />
              Tanda Vital Triase
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <VitalInput label="TD" value={triageData.data.tekanan_darah} onChange={v => setTriageData({...triageData, data: {...triageData.data, tekanan_darah: v}})} unit="mmHg" />
              <VitalInput label="Nadi" value={triageData.data.nadi} onChange={v => setTriageData({...triageData, data: {...triageData.data, nadi: v}})} unit="x/m" />
              <VitalInput label="RR" value={triageData.data.pernapasan} onChange={v => setTriageData({...triageData, data: {...triageData.data, pernapasan: v}})} unit="x/m" />
              <VitalInput label="Suhu" value={triageData.data.suhu} onChange={v => setTriageData({...triageData, data: {...triageData.data, suhu: v}})} unit="°C" />
              <VitalInput label="SpO2" value={triageData.data.saturasi_o2} onChange={v => setTriageData({...triageData, data: {...triageData.data, saturasi_o2: v}})} unit="%" />
              <VitalInput label="Nyeri" value={triageData.data.nyeri} onChange={v => setTriageData({...triageData, data: {...triageData.data, nyeri: v}})} unit="0-10" />
            </div>
          </section>

          {activeSubTab === 'primer' ? (
            <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
              <h3 className="text-sm font-black text-slate-900 tracking-widest uppercase flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Data Pemeriksaan Primer
              </h3>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Keluhan Utama</label>
                  <textarea 
                    value={triageData.primer.keluhan_utama}
                    onChange={e => setTriageData({...triageData, primer: {...triageData.primer, keluhan_utama: e.target.value}})}
                    className="w-full h-24 bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold outline-none focus:border-red-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kebutuhan Khusus</label>
                    <select 
                      value={triageData.primer.kebutuhan_khusus}
                      onChange={e => setTriageData({...triageData, primer: {...triageData.primer, kebutuhan_khusus: e.target.value}})}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-sm font-bold outline-none"
                    >
                      <option value="-">-</option>
                      <option value="UPPA">UPPA</option>
                      <option value="Airborne">Airborne</option>
                      <option value="Dekontaminan">Dekontaminan</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Plan / Keputusan</label>
                    <div className="flex flex-col gap-2">
                      {['Ruang Resusitasi', 'Ruang Kritis'].map(p => (
                        <label key={p} className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="radio" 
                            name="plan_primer" 
                            checked={triageData.primer.plan === p}
                            onChange={() => setTriageData({...triageData, primer: {...triageData.primer, plan: p}})}
                          />
                          <span className="text-xs font-bold text-slate-700">{p}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          ) : (
            <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
              <h3 className="text-sm font-black text-slate-900 tracking-widest uppercase flex items-center gap-3">
                <Shield className="w-5 h-5 text-amber-500" />
                Data Pemeriksaan Sekunder
              </h3>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Anamnesa Singkat</label>
                  <textarea 
                    value={triageData.sekunder.anamnesa_singkat}
                    onChange={e => setTriageData({...triageData, sekunder: {...triageData.sekunder, anamnesa_singkat: e.target.value}})}
                    className="w-full h-24 bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold outline-none focus:border-amber-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Plan / Keputusan</label>
                  <div className="flex gap-6">
                    {['Zona Kuning', 'Zona Hijau'].map(p => (
                      <label key={p} className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="radio" 
                          name="plan_sekunder" 
                          checked={triageData.sekunder.plan === p}
                          onChange={() => setTriageData({...triageData, sekunder: {...triageData.sekunder, plan: p}})}
                        />
                        <span className="text-xs font-bold text-slate-700">{p}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>

        <div className="space-y-8 bg-slate-50/50 p-8 rounded-[3rem] border border-slate-100">
           <h3 className="text-sm font-black text-slate-900 tracking-widest uppercase flex items-center gap-3">
              <Clock className="w-5 h-5 text-slate-400" />
              Skoring Triase & Pemeriksaan
           </h3>
           
           <div className="grid grid-cols-1 gap-6">
              {activeSubTab === 'primer' ? (
                <>
                  {renderScaleSection('skala1', 'skala1', 'Skala 1 - Resusitasi (Merah)', 'bg-red-50 border-red-100 text-red-900')}
                  {renderScaleSection('skala2', 'skala2', 'Skala 2 - Emergency (Merah)', 'bg-rose-50 border-rose-100 text-rose-900')}
                </>
              ) : (
                <>
                  {renderScaleSection('skala3', 'skala3', 'Skala 3 - Urgent (Kuning)', 'bg-yellow-50 border-yellow-100 text-yellow-900')}
                  {renderScaleSection('skala4', 'skala4', 'Skala 4 - Less Urgent (Hijau)', 'bg-emerald-50 border-emerald-100 text-emerald-900')}
                  {renderScaleSection('skala5', 'skala5', 'Skala 5 - Non Urgent (Hijau)', 'bg-blue-50 border-blue-100 text-blue-900')}
                </>
              )}
           </div>
        </div>
      </div>

      <div className="fixed bottom-10 right-10 z-50">
        <button 
          onClick={() => onSave(triageData)}
          disabled={isSaving}
          className="bg-slate-900 text-white px-10 py-5 rounded-[2rem] font-black shadow-2xl hover:bg-blue-600 transition-all active:scale-95 flex items-center gap-3 disabled:opacity-50"
        >
          {isSaving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <Save className="w-5 h-5 text-blue-400" />
          )}
          {isSaving ? 'Menyimpan...' : 'SIMPAN TRIASE IGD'}
        </button>
      </div>
    </div>
  )
}

function VitalInput({ label, value, onChange, unit }: any) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{label}</label>
      <div className="relative">
        <input 
          type="text" 
          value={value} 
          onChange={e => onChange(e.target.value)}
          className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 font-black text-slate-700 outline-none focus:bg-white focus:border-blue-500 transition-all pr-12"
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-300 uppercase">{unit}</span>
      </div>
    </div>
  )
}
