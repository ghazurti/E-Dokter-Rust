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

import { saveSoapAction, savePrescriptionFullAction, saveLabRequestAction, saveRadiologyRequestAction } from '@/app/pasien-rawat-jalan/actions'

export default function PemeriksaanPage({ params }: { params: Promise<{ id: string[] }> }) {
  const resolvedParams = use(params)
  const noRawatJoined = resolvedParams.id.join('/')
  
  const [patient, setPatient] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [activeTab, setActiveTab] = useState('SOAP')

  // Lifted State
const [formData, setFormData] = useState({
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
    prosedur_utama: '',
    kd_prosedur_utama: '',
    kondisi_pulang: 'Hidup',
    obat_pulang: '',
  })

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

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleGlobalSave = async () => {
    setSaving(true)
    setSaveStatus('idle')
    try {
      // 1. Save SOAP
      const soapResult = await saveSoapAction(noRawatJoined, formData)
      if (!soapResult.success) throw new Error(soapResult.error || 'Gagal menyimpan SOAP')

      // 2. Save Prescription if any
      if (standardMeds.length > 0 || compoundedMeds.length > 0) {
        const resepResult = await savePrescriptionFullAction(
          noRawatJoined,
          patient.kd_dokter || "D0001",
          "ralan",
          standardMeds,
          compoundedMeds
        )
        if (!resepResult.success) throw new Error(resepResult.error || 'Gagal menyimpan Resep')
      }

      // 3. Save Lab Request if any
      if (selectedLabTests.length > 0) {
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
      }

      // 4. Save Radiology Request if any
      if (selectedRadTests.length > 0) {
        const radResult = await saveRadiologyRequestAction({
          no_rawat: noRawatJoined,
          tests: selectedRadTests.map(t => ({
            kd_jenis_prw: t.kd_jenis_prw
          })),
          dokter_perujuk: patient.kd_dokter || "D0001",
          diagnosa_klinis: radNotes.diagnosa,
          informasi_tambahan: radNotes.informasi
        })
        if (!radResult.success && typeof radResult === 'object' && 'error' in radResult) {
            throw new Error(radResult.error || 'Gagal mengirim permintaan Radiologi')
        }
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
           {saveStatus === 'success' && (
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs animate-in fade-in slide-in-from-right-2 mr-4 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100">
                 <CheckCircle2 className="w-4 h-4" />
                 Berhasil Disimpan
              </div>
           )}
           {saveStatus === 'error' && (
              <div className="flex items-center gap-2 text-red-600 font-bold text-xs animate-in fade-in slide-in-from-right-2 mr-4 bg-red-50 px-4 py-2 rounded-full border border-red-100">
                 <AlertCircle className="w-4 h-4" />
                 {errorMessage}
              </div>
           )}

           <button 
             disabled={saving}
             onClick={handleGlobalSave}
             className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black text-xs hover:bg-emerald-700 shadow-xl shadow-emerald-100 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50 min-w-[160px] justify-center"
           >
             {saving ? (
               <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
             ) : (
               <>
                 <Save className="w-4 h-4" />
                 {activeTabInfo.saveLabel}
               </>
             )}
           </button>
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

                 <div className="bg-white min-h-[400px]">
                    {activeTab === 'SOAP' && <SoapTab formData={formData} updateField={updateField} />}
                    {activeTab === 'DIAGNOSA' && <IcdTab formData={formData} updateField={updateField} />}
                    {activeTab === 'RESEP' && (
                       <PrescriptionTab 
                          standardMeds={standardMeds} 
                          setStandardMeds={setStandardMeds}
                          compoundedMeds={compoundedMeds}
                          setCompoundedMeds={setCompoundedMeds}
                          patient={patient}
                          noRawat={noRawatJoined}
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

           {/* Consistent Footer Action Bar */}
           <div className="bg-white border-t border-slate-100 px-12 py-8 sticky bottom-0 z-20 flex justify-center shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)] w-full">
              <div className="w-full max-w-4xl flex items-center justify-between">
                 <div className="flex items-center gap-2">
                    
                 </div>
                 <div className="flex items-center gap-4">
                    <button className="text-slate-400 font-bold text-sm hover:text-slate-900 transition-colors px-6">Batal</button>
                    <button 
                      disabled={saving}
                      onClick={handleGlobalSave}
                      className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-xs hover:bg-emerald-600 transition-all shadow-xl shadow-slate-100 flex items-center gap-3 active:scale-95 disabled:opacity-50"
                    >
                      {saving ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <Save className="w-5 h-5 text-emerald-400" />
                      )}
                      <span>KONFIRMASI & SIMPAN {activeTabInfo.label}</span>
                    </button>
                 </div>
              </div>
           </div>
        </main>
      </div>
    </div>
  )
}
