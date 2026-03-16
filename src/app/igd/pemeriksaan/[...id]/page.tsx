"use client"

import { useEffect, useState, use } from 'react'
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
import { AiQuickNotes } from '@/components/pemeriksaan/AiQuickNotes'
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

export default function IgdPemeriksaanPage({ params }: { params: Promise<{ id: string[] }> }) {
  const resolvedParams = use(params)
  const noRawatJoined = resolvedParams.id.join('/').replace(/-/g, '/')
  
  const [patient, setPatient] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [activeTab, setActiveTab] = useState('TRIASE')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [highlightActive, setHighlightActive] = useState(false)

  const [formData, setFormData] = useState({
    // Standard SOAP
    keluhan: '', pemeriksaan: '', alergi: '', suhu: '', tensi: '120/80', nadi: '80', respirasi: '20', spo2: '', berat: '', tinggi: '', lingkar_perut: '', lingkar_kepala: '', lingkar_dada: '', gcs: '15', kesadaran: 'Compos Mentis', penilaian: '', tindak_lanjut: '', instruksi: '', evaluasi: '',
    // Specialized IGD Assessment
    anamnesis: 'Autoanamnesis', hubungan: '', keluhan_utama: '', rps: '', rpd: '', rpk: '', rpo: '', keadaan: 'Sakit Sedang', spo: '', bb: '', tb: '', kepala: 'Normal', mata: 'Normal', gigi: 'Normal', leher: 'Normal', thoraks: 'Normal', abdomen: 'Normal', genital: 'Normal', ekstremitas: 'Normal', ket_fisik: '', ket_lokalis: '', ekg: '', rad: '', lab: '', diagnosis: '', tata: '', tanggal: new Date().toISOString(), kd_dokter: '',
  })

  const [standardMeds, setStandardMeds] = useState<any[]>([])
  const [compoundedMeds, setCompoundedMeds] = useState<any[]>([])
  const [selectedLabTests, setSelectedLabTests] = useState<any[]>([])
  const [labNotes, setLabNotes] = useState({ diagnosa: '', informasi: '' })
  const [selectedRadTests, setSelectedRadTests] = useState<any[]>([])
  const [radNotes, setRadNotes] = useState({ diagnosa: '', informasi: '' })

  useEffect(() => {
    async function fetchDetail() {
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

  const handleGlobalSave = async (customData?: any) => {
    setSaving(true)
    setSaveStatus('idle')
    try {
      if (activeTab === 'TRIASE') {
        const res = await saveTriaseIgdAction(noRawatJoined, customData)
        if (!res.success) throw new Error(res.error)
      } else if (activeTab === 'ASESMEN_IGD') {
        const res = await saveAsesmenIgdAction(noRawatJoined, formData)
        if (!res.success) throw new Error(res.error)
      } else if (activeTab === 'SOAP') {
        const res = await saveSoapAction(noRawatJoined, formData)
        if (!res.success) throw new Error(res.error)
      } else if (activeTab === 'RESEP') {
        const res = await savePrescriptionFullAction(noRawatJoined, patient.kd_dokter, "ralan", standardMeds, compoundedMeds)
        if (!res.success) throw new Error(res.error)
      } else if (activeTab === 'LAB') {
        await saveLabRequestAction({ no_rawat: noRawatJoined, tests: selectedLabTests.map(t => ({ kd_jenis_prw: t.kd_jenis_prw, id_templates: t.selectedTemplateIds || [] })), dokter_perujuk: patient.kd_dokter, diagnosa_klinis: labNotes.diagnosa, informasi_tambahan: labNotes.informasi })
      } else if (activeTab === 'RADIOLOGI') {
        await saveRadiologyRequestAction({ no_rawat: noRawatJoined, tests: selectedRadTests.map(t => ({ kd_jenis_prw: t.kd_jenis_prw })), dokter_perujuk: patient.kd_dokter, diagnosa_klinis: radNotes.diagnosa, informasi_tambahan: radNotes.informasi })
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
          {saveStatus === 'success' && <div className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-full text-[10px] font-black border border-emerald-100 uppercase tracking-widest">Berhasil Disimpan</div>}
          {saveStatus === 'error' && <div className="bg-rose-50 text-rose-600 px-4 py-2 rounded-full text-[10px] font-black border border-rose-100 uppercase tracking-widest">{errorMessage}</div>}
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
            {activeTab === 'TRIASE' && <TriageTab noRawat={noRawatJoined} patient={patient} onSave={handleGlobalSave} />}
            {activeTab === 'ASESMEN_IGD' && <AsesmenIgdTab formData={formData} updateField={updateField} />}
            {activeTab === 'SOAP' && <SoapTab formData={formData} updateField={updateField} />}
            {activeTab === 'RESEP' && <PrescriptionTab standardMeds={standardMeds} setStandardMeds={setStandardMeds} compoundedMeds={compoundedMeds} setCompoundedMeds={setCompoundedMeds} patient={patient} noRawat={noRawatJoined} />}
            {activeTab === 'LAB' && <LabTab noRawat={noRawatJoined} kdDokter={patient.kd_dokter} selectedTests={selectedLabTests} setSelectedTests={setSelectedLabTests} notes={labNotes} setNotes={setLabNotes} />}
            {activeTab === 'RADIOLOGI' && <RadiologiTab noRawat={noRawatJoined} kdDokter={patient.kd_dokter} selectedTests={selectedRadTests} setSelectedTests={setSelectedRadTests} notes={radNotes} setNotes={setRadNotes} />}
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

            {activeTabInfo.saveLabel && activeTab !== 'TRIASE' && (
              <div className="mt-8 flex justify-end">
                <button onClick={() => handleGlobalSave()} disabled={saving} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs hover:bg-blue-600 transition-all flex items-center gap-3">
                  {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Save className="w-5 h-5" />}
                  {activeTabInfo.saveLabel.toUpperCase()}
                </button>
              </div>
            )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
