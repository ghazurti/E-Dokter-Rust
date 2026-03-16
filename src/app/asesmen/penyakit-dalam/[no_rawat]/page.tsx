"use client"

import React, { useState, useEffect, use } from 'react'
import { 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  Zap,
  Mic,
  MicOff,
  Stethoscope,
  Save
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { AiQuickNotes } from '@/components/pemeriksaan/AiQuickNotes'

export default function AsesmenPenyakitDalamPage({ params }: { params: Promise<{ no_rawat: string }> }) {
  const router = useRouter()
  const resolvedParams = use(params)
  const noRawatJoined = decodeURIComponent(resolvedParams.no_rawat).replace(/-/g, '/')
  
  const [patient, setPatient] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [highlightActive, setHighlightActive] = useState(false)

  
  const [formData, setFormData] = useState<any>({
    no_rawat: noRawatJoined,
    kd_dokter: '',
    anamnesis: 'Autoanamnesis',
    hubungan: '',
    keluhan_utama: '',
    rps: '',
    rpd: '',
    rpo: '',
    alergi: '',
    kondisi: '',
    status: '',
    td: '',
    nadi: '',
    suhu: '',
    rr: '',
    bb: '',
    nyeri: '',
    gcs: '',
    kepala: 'Normal',
    keterangan_kepala: '',
    thoraks: 'Normal',
    keterangan_thorak: '',
    abdomen: 'Normal',
    keterangan_abdomen: '',
    ekstremitas: 'Normal',
    keterangan_ekstremitas: '',
    lainnya: '',
    lab: '',
    rad: '',
    penunjanglain: '',
    diagnosis: '',
    diagnosis2: '',
    permasalahan: '',
    terapi: '',
    tindakan: '',
    edukasi: ''
  })

  useEffect(() => {
    async function fetchData() {
      try {
        const serviceUrl = process.env.NEXT_PUBLIC_RUST_SERVICE_URL || 'http://localhost:3001'
        
        // Fetch patient detail
        const regRes = await fetch(`${serviceUrl}/registration?no_rawat=${encodeURIComponent(noRawatJoined)}`)
        if (regRes.ok) {
          const regData = await regRes.json()
          setPatient(regData)
          setFormData((prev: any) => ({ ...prev, kd_dokter: regData.kd_dokter }))
        }

        // Fetch existing assessment
        const assessmentRes = await fetch(`${serviceUrl}/penilaian-medis-penyakit-dalam/${resolvedParams.no_rawat}`)
        let hasSpecialized = false
        if (assessmentRes.ok) {
          const assessmentData = await assessmentRes.json()
          if (assessmentData) {
            setFormData(assessmentData)
            hasSpecialized = true
          }
        }

        // Auto-fill from nurse SOAP if new
        if (!hasSpecialized) {
          const nurseRes = await fetch(`${serviceUrl}/pemeriksaan-ralan/latest/${resolvedParams.no_rawat}`)
          if (nurseRes.ok) {
            const nurseData = await nurseRes.json()
            if (nurseData) {
              setFormData((prev: any) => ({
                ...prev,
                suhu: nurseData.suhu_tubuh || prev.suhu,
                td: nurseData.tensi || prev.td,
                nadi: nurseData.nadi || prev.nadi,
                rr: nurseData.respirasi || prev.rr,
                bb: nurseData.berat || prev.bb,
                nyeri: nurseData.nyeri || prev.nyeri,
                gcs: nurseData.gcs || prev.gcs,
                keluhan_utama: nurseData.keluhan || prev.keluhan_utama,
                alergi: nurseData.alergi || prev.alergi,
                lainnya: nurseData.pemeriksaan || prev.lainnya,
              }))
            }
          }
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [noRawatJoined, resolvedParams.no_rawat])

  const handleSave = async () => {
    setSaving(true)
    setSaveStatus('idle')
    setErrorMessage('')
    try {
      const serviceUrl = process.env.NEXT_PUBLIC_RUST_SERVICE_URL || 'http://localhost:3001'
      const res = await fetch(`${serviceUrl}/penilaian-medis-penyakit-dalam/save/${resolvedParams.no_rawat}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(errorText || 'Gagal menyimpan data')
      }
      
      setSaveStatus('success')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (err: any) {
      setSaveStatus('error')
      setErrorMessage(err.message || 'Terjadi kesalahan sistem')
    } finally {
      setSaving(false)
    }
  }
  
  const handleAiSuggest = (data: any) => {
    setFormData((prev: any) => ({
      ...prev,
      keluhan_utama: data.subjective || prev.keluhan_utama,
      lainnya: data.objective || prev.lainnya, // objective mapped to 'lainnya' as per page structure
      diagnosis: data.assessment || prev.diagnosis,
      terapi: data.plan || prev.terapi,
      // Vital Signs mapping
      td: data.td != null ? String(data.td) : prev.td,
      suhu: data.suhu != null ? String(data.suhu) : prev.suhu,
      nadi: data.nadi != null ? String(data.nadi) : prev.nadi,
      rr: data.rr != null ? String(data.rr) : prev.rr,
      bb: data.bb != null ? String(data.bb) : prev.bb,
      nyeri: data.nyeri != null ? String(data.nyeri) : prev.nyeri,
      gcs: data.gcs != null ? String(data.gcs) : prev.gcs,
    }))
    
    setSaveStatus('success')
    setHighlightActive(true)
    setTimeout(() => setHighlightActive(false), 2000)
    setTimeout(() => setSaveStatus('idle'), 3000)
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-slate-400 font-bold animate-pulse uppercase tracking-[0.2em] text-[10px]">Memuat Formulir...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button onClick={() => router.back()} className="p-3 hover:bg-slate-50 rounded-2xl transition-all active:scale-90">
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">ASESMEN MEDIS PENYAKIT DALAM</h1>
              <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-wider">Spesialis</span>
            </div>
            {patient && (
              <p className="text-xs text-slate-400 font-bold mt-0.5">
                {patient.nm_pasien} • {patient.no_rkm_medis} • {noRawatJoined}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {saveStatus === 'success' && (
            <div className="flex items-center gap-2 text-emerald-500 bg-emerald-50 px-4 py-2 rounded-xl animate-in fade-in slide-in-from-right-4">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Berhasil Disimpan</span>
            </div>
          )}
          {saveStatus === 'error' && (
            <div className="flex items-center gap-2 text-rose-500 bg-rose-50 px-4 py-2 rounded-xl">
              <AlertCircle className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">{errorMessage || 'Gagal Menyimpan'}</span>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-10 px-8">
        <div className="space-y-10">
          <AiQuickNotes 
            onSuggest={handleAiSuggest} 
            onAnalyzing={setIsAnalyzing}
            variant="blue"
          />

          {/* Section I: Anamnesis */}
          <section className={`bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8 transition-all duration-500 ${highlightActive ? 'ai-highlight' : ''}`}>
            <h3 className="text-sm font-black text-slate-900 tracking-[0.2em] uppercase flex items-center gap-3">
              <div className="w-2 h-8 bg-blue-400 rounded-full"></div>
              I. Anamnesis
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Metode Anamnesis</label>
                <select 
                  className="w-full bg-slate-50 border-2 border-slate-100/50 rounded-2xl py-4 px-4 font-bold text-slate-700 outline-none focus:border-blue-500 transition-all"
                  value={formData.anamnesis}
                  onChange={(e) => setFormData({...formData, anamnesis: e.target.value})}
                >
                  <option value="Autoanamnesis">Autoanamnesis</option>
                  <option value="Alloanamnesis">Alloanamnesis</option>
                </select>
              </div>
              <InputField label="Hubungan / Pemberi Informasi" value={formData.hubungan} onChange={(v: string) => setFormData({...formData, hubungan: v})} placeholder="Hubungan dengan pasien..." />
            </div>

            <TextAreaField label="Keluhan Utama" value={formData.keluhan_utama} onChange={(v: string) => setFormData({...formData, keluhan_utama: v})} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <TextAreaField label="Riwayat Penyakit Sekarang (RPS)" value={formData.rps} onChange={(v: string) => setFormData({...formData, rps: v})} />
              <TextAreaField label="Riwayat Penyakit Dahulu (RPD)" value={formData.rpd} onChange={(v: string) => setFormData({...formData, rpd: v})} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <TextAreaField label="Riwayat Penggunaan Obat (RPO)" value={formData.rpo} onChange={(v: string) => setFormData({...formData, rpo: v})} />
              <InputField label="Riwayat Alergi" value={formData.alergi} onChange={(v: string) => setFormData({...formData, alergi: v})} />
            </div>
          </section>

          {/* Section II: Status Fisik */}
          <section className={`bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8 transition-all duration-500 ${highlightActive ? 'ai-highlight' : ''}`}>
            <h3 className="text-sm font-black text-slate-900 tracking-[0.2em] uppercase flex items-center gap-3">
              <div className="w-2 h-8 bg-indigo-500 rounded-full"></div>
              II. Status Fisik & Pemeriksaan Klinis
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              <InputField label="TD (mmHg)" value={formData.td} onChange={(v: string) => setFormData({...formData, td: v})} />
              <InputField label="Nadi (x/mnt)" value={formData.nadi} onChange={(v: string) => setFormData({...formData, nadi: v})} />
              <InputField label="Suhu (°C)" value={formData.suhu} onChange={(v: string) => setFormData({...formData, suhu: v})} />
              <InputField label="RR (x/mnt)" value={formData.rr} onChange={(v: string) => setFormData({...formData, rr: v})} />
              <InputField label="BB (Kg)" value={formData.bb} onChange={(v: string) => setFormData({...formData, bb: v})} />
              <InputField label="Nyeri" value={formData.nyeri} onChange={(v: string) => setFormData({...formData, nyeri: v})} />
              <InputField label="GCS" value={formData.gcs} onChange={(v: string) => setFormData({...formData, gcs: v})} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
               <TextAreaField label="Kondisi Umum" value={formData.kondisi} onChange={(v: string) => setFormData({...formData, kondisi: v})} />
               <TextAreaField label="Status Psikologis" value={formData.status} onChange={(v: string) => setFormData({...formData, status: v})} />
            </div>

            <div className="pt-6 border-t border-slate-50 space-y-6">
               <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Pemeriksaan Sistemik</p>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <SystemicToggleWithDesc label="Kepala" value={formData.kepala} desc={formData.keterangan_kepala} onChange={(v: string) => setFormData({...formData, kepala: v})} onDescChange={(v: string) => setFormData({...formData, keterangan_kepala: v})} />
                  <SystemicToggleWithDesc label="Thoraks" value={formData.thoraks} desc={formData.keterangan_thorak} onChange={(v: string) => setFormData({...formData, thoraks: v})} onDescChange={(v: string) => setFormData({...formData, keterangan_thorak: v})} />
                  <SystemicToggleWithDesc label="Abdomen" value={formData.abdomen} desc={formData.keterangan_abdomen} onChange={(v: string) => setFormData({...formData, abdomen: v})} onDescChange={(v: string) => setFormData({...formData, keterangan_abdomen: v})} />
                  <SystemicToggleWithDesc label="Ekstremitas" value={formData.ekstremitas} desc={formData.keterangan_ekstremitas} onChange={(v: string) => setFormData({...formData, ekstremitas: v})} onDescChange={(v: string) => setFormData({...formData, keterangan_ekstremitas: v})} />
               </div>
               <TextAreaField label="Pemeriksaan Lainnya" value={formData.lainnya} onChange={(v: string) => setFormData({...formData, lainnya: v})} />
            </div>
          </section>

          {/* Section III: Diagnosis & Plan */}
          <section className={`bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8 transition-all duration-500 ${highlightActive ? 'ai-highlight' : ''}`}>
            <h3 className="text-sm font-black text-slate-900 tracking-[0.2em] uppercase flex items-center gap-3">
              <div className="w-2 h-8 bg-emerald-500 rounded-full"></div>
              III. Diagnosis & Perencanaan
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <TextAreaField label="Laboratorium" value={formData.lab} onChange={(v: string) => setFormData({...formData, lab: v})} />
              <TextAreaField label="Radiologi" value={formData.rad} onChange={(v: string) => setFormData({...formData, rad: v})} />
              <TextAreaField label="Pemeriksaan Penunjang Lain" value={formData.penunjanglain} onChange={(v: string) => setFormData({...formData, penunjanglain: v})} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <TextAreaField label="Diagnosisutama" value={formData.diagnosis} onChange={(v: string) => setFormData({...formData, diagnosis: v})} />
              <TextAreaField label="Diagnosis Sekunder" value={formData.diagnosis2} onChange={(v: string) => setFormData({...formData, diagnosis2: v})} />
            </div>
            <TextAreaField label="Permasalahan" value={formData.permasalahan} onChange={(v: string) => setFormData({...formData, permasalahan: v})} />
            <TextAreaField label="Terapi" value={formData.terapi} onChange={(v: string) => setFormData({...formData, terapi: v})} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <TextAreaField label="Tindakan" value={formData.tindakan} onChange={(v: string) => setFormData({...formData, tindakan: v})} />
              <TextAreaField label="Edukasi" value={formData.edukasi} onChange={(v: string) => setFormData({...formData, edukasi: v})} />
            </div>
          </section>

          <div className="flex justify-end gap-4 pb-12">
             <button onClick={() => router.back()} className="px-8 py-4 text-slate-400 font-bold hover:text-slate-900 transition-colors">Batal</button>
             <button 
               disabled={saving}
               onClick={handleSave}
               className="bg-slate-900 text-white px-12 py-4 rounded-3xl font-black text-sm hover:bg-blue-600 transition-all shadow-2xl shadow-blue-100 active:scale-95 disabled:opacity-50 flex items-center gap-3"
             >
               {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><Stethoscope className="w-5 h-5" /> SIMPAN ASESMEN PENYAKIT DALAM</>}
             </button>
          </div>
        </div>
      </main>
    </div>
  )
}

function InputField({ label, value, onChange, placeholder }: any) {
  return (
    <div className="space-y-3">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{label}</label>
      <input 
        type="text"
        className="w-full bg-slate-50 border-2 border-slate-100/50 rounded-2xl py-4 px-6 font-bold text-slate-700 outline-none focus:border-blue-500 transition-all placeholder:text-slate-300"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  )
}

function TextAreaField({ label, value, onChange, placeholder }: any) {
  return (
    <div className="space-y-3">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{label}</label>
      <textarea 
        className="w-full h-32 bg-slate-50 border-2 border-slate-100/50 rounded-[2rem] p-6 font-medium text-slate-700 outline-none focus:border-blue-500 transition-all placeholder:text-slate-200 resize-none"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  )
}

function SystemicToggleWithDesc({ label, value, desc, onChange, onDescChange }: any) {
  return (
    <div className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider">{label}</label>
        <div className="flex gap-1.5">
          {['Normal', 'Abnormal', 'Tidak Diperiksa'].map((s) => (
            <button
              key={s}
              onClick={() => onChange(s)}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-black transition-all ${
                value === s ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50'
              }`}
            >
              {s === 'Tidak Diperiksa' ? 'T.D' : s}
            </button>
          ))}
        </div>
      </div>
      <input 
        type="text"
        placeholder={`Keterangan ${label}...`}
        className="w-full bg-white border border-slate-100 rounded-xl py-2 px-4 text-xs font-bold text-slate-600 placeholder:text-slate-200 outline-none focus:border-blue-300"
        value={desc || ''}
        onChange={(e) => onDescChange(e.target.value)}
      />
    </div>
  )
}
