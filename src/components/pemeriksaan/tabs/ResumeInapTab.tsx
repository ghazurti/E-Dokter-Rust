"use client"

import React, { useState, useEffect } from 'react'
import { ClipboardList, Stethoscope, Pill, Home, Activity, Save, Loader2, Sparkles, Printer, FileText, User, MapPin, Calendar, Clock, CreditCard, ChevronDown } from 'lucide-react'
import { getResumeInapAction, saveResumeInapAction } from '@/app/pasien-rawat-inap/actions'

export default function ResumeInapTab({ noRawat, patient, kdDokter }: any) {
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isAiLoading, setIsAiLoading] = useState(false)
  const [glowFields, setGlowFields] = useState<string[]>([])
  const [data, setData] = useState<any>({
    no_rawat: noRawat,
    kd_dokter: kdDokter || '',
    diagnosa_awal: '',
    alasan: '',
    keluhan_utama: '',
    pemeriksaan_fisik: '',
    jalannya_penyakit: '',
    pemeriksaan_penunjang: '',
    hasil_laborat: '',
    tindakan_dan_operasi: '',
    obat_di_rs: '',
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
    alergi: '',
    diet: '',
    lab_belum: '',
    edukasi: '',
    cara_keluar: 'Atas Izin Dokter',
    ket_keluar: '',
    keadaan: 'Membaik',
    ket_keadaan: '',
    dilanjutkan: 'Kembali Ke RS',
    ket_dilanjutkan: '',
    kontrol: '',
    obat_pulang: ''
  })

  useEffect(() => {
    const fetchResume = async () => {
      setIsLoading(true)
      const existing = await getResumeInapAction(noRawat)
      if (existing) {
        setData(existing)
      }
      setIsLoading(false)
    }
    fetchResume()
  }, [noRawat])

  const updateField = (field: string, value: string) => {
    setData((prev: any) => ({ ...prev, [field]: value }))
  }

  const handleAiAutoFill = async () => {
    setIsAiLoading(true)
    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_RUST_SERVICE_URL}/ai/resume-summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ no_rawat: noRawat.replace(/\//g, '-') })
      })
      if (!resp.ok) {
        const errorText = await resp.text()
        throw new Error(`Error ${resp.status}: ${errorText}`)
      }
      const aiData = await resp.json()

      const newFields: string[] = []
      const updatedData = { ...data }

      Object.keys(aiData).forEach(key => {
        if (aiData[key]) {
          updatedData[key] = aiData[key]
          newFields.push(key)
        }
      })

      setData(updatedData)
      setGlowFields(newFields)
      setTimeout(() => setGlowFields([]), 3000)
    } catch (error: any) {
      alert(error.message)
    } finally {
      setIsAiLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const result = await saveResumeInapAction({ ...data, no_rawat: noRawat, kd_dokter: kdDokter })
      if (result.success) {
        alert('Resume Medis Berhasil Disimpan!')
      } else {
        throw new Error(result.error || 'Gagal menyimpan resume')
      }
    } catch (error: any) {
      alert(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Memuat Data Resume...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-24 text-slate-700">
      
      {/* 0. Header Info - Compact Version of Image Header */}
      <div className="bg-white border border-slate-200 rounded-[32px] p-6 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-3">
          <InfoItem label="No. Rawat" value={noRawat} icon={<FileText className="w-4 h-4" />} />
          <InfoItem label="Pasien" value={`${patient?.no_rkm_medis || ''} - ${patient?.nm_pasien || ''}`} icon={<User className="w-4 h-4" />} />
          <InfoItem label="Dokter P.J." value={patient?.nm_dokter || '-'} icon={<Activity className="w-4 h-4" />} />
        </div>
        <div className="space-y-3">
          <InfoItem label="Bangsal/Kamar" value={`${patient?.nm_bangsal || ''} / ${patient?.kd_kamar || ''}`} icon={<MapPin className="w-4 h-4" />} />
          <InfoItem label="Cara Bayar" value={patient?.nm_pj || 'UMUM'} icon={<CreditCard className="w-4 h-4" />} />
          <div className="flex gap-2">
            <InfoItem label="Masuk" value={patient?.tgl_registrasi || '-'} icon={<Calendar className="w-4 h-4" />} />
            <InfoItem label="Jam" value={patient?.jam_reg || '-'} icon={<Clock className="w-4 h-4" />} />
          </div>
          {/* AI Auto-Fill Button */}
          <button 
            onClick={handleAiAutoFill}
            disabled={isAiLoading}
            className={`mt-2 flex items-center justify-center gap-2 w-full p-3 rounded-2xl font-black text-[10px] uppercase tracking-wider transition-all shadow-lg ${
              isAiLoading 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:scale-[1.02] active:scale-95 shadow-indigo-100'
            }`}
          >
            {isAiLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            AI Auto-Fill Resume (CPPT Review)
          </button>
        </div>
        <div className="space-y-4 flex flex-col justify-between">
           <div className="grid grid-cols-1 gap-4">
              <ResumeInput label="Diagnosa Awal" value={data.diagnosa_awal} onChange={(v) => updateField('diagnosa_awal', v)} placeholder="Diagnosa Awal Masuk..." />
              <ResumeInput label="Alasan Masuk" value={data.alasan} onChange={(v) => updateField('alasan', v)} placeholder="Alasan Pasien Dirawat..." />
           </div>
           <div className="flex gap-2 justify-end">
              <button onClick={handleSave} disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-indigo-100 flex items-center gap-2 transition-all">
                {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                Simpan
              </button>
              <button className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-6 py-3 rounded-2xl font-black text-[10px] uppercase flex items-center gap-2 transition-all">
                <Printer className="w-3 h-3" />
                Cetak
              </button>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Narratives */}
        <div className="space-y-6">
          <ResumeSection title="Riwayat & Pemeriksaan" icon={<Stethoscope className="text-blue-600" />}>
            <div className="space-y-6">
              <ResumeTextArea 
                label="Keluhan Utama & Riwayat Penyakit" 
                value={data.keluhan_utama} 
                onChange={(v) => updateField('keluhan_utama', v)} 
                isGlow={glowFields.includes('keluhan_utama')}
              />
              <ResumeTextArea 
                label="Pemeriksaan Fisik" 
                value={data.pemeriksaan_fisik} 
                onChange={(v) => updateField('pemeriksaan_fisik', v)} 
                isGlow={glowFields.includes('pemeriksaan_fisik')}
              />
              <ResumeTextArea 
                label="Jalannya Penyakit Selama Perawatan" 
                value={data.jalannya_penyakit} 
                onChange={(v) => updateField('jalannya_penyakit', v)} 
                isGlow={glowFields.includes('jalannya_penyakit')}
              />
            </div>
          </ResumeSection>

          <ResumeSection title="Pemeriksaan Penunjang" icon={<Activity className="text-emerald-600" />}>
            <div className="space-y-6">
              <ResumeTextArea 
                label="Pemeriksaan Penunjang Rad Terpenting" 
                value={data.pemeriksaan_penunjang} 
                onChange={(v) => updateField('pemeriksaan_penunjang', v)} 
                isGlow={glowFields.includes('pemeriksaan_penunjang')}
              />
              <ResumeTextArea 
                label="Pemeriksaan Penunjang Lab Terpenting" 
                value={data.hasil_laborat} 
                onChange={(v) => updateField('hasil_laborat', v)} 
                isGlow={glowFields.includes('hasil_laborat')}
              />
              <ResumeTextArea 
                label="Hasil Lab Yang Belum Selesai (Pending)" 
                value={data.lab_belum} 
                onChange={(v) => updateField('lab_belum', v)} 
              />
            </div>
          </ResumeSection>

          <ResumeSection title="Tindakan & Terapi RS" icon={<Pill className="text-amber-600" />}>
            <div className="space-y-6">
              <ResumeTextArea 
                label="Tindakan/Operasi Selama Perawatan" 
                value={data.tindakan_dan_operasi} 
                onChange={(v) => updateField('tindakan_dan_operasi', v)} 
                isGlow={glowFields.includes('tindakan_dan_operasi')}
              />
              <ResumeTextArea 
                label="Obat-obatan Selama Perawatan" 
                value={data.obat_di_rs} 
                onChange={(v) => updateField('obat_di_rs', v)} 
                isGlow={glowFields.includes('obat_di_rs')}
              />
            </div>
          </ResumeSection>
        </div>

        {/* Right Column - Coding & Discharge */}
        <div className="space-y-6">
          <ResumeSection title="Diagnosa & Prosedur (Coding)" icon={<ClipboardList className="text-purple-600" />}>
            <div className="space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Diagnosa Akhir</p>
              <CodingItem label="Diagnosa Utama" textValue={data.diagnosa_utama} textChange={(v) => updateField('diagnosa_utama', v)} codeValue={data.kd_diagnosa_utama} codeChange={(v) => updateField('kd_diagnosa_utama', v)} isGlow={glowFields.includes('diagnosa_utama')} />
              <CodingItem label="Diagnosa Sekunder 1" textValue={data.diagnosa_sekunder} textChange={(v) => updateField('diagnosa_sekunder', v)} codeValue={data.kd_diagnosa_sekunder} codeChange={(v) => updateField('kd_diagnosa_sekunder', v)} isGlow={glowFields.includes('diagnosa_sekunder')} />
              <CodingItem label="Diagnosa Sekunder 2" textValue={data.diagnosa_sekunder2} textChange={(v) => updateField('diagnosa_sekunder2', v)} codeValue={data.kd_diagnosa_sekunder2} codeChange={(v) => updateField('kd_diagnosa_sekunder2', v)} />
              <CodingItem label="Diagnosa Sekunder 3" textValue={data.diagnosa_sekunder3} textChange={(v) => updateField('diagnosa_sekunder3', v)} codeValue={data.kd_diagnosa_sekunder3} codeChange={(v) => updateField('kd_diagnosa_sekunder3', v)} />
              <CodingItem label="Diagnosa Sekunder 4" textValue={data.diagnosa_sekunder4} textChange={(v) => updateField('diagnosa_sekunder4', v)} codeValue={data.kd_diagnosa_sekunder4} codeChange={(v) => updateField('kd_diagnosa_sekunder4', v)} />
              
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2 mt-6">Prosedur / Tindakan</p>
              <CodingItem label="Prosedur Utama" textValue={data.prosedur_utama} textChange={(v) => updateField('prosedur_utama', v)} codeValue={data.kd_prosedur_utama} codeChange={(v) => updateField('kd_prosedur_utama', v)} isGlow={glowFields.includes('prosedur_utama')} />
              <CodingItem label="Prosedur Sekunder 1" textValue={data.prosedur_sekunder} textChange={(v) => updateField('prosedur_sekunder', v)} codeValue={data.kd_prosedur_sekunder} codeChange={(v) => updateField('kd_prosedur_sekunder', v)} />
              <CodingItem label="Prosedur Sekunder 2" textValue={data.prosedur_sekunder2} textChange={(v) => updateField('prosedur_sekunder2', v)} codeValue={data.kd_prosedur_sekunder2} codeChange={(v) => updateField('kd_prosedur_sekunder2', v)} />
              <CodingItem label="Prosedur Sekunder 3" textValue={data.prosedur_sekunder3} textChange={(v) => updateField('prosedur_sekunder3', v)} codeValue={data.kd_prosedur_sekunder3} codeChange={(v) => updateField('kd_prosedur_sekunder3', v)} />
            </div>
          </ResumeSection>

          <ResumeSection title="Alergi & Edukasi" icon={<Sparkles className="text-pink-600" />}>
            <div className="space-y-6">
              <ResumeInput label="Alergi Obat" value={data.alergi} onChange={(v) => updateField('alergi', v)} />
              <ResumeTextArea label="Diet" value={data.diet} onChange={(v) => updateField('diet', v)} />
              <ResumeTextArea label="Instruksi & Edukasi (Follow Up)" value={data.edukasi} onChange={(v) => updateField('edukasi', v)} />
            </div>
          </ResumeSection>

          <ResumeSection title="Kondisi Keluar" icon={<Home className="text-orange-600" />}>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                 <ResumeSelect label="Keadaan Pulang" value={data.keadaan} onChange={(v) => updateField('keadaan', v)} options={['Membaik', 'Sembuh', 'Belum Sembuh', 'Meninggal', 'Lain-lain']} />
                 <ResumeInput label="Keterangan Keadaan" value={data.ket_keadaan} onChange={(v) => updateField('ket_keadaan', v)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <ResumeSelect label="Cara Keluar" value={data.cara_keluar} onChange={(v) => updateField('cara_keluar', v)} options={['Atas Izin Dokter', 'Pulang Paksa', 'Lari', 'Dirujuk', 'Lain-lain']} />
                 <ResumeInput label="Keterangan Cara Keluar" value={data.ket_keluar} onChange={(v) => updateField('ket_keluar', v)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <ResumeSelect label="Dilanjutkan" value={data.dilanjutkan} onChange={(v) => updateField('dilanjutkan', v)} options={['Kembali Ke RS', 'Puskesmas', 'RS Lain', 'Tidak Perlu', 'Lain-lain']} />
                 <ResumeInput label="Keterangan Dilanjutkan" value={data.ket_dilanjutkan} onChange={(v) => updateField('ket_dilanjutkan', v)} />
              </div>
              <ResumeInput label="Tanggal & Jam Kontrol" type="datetime-local" value={data.kontrol} onChange={(v) => updateField('kontrol', v)} />
              <ResumeTextArea label="Obat Pulang" value={data.obat_pulang} onChange={(v) => updateField('obat_pulang', v)} isGlow={glowFields.includes('obat_pulang')} />
            </div>
          </ResumeSection>
        </div>
      </div>
    </div>
  )
}

// COMPONENTS
function ResumeSection({ title, icon, children }: any) {
  return (
    <section className="bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-sm hover:shadow-md transition-all">
      <div className="bg-slate-50/50 border-b p-5 px-8 flex items-center gap-3">
        <div className="p-2 bg-white rounded-xl shadow-sm">
          {React.cloneElement(icon, { className: "w-5 h-5" })}
        </div>
        <h3 className="font-black text-slate-700 uppercase tracking-wider text-xs">{title}</h3>
      </div>
      <div className="p-8">
        {children}
      </div>
    </section>
  )
}

function InfoItem({ label, value, icon }: any) {
  return (
    <div className="flex items-start gap-3 group">
      <div className="mt-1 p-1.5 bg-slate-50 rounded-lg text-slate-400 group-hover:text-blue-500 transition-colors">
        {icon}
      </div>
      <div>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-xs font-bold text-slate-700 group-hover:text-slate-900">{value || '-'}</p>
      </div>
    </div>
  )
}

function CodingItem({ label, textValue, textChange, codeValue, codeChange, isGlow }: any) {
  const glowClass = isGlow ? "animate-pulse border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.1)] bg-white" : "border-slate-50 bg-slate-50"

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      <div className="flex gap-2">
        <input 
          className={`flex-1 p-3 border-2 rounded-2xl text-[11px] font-bold focus:border-blue-500 focus:bg-white transition-all outline-none ${glowClass}`}
          value={textValue || ''}
          onChange={(e) => textChange(e.target.value)}
          placeholder="Nama Diagnosa/Prosedur..."
        />
        <input 
          className={`w-24 p-3 border-2 border-slate-50 rounded-2xl text-[11px] font-black text-center focus:border-blue-500 focus:bg-white transition-all outline-none ${isGlow ? 'bg-white border-blue-400' : 'bg-slate-100'}`}
          value={codeValue || ''}
          onChange={(e) => codeChange(e.target.value)}
          placeholder="KODE"
        />
      </div>
    </div>
  )
}

function ResumeInput({ label, value, onChange, type = "text", placeholder = "", isGlow }: any) {
  const glowClass = isGlow ? "animate-pulse border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)] bg-white" : "border-slate-50 bg-slate-50"

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      <input 
        type={type}
        className={`w-full p-3 border-2 rounded-2xl text-[11px] font-bold focus:border-blue-500 focus:bg-white transition-all outline-none ${glowClass}`}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  )
}

function ResumeTextArea({ label, value, onChange, placeholder = "", isGlow }: any) {
  const glowClass = isGlow ? "animate-pulse border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)] bg-white" : "border-slate-50 bg-slate-50"

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      <textarea 
        className={`w-full p-4 border-2 rounded-[24px] text-[11px] font-medium focus:border-blue-500 focus:bg-white transition-all outline-none min-h-[100px] leading-relaxed ${glowClass}`}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  )
}

function ResumeSelect({ label, value, onChange, options }: any) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      <div className="relative">
        <select 
          className="w-full p-3 pr-10 border-2 border-slate-50 rounded-2xl text-[11px] font-bold bg-slate-50 focus:border-blue-500 focus:bg-white transition-all outline-none appearance-none"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {options.map((opt: string) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>
    </div>
  )
}