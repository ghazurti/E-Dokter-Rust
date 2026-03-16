"use client"

import { useState } from 'react'
import { Search, AlertCircle } from 'lucide-react'
import { searchIcdAction } from '@/app/pasien-rawat-jalan/actions'

interface IcdTabProps {
  formData: any
  updateField: (field: string, value: string) => void
  onSave?: () => Promise<void>
  isSaving?: boolean
}

export function IcdTab({ formData, updateField, onSave, isSaving }: IcdTabProps) {
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

  return (
    <div className="space-y-8 w-full max-w-2xl mx-auto">
      <div className="bg-amber-50 rounded-[2rem] p-8 border border-amber-100 flex items-start gap-6">
        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm shrink-0">
           <AlertCircle className="w-6 h-6 text-amber-500" />
        </div>
        <p className="text-sm font-bold text-amber-700 leading-relaxed px-1">
           Pencarian Diagnosa menggunakan standar ICD-10. Silakan masukkan kode atau nama penyakit untuk akurasi pelaporan SIMRS.
        </p>
      </div>

      <div className="relative">
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-1">Cari Diagnosa (A)</label>
        <div className="relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
          <input 
            type="text"
            placeholder="Ketik ICD-10 atau Nama Penyakit..."
            className="w-full bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] py-5 pl-16 pr-8 font-bold outline-none focus:border-emerald-500 transition-all text-slate-900"
            value={icdSearch}
            onChange={(e) => handleIcdSearch(e.target.value)}
          />
        </div>
        
        {icdResults.length > 0 && (
          <div className="absolute z-50 top-full left-0 right-0 mt-4 bg-white rounded-[1.5rem] border border-slate-100 shadow-2xl overflow-hidden max-h-[400px] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-300">
             {icdResults.map(res => (
               <button 
                  key={res.kd}
                  onClick={() => {
                    updateField('penilaian', res.nm);
                    setIcdSearch(`${res.kd} - ${res.nm}`);
                    setIcdResults([]);
                  }}
                  className="w-full text-left px-8 py-5 hover:bg-slate-50 flex items-center justify-between border-b border-slate-50 last:border-0 transition-colors"
               >
                  <span className="font-bold text-slate-800">{res.nm}</span>
                  <span className="bg-slate-100 text-slate-500 px-3 py-1.5 rounded-xl text-[10px] font-black">{res.kd}</span>
               </button>
             ))}
          </div>
        )}
      </div>

      <div className="pt-8 border-t border-slate-50">
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-1">Terpilih saat ini</label>
        <div className="bg-emerald-50/50 p-8 rounded-[2rem] border-2 border-dashed border-emerald-100">
           {formData.penilaian ? (
              <div className="text-emerald-900 font-extrabold text-lg flex items-center gap-3">
                 <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                 {formData.penilaian}
              </div>
           ) : (
              <p className="text-slate-300 font-bold italic">Belum ada diagnosa dipilih.</p>
           )}
        </div>
      </div>

      <div className="pt-8 flex justify-end">
        <button 
          onClick={onSave}
          disabled={isSaving || !formData.penilaian}
          className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-xs hover:bg-emerald-600 transition-all flex items-center gap-3 shadow-xl active:scale-95 disabled:opacity-50 min-w-[200px] justify-center"
        >
          {isSaving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <Search className="w-5 h-5 text-emerald-400" />
          )}
          {isSaving ? 'Menyimpan...' : 'Simpan Diagnosa'}
        </button>
      </div>
    </div>
  )
}
