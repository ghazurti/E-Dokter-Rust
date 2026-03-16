"use client"

import { ClipboardList } from 'lucide-react'

interface SoapTabProps {
  formData: any
  updateField: (field: string, value: string) => void
  onSave?: (data: any) => Promise<void>
  isSaving?: boolean
}

export function SoapTab({ formData, updateField, onSave, isSaving }: SoapTabProps) {
  return (
    <div className="space-y-12 w-full">
      {/* Objective (Vital Signs) as per mockup */}
      <div className="space-y-6">
        <h3 className="text-sm font-black text-slate-900 tracking-[0.2em] uppercase flex items-center gap-2">
           <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
           Objective (Vital Signs)
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
           <VitalInput label="Tensi (mmHg)" placeholder="120/80" value={formData.tensi} onChange={(v) => updateField('tensi', v)} />
           <VitalInput label="Nadi (bpm)" placeholder="80" value={formData.nadi} onChange={(v) => updateField('nadi', v)} />
           <VitalInput label="Suhu (°C)" placeholder="36.5" value={formData.suhu} onChange={(v) => updateField('suhu', v)} />
           <VitalInput label="Respirasi (bpm)" placeholder="20" value={formData.respirasi} onChange={(v) => updateField('respirasi', v)} />
           <VitalInput label="SpO2 (%)" placeholder="98" value={formData.spo2} onChange={(v) => updateField('spo2', v)} />
           <VitalInput label="GCS" placeholder="15" value={formData.gcs} onChange={(v) => updateField('gcs', v)} />
           <VitalInput label="Berat (Kg)" placeholder="65" value={formData.berat} onChange={(v) => updateField('berat', v)} />
           <VitalInput label="Tinggi (Cm)" placeholder="170" value={formData.tinggi} onChange={(v) => updateField('tinggi', v)} />
           <VitalInput label="L. Perut (Cm)" placeholder="80" value={formData.lingkar_perut} onChange={(v) => updateField('lingkar_perut', v)} />
           <VitalInput label="L. Kepala (Cm)" placeholder="35" value={formData.lingkar_kepala} onChange={(v) => updateField('lingkar_kepala', v)} />
           <VitalInput label="L. Dada (Cm)" placeholder="33" value={formData.lingkar_dada} onChange={(v) => updateField('lingkar_dada', v)} />
           <div className="space-y-3">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Kesadaran</label>
             <select 
               className="w-full bg-slate-50 border-2 border-slate-100/50 rounded-2xl py-4 px-4 font-bold text-slate-700 outline-none focus:border-emerald-500 transition-all"
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

      {/* Text Entry Section */}
      <div className="space-y-8 pt-8 border-t border-slate-50">
        <h3 className="text-sm font-black text-slate-900 tracking-[0.2em] uppercase flex items-center gap-2">
           <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
           Text Entry
        </h3>
        <TextAreaField 
           label="Subjektif (S)" 
           placeholder="Keluhan utama dan riwayat penyakit..." 
           value={formData.keluhan} 
           onChange={(v) => updateField('keluhan', v)} 
        />
        <TextAreaField 
           label="Objektif (O)" 
           placeholder="Hasil pemeriksaan fisik..." 
           value={formData.pemeriksaan} 
           onChange={(v) => updateField('pemeriksaan', v)} 
        />
        <TextAreaField 
           label="Alergi" 
           placeholder="Riwayat alergi obat/makanan..." 
           value={formData.alergi} 
           onChange={(v) => updateField('alergi', v)} 
        />
        <TextAreaField 
           label="Analisa (A)" 
           placeholder="Assessment medis atau diagnosa kerja..." 
           value={formData.penilaian} 
           onChange={(v) => updateField('penilaian', v)} 
        />
        <TextAreaField 
           label="Plan (P)" 
           placeholder="Rencana terapi dan tindak lanjut..." 
           value={formData.tindak_lanjut} 
           onChange={(v) => updateField('tindak_lanjut', v)} 
        />
        <TextAreaField 
           label="Instruksi" 
           placeholder="Instruksi khusus untuk perawat/pasien..." 
           value={formData.instruksi} 
           onChange={(v) => updateField('instruksi', v)} 
        />
        <TextAreaField 
           label="Evaluasi" 
           placeholder="Evaluasi hasil tindakan..." 
           value={formData.evaluasi} 
           onChange={(v) => updateField('evaluasi', v)} 
        />
      </div>

      <div className="pt-8 flex justify-end">
        <button 
          onClick={() => onSave?.(formData)}
          disabled={isSaving}
          className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-xs hover:bg-emerald-600 transition-all flex items-center gap-3 shadow-xl active:scale-95 disabled:opacity-50"
        >
          {isSaving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <ClipboardList className="w-5 h-5" />
          )}
          {isSaving ? 'Menyimpan...' : 'Simpan SOAP & CPPT'}
        </button>
      </div>
    </div>
  )
}

function VitalInput({ label, placeholder, value, onChange }: { label: string, placeholder: string, value: string, onChange: (v: string) => void }) {
  return (
    <div className="space-y-3">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{label}</label>
      <input 
        type="text"
        placeholder={placeholder}
        className="w-full bg-slate-50 border-2 border-slate-100/50 rounded-2xl py-4 px-6 font-bold text-slate-700 outline-none focus:border-emerald-500 transition-all placeholder:text-slate-200"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

function TextAreaField({ label, placeholder, value, onChange }: { label: string, placeholder: string, value: string, onChange: (v: string) => void }) {
  return (
    <div className="space-y-4">
      <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest px-1">{label}</label>
      <textarea 
        className="w-full h-32 bg-slate-50 border-2 border-slate-100/50 rounded-3xl p-6 outline-none focus:border-emerald-500 transition-all font-medium text-slate-700 placeholder:text-slate-200 resize-none"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}
