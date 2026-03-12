"use client"

import React, { useState, useEffect } from 'react'
import { Beaker, Plus, Trash2, Search, TestTube, ClipboardCheck, ChevronDown, ChevronRight, CheckSquare, Square, Loader2 } from 'lucide-react'
import { searchLabInapAction, getLabTemplateInapAction, saveLabRequestInapAction } from '@/app/pasien-rawat-inap/actions'

interface LabInapTabProps {
  noRawat: string
  kdDokter: string
  kdPoli: string
}

export default function LabInapTab({ noRawat, kdDokter, kdPoli }: LabInapTabProps) {
  const [selectedItems, setSelectedItems] = useState<any[]>([])
  const [searchLab, setSearchLab] = useState('')
  const [labTemplates, setLabTemplates] = useState<any[]>([])
  const [expandedParent, setExpandedParent] = useState<string | null>(null)
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [notes, setNotes] = useState({ diagnosa: '', informasi: '' })

  // Fetch Lab Templates (Master)
  useEffect(() => {
    const fetchTemplates = async () => {
      if (searchLab.trim().length === 0) {
        setLabTemplates([])
        return
      }
      setIsLoadingTemplates(true)
      const results = await searchLabInapAction(searchLab)
      // Initialize with empty templates array for each master test
      setLabTemplates(results.map((r: any) => ({ ...r, templates: [] })))
      setIsLoadingTemplates(false)
    }

    const timer = setTimeout(() => {
      fetchTemplates()
    }, 500)

    return () => clearTimeout(timer)
  }, [searchLab])

  // Fetch Sub-items (Templates) when expanded
  useEffect(() => {
    const fetchSubItems = async () => {
      if (expandedParent) {
        const parentIndex = labTemplates.findIndex(p => p.kd_jenis_prw === expandedParent)
        if (parentIndex !== -1 && labTemplates[parentIndex].templates.length === 0) {
          const subItems = await getLabTemplateInapAction(expandedParent)
          setLabTemplates(prev => prev.map(p => 
            p.kd_jenis_prw === expandedParent ? { ...p, templates: subItems } : p
          ))
        }
      }
    }
    fetchSubItems()
  }, [expandedParent])

  // Fungsi pilih/hapus sub-item pemeriksaan
  const toggleSubItem = (parent: any, subItem: any) => {
    const itemKey = `${parent.kd_jenis_prw}-${subItem.id_template}`
    if (selectedItems.find(item => item.key === itemKey)) {
      setSelectedItems(selectedItems.filter(item => item.key !== itemKey))
    } else {
      setSelectedItems([...selectedItems, { 
        key: itemKey,
        kd_jenis_prw: parent.kd_jenis_prw,
        parent_name: parent.nm_perawatan,
        ...subItem 
      }])
    }
  }

  const toggleAllSubItems = (parent: any) => {
    const allParentSubItems = parent.templates.map((sub: any) => ({
      key: `${parent.kd_jenis_prw}-${sub.id_template}`,
      kd_jenis_prw: parent.kd_jenis_prw,
      parent_name: parent.nm_perawatan,
      ...sub
    }))

    const alreadySelectedInParent = selectedItems.filter(item => item.kd_jenis_prw === parent.kd_jenis_prw)
    
    if (alreadySelectedInParent.length === parent.templates.length) {
      // Unselect all in this parent
      setSelectedItems(selectedItems.filter(item => item.kd_jenis_prw !== parent.kd_jenis_prw))
    } else {
      // Select all in this parent (avoid duplicates from other parents)
      const otherItems = selectedItems.filter(item => item.kd_jenis_prw !== parent.kd_jenis_prw)
      setSelectedItems([...otherItems, ...allParentSubItems])
    }
  }

  const handleSave = async () => {
    if (selectedItems.length === 0) {
      alert('Pilih minimal satu item pemeriksaan!')
      return
    }

    setIsSaving(true)
    try {
      // Group items by kd_jenis_prw
      const grouped = selectedItems.reduce((acc: any, item: any) => {
        if (!acc[item.kd_jenis_prw]) {
          acc[item.kd_jenis_prw] = []
        }
        acc[item.kd_jenis_prw].push(item.id_template)
        return acc
      }, {})

      const tests = Object.keys(grouped).map(kd => ({
        kd_jenis_prw: kd,
        id_templates: grouped[kd]
      }))

      const payload = {
        no_rawat: noRawat,
        tests: tests,
        dokter_perujuk: kdDokter || "D0001",
        diagnosa_klinis: notes.diagnosa || "-",
        informasi_tambahan: notes.informasi || "-"
      }

      const result = await saveLabRequestInapAction(payload)
      
      if (typeof result === 'string' || (result && result.success !== false)) {
        alert('Permintaan Laborat Berhasil Disimpan!')
        setSelectedItems([])
        setNotes({ diagnosa: '', informasi: '' })
      } else {
        throw new Error(result.error || 'Gagal menyimpan permintaan')
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
      {/* KIRI: CARI & PILIH TEMPLATE */}
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-white border border-slate-300 rounded-3xl shadow-xl p-6">
          <h3 className="text-[10px] font-black text-indigo-600 mb-4 uppercase tracking-widest flex items-center gap-2">
            <Search className="w-4 h-4" /> Pilih Paket Laborat
          </h3>

          <div className="relative mb-4">
            <input 
              className="w-full p-4 pl-12 border-2 border-slate-100 rounded-2xl text-xs font-bold bg-slate-50 outline-none focus:border-indigo-500 transition-all font-mono"
              placeholder="Cari Darah Rutin, Urine..."
              value={searchLab}
              onChange={(e) => setSearchLab(e.target.value.toUpperCase())}
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
            {isLoadingTemplates && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500 animate-spin" />}
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {labTemplates.length === 0 && !isLoadingTemplates ? (
              <div className="text-center py-10">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Pemeriksaan Tidak Ditemukan</p>
              </div>
            ) : (
              labTemplates.map((parent) => (
                <div key={parent.kd_jenis_prw} className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm bg-white">
                  {/* Header Paket */}
                  <div 
                    onClick={() => setExpandedParent(expandedParent === parent.kd_jenis_prw ? null : parent.kd_jenis_prw)}
                    className={`p-4 cursor-pointer flex justify-between items-center transition-all ${expandedParent === parent.kd_jenis_prw ? 'bg-indigo-600 text-white' : 'bg-white hover:bg-slate-50'}`}
                  >
                    <div>
                      <p className={`text-[10px] font-black uppercase ${expandedParent === parent.kd_jenis_prw ? 'text-indigo-200' : 'text-slate-400'}`}>#{parent.kd_jenis_prw}</p>
                      <p className="text-xs font-black uppercase">{parent.nm_perawatan}</p>
                    </div>
                    {expandedParent === parent.kd_jenis_prw ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </div>

                  {/* List Sub-Item (Akan muncul saat diklik) */}
                  {expandedParent === parent.kd_jenis_prw && (
                    <div className="bg-slate-50 p-2 space-y-1 border-t border-indigo-500">
                      {parent.templates.length === 0 ? (
                        <div className="p-4 text-center">
                          <Loader2 className="w-4 h-4 animate-spin text-indigo-500 mx-auto" />
                        </div>
                      ) : (
                        <>
                          <div 
                            onClick={() => toggleAllSubItems(parent)}
                            className="p-3 mb-2 rounded-xl flex items-center gap-3 cursor-pointer bg-white border border-slate-200 hover:border-indigo-300 transition-all font-black text-[9px] text-indigo-600 uppercase tracking-widest"
                          >
                            <CheckSquare className="w-4 h-4" />
                            PILIH SEMUA {parent.nm_perawatan}
                          </div>
                          {parent.templates.map((sub: any) => {
                            const isSelected = selectedItems.find(i => i.key === `${parent.kd_jenis_prw}-${sub.id_template}`)
                            return (
                              <div 
                                key={sub.id_template}
                                onClick={() => toggleSubItem(parent, sub)}
                                className={`p-3 rounded-xl flex items-center gap-3 cursor-pointer transition-all ${isSelected ? 'bg-indigo-100 border-indigo-200' : 'hover:bg-white'}`}
                              >
                                {isSelected ? <CheckSquare className="w-4 h-4 text-indigo-600" /> : <Square className="w-4 h-4 text-slate-300" />}
                                <div className="flex-1">
                                  <p className="text-[11px] font-bold text-slate-700 uppercase">{sub.pemeriksaan}</p>
                                  <p className="text-[9px] text-slate-400 font-bold uppercase">Satuan: {sub.satuan || '-'}</p>
                                </div>
                              </div>
                            )
                          })}
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* KANAN: KERANJANG PERMINTAAN */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white border border-slate-300 rounded-3xl shadow-xl overflow-hidden">
          <div className="bg-indigo-900 p-4 px-8 flex justify-between items-center">
            <h3 className="font-black text-white uppercase tracking-wider text-[10px] flex items-center gap-2">
              <TestTube className="w-4 h-4" /> Detail Permintaan Lab
            </h3>
            <span className="bg-indigo-500 text-white text-[10px] px-3 py-1 rounded-full font-black">
              {selectedItems.length} ITEM TERPILIH
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="p-4 text-left text-[10px] font-black text-slate-400 uppercase">Pemeriksaan</th>
                  <th className="p-4 text-left text-[10px] font-black text-slate-400 uppercase text-center">Satuan</th>
                  <th className="p-4 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {selectedItems.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-20 text-center">
                      <Beaker className="w-12 h-12 text-slate-100 mx-auto mb-2" />
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Silakan pilih item di kiri</p>
                    </td>
                  </tr>
                ) : (
                  selectedItems.map((item) => (
                    <tr key={item.key} className="hover:bg-slate-50/50 transition-all">
                      <td className="p-4">
                        <p className="text-[9px] font-black text-indigo-500 uppercase">{item.parent_name}</p>
                        <p className="text-xs font-black text-slate-700 uppercase">{item.pemeriksaan}</p>
                      </td>
                      <td className="p-4 text-center text-xs font-bold text-slate-400 font-mono">{item.satuan || '-'}</td>
                      <td className="p-4">
                        <button onClick={() => setSelectedItems(selectedItems.filter(i => i.key !== item.key))} className="text-red-300 hover:text-red-600 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Notes Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-1">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Diagnosa Klinis</label>
            <textarea 
              className="w-full h-32 p-6 bg-white border-2 border-slate-100 rounded-[2rem] outline-none focus:border-indigo-500 transition-all text-xs font-bold text-slate-700 placeholder:text-slate-300 shadow-inner"
              placeholder="Tulis diagnosa klinis..."
              value={notes.diagnosa}
              onChange={(e) => setNotes({...notes, diagnosa: e.target.value})}
            />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Informasi Tambahan</label>
            <textarea 
              className="w-full h-32 p-6 bg-white border-2 border-slate-100 rounded-[2rem] outline-none focus:border-indigo-500 transition-all text-xs font-bold text-slate-700 placeholder:text-slate-300 shadow-inner"
              placeholder="Catatan untuk petugas laboratorium..."
              value={notes.informasi}
              onChange={(e) => setNotes({...notes, informasi: e.target.value})}
            />
          </div>
        </div>

        <button 
          onClick={handleSave}
          disabled={isSaving || selectedItems.length === 0}
          className="w-full bg-indigo-600 hover:bg-slate-900 text-white py-5 rounded-3xl font-black text-xs shadow-xl flex justify-center items-center gap-3 transition-all active:scale-95 uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          {isSaving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <ClipboardCheck className="w-5 h-5 text-indigo-400 group-hover:text-white transition-colors" />
          )}
          {isSaving ? 'Menyimpan...' : 'Simpan Permintaan Laborat'}
        </button>
      </div>
    </div>
  )
}