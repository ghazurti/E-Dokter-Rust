"use client"

import React, { useState, useEffect } from 'react'
import { X, Send, Copy, CheckCircle2, UserCircle2, AlertCircle, Info, ClipboardCheck, Loader2 } from 'lucide-react'

interface AiSbarHandoverProps {
  noRawat: string;
  soapData: {
    keluhan: string;
    pemeriksaan: string;
    penilaian: string;
    rtl: string;
  };
  onClose: () => void;
  onSave: (sbarData: any) => void;
}

export function AiSbarHandover({ noRawat, soapData, onClose, onSave }: AiSbarHandoverProps) {
  const [doctors, setDoctors] = useState<any[]>([])
  const [selectedDoctor, setSelectedDoctor] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [tbakConfirmed, setTbakConfirmed] = useState(false)
  const [sbar, setSbar] = useState({
    situation: '',
    background: '',
    assessment: '',
    recommendation: ''
  })

  useEffect(() => {
    fetchDoctors()
    generateSbar()
  }, [])

  const fetchDoctors = async () => {
    try {
      const serviceUrl = process.env.NEXT_PUBLIC_RUST_SERVICE_URL || 'http://localhost:3001'
      const res = await fetch(`${serviceUrl}/doctors`)
      if (res.ok) {
        setDoctors(await res.json())
      }
    } catch (error) {
      console.error("Failed to fetch doctors:", error)
    }
  }

  const generateSbar = async () => {
    setIsGenerating(true)
    try {
      const serviceUrl = process.env.NEXT_PUBLIC_RUST_SERVICE_URL || 'http://localhost:3001'
      const notes = `Subjective: ${soapData.keluhan}\nObjective: ${soapData.pemeriksaan}\nAssessment: ${soapData.penilaian}\nPlan: ${soapData.rtl}`
      
      const res = await fetch(`${serviceUrl}/ai/sbar-summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes })
      })

      if (res.ok) {
        const data = await res.json()
        setSbar(data)
      } else {
        throw new Error('Gagal generate SBAR')
      }
    } catch (error) {
      console.error(error)
      alert("Gagal memproses SBAR AI. Silakan tulis manual.")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopy = () => {
    const text = `*LHAPORAN SBAR HANDOVER*\n\n*S (SITUATION):*\n${sbar.situation}\n\n*B (BACKGROUND):*\n${sbar.background}\n\n*A (ASSESSMENT):*\n${sbar.assessment}\n\n*R (RECOMMENDATION):*\n${sbar.recommendation}\n\n*STATUS TBAK:* ${tbakConfirmed ? 'TERKONFIRMASI ✅' : 'BELUM KONFIRMASI ⚠️'}\n*PENERIMA:* ${selectedDoctor || '...'}`
    
    navigator.clipboard.writeText(text)
    alert('SBAR berhasil disalin ke clipboard!')
  }

  const handleProcessSave = async () => {
    if (!selectedDoctor) {
      alert('Pilih Dokter Penerima laporan terlebih dahulu!')
      return
    }
    if (!tbakConfirmed) {
      alert('Anda harus mengonfirmasi protokol TBAK (Tulis, Baca, Konfirmasi) terlebih dahulu!')
      return
    }

    setIsSaving(true)
    try {
      await onSave({
        ...sbar,
        doctorReceiver: selectedDoctor,
        tbak: tbakConfirmed
      })
      onClose()
    } catch (error) {
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
        
        {/* MODAL HEADER */}
        <div className="p-8 bg-gradient-to-r from-indigo-600 to-blue-700 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center border border-white/20">
               <ClipboardCheck className="w-6 h-6 text-white" />
             </div>
             <div>
               <h2 className="text-xl font-black tracking-tight flex items-center gap-2">SBAR Handover 🏥</h2>
               <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest italic">Clinical Standardization & TBAK Protocol</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all text-white/50 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar flex-grow">
          
          {/* RECEIVER SELECTION */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-indigo-600">
               <UserCircle2 className="w-5 h-5 font-black" />
               <span className="text-[11px] font-black uppercase tracking-widest leading-none mt-0.5">Dokter Penerima Laporan</span>
            </div>
            <select 
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-5 font-bold text-slate-700 outline-none focus:border-indigo-400 transition-all appearance-none"
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
            >
              <option value="">-- Pilih Dokter Penerima --</option>
              {doctors.map(doc => (
                <option key={doc.kd_dokter} value={doc.nm_dokter}>{doc.nm_dokter}</option>
              ))}
            </select>
          </div>

          {/* SBAR CONTENT */}
          <div className="grid grid-cols-1 gap-6">
            <div className="p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100 space-y-4">
               {isGenerating ? (
                 <div className="py-12 flex flex-col items-center justify-center gap-4">
                    <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
                    <p className="text-xs font-black text-indigo-400 uppercase tracking-widest animate-pulse">AI Sedang Menyusun SBAR...</p>
                 </div>
               ) : (
                 <div className="space-y-6">
                   <SbarField label="Situation (Kondisi Saat Ini)" value={sbar.situation} onChange={(v) => setSbar({...sbar, situation: v})} />
                   <SbarField label="Background (Riwayat Medis)" value={sbar.background} onChange={(v) => setSbar({...sbar, background: v})} />
                   <SbarField label="Assessment (Analisis)" value={sbar.assessment} onChange={(v) => setSbar({...sbar, assessment: v})} />
                   <SbarField label="Recommendation (Saran & Instruksi)" value={sbar.recommendation} onChange={(v) => setSbar({...sbar, recommendation: v})} />
                 </div>
               )}
            </div>
          </div>

          {/* TBAK PROTOCOL */}
          <div className="p-6 bg-rose-50 rounded-3xl border border-rose-100 space-y-4">
             <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center shrink-0 border border-rose-200">
                  <AlertCircle className="w-4 h-4 text-rose-500 font-black" />
                </div>
                <div className="space-y-1">
                   <p className="text-[11px] font-bold text-rose-800 uppercase tracking-widest">Verifikasi Protokol TBAK</p>
                   <p className="text-[10px] text-rose-600/70 font-medium">Tulis kembali instruksi verbal, Bacakan ulang, dan Konfirmasi kebenaran instruksi (Read-Back).</p>
                </div>
             </div>
             
             <label className="flex items-center gap-3 p-4 bg-white rounded-2xl border-2 border-rose-100 cursor-pointer hover:border-rose-300 transition-all group">
                <input 
                  type="checkbox" 
                  checked={tbakConfirmed}
                  onChange={(e) => setTbakConfirmed(e.target.checked)}
                  className="w-5 h-5 rounded-lg border-2 border-rose-200 text-rose-500 focus:ring-rose-200" 
                />
                <span className="text-[11px] font-black text-rose-900 uppercase tracking-tight group-hover:text-rose-600 transition-colors italic">
                  Saya telah melakukan proses TBAK dengan dokter penerima.
                </span>
             </label>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="p-8 bg-slate-50 border-t flex flex-wrap gap-4 justify-between items-center shrink-0">
          <button 
            onClick={handleCopy}
            className="flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-widest hover:bg-white px-4 py-2 rounded-xl transition-all"
          >
            <Copy className="w-4 h-4" /> Copy SBAR (Share)
          </button>
          
          <div className="flex gap-4">
            <button onClick={onClose} className="px-6 py-3 text-slate-400 font-bold hover:text-slate-900 transition-all uppercase text-[10px] tracking-widest">Batal</button>
            <button 
              disabled={isSaving || isGenerating}
              onClick={handleProcessSave}
              className="bg-indigo-600 text-white px-8 py-4 rounded-3xl font-black text-xs hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95 flex items-center gap-3 uppercase tracking-widest disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {isSaving ? 'Menyimpan...' : 'Simpan ke CPPT'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function SbarField({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-indigo-800/60">
         <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></div>
         <span className="text-[10px] font-black uppercase tracking-widest leading-none">{label}</span>
      </div>
      <textarea 
        className="w-full bg-white border border-indigo-100 rounded-2xl p-4 text-xs font-bold text-slate-800 outline-none focus:border-indigo-300 transition-all resize-none min-h-[80px]"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}
