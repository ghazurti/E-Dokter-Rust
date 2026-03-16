"use client"

import { useEffect, useState, use } from 'react'
import { 
  ArrowLeft, 
  Save, 
  Activity, 
  CheckCircle2, 
  AlertCircle,
  Stethoscope,
  Phone,
  DoorOpen,
  LogOut
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { AiQuickNotes } from '@/components/pemeriksaan/ai/AiQuickNotes'

export default function AsesmenGDPsikiatriPage({ params }: { params: Promise<{ no_rawat: string }> }) {
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
    gejala_menyertai: '',
    faktor_pencetus: '',
    riwayat_penyakit_dahulu: 'Tidak Ada',
    keterangan_riwayat_penyakit_dahulu: '',
    riwayat_kehamilan: '',
    riwayat_sosial: 'Bergaul',
    keterangan_riwayat_sosial: '',
    riwayat_pekerjaan: 'Bekerja',
    keterangan_riwayat_pekerjaan: '',
    riwayat_obat_diminum: '',
    faktor_kepribadian_premorbid: '',
    faktor_keturunan: 'Tidak Ada',
    keterangan_faktor_keturunan: '',
    faktor_organik: 'Tidak Ada',
    keterangan_faktor_organik: '',
    riwayat_alergi: '',
    fisik_kesadaran: 'Compos Mentis',
    fisik_td: '',
    fisik_rr: '',
    fisik_suhu: '',
    fisik_nyeri: 'Tidak Nyeri',
    fisik_nadi: '',
    fisik_bb: '',
    fisik_tb: '',
    fisik_status_nutrisi: '',
    fisik_gcs: '',
    status_kelainan_kepala: 'Normal',
    keterangan_status_kelainan_kepala: '',
    status_kelainan_leher: 'Normal',
    keterangan_status_kelainan_leher: '',
    status_kelainan_dada: 'Normal',
    keterangan_status_kelainan_dada: '',
    status_kelainan_perut: 'Normal',
    keterangan_status_kelainan_perut: '',
    status_kelainan_anggota_gerak: 'Normal',
    keterangan_status_kelainan_anggota_gerak: '',
    status_lokalisata: '',
    psikiatrik_kesan_umum: '',
    psikiatrik_sikap_prilaku: '',
    psikiatrik_kesadaran: '',
    psikiatrik_orientasi: '',
    psikiatrik_daya_ingat: '',
    psikiatrik_persepsi: '',
    psikiatrik_pikiran: '',
    psikiatrik_insight: '',
    laborat: '',
    radiologi: '',
    ekg: '',
    diagnosis: '',
    permasalahan: '',
    instruksi_medis: '',
    rencana_target: '',
    pulang_dipulangkan: '-',
    keterangan_pulang_dipulangkan: '',
    pulang_dirawat_diruang: '',
    pulang_indikasi_ranap: '',
    pulang_dirujuk_ke: '',
    pulang_alasan_dirujuk: '-',
    pulang_paksa: '-',
    keterangan_pulang_paksa: '',
    pulang_meninggal_igd: '-',
    pulang_penyebab_kematian: '',
    fisik_pulang_kesadaran: 'Compos Mentis',
    fisik_pulang_td: '',
    fisik_pulang_nadi: '',
    fisik_pulang_gcs: '',
    fisik_pulang_suhu: '',
    fisik_pulang_rr: '',
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
        const assessmentRes = await fetch(`${serviceUrl}/penilaian-medis-gd-psikiatri/${resolvedParams.no_rawat}`)
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
                fisik_suhu: nurseData.suhu_tubuh || prev.fisik_suhu,
                fisik_td: nurseData.tensi || prev.fisik_td,
                fisik_nadi: nurseData.nadi || prev.fisik_nadi,
                fisik_rr: nurseData.respirasi || prev.fisik_rr,
                fisik_bb: nurseData.berat || prev.fisik_bb,
                fisik_tb: nurseData.tinggi || prev.fisik_tb,
                fisik_gcs: nurseData.gcs || prev.fisik_gcs,
                keluhan_utama: nurseData.keluhan || prev.keluhan_utama,
                riwayat_alergi: nurseData.alergi || prev.riwayat_alergi,
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
      status_lokalisata: data.objective || prev.status_lokalisata,
      diagnosis: data.assessment || prev.diagnosis,
      instruksi_medis: data.plan || prev.instruksi_medis,
      // Vital Signs (using fisik_ prefix)
      fisik_td: data.td != null ? String(data.td) : prev.fisik_td,
      fisik_suhu: data.suhu != null ? String(data.suhu) : prev.fisik_suhu,
      fisik_nadi: data.nadi != null ? String(data.nadi) : prev.fisik_nadi,
      fisik_rr: data.rr != null ? String(data.rr) : prev.fisik_rr,
      fisik_bb: data.bb != null ? String(data.bb) : prev.fisik_bb,
      fisik_tb: data.tb != null ? String(data.tb) : prev.fisik_tb,
      fisik_gcs: data.gcs != null ? String(data.gcs) : prev.fisik_gcs,
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
      const res = await fetch(`${serviceUrl}/penilaian-medis-gd-psikiatri/save/${resolvedParams.no_rawat}`, {
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
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="font-bold text-slate-500 animate-pulse uppercase tracking-widest text-xs">Memuat Data Asesmen IGD Psikiatri...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col">
      <header className="bg-white/80 backdrop-blur-xl border-b border-indigo-50 px-8 py-6 sticky top-0 z-30 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-6">
          <button onClick={() => router.back()} className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all group">
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </button>
          <div className="flex items-center gap-4">
             <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-[1.2rem] flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                <Activity className="w-7 h-7" />
             </div>
             <div>
                <div className="flex items-center gap-3">
                   <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">ASESMEN GD PSIKIATRI</h1>
                   <span className="bg-rose-600 text-white px-3 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase">EMERGENCY</span>
                </div>
                <p className="text-[11px] font-bold text-slate-400 flex items-center gap-3 mt-1 uppercase">
                   <span className="text-slate-900">{patient?.nm_pasien}</span>
                   <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                   <span>RM: {patient?.no_rkm_medis}</span>
                   <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                   <span className="text-indigo-600 font-extrabold">{noRawatJoined}</span>
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
             className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-xs hover:bg-indigo-600 shadow-xl shadow-slate-100 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
           >
             {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><Save className="w-4 h-4" /> SIMPAN ASESMEN</>}
           </button>
        </div>
      </header>

      <main className="flex-1 p-12 flex flex-col items-center">
        <div className="w-full max-w-6xl space-y-8">
          <AiQuickNotes 
            onSuggest={handleAiSuggest} 
            onAnalyzing={setIsAnalyzing}
            variant="indigo"
          />
          
          <section className={`bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8 transition-all duration-500 ${highlightActive ? 'ai-highlight' : ''}`}>
            <h3 className="text-sm font-black text-slate-900 tracking-[0.2em] uppercase flex items-center gap-3">
              <div className="w-2 h-8 bg-indigo-400 rounded-full"></div>
              I. Anamnesis Gawat Darurat
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Metode Anamnesis</label>
                <select 
                  className="w-full bg-slate-50 border-2 border-slate-100/50 rounded-2xl py-4 px-4 font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all"
                  value={formData.anamnesis}
                  onChange={(e) => setFormData({...formData, anamnesis: e.target.value})}
                >
                  <option value="Autoanamnesis">Autoanamnesis</option>
                  <option value="Alloanamnesis">Alloanamnesis</option>
                </select>
              </div>
              <InputField label="Hubungan / Pembawa" value={formData.hubungan} onChange={(v: string) => setFormData({...formData, hubungan: v})} placeholder="Hubungan dengan pasien..." />
            </div>

            <TextAreaField label="Keluhan Utama" value={formData.keluhan_utama} onChange={(v: string) => setFormData({...formData, keluhan_utama: v})} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <TextAreaField label="Gejala Menyertai" value={formData.gejala_menyertai} onChange={(v: string) => setFormData({...formData, gejala_menyertai: v})} />
              <TextAreaField label="Faktor Pencetus" value={formData.faktor_pencetus} onChange={(v: string) => setFormData({...formData, faktor_pencetus: v})} />
            </div>

            <div className="pt-6 border-t border-slate-50 space-y-6">
               <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Riwayat Psikiatrik</p>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <SelectToggleWithDesc label="Riwayat Penyakit Dahulu" value={formData.riwayat_penyakit_dahulu} desc={formData.keterangan_riwayat_penyakit_dahulu} options={['Tidak Ada', 'Ada']} onChange={(v: string) => setFormData({...formData, riwayat_penyakit_dahulu: v})} onDescChange={(v: string) => setFormData({...formData, keterangan_riwayat_penyakit_dahulu: v})} />
                  <SelectToggleWithDesc label="Faktor Keturunan" value={formData.faktor_keturunan} desc={formData.keterangan_faktor_keturunan} options={['Tidak Ada', 'Ada']} onChange={(v: string) => setFormData({...formData, faktor_keturunan: v})} onDescChange={(v: string) => setFormData({...formData, keterangan_faktor_keturunan: v})} />
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                  <SelectToggleWithDesc label="Riwayat Sosial" value={formData.riwayat_sosial} desc={formData.keterangan_riwayat_sosial} options={['Bergaul', 'Tidak Bergaul', 'Lain-lain']} onChange={(v: string) => setFormData({...formData, riwayat_sosial: v})} onDescChange={(v: string) => setFormData({...formData, keterangan_riwayat_sosial: v})} />
                  <SelectToggleWithDesc label="Riwayat Pekerjaan" value={formData.riwayat_pekerjaan} desc={formData.keterangan_riwayat_pekerjaan} options={['Bekerja', 'Tidak Bekerja', 'Ganti-gantian Pekerjaan']} onChange={(v: string) => setFormData({...formData, riwayat_pekerjaan: v})} onDescChange={(v: string) => setFormData({...formData, keterangan_riwayat_pekerjaan: v})} />
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                  <TextAreaField label="Riwayat Kehamilan / Tumbuh Kembang" value={formData.riwayat_kehamilan} onChange={(v: string) => setFormData({...formData, riwayat_kehamilan: v})} />
                  <TextAreaField label="Riwayat Obat Diminum" value={formData.riwayat_obat_diminum} onChange={(v: string) => setFormData({...formData, riwayat_obat_diminum: v})} />
               </div>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-6">
                  <InputField label="Faktor Kepribadian Premorbid" value={formData.faktor_kepribadian_premorbid} onChange={(v: string) => setFormData({...formData, faktor_kepribadian_premorbid: v})} />
                  <SelectToggleWithDesc label="Faktor Organik" value={formData.faktor_organik} desc={formData.keterangan_faktor_organik} options={['Tidak Ada', 'Ada']} onChange={(v: string) => setFormData({...formData, faktor_organik: v})} onDescChange={(v: string) => setFormData({...formData, keterangan_faktor_organik: v})} />
                  <InputField label="Riwayat Alergi" value={formData.riwayat_alergi} onChange={(v: string) => setFormData({...formData, riwayat_alergi: v})} />
               </div>
            </div>
          </section>

          <section className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
            <h3 className="text-sm font-black text-slate-900 tracking-[0.2em] uppercase flex items-center gap-3">
              <div className="w-2 h-8 bg-indigo-600 rounded-full"></div>
              II. Status Fisik & Pemeriksaan Psikiatrik
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              <SelectField label="Kesadaran" value={formData.fisik_kesadaran} options={['Compos Mentis', 'Apatis', 'Somnolen', 'Sopor', 'Koma']} onChange={(v: string) => setFormData({...formData, fisik_kesadaran: v})} />
              <InputField label="TD (mmHg)" value={formData.fisik_td} onChange={(v: string) => setFormData({...formData, fisik_td: v})} />
              <InputField label="Nadi (x/mnt)" value={formData.fisik_nadi} onChange={(v: string) => setFormData({...formData, fisik_nadi: v})} />
              <InputField label="Suhu (°C)" value={formData.fisik_suhu} onChange={(v: string) => setFormData({...formData, fisik_suhu: v})} />
               <InputField label="RR (x/mnt)" value={formData.fisik_rr} onChange={(v: string) => setFormData({...formData, fisik_rr: v})} />
              <InputField label="BB (Kg)" value={formData.fisik_bb} onChange={(v: string) => setFormData({...formData, fisik_bb: v})} />
              <InputField label="TB (Cm)" value={formData.fisik_tb} onChange={(v: string) => setFormData({...formData, fisik_tb: v})} />
              <SelectField label="Nyeri" value={formData.fisik_nyeri} options={['Tidak Nyeri', 'Nyeri Ringan', 'Nyeri Sedang', 'Nyeri Berat', 'Nyeri Sangat Berat', 'Nyeri Tak Tertahankan']} onChange={(v: string) => setFormData({...formData, fisik_nyeri: v})} />
              <InputField label="GCS" value={formData.fisik_gcs} onChange={(v: string) => setFormData({...formData, fisik_gcs: v})} />
               <InputField label="Status Nutrisi" value={formData.fisik_status_nutrisi} onChange={(v: string) => setFormData({...formData, fisik_status_nutrisi: v})} />
            </div>

            <div className="pt-6 border-t border-slate-50 space-y-6">
               <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Pemeriksaan Sistemik</p>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                  <SystemicToggleWithDesc label="Kepala" value={formData.status_kelainan_kepala} desc={formData.keterangan_status_kelainan_kepala} onChange={(v: string) => setFormData({...formData, status_kelainan_kepala: v})} onDescChange={(v: string) => setFormData({...formData, keterangan_status_kelainan_kepala: v})} />
                  <SystemicToggleWithDesc label="Leher" value={formData.status_kelainan_leher} desc={formData.keterangan_status_kelainan_leher} onChange={(v: string) => setFormData({...formData, status_kelainan_leher: v})} onDescChange={(v: string) => setFormData({...formData, keterangan_status_kelainan_leher: v})} />
                  <SystemicToggleWithDesc label="Dada" value={formData.status_kelainan_dada} desc={formData.keterangan_status_kelainan_dada} onChange={(v: string) => setFormData({...formData, status_kelainan_dada: v})} onDescChange={(v: string) => setFormData({...formData, keterangan_status_kelainan_dada: v})} />
                  <SystemicToggleWithDesc label="Perut" value={formData.status_kelainan_perut} desc={formData.keterangan_status_kelainan_perut} onChange={(v: string) => setFormData({...formData, status_kelainan_perut: v})} onDescChange={(v: string) => setFormData({...formData, keterangan_status_kelainan_perut: v})} />
                  <SystemicToggleWithDesc label="Gerak" value={formData.status_kelainan_anggota_gerak} desc={formData.keterangan_status_kelainan_anggota_gerak} onChange={(v: string) => setFormData({...formData, status_kelainan_anggota_gerak: v})} onDescChange={(v: string) => setFormData({...formData, keterangan_status_kelainan_anggota_gerak: v})} />
               </div>
               <TextAreaField label="Status Lokalisata" value={formData.status_lokalisata} onChange={(v: string) => setFormData({...formData, status_lokalisata: v})} />
            </div>

            <div className="pt-6 border-t border-slate-50 space-y-6">
               <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest underline decoration-indigo-200 underline-offset-8">Status Mental Psikiatrik</p>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <InputField label="Kesan Umum" value={formData.psikiatrik_kesan_umum} onChange={(v: string) => setFormData({...formData, psikiatrik_kesan_umum: v})} />
                  <InputField label="Sikap & Perilaku" value={formData.psikiatrik_sikap_prilaku} onChange={(v: string) => setFormData({...formData, psikiatrik_sikap_prilaku: v})} />
                  <InputField label="Kesadaran Mental" value={formData.psikiatrik_kesadaran} onChange={(v: string) => setFormData({...formData, psikiatrik_kesadaran: v})} />
                  <InputField label="Orientasi" value={formData.psikiatrik_orientasi} onChange={(v: string) => setFormData({...formData, psikiatrik_orientasi: v})} />
                  <InputField label="Daya Ingat" value={formData.psikiatrik_daya_ingat} onChange={(v: string) => setFormData({...formData, psikiatrik_daya_ingat: v})} />
                  <InputField label="Persepsi" value={formData.psikiatrik_persepsi} onChange={(v: string) => setFormData({...formData, psikiatrik_persepsi: v})} />
                  <InputField label="Pikiran" value={formData.psikiatrik_pikiran} onChange={(v: string) => setFormData({...formData, psikiatrik_pikiran: v})} />
                  <InputField label="Insight / Tilikan" value={formData.psikiatrik_insight} onChange={(v: string) => setFormData({...formData, psikiatrik_insight: v})} />
               </div>
            </div>
          </section>

          <section className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
            <h3 className="text-sm font-black text-slate-900 tracking-[0.2em] uppercase flex items-center gap-3">
              <div className="w-2 h-8 bg-emerald-500 rounded-full"></div>
              III. Pemeriksaan Penunjang & Diagnosis
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <TextAreaField label="Laboratorium" value={formData.laborat} onChange={(v: string) => setFormData({...formData, laborat: v})} />
              <TextAreaField label="Radiologi" value={formData.radiologi} onChange={(v: string) => setFormData({...formData, radiologi: v})} />
              <TextAreaField label="EKG" value={formData.ekg} onChange={(v: string) => setFormData({...formData, ekg: v})} />
            </div>
            <TextAreaField label="Diagnosis / Kesimpulan" value={formData.diagnosis} onChange={(v: string) => setFormData({...formData, diagnosis: v})} />
            <TextAreaField label="Permasalahan" value={formData.permasalahan} onChange={(v: string) => setFormData({...formData, permasalahan: v})} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <TextAreaField label="Instruksi Medis" value={formData.instruksi_medis} onChange={(v: string) => setFormData({...formData, instruksi_medis: v})} />
               <TextAreaField label="Rencana & Target" value={formData.rencana_target} onChange={(v: string) => setFormData({...formData, rencana_target: v})} />
            </div>
            <TextAreaField label="Edukasi Pasien/Keluarga" value={formData.edukasi} onChange={(v: string) => setFormData({...formData, edukasi: v})} />
          </section>

          <section className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8 border-l-8 border-l-rose-500">
            <h3 className="text-sm font-black text-rose-600 tracking-[0.2em] uppercase flex items-center gap-3">
              <LogOut className="w-6 h-6" />
              IV. Rencana Pemulangan IGD
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               <SelectToggleWithDesc label="Keputusan" value={formData.pulang_dipulangkan} desc={formData.keterangan_pulang_dipulangkan} options={['-', 'Tidak Perlu Kontrol', 'Kontrol/Berobat Jalan', 'Rawat Inap']} onChange={(v: string) => setFormData({...formData, pulang_dipulangkan: v})} onDescChange={(v: string) => setFormData({...formData, keterangan_pulang_dipulangkan: v})} />
               <InputField label="Rawat di Ruangan" value={formData.pulang_dirawat_diruang} onChange={(v: string) => setFormData({...formData, pulang_dirawat_diruang: v})} />
               <InputField label="Indikasi Rawat Inap" value={formData.pulang_indikasi_ranap} onChange={(v: string) => setFormData({...formData, pulang_indikasi_ranap: v})} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
               <InputField label="Dirujuk ke" value={formData.pulang_dirujuk_ke} onChange={(v: string) => setFormData({...formData, pulang_dirujuk_ke: v})} />
               <SelectField label="Alasan Rujuk" value={formData.pulang_alasan_dirujuk} options={['-', 'Tempat Penuh', 'Perlu Fasilitas Lebih', 'Permintaan Pasien/Keluarga']} onChange={(v: string) => setFormData({...formData, pulang_alasan_dirujuk: v})} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
               <SelectToggleWithDesc label="Pulang Paksa" value={formData.pulang_paksa} desc={formData.keterangan_pulang_paksa} options={['-', 'Masalah Biaya', 'Kondisi Pasien', 'Masalah Lokasi Rumah', 'Lain-lain']} onChange={(v: string) => setFormData({...formData, pulang_paksa: v})} onDescChange={(v: string) => setFormData({...formData, keterangan_pulang_paksa: v})} />
               <SelectToggleWithDesc label="Meninggal di IGD" value={formData.pulang_meninggal_igd} desc={formData.pulang_penyebab_kematian} options={['-', '<= 2 Jam', '> 2 Jam']} onChange={(v: string) => setFormData({...formData, pulang_meninggal_igd: v})} onDescChange={(v: string) => setFormData({...formData, pulang_penyebab_kematian: v})} />
            </div>

            <div className="pt-6 border-t border-slate-50 space-y-6">
               <p className="text-[11px] font-black text-rose-400 uppercase tracking-widest">Status Fisik Saat Keluar IGD</p>
               <div className="grid grid-cols-2 md:grid-cols-6 gap-6">
                  <SelectField label="Kesadaran" value={formData.fisik_pulang_kesadaran} options={['Compos Mentis', 'Apatis', 'Somnolen', 'Sopor', 'Koma']} onChange={(v: string) => setFormData({...formData, fisik_pulang_kesadaran: v})} />
                  <InputField label="TD" value={formData.fisik_pulang_td} onChange={(v: string) => setFormData({...formData, fisik_pulang_td: v})} />
                  <InputField label="Nadi" value={formData.fisik_pulang_nadi} onChange={(v: string) => setFormData({...formData, fisik_pulang_nadi: v})} />
                  <InputField label="GCS" value={formData.fisik_pulang_gcs} onChange={(v: string) => setFormData({...formData, fisik_pulang_gcs: v})} />
                  <InputField label="Suhu" value={formData.fisik_pulang_suhu} onChange={(v: string) => setFormData({...formData, fisik_pulang_suhu: v})} />
                  <InputField label="RR" value={formData.fisik_pulang_rr} onChange={(v: string) => setFormData({...formData, fisik_pulang_rr: v})} />
               </div>
            </div>
          </section>

          <div className="flex justify-end gap-4 pb-12">
             <button onClick={() => router.back()} className="px-8 py-4 text-slate-400 font-bold hover:text-slate-900 transition-colors">Batal</button>
             <button 
               disabled={saving}
               onClick={handleSave}
               className="bg-slate-900 text-white px-12 py-4 rounded-3xl font-black text-sm hover:bg-indigo-600 transition-all shadow-2xl shadow-indigo-100 active:scale-95 disabled:opacity-50 flex items-center gap-3"
             >
               {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><Activity className="w-5 h-5" /> SIMPAN ASESMEN GD PSIKIATRI</>}
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
        className="w-full bg-slate-50 border-2 border-slate-100/50 rounded-2xl py-4 px-6 font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all placeholder:text-slate-300"
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
        className="w-full h-32 bg-slate-50 border-2 border-slate-100/50 rounded-[2rem] p-6 font-medium text-slate-700 outline-none focus:border-indigo-500 transition-all placeholder:text-slate-200 resize-none"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  )
}

function SelectField({ label, value, options, onChange }: any) {
  return (
    <div className="space-y-3">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{label}</label>
      <select 
        className="w-full bg-slate-50 border-2 border-slate-100/50 rounded-2xl py-4 px-4 font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((opt: string) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  )
}

function SelectToggleWithDesc({ label, value, desc, options, onChange, onDescChange }: any) {
  return (
    <div className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider">{label}</label>
        <div className="flex gap-1.5">
          {options.map((s: string) => (
            <button
              key={s}
              onClick={() => onChange(s)}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-black transition-all ${
                value === s ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50'
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
        className="w-full bg-white border border-slate-100 rounded-xl py-2 px-4 text-xs font-bold text-slate-600 placeholder:text-slate-200 outline-none focus:border-indigo-300"
        value={desc || ''}
        onChange={(e) => onDescChange(e.target.value)}
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
                value === s ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50'
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
        className="w-full bg-white border border-slate-100 rounded-xl py-2 px-4 text-xs font-bold text-slate-600 placeholder:text-slate-200 outline-none focus:border-indigo-300"
        value={desc || ''}
        onChange={(e) => onDescChange(e.target.value)}
      />
    </div>
  )
}
