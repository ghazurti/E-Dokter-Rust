"use client"

import { Printer, Paperclip } from 'lucide-react'

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
  
  return (
    <div className="w-full space-y-4 p-4 bg-slate-100 min-h-screen print:bg-white print:p-0">
      {/* Header Aksi - Hilang saat Print */}
      <div className="flex justify-end print:hidden">
        <button 
          onClick={() => window.print()}
          className="bg-white border border-slate-300 px-4 py-2 rounded shadow-sm text-xs font-bold flex items-center gap-2 hover:bg-slate-50"
        >
          <Printer className="w-4 h-4" /> CETAK RESUME
        </button>
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
          <BigInput label="Keluhan Utama Riwayat Penyakit Yang Positif :" value={formData.keluhan_utama} onChange={(v) => updateField('keluhan_utama', v)} />
          <BigInput label="Jalannya Penyakit Selama Perawatan :" value={formData.jalannya_penyakit} onChange={(v) => updateField('jalannya_penyakit', v)} />
          <BigInput label="Pemeriksaan Penunjang Yang Positif :" value={formData.pemeriksaan_penunjang} onChange={(v) => updateField('pemeriksaan_penunjang', v)} />
          <BigInput label="Hasil Laboratorium Yang Positif :" value={formData.hasil_laborat} onChange={(v) => updateField('hasil_laborat', v)} />
        </div>

        {/* Diagnosa & Prosedur - Sesuai Gambar 3 */}
        <div className="grid grid-cols-12 gap-x-4 pt-4 border-t border-dashed">
          <div className="col-span-8 font-bold text-slate-600">Diagnosa Akhir :</div>
          <div className="col-span-4 font-bold text-slate-600 pl-4">Kode ICD :</div>

          {/* List Diagnosa */}
          <DualInput label="Diagnosa Utama :" val1={formData.diagnosa_utama} val2={formData.kd_diagnosa_utama} on1={(v)=>updateField('diagnosa_utama',v)} on2={(v)=>updateField('kd_diagnosa_utama',v)} />
          <DualInput label="Diagnosa Sekunder 1 :" val1={formData.diagnosa_sekunder} val2={formData.kd_diagnosa_sekunder} on1={(v)=>updateField('diagnosa_sekunder',v)} on2={(v)=>updateField('kd_diagnosa_sekunder',v)} />
          <DualInput label="Diagnosa Sekunder 2 :" val1={formData.diagnosa_sekunder2} val2={formData.kd_diagnosa_sekunder2} on1={(v)=>updateField('diagnosa_sekunder2',v)} on2={(v)=>updateField('kd_diagnosa_sekunder2',v)} />
          <DualInput label="Diagnosa Sekunder 3 :" val1={formData.diagnosa_sekunder3} val2={formData.kd_diagnosa_sekunder3} on1={(v)=>updateField('diagnosa_sekunder3',v)} on2={(v)=>updateField('kd_diagnosa_sekunder3',v)} />
          <DualInput label="Diagnosa Sekunder 4 :" val1={formData.diagnosa_sekunder4} val2={formData.kd_diagnosa_sekunder4} on1={(v)=>updateField('diagnosa_sekunder4',v)} on2={(v)=>updateField('kd_diagnosa_sekunder4',v)} />
          
          <div className="col-span-12 my-2 border-b border-slate-200" />

          {/* List Prosedur */}
          <DualInput label="Prosedur Utama :" val1={formData.prosedur_utama} val2={formData.kd_prosedur_utama} on1={(v)=>updateField('prosedur_utama',v)} on2={(v)=>updateField('kd_prosedur_utama',v)} />
          <DualInput label="Prosedur Sekunder 1 :" val1={formData.prosedur_sekunder} val2={formData.kd_prosedur_sekunder} on1={(v)=>updateField('prosedur_sekunder',v)} on2={(v)=>updateField('kd_prosedur_sekunder',v)} />
          <DualInput label="Prosedur Sekunder 2 :" val1={formData.prosedur_sekunder2} val2={formData.kd_prosedur_sekunder2} on1={(v)=>updateField('prosedur_sekunder2',v)} on2={(v)=>updateField('kd_prosedur_sekunder2',v)} />
          <DualInput label="Prosedur Sekunder 3 :" val1={formData.prosedur_sekunder3} val2={formData.kd_prosedur_sekunder3} on1={(v)=>updateField('prosedur_sekunder3',v)} on2={(v)=>updateField('kd_prosedur_sekunder3',v)} />
        </div>

        {/* Obat Pulang - Sesuai Gambar 2 */}
        <div className="pt-4">
          <div className="grid grid-cols-12 gap-2">
            <label className="col-span-3 text-right pr-2">Obat-obatan Waktu Pulang/Nasihat :</label>
            <div className="col-span-9 flex items-start gap-2">
              <Paperclip className="w-4 h-4 mt-2 text-slate-400" />
              <textarea 
                className="flex-1 border border-slate-800 p-2 min-h-[100px] outline-none bg-white focus:ring-1 focus:ring-blue-500"
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
function BigInput({ label, value, onChange }: any) {
  return (
    <div className="grid grid-cols-12 gap-2">
      <label className="col-span-3 text-right pr-2">{label}</label>
      <div className="col-span-9 flex items-start gap-2">
        <div className="flex flex-col gap-1 mt-1">
          <Paperclip className="w-4 h-4 text-slate-400 cursor-pointer" />
          <Paperclip className="w-4 h-4 text-slate-400 cursor-pointer" />
        </div>
        <textarea 
          className="flex-1 border border-slate-800 p-2 min-h-[80px] outline-none bg-white text-[12px] font-mono"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  )
}

// --- Komponen Baris Diagnosa/Prosedur + Kode ICD ---
function DualInput({ label, val1, val2, on1, on2 }: any) {
  return (
    <div className="col-span-12 grid grid-cols-12 gap-2 items-center mt-1">
      <label className="col-span-3 text-right pr-2">{label}</label>
      <div className="col-span-6 border border-slate-400 rounded-full px-3 py-0.5 bg-white">
        <input className="w-full bg-transparent outline-none" value={val1 || ""} onChange={(e)=>on1(e.target.value)} />
      </div>
      <div className="col-span-3 border border-slate-400 rounded-full px-3 py-0.5 bg-white ml-4">
        <input className="w-full bg-transparent outline-none text-center" value={val2 || ""} onChange={(e)=>on2(e.target.value)} />
      </div>
    </div>
  )
}