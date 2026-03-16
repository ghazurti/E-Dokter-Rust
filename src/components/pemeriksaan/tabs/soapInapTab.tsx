"use client"

import { Activity, Thermometer, Gauge, Wind, Scale, Weight, Brain, FileText, ClipboardCheck, MessageSquare, History, Calendar, Clock, User } from 'lucide-react'

export default function SoapInapTab({ formData = {}, updateField, history = [], onSave, isSaving }: any) {
  return (
    <div className="space-y-12">
      {/* 1. Vital Signs Card */}
      <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm p-10">
        <h3 className="text-xs font-black text-blue-600 mb-8 uppercase tracking-[0.2em] flex items-center gap-2">
          <Activity className="w-4 h-4" /> Pemeriksaan Fisik & Vital Signs
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
          <VitalInput label="Suhu (°C)" value={formData?.suhu_tubuh || ''} onChange={(v:any) => updateField('suhu_tubuh', v)} icon={Thermometer} color="text-orange-500" />
          <VitalInput label="Tensi (mmHg)" value={formData?.tensi || ''} onChange={(v:any) => updateField('tensi', v)} icon={Gauge} color="text-blue-500" />
          <VitalInput label="Nadi (/mnt)" value={formData?.nadi || ''} onChange={(v:any) => updateField('nadi', v)} icon={Activity} color="text-red-500" />
          <VitalInput label="Respirasi (/mnt)" value={formData?.respirasi || ''} onChange={(v:any) => updateField('respirasi', v)} icon={Wind} color="text-emerald-500" />
          <VitalInput label="SpO2 (%)" value={formData?.spo2 || ''} onChange={(v:any) => updateField('spo2', v)} icon={Activity} color="text-blue-600" />
          <VitalInput label="GCS(E,V,M)" value={formData?.gcs || ''} onChange={(v:any) => updateField('gcs', v)} icon={Brain} color="text-purple-500" />
          <VitalInput label="Berat (Kg)" value={formData?.berat || ''} onChange={(v:any) => updateField('berat', v)} icon={Scale} color="text-slate-600" />
          <VitalInput label="Tinggi (Cm)" value={formData?.tinggi || ''} onChange={(v:any) => updateField('tinggi', v)} icon={Weight} color="text-slate-600" />
          
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kesadaran</label>
            <select 
              className="w-full p-4 border-2 border-slate-100 rounded-2xl text-xs font-bold bg-slate-50 focus:border-blue-500 focus:bg-white transition-all outline-none shadow-inner"
              value={formData?.kesadaran || 'Compos Mentis'}
              onChange={(e) => updateField('kesadaran', e.target.value)}
            >
              <option>Compos Mentis</option>
              <option>Somnolence</option>
              <option>Sopor</option>
              <option>Coma</option>
              <option>Alert</option>
              <option>Confusion</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. SOAP Narrative Card */}
      <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm p-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <SoapTextArea label="Subjektif (S) - Keluhan" value={formData?.keluhan || ''} onChange={(v:any) => updateField('keluhan', v)} placeholder="Keluhan pasien..." />
          <SoapTextArea label="Objektif (O) - Pemeriksaan" value={formData?.pemeriksaan || ''} onChange={(v:any) => updateField('pemeriksaan', v)} placeholder="Hasil pemeriksaan fisik..." />
          <SoapTextArea label="Asesmen (A) - Penilaian" value={formData?.penilaian || ''} onChange={(v:any) => updateField('penilaian', v)} placeholder="Analisis/Diagnosa..." />
          <SoapTextArea label="Plan (P) - RTL" value={formData?.rtl || ''} onChange={(v:any) => updateField('rtl', v)} placeholder="Rencana tindak lanjut..." />
        </div>
      </div>

      {/* 3. Instruksi & Evaluasi */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm p-8">
          <label className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4" /> Instruksi Tenaga Medis
          </label>
          <textarea 
            className="w-full p-5 border-2 border-slate-50 rounded-3xl text-sm bg-slate-50 focus:bg-white focus:border-amber-400 transition-all outline-none min-h-[120px] shadow-inner font-medium"
            value={formData?.instruksi || ''}
            onChange={(e) => updateField('instruksi', e.target.value)}
          />
        </div>
        <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm p-8">
          <label className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" /> Evaluasi
          </label>
          <textarea 
            className="w-full p-5 border-2 border-slate-50 rounded-3xl text-sm bg-slate-50 focus:bg-white focus:border-indigo-400 transition-all outline-none min-h-[120px] shadow-inner font-medium"
            value={formData?.evaluasi || ''}
            onChange={(e) => updateField('evaluasi', e.target.value)}
          />
        </div>
      </div>

      {/* Alergi & NIP */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1">
          <label className="text-[10px] font-black text-red-500 uppercase tracking-widest ml-1">Riwayat Alergi</label>
          <input 
            className="w-full p-5 border-2 border-red-50 rounded-3xl text-xs font-bold text-red-600 bg-red-50/20 focus:border-red-200 outline-none shadow-inner"
            value={formData?.alergi || '-'}
            onChange={(e) => updateField('alergi', e.target.value)}
          />
        </div>
        <div className="md:w-1/4">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">NIP Petugas</label>
          <div className="w-full p-5 border-2 border-slate-50 rounded-3xl text-xs font-black bg-slate-100/50 text-slate-500 flex items-center gap-3">
             <User className="w-4 h-4 text-slate-300" />
             {formData?.nip || 'D0001'}
          </div>
        </div>
      </div>

      <div className="pt-8 flex justify-end">
        <button 
          onClick={() => onSave?.(formData)}
          disabled={isSaving}
          className="bg-slate-900 text-white px-10 py-5 rounded-[2rem] font-black text-xs hover:bg-emerald-600 transition-all flex items-center gap-3 shadow-xl active:scale-95 disabled:opacity-50"
        >
          {isSaving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <ClipboardCheck className="w-6 h-6 text-emerald-400" />
          )}
          {isSaving ? 'Menyimpan...' : 'Simpan SOAP & CPPT'}
        </button>
      </div>

      {/* 4. SOAP HISTORY SECTION */}
      <div className="pt-12 border-t border-slate-200">
        <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.3em] flex items-center gap-3">
                <History className="w-5 h-5 text-slate-400" /> Riwayat Pemeriksaan SOAP
            </h3>
            <div className="bg-slate-100 px-4 py-1.5 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-widest">
                {history.length} Catatan
            </div>
        </div>

        {history.length === 0 ? (
            <div className="bg-slate-50 rounded-[2.5rem] p-20 text-center border-2 border-dashed border-slate-200">
                <FileText className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Belum ada riwayat SOAP untuk pasien ini</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 gap-6">
                {history.map((item: any, idx: number) => (
                    <div key={idx} className="bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:shadow-xl hover:border-blue-100 transition-all duration-500 group overflow-hidden">
                        <div className="bg-slate-50/50 px-8 py-4 border-b border-slate-50 flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-800 uppercase italic">
                                    <Calendar className="w-3.5 h-3.5 text-blue-500" /> {item.tgl_perawatan}
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase">
                                    <Clock className="w-3.5 h-3.5" /> {item.jam_rawat}
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <User className="w-3.5 h-3.5" /> {item.nip}
                            </div>
                        </div>
                        <div className="p-8 grid grid-cols-1 md:grid-cols-4 gap-8">
                            <div className="col-span-1 border-r border-slate-50 pr-8">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Vital Signs</p>
                                <div className="grid grid-cols-2 gap-y-4">
                                    <HistoryStat label="Suhu" value={`${item.suhu}°C`} />
                                    <HistoryStat label="Tensi" value={item.tensi} />
                                    <HistoryStat label="Nadi" value={item.nadi} />
                                    <HistoryStat label="Resp" value={item.respirasi} />
                                    <HistoryStat label="SpO2" value={`${item.spo2}%`} />
                                    <HistoryStat label="GCS" value={item.gcs} />
                                </div>
                            </div>
                            <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-8">
                                <HistoryText label="Subjektif" text={item.keluhan} />
                                <HistoryText label="Objektif" text={item.pemeriksaan} />
                                <HistoryText label="Asesmen" text={item.penilaian} />
                                <HistoryText label="Planning" text={item.rtl} />
                                {item.instruksi && <HistoryText label="Instruksi" text={item.instruksi} border="border-amber-100 bg-amber-50/30 text-amber-800" />}
                                {item.evaluasi && <HistoryText label="Evaluasi" text={item.evaluasi} border="border-indigo-100 bg-indigo-50/30 text-indigo-800" />}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  )
}

function HistoryStat({ label, value }: any) {
    return (
        <div>
            <p className="text-[8px] font-black text-slate-300 uppercase leading-none">{label}</p>
            <p className="text-xs font-black text-slate-700 mt-1">{value || '-'}</p>
        </div>
    )
}

function HistoryText({ label, text, border = "border-slate-50 bg-slate-50/30 text-slate-600" }: any) {
    if (!text || text === '-') return null;
    return (
        <div className={`p-4 rounded-2xl border ${border} space-y-2 translate-y-0 hover:-translate-y-1 transition-transform`}>
            <p className="text-[9px] font-black uppercase tracking-widest opacity-40 leading-none">{label}</p>
            <p className="text-[11px] font-medium leading-relaxed">{text}</p>
        </div>
    )
}

function VitalInput({ label, value, onChange, icon: Icon, color }: any) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1.5 ml-1">
        <Icon className={`w-3 h-3 ${color}`} /> {label}
      </label>
      <input 
        className="w-full p-4 border-2 border-slate-100 rounded-2xl text-xs font-black text-slate-700 bg-slate-50 focus:border-blue-500 focus:bg-white transition-all text-center outline-none shadow-inner"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

function SoapTextArea({ label, value, onChange, placeholder }: any) {
  return (
    <div className="space-y-3">
      <label className="text-[11px] font-black text-slate-600 uppercase tracking-[0.2em] ml-2">{label}</label>
      <textarea 
        className="w-full p-6 border-2 border-slate-50 rounded-[2rem] text-sm font-medium bg-slate-50/50 min-h-[140px] outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner leading-relaxed"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  )
}