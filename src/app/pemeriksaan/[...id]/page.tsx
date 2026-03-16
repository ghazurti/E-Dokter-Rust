"use client"

import { useEffect, useState } from 'react'
import * as React from 'react'
import { 
  ClipboardList, 
  Activity, 
  Stethoscope, 
  Pill, 
  FlaskConical, 
  Radiation, 
  FileText,
  Save,
  ArrowLeft,
  User,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'
import { SoapTab } from '@/components/pemeriksaan/tabs/SoapTab'
import { IcdTab } from '@/components/pemeriksaan/tabs/IcdTab'
import { PrescriptionTab } from '@/components/pemeriksaan/tabs/PrescriptionTab'
import { LabTab } from '@/components/pemeriksaan/tabs/LabTab'
import { RadiologiTab } from '@/components/pemeriksaan/tabs/RadiologiTab'
import HasilLabTab from '@/components/pemeriksaan/tabs/HasilLabTab'
import HasilRadTab from '@/components/pemeriksaan/tabs/HasilRadTab'
import ResumeTab from '@/components/pemeriksaan/tabs/ResumeTab'
import { IcareButton } from '@/components/pemeriksaan/IcareButton'
import { AiQuickNotes } from '@/components/pemeriksaan/ai/AiQuickNotes'

import { saveSoapAction, savePrescriptionFullAction, saveLabRequestAction, saveRadiologyRequestAction } from '@/app/pasien-rawat-jalan/actions'

const initialFormData = {
  // Field Pemeriksaan Fisik / SOAP
  keluhan: '',
  pemeriksaan: '',
  alergi: '',
  suhu: '',
  tensi: '120/80',
  nadi: '80',
  respirasi: '20',
  spo2: '',
  berat: '',
  tinggi: '',
  lingkar_perut: '',
  lingkar_kepala: '',
  lingkar_dada: '',
  gcs: '15',
  kesadaran: 'Compos Mentis',
  penilaian: '',
  tindak_lanjut: '',
  instruksi: '',
  evaluasi: '',

  // Field Baru Sesuai Struktur Tabel Database Anda
  keluhan_utama: '',
  jalannya_penyakit: '',
  pemeriksaan_penunjang: '',
  hasil_laborat: '',
  diagnosa_utama: '',
  kd_diagnosa_utama: '',
  diagnosa_sekunder: '',
  kd_diagnosa_sekunder: '',
  diagnosa_sekunder2: '',
  kd_diagnosa_sekunder2: '',
  diagnosa_sekunder3: '',
  kd_diagnosa_sekunder3: '',
  diagnosa_sekunder4: '',
  kd_diagnosa_sekunder4: '',
  prosedur_utama: '',
  kd_prosedur_utama: '',
  prosedur_sekunder: '',
  kd_prosedur_sekunder: '',
  prosedur_sekunder2: '',
  kd_prosedur_sekunder2: '',
  prosedur_sekunder3: '',
  kd_prosedur_sekunder3: '',
  kondisi_pulang: 'Hidup',
  obat_pulang: '',
};

export default function PemeriksaanPage({ params }: { params: any }) {
  const [resolvedParams, setResolvedParams] = useState<{ id: string[] } | null>(null)

  useEffect(() => {
    if (params instanceof Promise) {
      params.then(setResolvedParams)
    } else {
      setResolvedParams(params)
    }
  }, [params])

  const noRawatJoined = (resolvedParams?.id?.join('/') || '').replace(/-/g, '/')
  
  const [patient, setPatient] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [activeTab, setActiveTab] = useState('SOAP')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [highlightActive, setHighlightActive] = useState(false)

  // Lifted State
  const [formData, setFormData] = useState(initialFormData)

  // Lab & Radiologi States (New)
  const [selectedLabTests, setSelectedLabTests] = useState<any[]>([])
  const [labNotes, setLabNotes] = useState({ diagnosa: '', informasi: '' })
  const [selectedRadTests, setSelectedRadTests] = useState<any[]>([])
  const [radNotes, setRadNotes] = useState({ diagnosa: '', informasi: '' })

  // Prescription State
  const [standardMeds, setStandardMeds] = useState<any[]>([])
  const [compoundedMeds, setCompoundedMeds] = useState<any[]>([])

  useEffect(() => {
    async function fetchDetail() {
      if (!noRawatJoined) return
      try {
        const serviceUrl = process.env.NEXT_PUBLIC_RUST_SERVICE_URL || 'http://localhost:3001'
        const res = await fetch(`${serviceUrl}/registration?no_rawat=${encodeURIComponent(noRawatJoined)}`)
        if (!res.ok) throw new Error('Gagal mengambil data pasien')
        const data = await res.json()
        setPatient(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchDetail()
  }, [noRawatJoined])

  useEffect(() => {
    async function fetchResume() {
      if (!noRawatJoined) return
      try {
        const serviceUrl = process.env.NEXT_PUBLIC_RUST_SERVICE_URL || 'http://localhost:3001'
        const res = await fetch(`${serviceUrl}/resume-ralan/${noRawatJoined.replace(/\//g, '-')}`)
        if (res.ok) {
          const data = await res.json()
          if (data) {
            setFormData(prev => ({
              ...prev,
              keluhan_utama: data.keluhan_utama || prev.keluhan_utama,
              jalannya_penyakit: data.jalannya_penyakit || prev.jalannya_penyakit,
              pemeriksaan_penunjang: data.pemeriksaan_penunjang || prev.pemeriksaan_penunjang,
              hasil_laborat: data.hasil_laborat || prev.hasil_laborat,
              diagnosa_utama: data.diagnosa_utama || prev.diagnosa_utama,
              kd_diagnosa_utama: data.kd_diagnosa_utama || prev.kd_diagnosa_utama,
              diagnosa_sekunder: data.diagnosa_sekunder || prev.diagnosa_sekunder,
              kd_diagnosa_sekunder: data.kd_diagnosa_sekunder || prev.kd_diagnosa_sekunder,
              prosedur_utama: data.prosedur_utama || prev.prosedur_utama,
              kd_prosedur_utama: data.kd_prosedur_utama || prev.kd_prosedur_utama,
              kondisi_pulang: data.kondisi_pulang || prev.kondisi_pulang,
              obat_pulang: data.obat_pulang || prev.obat_pulang,
            }))
          }
        }
      } catch (err) {
        console.error("Gagal memuat resume:", err)
      }
    }
    fetchResume()
  }, [noRawatJoined])

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleAiSuggest = (data: any) => {
    setFormData((prev: any) => ({
      ...prev,
      keluhan: data.subjective || prev.keluhan,
      pemeriksaan: data.objective || prev.pemeriksaan,
      penilaian: data.assessment || prev.penilaian,
      tindak_lanjut: data.plan || prev.tindak_lanjut,
      // Vital Signs
      tensi: data.td != null ? String(data.td) : prev.tensi,
      suhu: data.suhu != null ? String(data.suhu) : prev.suhu,
      nadi: data.nadi != null ? String(data.nadi) : prev.nadi,
      respirasi: data.rr != null ? String(data.rr) : prev.respirasi,
      berat: data.bb != null ? String(data.bb) : prev.berat,
      gcs: data.gcs != null ? String(data.gcs) : prev.gcs,
      spo2: data.spo2 != null ? String(data.spo2) : prev.spo2,
    }))
    
    setSaveStatus('success')
    setHighlightActive(true)
    setTimeout(() => setHighlightActive(false), 2000)
    setTimeout(() => setSaveStatus('idle'), 3000)
  }

  const handleSaveSoap = async (data: any) => {
    setSaving(true)
    try {
      const result = await saveSoapAction(noRawatJoined, { ...data, nip: patient?.kd_dokter })
      if (!result.success) throw new Error(result.error || 'Gagal menyimpan SOAP')
      setFormData(initialFormData)
      setSaveStatus('success')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (err: any) {
      setErrorMessage(err.message)
      setSaveStatus('error')
    } finally {
      setSaving(false)
    }
  }

  const handleSavePrescription = async () => {
    setSaving(true)
    try {
      const result = await savePrescriptionFullAction(
        noRawatJoined,
        patient.kd_dokter || "D0001",
        "ralan",
        standardMeds,
        compoundedMeds
      )
      if (!result.success) throw new Error(result.error || 'Gagal menyimpan Resep')
      setSaveStatus('success')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (err: any) {
      setErrorMessage(err.message)
      setSaveStatus('error')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveLab = async () => {
    setSaving(true)
    try {
      const labResult = await saveLabRequestAction({
        no_rawat: noRawatJoined,
        tests: selectedLabTests.map(t => ({
          kd_jenis_prw: t.kd_jenis_prw,
          id_templates: t.selectedTemplateIds || []
        })),
        dokter_perujuk: patient.kd_dokter || "D0001",
        diagnosa_klinis: labNotes.diagnosa,
        informasi_tambahan: labNotes.informasi
      })
      if (!labResult.success && typeof labResult === 'object' && 'error' in labResult) {
         throw new Error(labResult.error || 'Gagal mengirim permintaan Lab')
      }
      setSaveStatus('success')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (err: any) {
      setErrorMessage(err.message)
      setSaveStatus('error')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveRadiology = async () => {
    setSaving(true)
    try {
      const radResult = await saveRadiologyRequestAction({
        no_rawat: noRawatJoined,
        tests: selectedRadTests.map(t => ({
          kd_jenis_prw: t.kd_jenis_prw
        })),
        dokter_perujuk: patient.kd_dokter || "D0001",
        diagnosa_klinis: radNotes.diagnosa,
        informasi_tambahan: radNotes.informasi
      })
      if (radResult && !radResult.success) {
          throw new Error(radResult.error || 'Gagal mengirim permintaan Radiologi')
      }
      setSaveStatus('success')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (err: any) {
      setErrorMessage(err.message)
      setSaveStatus('error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="font-bold text-slate-500 animate-pulse uppercase tracking-widest text-xs">Memuat Data Pasien...</p>
        </div>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 p-6">
        <div className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-2xl text-center max-w-lg">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Activity className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-2">Registrasi Tidak Ditemukan</h1>
          <p className="text-slate-500 mb-8">Data dengan No. Rawat <span className="font-bold text-slate-900">{noRawatJoined}</span> tidak tersedia di sistem.</p>
          <Link href="/pasien-rawat-jalan" className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Antrian
          </Link>
        </div>
      </div>
    )
  }

  const birthDate = patient.tgl_lahir ? new Date(patient.tgl_lahir) : null
  let ageStr = "Umur tidak diketahui"
  if (birthDate) {
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--
    ageStr = `${age} Tahun`
  }

  const tabs = [
    { id: 'SOAP', label: 'S.O.A.P', icon: Stethoscope, saveLabel: "Simpan S.O.A.P" },
    { id: 'DIAGNOSA', label: 'Diagnosa (ICD-10)', icon: ClipboardList, saveLabel: "Simpan Diagnosa" },
    { id: 'RESEP', label: 'E-Resep Obat', icon: Pill, saveLabel: "Simpan E-Resep" },
    { id: 'LAB', label: 'Permintaan Lab', icon: FlaskConical, saveLabel: "Kirim Permintaan Lab" },
    { id: 'HASIL_LAB', label: 'Hasil Lab', icon: Activity, saveLabel: "Tinjau Hasil Lab" },
    { id: 'RADIOLOGI', label: 'Radiologi', icon: Radiation, saveLabel: "Kirim Permintaan Radiologi" },
    { id: 'HASIL_RAD', label: 'Hasil Rad', icon: Activity, saveLabel: "Tinjau Hasil Rad" },
    { id: 'RESUME', label: 'Resume Medis', icon: FileText, saveLabel: "Selesai Tinjauan" },
  ]

  const activeTabInfo = tabs.find(t => t.id === activeTab) || tabs[0]
  const ActiveIcon = activeTabInfo.icon

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col">
      {/* Premium Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-100 px-8 py-6 sticky top-0 z-30 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-6">
          <Link href="/pasien-rawat-jalan" className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all group">
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </Link>
          <div className="flex items-center gap-4">
             <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[1.2rem] flex items-center justify-center text-white shadow-lg shadow-emerald-100">
                <User className="w-7 h-7" />
             </div>
             <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">{patient.nm_pasien}</h1>
                  <span className="bg-slate-900 text-white px-3 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase">RM: {patient.no_rkm_medis}</span>
                </div>
                <p className="text-[11px] font-bold text-slate-400 flex items-center gap-3 mt-1 uppercase">
                   <span>{patient.jk === 'L' ? 'Laki-laki' : 'Perempuan'}</span>
                   <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                   <span>{ageStr}</span>
                   <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                   <span className="text-emerald-600 font-extrabold">{patient.nm_poli}</span>
                </p>
             </div>
          </div>
          
          <div className="ml-4 border-l border-slate-100 pl-6 hidden md:block">
             <IcareButton 
                nik_atau_kartu={patient.no_peserta || patient.no_ktp || ""} 
                kode_dokter={patient.kd_dokter || ""} 
             />
          </div>
        </div>

        <div className="flex items-center gap-3">
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Vertical Sidebar Tabs */}
        <aside className="w-80 bg-white border-r border-slate-100 p-8 flex flex-col gap-2 overflow-y-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-4 px-6 py-5 rounded-[1.5rem] transition-all duration-300 group ${
                activeTab === tab.id 
                ? 'bg-emerald-50 text-emerald-600 shadow-inner' 
                : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
              }`}
            >
              <div className={`p-3 rounded-2xl transition-all duration-300 ${
                activeTab === tab.id ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'bg-slate-50 group-hover:bg-white'
              }`}>
                <tab.icon className="w-5 h-5" />
              </div>
              <span className={`text-sm font-black tracking-tight ${activeTab === tab.id ? 'translate-x-1' : ''} transition-transform`}>
                {tab.label}
              </span>
            </button>
          ))}
          
          <div className="mt-auto pt-8 border-t border-slate-50">
             <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Informasi Kunjungan</p>
                <div className="space-y-4">
                   <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-slate-300" />
                      <span className="text-xs font-bold text-slate-600 uppercase italic">
                        {patient.tgl_registrasi ? new Date(patient.tgl_registrasi).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' }) : '-'}
                      </span>
                   </div>
                   <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-slate-300" />
                      <span className="text-xs font-bold text-slate-600 italic uppercase">{patient.jam_reg?.substring(0, 5) || '-'} WIB</span>
                   </div>
                </div>
             </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto flex flex-col bg-white">
           <div className="flex-1 p-12 flex flex-col items-center">
              <div className="w-full max-w-4xl animate-in fade-in slide-in-from-bottom-8 duration-700">
                 <div className="mb-10 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-slate-300">
                       <div className="w-12 h-12 rounded-[1.2rem] bg-slate-50 flex items-center justify-center">
                          <ActiveIcon className="w-6 h-6 text-slate-400" />
                       </div>
                       <div>
                          <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                             {activeTabInfo.label}
                          </h2>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Lengkapi data pemeriksaan anda</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                       </span>
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sistem LIVE</span>
                    </div>
                 </div>

                  <div className="mb-8">
                     <AiQuickNotes 
                        onSuggest={handleAiSuggest} 
                        onAnalyzing={setIsAnalyzing}
                        variant="emerald"
                     />
                  </div>

                  <div className={`bg-white min-h-[400px] transition-all duration-500 ${highlightActive ? 'ai-highlight' : ''}`}>
                     {activeTab === 'SOAP' && <SoapTab formData={formData} updateField={updateField} onSave={handleSaveSoap} isSaving={saving} />}
                    {activeTab === 'DIAGNOSA' && <IcdTab formData={formData} updateField={updateField} onSave={() => handleSaveSoap(formData)} isSaving={saving} />}
                    {activeTab === 'RESEP' && (
                       <PrescriptionTab 
                          standardMeds={standardMeds} 
                          setStandardMeds={setStandardMeds}
                          compoundedMeds={compoundedMeds}
                          setCompoundedMeds={setCompoundedMeds}
                          patient={patient}
                          noRawat={noRawatJoined}
                          onSave={handleSavePrescription}
                          isSaving={saving}
                       />
                    )}
                    {activeTab === 'LAB' && (
                       <LabTab 
                          noRawat={noRawatJoined} 
                          kdDokter={patient.kd_dokter || "D0001"}
                          selectedTests={selectedLabTests}
                          setSelectedTests={setSelectedLabTests}
                          notes={labNotes}
                          setNotes={setLabNotes}
                          onSave={handleSaveLab}
                          isSaving={saving}
                       />
                    )}
                    { activeTab === 'RADIOLOGI' && (
                       <RadiologiTab 
                          noRawat={noRawatJoined}
                          kdDokter={patient.kd_dokter || "D0001"}
                          selectedTests={selectedRadTests}
                          setSelectedTests={setSelectedRadTests}
                          notes={radNotes}
                          setNotes={setRadNotes}
                          onSave={handleSaveRadiology}
                          isSaving={saving}
                       />
                    )}
                     {activeTab === 'HASIL_LAB' && (
                        <HasilLabTab noRawat={noRawatJoined} />
                     )}
                     {activeTab === 'HASIL_RAD' && (
                        <HasilRadTab noRawat={noRawatJoined} />
                     )}
                    { activeTab === 'RESUME' && (
                       <ResumeTab 
                          patient={patient}
                          formData={formData}
                          updateField={updateField}
                          standardMeds={standardMeds}
                          compoundedMeds={compoundedMeds}
                          selectedLabTests={selectedLabTests}
                          labNotes={labNotes}
                          selectedRadTests={selectedRadTests}
                          radNotes={radNotes}
                       />
                    )}
                 </div>
              </div>
           </div>

        </main>
      </div>
    </div>
  )
}
