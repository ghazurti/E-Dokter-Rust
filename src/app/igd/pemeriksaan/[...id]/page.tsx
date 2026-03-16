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
  AlertCircle,
  ShieldAlert
} from 'lucide-react'
import Link from 'next/link'
import { AiQuickNotes } from '@/components/pemeriksaan/ai/AiQuickNotes'
import { TriageTab } from '@/components/pemeriksaan/tabs/TriageTab'
import { AsesmenIgdTab } from '@/components/pemeriksaan/tabs/AsesmenIgdTab'
import { SoapTab } from '@/components/pemeriksaan/tabs/SoapTab'
import { IcdTab } from '@/components/pemeriksaan/tabs/IcdTab'
import { PrescriptionTab } from '@/components/pemeriksaan/tabs/PrescriptionTab'
import { LabTab } from '@/components/pemeriksaan/tabs/LabTab'
import { RadiologiTab } from '@/components/pemeriksaan/tabs/RadiologiTab'
import HasilLabTab from '@/components/pemeriksaan/tabs/HasilLabTab'
import HasilRadTab from '@/components/pemeriksaan/tabs/HasilRadTab'
import ResumeTab from '@/components/pemeriksaan/tabs/ResumeTab'

import { saveSoapAction, savePrescriptionFullAction, saveLabRequestAction, saveRadiologyRequestAction } from '@/app/pasien-rawat-jalan/actions'
import { saveTriaseIgdAction, saveAsesmenIgdAction } from '../actions'

const initialFormData = {
  // Standard SOAP
  keluhan: '', pemeriksaan: '', alergi: '', suhu: '', tensi: '120/80', nadi: '80', respirasi: '20', spo2: '', berat: '', tinggi: '', lingkar_perut: '', lingkar_kepala: '', lingkar_dada: '', gcs: '15', kesadaran: 'Compos Mentis', penilaian: '', tindak_lanjut: '', instruksi: '', evaluasi: '',
  // Specialized IGD Assessment
  anamnesis: 'Autoanamnesis', hubungan: '', keluhan_utama: '', rps: '', rpd: '', rpk: '', rpo: '', keadaan: 'Sakit Sedang', spo: '', bb: '', tb: '', kepala: 'Normal', mata: 'Normal', gigi: 'Normal', leher: 'Normal', thoraks: 'Normal', abdomen: 'Normal', genital: 'Normal', ekstremitas: 'Normal', ket_fisik: '', ket_lokalis: '', ekg: '', rad: '', lab: '', diagnosis: '', tata: '', tanggal: new Date().toISOString(), kd_dokter: '',
  
  // Resume Medis Fields
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

export default function IgdPemeriksaanPage({ params }: { params: any }) {
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
  const [activeTab, setActiveTab] = useState('TRIASE')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [highlightActive, setHighlightActive] = useState(false)

  const [formData, setFormData] = useState(initialFormData)

  const [standardMeds, setStandardMeds] = useState<any[]>([])
  const [compoundedMeds, setCompoundedMeds] = useState<any[]>([])
  const [selectedLabTests, setSelectedLabTests] = useState<any[]>([])
  const [labNotes, setLabNotes] = useState({ diagnosa: '', informasi: '' })
  const [selectedRadTests, setSelectedRadTests] = useState<any[]>([])
  const [radNotes, setRadNotes] = useState({ diagnosa: '', informasi: '' })

  useEffect(() => {
    async function fetchDetail() {
      if (!noRawatJoined) return
      try {
        const serviceUrl = process.env.NEXT_PUBLIC_RUST_SERVICE_URL || 'http://localhost:3001'
        const res = await fetch(`${serviceUrl}/registration?no_rawat=${encodeURIComponent(noRawatJoined)}`)
        if (res.ok) {
          const data = await res.json()
          setPatient(data)
          setFormData(prev => ({ ...prev, kd_dokter: data.kd_dokter }))
        }
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
      // Generic SOAP mapping
      keluhan: data.subjective || prev.keluhan,
      pemeriksaan: data.objective || prev.pemeriksaan,
      penilaian: data.assessment || prev.penilaian,
      tindak_lanjut: data.plan || prev.tindak_lanjut, 
      
      // Specialized IGD Assessment fields
      keluhan_utama: data.subjective || prev.keluhan_utama,
      ket_fisik: data.objective || prev.ket_fisik,
      diagnosis: data.assessment || prev.diagnosis,
      tata: data.plan || prev.tata,

      // Vital Signs
      tensi: data.td != null ? String(data.td) : prev.tensi,
      suhu: data.suhu != null ? String(data.suhu) : prev.suhu,
      nadi: data.nadi != null ? String(data.nadi) : prev.nadi,
      respirasi: data.rr != null ? String(data.rr) : prev.respirasi,
      bb: data.bb != null ? String(data.bb) : prev.bb,
      gcs: data.gcs != null ? String(data.gcs) : prev.gcs,
      spo2: data.spo2 != null ? String(data.spo2) : prev.spo2,
    }))
    
    setSaveStatus('success')
    setHighlightActive(true)
    setTimeout(() => setHighlightActive(false), 2000)
    setTimeout(() => setSaveStatus('idle'), 3000)
  }

  const handleSaveAsesmen = async (data: any) => {
    setSaving(true)
    try {
      const result = await saveAsesmenIgdAction(noRawatJoined, data)
      if (!result.success) throw new Error(result.error || 'Gagal menyimpan Asesmen')
      setSaveStatus('success')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (err: any) {
      setErrorMessage(err.message)
      setSaveStatus('error')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveTriase = async (data: any) => {
    setSaving(true)
    try {
      const result = await saveTriaseIgdAction(noRawatJoined, data)
      if (!result.success) throw new Error(result.error || 'Gagal menyimpan Triase')
      setSaveStatus('success')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (err: any) {
      setErrorMessage(err.message)
      setSaveStatus('error')
    } finally {
      setSaving(false)
    }
  }

  const handleGlobalSave = async (customData?: any) => {
    setSaving(true)
    setSaveStatus('idle')
    try {
      if (activeTab === 'SOAP') {
        await handleSaveSoap(formData)
      } else if (activeTab === 'RESEP') {
        await handleSavePrescription()
      } else if (activeTab === 'LAB') {
        await handleSaveLab()
      } else if (activeTab === 'RADIOLOGI') {
        await handleSaveRadiology()
      }

      setSaveStatus('success')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (err: any) {
      setSaveStatus('error')
      setErrorMessage(err.message)
    } finally {
      setSaving(false)
    }
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
      const result = await saveLabRequestAction({
        no_rawat: noRawatJoined,
        tests: selectedLabTests.map(t => ({
          kd_jenis_prw: t.kd_jenis_prw,
          id_templates: t.selectedTemplateIds || []
        })),
        dokter_perujuk: patient.kd_dokter || "D0001",
        diagnosa_klinis: labNotes.diagnosa,
        informasi_tambahan: labNotes.informasi
      })
      if (!result.success && typeof result === 'object' && 'error' in result) {
         throw new Error(result.error || 'Gagal mengirim permintaan Lab')
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
      const result = await saveRadiologyRequestAction({
        no_rawat: noRawatJoined,
        tests: selectedRadTests.map(t => ({
          kd_jenis_prw: t.kd_jenis_prw
        })),
        dokter_perujuk: patient.kd_dokter || "D0001",
        diagnosa_klinis: radNotes.diagnosa,
        informasi_tambahan: radNotes.informasi
      })
      if (!result.success && typeof result === 'object' && 'error' in result) {
          throw new Error(result.error || 'Gagal mengirim permintaan Radiologi')
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

  if (loading) return <div className="h-screen flex items-center justify-center font-black text-slate-400 animate-pulse">MEMUAT DATA IGD...</div>
  if (!patient) return <div className="h-screen flex items-center justify-center font-black text-rose-500">PASIEN TIDAK DITEMUKAN</div>

  const tabs = [
    { id: 'TRIASE', label: 'Triage IGD', icon: ShieldAlert, saveLabel: "Simpan Triage" },
    { id: 'ASESMEN_IGD', label: 'Asesmen Medis IGD', icon: ClipboardList, saveLabel: "Simpan Asesmen" },
    { id: 'SOAP', label: 'SOAP / CPPT', icon: Stethoscope, saveLabel: "Simpan SOAP" },
    { id: 'RESEP', label: 'E-Resep', icon: Pill, saveLabel: "Simpan Resep" },
    { id: 'LAB', label: 'Lab', icon: FlaskConical, saveLabel: "Simpan Lab" },
    { id: 'RADIOLOGI', label: 'Radiologi', icon: Radiation, saveLabel: "Simpan Rad" },
    { id: 'HASIL_LAB', label: 'Hasil Lab', icon: Activity },
    { id: 'HASIL_RAD', label: 'Hasil Rad', icon: Activity },
    { id: 'RESUME', label: 'Resume', icon: FileText },
  ]

  const activeTabInfo = tabs.find(t => t.id === activeTab) || tabs[0]

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col">
      <header className="bg-white border-b border-slate-100 px-8 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-6">
          <Link href="/igd" className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-red-100">
                <ShieldAlert className="w-6 h-6" />
             </div>
             <div>
                <h1 className="text-xl font-black text-slate-900 uppercase leading-none">{patient.nm_pasien}</h1>
                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">RM: {patient.no_rkm_medis} | {noRawatJoined}</p>
             </div>
          </div>

        </div>
        <div className="flex items-center gap-3">
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-64 bg-white border-r border-slate-100 flex flex-col p-4 overflow-y-auto">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex items-center gap-3 px-5 py-4 rounded-xl transition-all ${activeTab === t.id ? 'bg-red-50 text-red-600' : 'text-slate-400 hover:bg-slate-50'}`}>
              <t.icon className="w-4 h-4" />
              <span className="text-xs font-black uppercase tracking-tight">{t.label}</span>
            </button>
          ))}
        </aside>

        <main className="flex-1 overflow-y-auto bg-white p-12">
          <div className="max-w-5xl mx-auto space-y-10">
            <AiQuickNotes 
              onSuggest={handleAiSuggest} 
              onAnalyzing={setIsAnalyzing}
              variant="rose"
            />
            <div className={`transition-all duration-500 ${highlightActive ? 'ai-highlight' : ''}`}>
            {activeTab === 'TRIASE' && <TriageTab noRawat={noRawatJoined} patient={patient} onSave={handleSaveTriase} isSaving={saving} />}
             {activeTab === 'ASESMEN_IGD' && <AsesmenIgdTab formData={formData} updateField={updateField} onSave={() => handleSaveAsesmen(formData)} isSaving={saving} />}
             {activeTab === 'SOAP' && <SoapTab formData={formData} updateField={updateField} onSave={handleSaveSoap} isSaving={saving} />}
             {activeTab === 'RESEP' && <PrescriptionTab standardMeds={standardMeds} setStandardMeds={setStandardMeds} compoundedMeds={compoundedMeds} setCompoundedMeds={setCompoundedMeds} patient={patient} noRawat={noRawatJoined} onSave={handleSavePrescription} isSaving={saving} />}
             {activeTab === 'LAB' && <LabTab noRawat={noRawatJoined} kdDokter={patient.kd_dokter} selectedTests={selectedLabTests} setSelectedTests={setSelectedLabTests} notes={labNotes} setNotes={setLabNotes} onSave={handleSaveLab} isSaving={saving} />}
             {activeTab === 'RADIOLOGI' && <RadiologiTab noRawat={noRawatJoined} kdDokter={patient.kd_dokter} selectedTests={selectedRadTests} setSelectedTests={setSelectedRadTests} notes={radNotes} setNotes={setRadNotes} onSave={handleSaveRadiology} isSaving={saving} />}
            {activeTab === 'HASIL_LAB' && <HasilLabTab noRawat={noRawatJoined} />}
            {activeTab === 'HASIL_RAD' && <HasilRadTab noRawat={noRawatJoined} />}
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
        </main>
      </div>
    </div>
  )
}
