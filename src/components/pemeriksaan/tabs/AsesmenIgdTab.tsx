"use client"

import { Activity, Stethoscope, Save } from 'lucide-react'

export function AsesmenIgdTab({ formData, updateField, onSave, isSaving }: any) {
  return (
    <div className="space-y-10 pb-20">
      <section className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
        <h3 className="text-sm font-black text-slate-900 tracking-[0.2em] uppercase flex items-center gap-3">
          <div className="w-2 h-8 bg-blue-500 rounded-full"></div>
          I. Anamnesis IGD
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Metode Anamnesis</label>
            <select 
              className="w-full bg-slate-50 border-2 border-slate-100/50 rounded-2xl py-4 px-4 font-bold text-slate-700 outline-none focus:border-blue-500 transition-all"
              value={formData.anamnesis}
              onChange={(e) => updateField('anamnesis', e.target.value)}
            >
              <option value="Autoanamnesis">Autoanamnesis</option>
              <option value="Alloanamnesis">Alloanamnesis</option>
            </select>
          </div>
          <InputField label="Hubungan" value={formData.hubungan} onChange={(v: string) => updateField('hubungan', v)} placeholder="Jika Alloanamnesis..." />
        </div>

        <TextAreaField label="Keluhan Utama" value={formData.keluhan_utama} onChange={(v: string) => updateField('keluhan_utama', v)} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <TextAreaField label="Riwayat Penyakit Sekarang (RPS)" value={formData.rps} onChange={(v: string) => updateField('rps', v)} />
          <TextAreaField label="Riwayat Penyakit Dahulu (RPD)" value={formData.rpd} onChange={(v: string) => updateField('rpd', v)} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <TextAreaField label="Riwayat Penyakit Keluarga (RPK)" value={formData.rpk} onChange={(v: string) => updateField('rpk', v)} />
          <TextAreaField label="Riwayat Penggunaan Obat (RPO)" value={formData.rpo} onChange={(v: string) => updateField('rpo', v)} />
        </div>
        <InputField label="Riwayat Alergi" value={formData.alergi} onChange={(v: string) => updateField('alergi', v)} />
      </section>

      <section className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
        <h3 className="text-sm font-black text-slate-900 tracking-[0.2em] uppercase flex items-center gap-3">
          <div className="w-2 h-8 bg-emerald-500 rounded-full"></div>
          II. Pemeriksaan Fisik
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
           <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Keadaan Umum</label>
            <select 
              className="w-full bg-slate-50 border-2 border-slate-100/50 rounded-2xl py-4 px-4 font-bold text-slate-700 outline-none focus:border-emerald-500 transition-all"
              value={formData.keadaan}
              onChange={(e) => updateField('keadaan', e.target.value)}
            >
              {['Sehat','Sakit Ringan','Sakit Sedang','Sakit Berat'].map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Kesadaran</label>
            <select 
              className="w-full bg-slate-50 border-2 border-slate-100/50 rounded-2xl py-4 px-4 font-bold text-slate-700 outline-none focus:border-emerald-500 transition-all"
              value={formData.kesadaran}
              onChange={(e) => updateField('kesadaran', e.target.value)}
            >
              {['Compos Mentis','Apatis','Somnolen','Sopor','Koma'].map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <InputField label="GCS (E,V,M)" value={formData.gcs} onChange={(v: string) => updateField('gcs', v)} />
          <InputField label="TD (mmHg)" value={formData.td} onChange={(v: string) => updateField('td', v)} />
          <InputField label="Nadi (x/mnt)" value={formData.nadi} onChange={(v: string) => updateField('nadi', v)} />
          <InputField label="RR (x/mnt)" value={formData.rr} onChange={(v: string) => updateField('rr', v)} />
          <InputField label="Suhu (°C)" value={formData.suhu} onChange={(v: string) => updateField('suhu', v)} />
          <InputField label="SpO2 (%)" value={formData.spo} onChange={(v: string) => updateField('spo', v)} />
          <InputField label="BB (Kg)" value={formData.bb} onChange={(v: string) => updateField('bb', v)} />
          <InputField label="TB (cm)" value={formData.tb} onChange={(v: string) => updateField('tb', v)} />
        </div>

        <div className="space-y-6 pt-6 border-t border-slate-50">
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Pemeriksaan Sistemik</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             <SystemicToggle label="Kepala" value={formData.kepala} onChange={(v: string) => updateField('kepala', v)} />
             <SystemicToggle label="Mata" value={formData.mata} onChange={(v: string) => updateField('mata', v)} />
             <SystemicToggle label="Gigi & Mulut" value={formData.gigi} onChange={(v: string) => updateField('gigi', v)} />
             <SystemicToggle label="Leher" value={formData.leher} onChange={(v: string) => updateField('leher', v)} />
             <SystemicToggle label="Thoraks" value={formData.thoraks} onChange={(v: string) => updateField('thoraks', v)} />
             <SystemicToggle label="Abdomen" value={formData.abdomen} onChange={(v: string) => updateField('abdomen', v)} />
             <SystemicToggle label="Genital" value={formData.genital} onChange={(v: string) => updateField('genital', v)} />
             <SystemicToggle label="Ekstremitas" value={formData.ekstremitas} onChange={(v: string) => updateField('ekstremitas', v)} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
          <TextAreaField label="Keterangan Fisik" value={formData.ket_fisik} onChange={(v: string) => updateField('ket_fisik', v)} />
          <TextAreaField label="Keterangan Lokalis" value={formData.ket_lokalis} onChange={(v: string) => updateField('ket_lokalis', v)} />
        </div>
      </section>

      <section className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
        <h3 className="text-sm font-black text-slate-900 tracking-[0.2em] uppercase flex items-center gap-3">
          <div className="w-2 h-8 bg-amber-500 rounded-full"></div>
          III. Penunjang & Diagnosa
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <TextAreaField label="Hasil EKG" value={formData.ekg} onChange={(v: string) => updateField('ekg', v)} />
          <TextAreaField label="Hasil Radiologi" value={formData.rad} onChange={(v: string) => updateField('rad', v)} />
          <TextAreaField label="Hasil Laborat" value={formData.lab} onChange={(v: string) => updateField('lab', v)} />
        </div>
        
        <TextAreaField label="Diagnosis" value={formData.diagnosis} onChange={(v: string) => updateField('diagnosis', v)} />
        <TextAreaField label="Tata Laksana / Rencana" value={formData.tata} onChange={(v: string) => updateField('tata', v)} />
      </section>

      <div className="pt-8 flex justify-end">
        <button 
          onClick={onSave}
          disabled={isSaving}
          className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-xs hover:bg-rose-600 transition-all flex items-center gap-3 shadow-xl active:scale-95 disabled:opacity-50"
        >
          {isSaving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <Save className="w-5 h-5 text-rose-400" />
          )}
          {isSaving ? 'Menyimpan...' : 'Simpan Asesmen IGD'}
        </button>
      </div>
    </div>
  )
}

function InputField({ label, value, onChange, placeholder }: any) {
  return (
    <div className="space-y-3">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{label}</label>
      <input 
        type="text"
        className="w-full bg-slate-50 border-2 border-slate-100/50 rounded-2xl py-4 px-6 font-bold text-slate-700 outline-none focus:border-blue-500 transition-all placeholder:text-slate-300"
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
        className="w-full h-32 bg-slate-50 border-2 border-slate-100/50 rounded-[2rem] p-6 font-medium text-slate-700 outline-none focus:border-blue-500 transition-all placeholder:text-slate-200 resize-none"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  )
}

function SystemicToggle({ label, value, onChange }: any) {
  return (
    <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 flex flex-col gap-3">
      <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider">{label}</label>
      <div className="flex flex-wrap gap-1.5">
        {['Normal', 'Abnormal', 'Tidak Diperiksa'].map((s) => (
          <button
            key={s}
            onClick={() => onChange(s)}
            className={`flex-1 px-2 py-2 rounded-xl text-[9px] font-bold transition-all ${
              value === s ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50'
            }`}
          >
            {s === 'Tidak Diperiksa' ? 'T.D' : s}
          </button>
        ))}
      </div>
    </div>
  )
}
