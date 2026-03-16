"use client"

import { useEffect, useState, use } from 'react'
import { 
  ArrowLeft, 
  Save, 
  Zap, 
  CheckCircle2, 
  AlertCircle
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { AiQuickNotes } from '@/components/pemeriksaan/ai/AiQuickNotes'

export default function AsesmenBedahMulutPage({ params }: { params: Promise<{ no_rawat: string }> }) {
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
    kesadaran: 'Compos Mentis',
    td: '',
    nadi: '',
    suhu: '',
    rr: '',
    kepala: 'Tidak',
    keterangan_kepala: '',
    mata: 'Tidak',
    keterangan_mata: '',
    leher: 'Tidak',
    keterangan_leher: '',
    kelenjar: 'Tidak',
    keterangan_kelenjar: '',
    dada: 'Tidak',
    keterangan_dada: '',
    perut: 'Tidak',
    keterangan_perut: '',
    ekstremitas: 'Tidak',
    keterangan_ekstremitas: '',
    wajah: '',
    intra: '',
    gigigeligi: '',
    lab: '',
    rad: '',
    penunjang: '',
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

        // Fetch existing assessment if any
        const assessmentRes = await fetch(`${serviceUrl}/penilaian-medis-bedah-mulut/${resolvedParams.no_rawat}`)
        let hasSpecialized = false
        if (assessmentRes.ok) {
          const assessmentData = await assessmentRes.json()
          if (assessmentData) {
            setFormData(assessmentData)
            hasSpecialized = true
          }
        }

        // If no specialized assessment, try to fetch nurse SOAP (pemeriksaan_ralan)
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
                keluhan_utama: nurseData.keluhan || prev.keluhan_utama,
                alergi: nurseData.alergi || prev.alergi,
                intra: nurseData.pemeriksaan || prev.intra,
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

  const handleAiSuggest = (data: any) => {
    setFormData((prev: any) => ({
      ...prev,
      keluhan_utama: data.subjective || prev.keluhan_utama,
      intra: data.objective || prev.intra,
      diagnosis: data.assessment || prev.diagnosis,
      terapi: data.plan || prev.terapi,
      // Vital Signs
      td: data.td != null ? String(data.td) : prev.td,
      suhu: data.suhu != null ? String(data.suhu) : prev.suhu,
      nadi: data.nadi != null ? String(data.nadi) : prev.nadi,
      rr: data.rr != null ? String(data.rr) : prev.rr,
    }))
    
    setSaveStatus('success')
    setHighlightActive(true)
    setTimeout(() => setHighlightActive(false), 2000)
    setTimeout(() => setSaveStatus('idle'), 3000)
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveStatus('idle')
    setErrorMessage('')
    try {
      const serviceUrl = process.env.NEXT_PUBLIC_RUST_SERVICE_URL || 'http://localhost:3001'
      const res = await fetch(`${serviceUrl}/penilaian-medis-bedah-mulut/save/${resolvedParams.no_rawat}`, {
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

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="font-bold text-slate-500 animate-pulse uppercase tracking-widest text-xs">Memuat Data Asesmen Bedah Mulut...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col">
      <header className="bg-white/80 backdrop-blur-xl border-b border-amber-50 px-8 py-6 sticky top-0 z-30 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-6">
          <button onClick={() => router.back()} className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all group">
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </button>
          <div className="flex items-center gap-4">
             <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-[1.2rem] flex items-center justify-center text-white shadow-lg shadow-amber-100">
                <Zap className="w-7 h-7" />
             </div>
             <div>
                <div className="flex items-center gap-3">
                   <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">ASESMEN MEDIS BEDAH MULUT</h1>
                   <span className="bg-amber-600 text-white px-3 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase">ORAL SURGERY</span>
                </div>
                <p className="text-[11px] font-bold text-slate-400 flex items-center gap-3 mt-1 uppercase">
                   <span className="text-slate-900">{patient?.nm_pasien}</span>
                   <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                   <span>RM: {patient?.no_rkm_medis}</span>
                   <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                   <span className="text-amber-600 font-extrabold">{noRawatJoined}</span>
                </p>
             </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
           {saveStatus === 'success' && (
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs mr-4 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100">
                 <CheckCircle2 className="w-4 h-4" />
                 Berhasil Disimpan
              </div>
           )}
           {saveStatus === 'error' && (
              <div className="flex items-center gap-2 text-rose-600 font-bold text-xs mr-4 bg-rose-50 px-4 py-2 rounded-full border border-rose-100">
                 <AlertCircle className="w-4 h-4" />
                 {errorMessage}
              </div>
           )}
           <button 
             disabled={saving}
             onClick={handleSave}
             className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-xs hover:bg-amber-600 shadow-xl shadow-slate-100 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
           >
             {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><Save className="w-4 h-4" /> SIMPAN ASESMEN</>}
           </button>
        </div>
      </header>

      <main className="flex-1 p-12 flex flex-col items-center">
        <div className="w-full max-w-5xl space-y-8">
          <AiQuickNotes 
            onSuggest={handleAiSuggest} 
            onAnalyzing={setIsAnalyzing}
            variant="emerald"
          />
          
          <section className={`bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8 transition-all duration-500 ${highlightActive ? 'ai-highlight' : ''}`}>
            <h3 className="text-sm font-black text-slate-900 tracking-[0.2em] uppercase flex items-center gap-3">
              <div className="w-2 h-8 bg-amber-400 rounded-full"></div>
              I. Anamnesis
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Metode Anamnesis</label>
                <select 
                  className="w-full bg-slate-50 border-2 border-slate-100/50 rounded-2xl py-4 px-4 font-bold text-slate-700 outline-none focus:border-amber-500 transition-all"
                  value={formData.anamnesis}
                  onChange={(e) => setFormData({...formData, anamnesis: e.target.value})}
                >
                  <option value="Autoanamnesis">Autoanamnesis</option>
                  <option value="Alloanamnesis">Alloanamnesis</option>
                </select>
              </div>
              <InputField label="Hubungan" value={formData.hubungan} onChange={(v: string) => setFormData({...formData, hubungan: v})} placeholder="Hubungan dengan pasien..." />
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

          <section className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
            <h3 className="text-sm font-black text-slate-900 tracking-[0.2em] uppercase flex items-center gap-3">
              <div className="w-2 h-8 bg-orange-500 rounded-full"></div>
              II. Status Fisik & Pemeriksaan
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <InputField label="Kesadaran" value={formData.kesadaran} onChange={(v: string) => setFormData({...formData, kesadaran: v})} />
              <InputField label="TD (mmHg)" value={formData.td} onChange={(v: string) => setFormData({...formData, td: v})} />
              <InputField label="Nadi (x/mnt)" value={formData.nadi} onChange={(v: string) => setFormData({...formData, nadi: v})} />
              <InputField label="Suhu (°C)" value={formData.suhu} onChange={(v: string) => setFormData({...formData, suhu: v})} />
              <InputField label="RR (x/mnt)" value={formData.rr} onChange={(v: string) => setFormData({...formData, rr: v})} />
            </div>

            <div className="space-y-6 pt-6 border-t border-slate-50">
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Pemeriksaan Ekstra Oral</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 <SystemicToggle label="Kepala" value={formData.kepala} desc={formData.keterangan_kepala} onChange={(v: string) => setFormData({...formData, kepala: v})} onDescChange={(v: string) => setFormData({...formData, keterangan_kepala: v})} />
                 <SystemicToggle label="Mata" value={formData.mata} desc={formData.keterangan_mata} onChange={(v: string) => setFormData({...formData, mata: v})} onDescChange={(v: string) => setFormData({...formData, keterangan_mata: v})} />
                 <SystemicToggle label="Leher" value={formData.leher} desc={formData.keterangan_leher} onChange={(v: string) => setFormData({...formData, leher: v})} onDescChange={(v: string) => setFormData({...formData, keterangan_leher: v})} />
                 <SystemicToggle label="Kelenjar" value={formData.kelenjar} desc={formData.keterangan_kelenjar} onChange={(v: string) => setFormData({...formData, kelenjar: v})} onDescChange={(v: string) => setFormData({...formData, keterangan_kelenjar: v})} />
                 <SystemicToggle label="Dada" value={formData.dada} desc={formData.keterangan_dada} onChange={(v: string) => setFormData({...formData, dada: v})} onDescChange={(v: string) => setFormData({...formData, keterangan_dada: v})} />
                 <SystemicToggle label="Perut" value={formData.perut} desc={formData.keterangan_perut} onChange={(v: string) => setFormData({...formData, perut: v})} onDescChange={(v: string) => setFormData({...formData, keterangan_perut: v})} />
                 <SystemicToggle label="Ekstremitas" value={formData.ekstremitas} desc={formData.keterangan_ekstremitas} onChange={(v: string) => setFormData({...formData, ekstremitas: v})} onDescChange={(v: string) => setFormData({...formData, keterangan_ekstremitas: v})} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
              <TextAreaField label="Pemeriksaan Wajah" value={formData.wajah} onChange={(v: string) => setFormData({...formData, wajah: v})} />
              <TextAreaField label="Pemeriksaan Intra Oral" value={formData.intra} onChange={(v: string) => setFormData({...formData, intra: v})} />
            </div>
            <TextAreaField label="Gigi Geligi" value={formData.gigigeligi} onChange={(v: string) => setFormData({...formData, gigigeligi: v})} />
          </section>

          <section className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
            <h3 className="text-sm font-black text-slate-900 tracking-[0.2em] uppercase flex items-center gap-3">
              <div className="w-2 h-8 bg-emerald-500 rounded-full"></div>
              III. Diagnosis & Perencanaan
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <TextAreaField label="Lab" value={formData.lab} onChange={(v: string) => setFormData({...formData, lab: v})} />
              <TextAreaField label="Rad" value={formData.rad} onChange={(v: string) => setFormData({...formData, rad: v})} />
              <TextAreaField label="Penunjang Lain" value={formData.penunjang} onChange={(v: string) => setFormData({...formData, penunjang: v})} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <InputField label="Diagnosis 1" value={formData.diagnosis} onChange={(v: string) => setFormData({...formData, diagnosis: v})} />
              <InputField label="Diagnosis 2" value={formData.diagnosis2} onChange={(v: string) => setFormData({...formData, diagnosis2: v})} />
            </div>
            <TextAreaField label="Permasalahan" value={formData.permasalahan} onChange={(v: string) => setFormData({...formData, permasalahan: v})} />
            <TextAreaField label="Terapi" value={formData.terapi} onChange={(v: string) => setFormData({...formData, terapi: v})} />
            <TextAreaField label="Tindakan" value={formData.tindakan} onChange={(v: string) => setFormData({...formData, tindakan: v})} />
            <TextAreaField label="Edukasi" value={formData.edukasi} onChange={(v: string) => setFormData({...formData, edukasi: v})} />
          </section>

          <div className="flex justify-end gap-4 pb-12">
             <button onClick={() => router.back()} className="px-8 py-4 text-slate-400 font-bold hover:text-slate-900 transition-colors">Batal</button>
             <button 
               disabled={saving}
               onClick={handleSave}
               className="bg-amber-600 text-white px-12 py-4 rounded-3xl font-black text-sm hover:bg-amber-700 transition-all shadow-2xl shadow-amber-100 active:scale-95 disabled:opacity-50 flex items-center gap-3"
             >
               {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Save className="w-5 h-5" />}
               SIMPAN ASESMEN BEDAH MULUT
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
        className="w-full bg-slate-50 border-2 border-slate-100/50 rounded-2xl py-4 px-6 font-bold text-slate-700 outline-none focus:border-amber-500 transition-all placeholder:text-slate-300"
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
        className="w-full h-32 bg-slate-50 border-2 border-slate-100/50 rounded-[2rem] p-6 font-medium text-slate-700 outline-none focus:border-amber-500 transition-all placeholder:text-slate-200 resize-none"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  )
}

function SystemicToggle({ label, value, desc, onChange, onDescChange }: any) {
  return (
    <div className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider">{label}</label>
        <div className="flex gap-1.5">
          {['Tidak', 'Ya'].map((s) => (
            <button
              key={s}
              onClick={() => onChange(s)}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-black transition-all ${
                value === s ? 'bg-amber-600 text-white shadow-md' : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      <input 
        type="text"
        placeholder={`Keterangan ${label}...`}
        className="w-full bg-white border border-slate-100 rounded-xl py-2 px-4 text-xs font-bold text-slate-600 placeholder:text-slate-200 outline-none focus:border-amber-300"
        value={desc || ''}
        onChange={(e) => onDescChange(e.target.value)}
      />
    </div>
  )
}
