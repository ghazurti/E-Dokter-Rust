"use client"
import React, { useState } from 'react'
import { Printer, Paperclip, Sparkles, Loader2, CheckCircle2, Save } from 'lucide-react'

interface ResumeTabProps {
  patient: any
  formData: any
  updateField: (field: string, value: string) => void
  standardMeds: any[]
  compoundedMeds: any[]
  selectedLabTests: any[]
  labNotes: any
  selectedRadTests: any[]
  radNotes: any
}

export default function ResumeTab({ 
  patient, 
  formData, 
  updateField,
}: ResumeTabProps) {
  const [isAiLoading, setIsAiLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [glowFields, setGlowFields] = useState<string[]>([])
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState("")

  const handleSave = async () => {
    if (!patient?.no_rawat) return
    setIsSaving(true)
    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_RUST_SERVICE_URL}/resume-ralan/save/${patient.no_rawat.replace(/\//g, '-')}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          no_rawat: patient.no_rawat,
          kd_dokter: patient.kd_dokter,
          keluhan_utama: formData.keluhan_utama || "",
          jalannya_penyakit: formData.jalannya_penyakit || "",
          pemeriksaan_penunjang: formData.pemeriksaan_penunjang || "",
          hasil_laborat: formData.hasil_laborat || "",
          diagnosa_utama: formData.diagnosa_utama || "",
          kd_diagnosa_utama: formData.kd_diagnosa_utama || "",
          diagnosa_sekunder: formData.diagnosa_sekunder || "",
          kd_diagnosa_sekunder: formData.kd_diagnosa_sekunder || "",
          diagnosa_sekunder2: formData.diagnosa_sekunder2 || "",
          kd_diagnosa_sekunder2: formData.kd_diagnosa_sekunder2 || "",
          diagnosa_sekunder3: formData.diagnosa_sekunder3 || "",
          kd_diagnosa_sekunder3: formData.kd_diagnosa_sekunder3 || "",
          diagnosa_sekunder4: formData.diagnosa_sekunder4 || "",
          kd_diagnosa_sekunder4: formData.kd_diagnosa_sekunder4 || "",
          prosedur_utama: formData.prosedur_utama || "",
          kd_prosedur_utama: formData.kd_prosedur_utama || "",
          prosedur_sekunder: formData.prosedur_sekunder || "",
          kd_prosedur_sekunder: formData.kd_prosedur_sekunder || "",
          prosedur_sekunder2: formData.prosedur_sekunder2 || "",
          kd_prosedur_sekunder2: formData.kd_prosedur_sekunder2 || "",
          prosedur_sekunder3: formData.prosedur_sekunder3 || "",
          kd_prosedur_sekunder3: formData.kd_prosedur_sekunder3 || "",
          kondisi_pulang: formData.kondisi_pulang || "Hidup",
          obat_pulang: formData.obat_pulang || ""
        })
      })
      if (!resp.ok) {
        throw new Error('Gagal menyimpan resume ralan')
      }
      setToastMessage("Resume Berhasil Disimpan")
      setShowToast(true)
      setTimeout(() => setShowToast(false), 3000)
    } catch (error: any) {
      setToastMessage("Error: " + error.message)
      setShowToast(true)
      setTimeout(() => setShowToast(false), 5000)
    } finally {
      setIsSaving(false)
    }
  }

  const handleAiAutoFill = async () => {
    if (!patient?.no_rawat) return
    setIsAiLoading(true)
    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_RUST_SERVICE_URL}/ai/resume-summary-ralan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ no_rawat: patient.no_rawat.replace(/\//g, '-') })
      })
      if (!resp.ok) {
        const errorText = await resp.text()
        throw new Error(`Error ${resp.status}: ${errorText}`)
      }
      const aiData = await resp.json()

      const newFields: string[] = []
      const updatedData = { ...formData }

      Object.keys(aiData).forEach(key => {
        if (aiData[key]) {
          updatedData[key] = aiData[key]
          newFields.push(key)
        }
      })

      // Update state per field
      Object.keys(updatedData).forEach(key => {
         updateField(key, updatedData[key])
      })

      setGlowFields(newFields)
      setToastMessage("AI Berhasil Memetakan Data")
      setShowToast(true)
      
      setTimeout(() => setGlowFields([]), 3000)
      setTimeout(() => setShowToast(false), 3000)

    } catch (error: any) {
      console.error(error)
      alert(error.message)
    } finally {
      setIsAiLoading(false)
    }
  }

  return (
    <div className="w-full space-y-4 p-4 bg-slate-100 min-h-screen print:bg-white print:p-0">
      {/* Header Aksi - Hilang saat Print */}
      <div className="flex justify-between items-center print:hidden">
        <div className="flex items-center">
            {showToast && (
              <div className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-full text-[10px] font-black border border-emerald-100 uppercase tracking-widest animate-in fade-in slide-in-from-left mr-4">
                <CheckCircle2 className="w-3 h-3 inline mr-1" /> {toastMessage}
              </div>
            )}
        </div>
        <div className="flex gap-2">
            <button 
                onClick={handleAiAutoFill}
                disabled={isAiLoading}
                className="bg-indigo-600 border border-indigo-700 text-white px-4 py-2 rounded shadow-sm text-xs font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all disabled:opacity-50"
            >
                {isAiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {isAiLoading ? 'Menganalisis CPPT...' : 'AI Auto-Fill Resume'}
            </button>
            {/* Simpan Button */}
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 text-[10px] font-black uppercase tracking-widest"
            >
              {isSaving ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Save className="w-3 h-3" />
              )}
              {isSaving ? "Menyimpan..." : "Simpan Resume"}
            </button>

            {/* Print Button - Sesuai Gambar 1 */}
            <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all active:scale-95 text-[10px] font-black uppercase tracking-widest">
              <Printer className="w-3 h-3" />
              Cetak Resume
            </button>
          </div>
        </div>

        {/* Message Indicators */}
        <div className="flex flex-col gap-2 mb-4">
          {showToast && (
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest animate-in fade-in slide-in-from-top-2 duration-300 ${toastMessage.toLowerCase().includes('berhasil') ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
              {toastMessage.toLowerCase().includes('berhasil') ? <CheckCircle2 className="w-3 h-3" /> : <Loader2 className="w-3 h-3" />}
              {toastMessage}
            </div>
          )}
        </div>

      <div className="bg-[#fdfdfd] border border-slate-300 shadow-md p-6 space-y-4 text-[13px] text-slate-700 max-w-5xl mx-auto print:shadow-none print:border-none print:max-w-full">
        <h2 className="text-sm font-bold border-b pb-2">::[ Data Resume Medis Pasien Rawat Jalan ]::</h2>

        {/* Header: No Rawat & Pasien */}
        <div className="grid grid-cols-12 gap-2 items-center">
          <label className="col-span-2 text-right pr-2">No.Rawat :</label>
          <div className="col-span-2 border border-slate-400 rounded-full px-3 py-1 bg-white">{patient?.no_rawat}</div>
          <div className="col-span-2 border border-slate-400 rounded-full px-3 py-1 bg-white">{patient?.no_rkm_medis}</div>
          <div className="col-span-6 border border-slate-400 rounded-full px-3 py-1 bg-white uppercase font-bold">{patient?.nm_pasien} ({patient?.tgl_lahir})</div>
          
          <label className="col-span-2 text-right pr-2">Dokter P.J. :</label>
          <div className="col-span-2 border border-slate-400 rounded-full px-3 py-1 bg-white">{patient?.kd_dokter}</div>
          <div className="col-span-4 border border-slate-400 rounded-full px-3 py-1 bg-white flex justify-between items-center group">
            <span className="truncate">{patient?.nm_dokter}</span>
            <Paperclip className="w-3 h-3 text-slate-400 cursor-pointer" />
          </div>
          <label className="col-span-2 text-right pr-2 font-bold">Kondisi Pasien Pulang :</label>
          <div className="col-span-2">
            <select 
              value={formData.kondisi_pulang} 
              onChange={(e) => updateField('kondisi_pulang', e.target.value)}
              className="w-full border border-slate-400 rounded px-2 py-1 bg-[#e0f2fe] text-blue-900 font-bold outline-none"
            >
              <option value="Hidup">Hidup</option>
              <option value="Meninggal">Meninggal</option>
            </select>
          </div>
        </div>

        {/* Input Area: Keluhan, Jalannya Penyakit, dll */}
        <div className="space-y-3 pt-4">
          <BigInput label="Keluhan Utama Riwayat Penyakit Yang Positif :" value={formData.keluhan_utama} onChange={(v: string) => updateField('keluhan_utama', v)} isGlow={glowFields.includes('keluhan_utama')} />
          <BigInput label="Jalannya Penyakit Selama Perawatan :" value={formData.jalannya_penyakit} onChange={(v: string) => updateField('jalannya_penyakit', v)} isGlow={glowFields.includes('jalannya_penyakit')} />
          <BigInput label="Pemeriksaan Penunjang Yang Positif :" value={formData.pemeriksaan_penunjang} onChange={(v: string) => updateField('pemeriksaan_penunjang', v)} isGlow={glowFields.includes('pemeriksaan_penunjang')} />
          <BigInput label="Hasil Laboratorium Yang Positif :" value={formData.hasil_laborat} onChange={(v: string) => updateField('hasil_laborat', v)} isGlow={glowFields.includes('hasil_laborat')} />
        </div>

        {/* Diagnosa & Prosedur - Sesuai Gambar 3 */}
        <div className="grid grid-cols-12 gap-x-4 pt-4 border-t border-dashed">
          <div className="col-span-8 font-bold text-slate-600">Diagnosa Akhir :</div>
          <div className="col-span-4 font-bold text-slate-600 pl-4">Kode ICD :</div>

          {/* List Diagnosa */}
          <DualInput label="Diagnosa Utama :" val1={formData.diagnosa_utama} val2={formData.kd_diagnosa_utama} on1={(v: string)=>updateField('diagnosa_utama',v)} on2={(v: string)=>updateField('kd_diagnosa_utama',v)} isGlow={glowFields.includes('diagnosa_utama')} />
          <DualInput label="Diagnosa Sekunder 1 :" val1={formData.diagnosa_sekunder} val2={formData.kd_diagnosa_sekunder} on1={(v: string)=>updateField('diagnosa_sekunder',v)} on2={(v: string)=>updateField('kd_diagnosa_sekunder',v)} isGlow={glowFields.includes('diagnosa_sekunder')} />
          <DualInput label="Diagnosa Sekunder 2 :" val1={formData.diagnosa_sekunder2} val2={formData.kd_diagnosa_sekunder2} on1={(v: string)=>updateField('diagnosa_sekunder2',v)} on2={(v: string)=>updateField('kd_diagnosa_sekunder2',v)} isGlow={glowFields.includes('diagnosa_sekunder2')} />
          <DualInput label="Diagnosa Sekunder 3 :" val1={formData.diagnosa_sekunder3} val2={formData.kd_diagnosa_sekunder3} on1={(v: string)=>updateField('diagnosa_sekunder3',v)} on2={(v: string)=>updateField('kd_diagnosa_sekunder3',v)} isGlow={glowFields.includes('diagnosa_sekunder3')} />
          <DualInput label="Diagnosa Sekunder 4 :" val1={formData.diagnosa_sekunder4} val2={formData.kd_diagnosa_sekunder4} on1={(v: string)=>updateField('diagnosa_sekunder4',v)} on2={(v: string)=>updateField('kd_diagnosa_sekunder4',v)} isGlow={glowFields.includes('diagnosa_sekunder4')} />
          
          <div className="col-span-12 my-2 border-b border-slate-200" />

          {/* List Prosedur */}
          <DualInput label="Prosedur Utama :" val1={formData.prosedur_utama} val2={formData.kd_prosedur_utama} on1={(v: string)=>updateField('prosedur_utama',v)} on2={(v: string)=>updateField('kd_prosedur_utama',v)} isGlow={glowFields.includes('prosedur_utama')} />
          <DualInput label="Prosedur Sekunder 1 :" val1={formData.prosedur_sekunder} val2={formData.kd_prosedur_sekunder} on1={(v: string)=>updateField('prosedur_sekunder',v)} on2={(v: string)=>updateField('kd_prosedur_sekunder',v)} isGlow={glowFields.includes('prosedur_sekunder')} />
          <DualInput label="Prosedur Sekunder 2 :" val1={formData.prosedur_sekunder2} val2={formData.kd_prosedur_sekunder2} on1={(v: string)=>updateField('prosedur_sekunder2',v)} on2={(v: string)=>updateField('kd_prosedur_sekunder2',v)} isGlow={glowFields.includes('prosedur_sekunder2')} />
          <DualInput label="Prosedur Sekunder 3 :" val1={formData.prosedur_sekunder3} val2={formData.kd_prosedur_sekunder3} on1={(v: string)=>updateField('prosedur_sekunder3',v)} on2={(v: string)=>updateField('kd_prosedur_sekunder3',v)} isGlow={glowFields.includes('prosedur_sekunder3')} />
        </div>

        {/* Obat Pulang - Sesuai Gambar 2 */}
        <div className="pt-4">
          <div className="grid grid-cols-12 gap-2">
            <label className="col-span-3 text-right pr-2">Obat-obatan Waktu Pulang/Nasihat :</label>
            <div className="col-span-9 flex items-start gap-2">
              <Paperclip className="w-4 h-4 mt-2 text-slate-400" />
              <textarea 
                className={`flex-1 border p-2 min-h-[100px] outline-none focus:ring-1 focus:ring-blue-500 transition-all ${glowFields.includes('obat_pulang') ? 'border-indigo-400 bg-indigo-50 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'border-slate-800 bg-white'}`}
                value={formData.obat_pulang || ""}
                onChange={(e) => updateField('obat_pulang', e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// --- Komponen Input Besar (Keluhan, dll) ---
function BigInput({ label, value, onChange, isGlow }: any) {
  return (
    <div className="grid grid-cols-12 gap-2">
      <label className="col-span-3 text-right pr-2">{label}</label>
      <div className="col-span-9 flex items-start gap-2">
        <div className="flex flex-col gap-1 mt-1">
          <Paperclip className="w-4 h-4 text-slate-400 cursor-pointer" />
          <Paperclip className="w-4 h-4 text-slate-400 cursor-pointer" />
        </div>
        <textarea 
          className={`flex-1 border p-2 min-h-[80px] outline-none text-[12px] font-mono transition-all ${isGlow ? 'border-indigo-400 bg-indigo-50 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'border-slate-800 bg-white'}`}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  )
}

// --- Komponen Baris Diagnosa/Prosedur + Kode ICD ---
function DualInput({ label, val1, val2, on1, on2, isGlow }: any) {
  return (
    <div className="col-span-12 grid grid-cols-12 gap-2 items-center mt-1">
      <label className="col-span-3 text-right pr-2">{label}</label>
      <div className={`col-span-6 border rounded-full px-3 py-0.5 transition-all ${isGlow ? 'border-indigo-400 bg-indigo-50 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'border-slate-400 bg-white'}`}>
        <input className="w-full bg-transparent outline-none" value={val1 || ""} onChange={(e)=>on1(e.target.value)} />
      </div>
      <div className={`col-span-3 border rounded-full px-3 py-0.5 ml-4 transition-all ${isGlow ? 'border-indigo-400 bg-indigo-50' : 'border-slate-400 bg-white'}`}>
        <input className="w-full bg-transparent outline-none text-center" value={val2 || ""} onChange={(e)=>on2(e.target.value)} />
      </div>
    </div>
  )
}