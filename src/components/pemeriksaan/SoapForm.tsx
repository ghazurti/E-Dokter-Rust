"use client"

import { useState } from 'react'
import { 
  ClipboardList, 
  Activity, 
  Stethoscope, 
  Pill, 
  Save, 
  ChevronRight, 
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  Search
} from 'lucide-react'

import { 
  saveSoapAction, 
  searchIcdAction, 
  searchMedicineAction, 
  getMetodeRacikAction,
  savePrescriptionFullAction 
} from '@/app/pasien-rawat-jalan/actions'
import { Plus, Trash2, Box } from 'lucide-react'

interface SoapFormProps {
  patient: any
  onComplete: () => void
}

export function SoapForm({ patient, onComplete }: SoapFormProps) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
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
  })

  // Prescription State
  const [resepTab, setResepTab] = useState<'standar' | 'racikan'>('standar')
  const [standardMeds, setStandardMeds] = useState<any[]>([])
  const [compoundedMeds, setCompoundedMeds] = useState<any[]>([])
  
  // Search States
  const [medSearch, setMedSearch] = useState('')
  const [medResults, setMedResults] = useState<any[]>([])
  const [metodeRacik, setMetodeRacik] = useState<any[]>([])

  // ICD-10 Search
  const [icdSearch, setIcdSearch] = useState('')
  const [icdResults, setIcdResults] = useState<{kd: string, nm: string}[]>([])

  const handleIcdSearch = async (val: string) => {
    setIcdSearch(val)
    if (val.length > 1) {
      const results = await searchIcdAction(val)
      setIcdResults(results)
    } else {
      setIcdResults([])
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // 1. Save SOAP
      const soapResult = await saveSoapAction(patient.no_rawat, formData)
      
      if (!soapResult.success) {
        throw new Error(soapResult.error || 'Gagal menyimpan SOAP')
      }

      // 2. Save Prescription if any
      if (standardMeds.length > 0 || compoundedMeds.length > 0) {
        const resepResult = await savePrescriptionFullAction(
          patient.no_rawat,
          patient.kd_dokter || "D0001",
          "ralan",
          standardMeds,
          compoundedMeds
        )
        if (!resepResult.success) {
          throw new Error(resepResult.error || 'Gagal menyimpan Resep')
        }
      }

      setSuccess(true)
      setTimeout(() => {
        onComplete()
      }, 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (success) {
    return (
      <div className="bg-white rounded-[2.5rem] p-12 border border-slate-100 shadow-xl flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-500">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 animate-bounce" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 mb-2">Data Terkirim!</h2>
        <p className="text-slate-500 font-medium">SOAP untuk {patient.pasien.nm_pasien} telah berhasil disimpan ke SIMRS Khanza.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl relative overflow-hidden">
      {/* Steps Header */}
      <div className="flex items-center justify-between mb-10 overflow-x-auto pb-4 gap-4 no-scrollbar">
        <StepIndicator num={1} active={step >= 1} label="Subjektif" icon={ClipboardList} />
        <div className="h-0.5 flex-1 bg-slate-100 min-w-[20px]"></div>
        <StepIndicator num={2} active={step >= 2} label="Objektif" icon={Activity} />
        <div className="h-0.5 flex-1 bg-slate-100 min-w-[20px]"></div>
        <StepIndicator num={3} active={step >= 3} label="Assessment" icon={Stethoscope} />
        <div className="h-0.5 flex-1 bg-slate-100 min-w-[20px]"></div>
        <StepIndicator num={4} active={step >= 4} label="Plan" icon={Pill} />
        <div className="h-0.5 flex-1 bg-slate-100 min-w-[20px]"></div>
        <StepIndicator num={5} active={step >= 5} label="Resep" icon={Pill} />
      </div>

      <div className="min-h-[400px]">
        {/* Step 1: Subjective */}
        {step === 1 && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
            <div>
              <label className="block text-sm font-black text-slate-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-emerald-600" />
                Keluhan Utama (S)
              </label>
              <textarea 
                className="w-full h-40 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] p-6 focus:border-emerald-500 focus:ring-0 transition-all outline-none font-medium text-slate-700 resize-none"
                placeholder="Tuliskan keluhan atau kronologi penyakit pasien di sini..."
                value={formData.keluhan}
                onChange={(e) => updateField('keluhan', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-black text-slate-900 uppercase tracking-widest mb-3">Alergi (Opsional)</label>
              <input 
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 focus:border-emerald-500 focus:ring-0 transition-all outline-none font-bold text-slate-700"
                placeholder="Riwayat alergi pasien..."
                value={formData.alergi}
                onChange={(e) => updateField('alergi', e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Step 2: Objective */}
        {step === 2 && (
          <div className="space-y-8 animate-in slide-in-from-right-4 duration-500 uppercase">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <h3 className="text-sm font-black text-emerald-600 tracking-widest mb-4">Vitals & Fisik</h3>
                <div className="grid grid-cols-2 gap-4">
                  <VitalInput label="Tensi" placeholder="120/80" value={formData.tensi} onChange={(v) => updateField('tensi', v)} />
                  <VitalInput label="Nadi" placeholder="80" value={formData.nadi} onChange={(v) => updateField('nadi', v)} />
                  <VitalInput label="Suhu" placeholder="36.5" value={formData.suhu} onChange={(v) => updateField('suhu', v)} />
                  <VitalInput label="Respirasi" placeholder="18" value={formData.respirasi} onChange={(v) => updateField('respirasi', v)} />
                  <VitalInput label="SPO2" placeholder="98" value={formData.spo2} onChange={(v) => updateField('spo2', v)} />
                  <VitalInput label="GCS" placeholder="15" value={formData.gcs} onChange={(v) => updateField('gcs', v)} />
                </div>
              </div>
              
              <div className="space-y-6">
                <h3 className="text-sm font-black text-emerald-600 tracking-widest mb-4">Antropometri & Kesadaran</h3>
                <div className="grid grid-cols-2 gap-4">
                  <VitalInput label="Berat (Kg)" placeholder="65" value={formData.berat} onChange={(v) => updateField('berat', v)} />
                  <VitalInput label="Tinggi (Cm)" placeholder="170" value={formData.tinggi} onChange={(v) => updateField('tinggi', v)} />
                  <VitalInput label="L. Perut (Cm)" placeholder="80" value={formData.lingkar_perut} onChange={(v) => updateField('lingkar_perut', v)} />
                  <VitalInput label="L. Kepala (Cm)" placeholder="35" value={formData.lingkar_kepala} onChange={(v) => updateField('lingkar_kepala', v)} />
                  <VitalInput label="L. Dada (Cm)" placeholder="33" value={formData.lingkar_dada} onChange={(v) => updateField('lingkar_dada', v)} />
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Kesadaran</label>
                    <select 
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-4 font-bold outline-none focus:border-emerald-500 transition-all text-slate-700"
                      value={formData.kesadaran}
                      onChange={(e) => updateField('kesadaran', e.target.value)}
                    >
                      <option value="Compos Mentis">Compos Mentis</option>
                      <option value="Somnolence">Somnolence</option>
                      <option value="Sopor">Sopor</option>
                      <option value="Coma">Coma</option>
                      <option value="Apatis">Apatis</option>
                      <option value="Alert">Alert</option>
                      <option value="Confusion">Confusion</option>
                      <option value="Voice">Voice</option>
                      <option value="Pain">Pain</option>
                      <option value="Unresponsive">Unresponsive</option>
                      <option value="Delirium">Delirium</option>
                      <option value="Meninggal">Meninggal</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-black text-slate-900 uppercase tracking-widest mb-3">Pemeriksaan Fisik (O)</label>
              <textarea 
                className="w-full h-32 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] p-6 focus:border-emerald-500 focus:ring-0 transition-all outline-none font-medium text-slate-700 resize-none"
                placeholder="Catatan pemeriksaan fisik detail..."
                value={formData.pemeriksaan}
                onChange={(e) => updateField('pemeriksaan', e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Step 3: Assessment */}
        {step === 3 && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
             <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 flex items-start gap-4 mb-6">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-1 shrink-0" />
                <p className="text-sm font-bold text-amber-700 leading-relaxed">
                   Pastikan kode diagnosis ICD-10 sesuai dengan kondisi klinis pasien untuk keperluan bridging BPJS.
                </p>
             </div>

            <div className="relative">
              <label className="block text-sm font-black text-slate-900 uppercase tracking-widest mb-3">Cari Diagnosa (A)</label>
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                <input 
                  type="text"
                  placeholder="Ketik ICD-10 atau Nama Penyakit..."
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-6 font-bold outline-none focus:border-emerald-500 transition-all"
                  value={icdSearch}
                  onChange={(e) => handleIcdSearch(e.target.value)}
                />
              </div>
              
              {icdResults.length > 0 && (
                <div className="absolute z-20 top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-100 shadow-2xl overflow-hidden max-h-[300px] overflow-y-auto">
                   {icdResults.map(res => (
                     <button 
                        key={res.kd}
                        onClick={() => {
                          setFormData(prev => ({ ...prev, penilaian: res.nm }));
                          setIcdSearch(`${res.kd} - ${res.nm}`);
                          setIcdResults([]);
                        }}
                        className="w-full text-left px-6 py-4 hover:bg-slate-50 flex items-center justify-between border-b last:border-0"
                     >
                        <span className="font-bold text-slate-800">{res.nm}</span>
                        <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-lg text-xs font-black">{res.kd}</span>
                     </button>
                   ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-black text-slate-900 uppercase tracking-widest mb-3">Assessment (Penilaian Klinis)</label>
              <textarea 
                className="w-full h-32 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] p-6 focus:border-emerald-500 focus:ring-0 transition-all outline-none font-medium text-slate-700 resize-none"
                placeholder="Ringkasan diagnosa/assessment..."
                value={formData.penilaian}
                onChange={(e) => updateField('penilaian', e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Step 5: E-Resep */}
        {step === 5 && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
             <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-2 w-fit mb-6">
                <button 
                  onClick={() => setResepTab('standar')}
                  className={`px-6 py-2.5 rounded-xl font-black text-sm transition-all ${resepTab === 'standar' ? 'bg-white shadow-xl text-emerald-600 scale-105' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  OBAT STANDAR
                </button>
                <button 
                  onClick={() => {
                     setResepTab('racikan');
                     if (metodeRacik.length === 0) getMetodeRacikAction().then(setMetodeRacik);
                  }}
                  className={`px-6 py-2.5 rounded-xl font-black text-sm transition-all ${resepTab === 'racikan' ? 'bg-white shadow-xl text-emerald-600 scale-105' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  OBAT RACIKAN
                </button>
             </div>

             {resepTab === 'standar' ? (
                <div className="space-y-6">
                   {/* Search & Add Med */}
                   <div className="relative">
                      <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                        <input 
                          type="text"
                          placeholder="Cari Nama Obat Standar..."
                          className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-6 font-bold outline-none focus:border-emerald-500 transition-all"
                          value={medSearch}
                          onChange={(e) => {
                             setMedSearch(e.target.value);
                             if (e.target.value.length > 1) searchMedicineAction(e.target.value).then(setMedResults);
                             else setMedResults([]);
                          }}
                        />
                      </div>
                      {medResults.length > 0 && (
                        <div className="absolute z-30 top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-100 shadow-2xl overflow-hidden max-h-[250px] overflow-y-auto">
                           {medResults.map(m => (
                             <button 
                                key={m.kode_brng}
                                onClick={() => {
                                  setStandardMeds([...standardMeds, { ...m, jml: '1', aturan_pakai: '3 x 1' }]);
                                  setMedSearch('');
                                  setMedResults([]);
                                }}
                                className="w-full text-left px-6 py-4 hover:bg-slate-50 flex items-center justify-between border-b last:border-0"
                             >
                                <span className="font-bold text-slate-800">{m.nama_brng}</span>
                                <span className="bg-slate-100 text-slate-400 px-3 py-1 rounded-lg text-[10px] font-black">{m.kode_brng}</span>
                             </button>
                           ))}
                        </div>
                      )}
                   </div>

                   {/* Meds List */}
                   <div className="space-y-3">
                      {standardMeds.map((m, idx) => (
                        <div key={idx} className="bg-slate-50 p-4 rounded-3xl border border-slate-100 flex items-center gap-4 group">
                           <div className="flex-1">
                              <p className="text-sm font-black text-slate-900">{m.nama_brng}</p>
                              <p className="text-[10px] font-bold text-slate-400">{m.kode_brng}</p>
                           </div>
                           <div className="w-24">
                              <input 
                                 type="number"
                                 className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-center font-black text-slate-900"
                                 value={m.jml}
                                 onChange={(e) => {
                                    const next = [...standardMeds];
                                    next[idx].jml = e.target.value;
                                    setStandardMeds(next);
                                 }}
                              />
                           </div>
                           <div className="flex-1">
                              <input 
                                 placeholder="Aturan Pakai"
                                 className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 font-bold text-slate-700"
                                 value={m.aturan_pakai}
                                 onChange={(e) => {
                                    const next = [...standardMeds];
                                    next[idx].aturan_pakai = e.target.value;
                                    setStandardMeds(next);
                                 }}
                              />
                           </div>
                           <button 
                              onClick={() => setStandardMeds(standardMeds.filter((_, i) => i !== idx))}
                              className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                           >
                              <Trash2 className="w-5 h-5" />
                           </button>
                        </div>
                      ))}
                      {standardMeds.length === 0 && (
                        <div className="py-12 flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-100 rounded-[2rem]">
                           <Pill className="w-12 h-12 mb-2 opacity-20" />
                           <p className="font-bold">Belum ada obat standar ditambahkan</p>
                        </div>
                      )}
                   </div>
                </div>
             ) : (
                <div className="space-y-8">
                   <button 
                      onClick={() => setCompoundedMeds([...compoundedMeds, { nama_racik: `Racikan ${compoundedMeds.length + 1}`, kd_racik: 'R01', jml_dr: '10', aturan_pakai: '3 x 1', items: [] }])}
                      className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black text-xs hover:bg-emerald-700 transition-all flex items-center gap-2"
                   >
                      <Plus className="w-4 h-4" />
                      TAMBAH GRUP RACIKAN BARU
                   </button>

                   <div className="space-y-6">
                      {compoundedMeds.map((racik, rIdx) => (
                        <div key={rIdx} className="bg-white border-2 border-slate-100 rounded-[2.5rem] p-6 shadow-sm">
                           <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                              <div className="md:col-span-2">
                                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Nama Racikan</label>
                                 <input 
                                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-black text-slate-900 focus:ring-2 focus:ring-emerald-500"
                                    value={racik.nama_racik}
                                    onChange={(e) => {
                                       const next = [...compoundedMeds];
                                       next[rIdx].nama_racik = e.target.value;
                                       setCompoundedMeds(next);
                                    }}
                                 />
                              </div>
                              <div>
                                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Metode</label>
                                 <select 
                                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-black text-slate-900"
                                    value={racik.kd_racik}
                                    onChange={(e) => {
                                       const next = [...compoundedMeds];
                                       next[rIdx].kd_racik = e.target.value;
                                       setCompoundedMeds(next);
                                    }}
                                 >
                                    {metodeRacik.map(m => <option key={m.kd_racik} value={m.kd_racik}>{m.nm_racik}</option>)}
                                 </select>
                              </div>
                              <div>
                                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Jml Sediaan</label>
                                 <input 
                                    type="number"
                                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-black text-slate-900"
                                    value={racik.jml_dr}
                                    onChange={(e) => {
                                       const next = [...compoundedMeds];
                                       next[rIdx].jml_dr = e.target.value;
                                       setCompoundedMeds(next);
                                    }}
                                 />
                              </div>
                           </div>

                           {/* Racikan Items */}
                           <div className="space-y-3 pl-4 border-l-4 border-emerald-100 mb-6">
                              {racik.items.map((item: any, iIdx: number) => (
                                <div key={iIdx} className="bg-slate-50 p-3 rounded-2xl flex items-center gap-4">
                                   <div className="flex-1 font-bold text-slate-700 text-sm">{item.nama_brng}</div>
                                   <div className="w-20">
                                      <input 
                                         placeholder="KND"
                                         className="w-full bg-white border-none rounded-lg px-2 py-1 text-center font-black text-xs"
                                         value={item.knd}
                                         onChange={(e) => {
                                            const next = [...compoundedMeds];
                                            next[rIdx].items[iIdx].knd = e.target.value;
                                            next[rIdx].items[iIdx].jml = parseFloat(e.target.value) * (parseInt(racik.jml_dr) || 0);
                                            setCompoundedMeds(next);
                                         }}
                                      />
                                   </div>
                                   <div className="w-16 font-black text-emerald-600 text-xs text-right">{item.jml}</div>
                                   <button 
                                      onClick={() => {
                                         const next = [...compoundedMeds];
                                         next[rIdx].items = next[rIdx].items.filter((_: any, i: number) => i !== iIdx);
                                         setCompoundedMeds(next);
                                      }}
                                      className="p-1 text-slate-300 hover:text-red-500"
                                   >
                                      <Trash2 className="w-4 h-4" />
                                   </button>
                                </div>
                              ))}
                              
                              {/* Add to Racikan Search */}
                              <div className="relative mt-4">
                                 <div className="relative">
                                    <Plus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                                    <input 
                                       placeholder="Tambah Obat ke Racikan ini..."
                                       className="w-full bg-slate-100 border-none rounded-xl py-2 pl-10 pr-4 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                                       onChange={(e) => {
                                          if (e.target.value.length > 1) {
                                             searchMedicineAction(e.target.value).then(res => {
                                                // We reuse medResults for UI but need to know which group is searching
                                                // For simplicity, we'll just show the list and add to THIS group
                                                setMedResults(res.map(m => ({ ...m, targetRacikIdx: rIdx })));
                                             });
                                          } else setMedResults([]);
                                       }}
                                    />
                                 </div>
                                 {medResults.length > 0 && medResults[0].targetRacikIdx === rIdx && (
                                    <div className="absolute z-30 top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-100 shadow-2xl overflow-hidden max-h-[200px] overflow-y-auto">
                                       {medResults.map(m => (
                                         <button 
                                            key={m.kode_brng}
                                            onClick={() => {
                                              const next = [...compoundedMeds];
                                              next[rIdx].items.push({ ...m, knd: '1', jml: parseFloat(racik.jml_dr) || 1 });
                                              setCompoundedMeds(next);
                                              setMedResults([]);
                                            }}
                                            className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center justify-between border-b last:border-0"
                                         >
                                            <span className="font-bold text-slate-800 text-xs">{m.nama_brng}</span>
                                            <span className="bg-slate-100 text-slate-400 px-2 py-0.5 rounded text-[8px] font-black">{m.kode_brng}</span>
                                         </button>
                                       ))}
                                    </div>
                                 )}
                              </div>
                           </div>

                           <div className="flex justify-between items-center">
                              <input 
                                 placeholder="Aturan Pakai Racikan"
                                 className="w-full max-w-sm bg-slate-50 border-none rounded-xl px-4 py-2 font-bold text-slate-700 text-sm"
                                 value={racik.aturan_pakai}
                                 onChange={(e) => {
                                    const next = [...compoundedMeds];
                                    next[rIdx].aturan_pakai = e.target.value;
                                    setCompoundedMeds(next);
                                 }}
                              />
                              <button 
                                 onClick={() => setCompoundedMeds(compoundedMeds.filter((_, i) => i !== rIdx))}
                                 className="text-red-500 font-bold text-xs hover:underline flex items-center gap-1"
                              >
                                 <Trash2 className="w-3 h-3" />
                                 Hapus Grup
                              </button>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
             )}
          </div>
        )}
      </div>

      {/* Navigation Footer */}
      <div className="mt-12 flex items-center justify-between border-t pt-8">
        <button 
          onClick={() => step > 1 ? setStep(step - 1) : onComplete()}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
          {step === 1 ? 'Batalkan' : 'Sebelumnya'}
        </button>

        {step < 5 ? (
          <button 
            onClick={() => setStep(step + 1)}
            className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 flex items-center gap-2"
          >
            Lanjutkan
            <ChevronRight className="w-5 h-5" />
          </button>
        ) : (
          <button 
            disabled={loading}
            onClick={handleSubmit}
            className="bg-slate-900 text-white px-10 py-3 rounded-2xl font-bold hover:bg-emerald-600 transition-all shadow-xl shadow-slate-200 flex items-center gap-2"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Menyimpan...
              </span>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Simpan Rekam Medis
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}

function StepIndicator({ num, active, label, icon: Icon }: { num: number, active: boolean, label: string, icon: any }) {
  return (
    <div className={`flex items-center gap-3 shrink-0 transition-all duration-500 ${active ? 'scale-105' : 'opacity-40'}`}>
      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black shadow-lg ${active ? 'bg-emerald-600 text-white shadow-emerald-200' : 'bg-slate-100 text-slate-400'}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className={`text-[10px] font-black uppercase tracking-[0.2em] leading-none mb-1 ${active ? 'text-emerald-500' : 'text-slate-400'}`}>Step 0{num}</p>
        <p className={`text-sm font-bold ${active ? 'text-slate-900' : 'text-slate-500'}`}>{label}</p>
      </div>
    </div>
  )
}

function VitalInput({ label, placeholder, value, onChange }: { label: string, placeholder: string, value: string, onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">{label}</label>
      <input 
        type="text"
        placeholder={placeholder}
        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-6 font-bold outline-none focus:border-emerald-500 transition-all text-slate-700"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}
