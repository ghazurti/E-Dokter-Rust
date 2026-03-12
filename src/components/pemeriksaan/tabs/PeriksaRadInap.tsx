"use client"

import React, { useState, useEffect } from 'react'
import { Monitor, Plus, Trash2, Search, Aperture, ClipboardCheck, Info, Tag, Loader2 } from 'lucide-react'
import { searchRadiologyInapAction, saveRadiologyRequestInapAction } from '@/app/pasien-rawat-inap/actions'

interface RadiologiInapTabProps {
  noRawat: string
  kdDokter: string
}

export default function RadiologiInapTab({ noRawat, kdDokter }: RadiologiInapTabProps) {
  const [selectedRadio, setSelectedRadio] = useState<any[]>([])
  const [searchRadio, setSearchRadio] = useState('')
  const [radioTemplates, setRadioTemplates] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Fetch Radiology Master Data
  useEffect(() => {
    const fetchTemplates = async () => {
      setIsLoading(true)
      const results = await searchRadiologyInapAction(searchRadio)
      setRadioTemplates(results)
      setIsLoading(false)
    }

    const timer = setTimeout(() => {
      fetchTemplates()
    }, 500)

    return () => clearTimeout(timer)
  }, [searchRadio])

  const addRadio = (item: any) => {
    if (!selectedRadio.find(r => r.kd_jenis_prw === item.kd_jenis_prw)) {
      setSelectedRadio([...selectedRadio, { ...item, informasi_klinis: '' }])
    }
  }

  const updateKlinis = (id: string, text: string) => {
    setSelectedRadio(selectedRadio.map(r => 
      r.kd_jenis_prw === id ? { ...r, informasi_klinis: text } : r
    ))
  }

  const handleSave = async () => {
    if (selectedRadio.length === 0) {
      alert('Pilih minimal satu tindakan radiologi!')
      return
    }

    setIsSaving(true)
    try {
      const payload = {
        no_rawat: noRawat,
        tests: selectedRadio.map(r => ({ kd_jenis_prw: r.kd_jenis_prw })),
        dokter_perujuk: kdDokter || "D0001",
        diagnosa_klinis: selectedRadio.map(r => r.informasi_klinis).filter(Boolean).join(", ") || "-",
        informasi_tambahan: "-"
      }

      const result = await saveRadiologyRequestInapAction(payload)
      
      if (result && (result.success !== false)) {
        alert('Permintaan Radiologi Berhasil Disimpan!')
        setSelectedRadio([])
      } else {
        throw new Error(result.error || 'Gagal menyimpan permintaan radiologi')
      }
    } catch (error: any) {
      console.error(error)
      alert(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* KIRI: CARI TINDAKAN RADIOLOGI */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white border border-slate-300 rounded-3xl shadow-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-2">
              <Search className="w-4 h-4" /> Cari Pemeriksaan
            </h3>
            <span className="text-[9px] font-black bg-amber-50 text-amber-600 px-2 py-0.5 rounded">RADIOLOGI</span>
          </div>

          <div className="relative mb-6">
            <input 
              className="w-full p-4 pl-12 border-2 border-slate-100 rounded-2xl text-xs font-bold bg-slate-50 focus:border-amber-500 focus:bg-white outline-none transition-all shadow-inner font-mono"
              placeholder="Cari Rontgen, USG, CT-Scan..."
              value={searchRadio}
              onChange={(e) => setSearchRadio(e.target.value.toUpperCase())}
            />
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
            {isLoading && <Loader2 className="w-4 h-4 animate-spin text-amber-500 absolute right-4 top-4" />}
          </div>

          <div className="space-y-2 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
            {radioTemplates.length === 0 && !isLoading ? (
              <div className="text-center py-10">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-relaxed">Tindakan Tidak Ditemukan</p>
              </div>
            ) : (
              radioTemplates.map((item) => (
                <div 
                  key={item.kd_jenis_prw}
                  onClick={() => addRadio(item)}
                  className="p-4 border border-slate-100 rounded-2xl hover:border-amber-300 hover:bg-amber-50 cursor-pointer transition-all flex justify-between items-center group bg-white shadow-sm"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                       <Tag className="w-3 h-3 text-amber-400" />
                       <p className="text-[9px] font-bold text-slate-400 tracking-tighter uppercase">{item.kd_jenis_prw}</p>
                    </div>
                    <p className="text-xs font-black text-slate-700 uppercase leading-tight">{item.nm_perawatan}</p>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-xl group-hover:bg-amber-500 group-hover:text-white transition-all shadow-sm">
                    <Plus className="w-4 h-4" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* KANAN: LIST PERMINTAAN */}
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white border border-slate-300 rounded-3xl shadow-xl overflow-hidden">
          <div className="bg-amber-600 p-4 px-8 flex justify-between items-center text-white">
            <h3 className="font-black uppercase tracking-wider text-[10px] flex items-center gap-2">
              <Aperture className="w-4 h-4" /> Daftar Permintaan Radiologi
            </h3>
            <div className="flex gap-2">
               <span className="bg-white/20 text-[10px] px-3 py-1 rounded-full font-black uppercase">
                 {selectedRadio.length} Tindakan
               </span>
            </div>
          </div>

          <div className="p-0 overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100 text-left">
                <tr>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase w-1/3">Tindakan</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase">Informasi Klinis / Diagnosa</th>
                  <th className="p-4 w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {selectedRadio.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-24 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Monitor className="w-16 h-16 text-slate-100" />
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">Keranjang Radiologi Kosong</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  selectedRadio.map((item) => (
                    <tr key={item.kd_jenis_prw} className="hover:bg-slate-50/50 group transition-colors">
                      <td className="p-4">
                        <p className="text-xs font-black text-slate-700 uppercase">{item.nm_perawatan}</p>
                        <p className="text-[9px] text-amber-500 font-bold uppercase tracking-tight">#{item.kd_jenis_prw}</p>
                      </td>
                      <td className="p-4">
                        <div className="relative group">
                          <textarea 
                            rows={1}
                            className="w-full p-3 pl-10 border-2 border-slate-100 rounded-2xl text-xs font-bold focus:border-amber-500 focus:bg-white bg-slate-50 outline-none transition-all resize-none shadow-inner"
                            placeholder="Contoh: Susp. Pneumonia..."
                            value={item.informasi_klinis}
                            onChange={(e) => updateKlinis(item.kd_jenis_prw, e.target.value)}
                          />
                          <Info className="w-4 h-4 text-slate-300 absolute left-3.5 top-3.5 group-focus-within:text-amber-500 transition-colors" />
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <button 
                          onClick={() => setSelectedRadio(selectedRadio.filter(r => r.kd_jenis_prw !== item.kd_jenis_prw))} 
                          className="p-2 hover:bg-red-50 text-red-200 hover:text-red-500 rounded-xl transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-col gap-3">
          <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <p className="text-[10px] text-amber-700 font-bold leading-relaxed">
              Pastikan Anda telah mengisi informasi klinis untuk setiap permintaan. Ini membantu dokter Spesialis Radiologi dalam memberikan ekspertise hasil foto.
            </p>
          </div>
          
          <button 
            onClick={handleSave}
            disabled={isSaving || selectedRadio.length === 0}
            className="w-full bg-slate-900 hover:bg-black text-white py-5 rounded-3xl font-black text-xs shadow-xl flex justify-center items-center gap-3 transition-all active:scale-95 uppercase tracking-widest disabled:opacity-50 group"
          >
            {isSaving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <ClipboardCheck className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
            )}
            {isSaving ? 'Menyimpan...' : 'Simpan & Kirim Ke Radiologi'}
          </button>
        </div>
      </div>
    </div>
  )
}