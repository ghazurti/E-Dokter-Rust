"use client"

import { useState, useEffect } from 'react'
import { Search, FlaskConical, Plus, Trash2, Info, CheckCircle2, Droplets, Waves, ShieldCheck, Microscope, AlertCircle, FileText, Dna, LayoutGrid } from 'lucide-react'
import { searchLabTestAction, getLabTemplateAction } from '@/app/pasien-rawat-jalan/actions'

interface LabTabProps {
  noRawat: string
  kdDokter: string
  selectedTests: any[]
  setSelectedTests: (tests: any[]) => void
  notes: { diagnosa: string, informasi: string }
  setNotes: (notes: any) => void
}

const CATEGORIES = [
  { id: 'hematologi', name: 'Hematologi', icon: Droplets, color: 'text-rose-500', bg: 'bg-rose-50' },
  { id: 'kimia', name: 'Kimia Klinik', icon: FlaskConical, color: 'text-blue-500', bg: 'bg-blue-50' },
  { id: 'urin', name: 'Urinalisa', icon: Waves, color: 'text-amber-500', bg: 'bg-amber-50' },
  { id: 'serologi', name: 'Serologi', icon: ShieldCheck, color: 'text-indigo-500', bg: 'bg-indigo-50' },
  { id: 'mikro', name: 'Mikrobiologi', icon: Microscope, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { id: 'narkoba', name: 'Narkoba', icon: AlertCircle, color: 'text-orange-500', bg: 'bg-orange-50' },
  { id: 'pa', name: 'Patologi Anatomi', icon: FileText, color: 'text-slate-500', bg: 'bg-slate-50' },
]

export function LabTab({ noRawat, kdDokter, selectedTests, setSelectedTests, notes, setNotes }: LabTabProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [categoryResults, setCategoryResults] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [isLoadingCategory, setIsLoadingCategory] = useState(false)

  // Search effect
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.length >= 2) {
        setIsSearching(true)
        const results = await searchLabTestAction(searchTerm)
        setSearchResults(results)
        setIsSearching(false)
      } else {
        setSearchResults([])
      }
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [searchTerm])

  // Category effect
  useEffect(() => {
    const fetchCategory = async () => {
      if (selectedCategory) {
        setIsLoadingCategory(true)
        const results = await searchLabTestAction(undefined, selectedCategory)
        setCategoryResults(results)
        setIsLoadingCategory(false)
      } else {
        setCategoryResults([])
      }
    }
    fetchCategory()
  }, [selectedCategory])

  const addTest = async (test: any) => {
    if (selectedTests.find(t => t.kd_jenis_prw === test.kd_jenis_prw)) return
    
    const templates = await getLabTemplateAction(test.kd_jenis_prw)
    setSelectedTests([...selectedTests, { 
      ...test, 
      templates,
      selectedTemplateIds: templates.map((t: any) => t.id_template)
    }])
    setSearchTerm('')
    setSearchResults([])
  }

  const toggleTemplateSelection = (kd_jenis_prw: string, id_template: number) => {
    setSelectedTests(selectedTests.map(t => {
      if (t.kd_jenis_prw === kd_jenis_prw) {
        const isSelected = t.selectedTemplateIds.includes(id_template)
        const newIds = isSelected 
          ? t.selectedTemplateIds.filter((id: number) => id !== id_template)
          : [...t.selectedTemplateIds, id_template]
        return { ...t, selectedTemplateIds: newIds }
      }
      return t
    }))
  }

  const selectAllTemplates = (kd_jenis_prw: string, select: boolean) => {
    setSelectedTests(selectedTests.map(t => {
      if (t.kd_jenis_prw === kd_jenis_prw) {
        return { 
          ...t, 
          selectedTemplateIds: select ? t.templates.map((tmpl: any) => tmpl.id_template) : [] 
        }
      }
      return t
    }))
  }

  const removeTest = (kd: string) => {
    setSelectedTests(selectedTests.filter(t => t.kd_jenis_prw !== kd))
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-500 pb-20">
      {/* Search Header */}
      <div className="bg-slate-900 p-10 rounded-[3rem] space-y-8 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-emerald-500/20 transition-colors duration-700"></div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <h3 className="text-xl font-black text-white tracking-widest uppercase flex items-center gap-4">
              <span className="w-2 h-8 bg-emerald-500 rounded-full"></span>
              Permintaan Laboratorium
            </h3>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest pl-6">Pilih pemeriksaan atau cari di katalog</p>
          </div>
          
          <div className="relative w-full md:w-96 group/search">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within/search:text-emerald-500 transition-colors" />
            <input 
              type="text"
              className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl py-4 pl-16 pr-6 font-bold text-white outline-none focus:border-emerald-500 focus:bg-slate-800/50 transition-all shadow-sm placeholder:text-slate-600"
              placeholder="Cari pemeriksaan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-3xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                {searchResults.map((result) => (
                  <button
                    key={result.kd_jenis_prw}
                    onClick={() => addTest(result)}
                    className="w-full px-8 py-5 text-left hover:bg-emerald-50 flex items-center justify-between group border-b border-slate-50 last:border-0"
                  >
                    <div>
                      <p className="font-black text-slate-900 uppercase text-xs tracking-tight">{result.nm_perawatan}</p>
                      <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">{result.kd_jenis_prw}</p>
                    </div>
                    <Plus className="w-5 h-5 text-slate-200 group-hover:text-emerald-500 transition-colors" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Catalog Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sidebar Kategori */}
        <div className="lg:col-span-3 space-y-4 pt-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2 mb-4">Katalog Pemeriksaan</p>
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all text-xs uppercase tracking-wider ${!selectedCategory ? 'bg-slate-900 text-white shadow-lg translate-x-2' : 'bg-white border-2 border-slate-50 text-slate-400 hover:border-slate-200'}`}
            >
              <LayoutGrid className="w-4 h-4" />
              Semua
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all text-xs uppercase tracking-wider ${selectedCategory === cat.id ? 'bg-slate-900 text-white shadow-lg translate-x-2' : 'bg-white border-2 border-slate-50 text-slate-400 hover:border-slate-200'}`}
              >
                <cat.icon className={`w-4 h-4 ${selectedCategory === cat.id ? 'text-emerald-400' : cat.color}`} />
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-9 space-y-8 animate-in slide-in-from-right-4 duration-500">
           {selectedCategory ? (
             <div className="bg-slate-50/50 rounded-[2.5rem] border-2 border-dashed border-slate-200 p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${CATEGORIES.find(c => c.id === selectedCategory)?.bg}`}>
                      {(() => {
                        const Icon = CATEGORIES.find(c => c.id === selectedCategory)?.icon || LayoutGrid
                        return <Icon className={`w-6 h-6 ${CATEGORIES.find(c => c.id === selectedCategory)?.color}`} />
                      })()}
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 uppercase text-sm tracking-widest">{CATEGORIES.find(c => c.id === selectedCategory)?.name}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Daftar Pemeriksaan Tersedia</p>
                    </div>
                  </div>
                </div>

                {isLoadingCategory ? (
                  <div className="py-20 text-center space-y-4">
                    <div className="w-10 h-10 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin mx-auto"></div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Memuat Katalog...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {categoryResults.map((test) => {
                      const isAdded = selectedTests.find(t => t.kd_jenis_prw === test.kd_jenis_prw)
                      return (
                        <button
                          key={test.kd_jenis_prw}
                          onClick={() => !isAdded && addTest(test)}
                          className={`group p-6 rounded-3xl text-left transition-all flex items-center justify-between border-2 ${isAdded ? 'bg-emerald-50 border-emerald-100 cursor-default' : 'bg-white border-transparent shadow-sm hover:shadow-md hover:border-emerald-500'}`}
                        >
                          <div>
                            <p className={`text-xs font-black uppercase tracking-tight ${isAdded ? 'text-emerald-700' : 'text-slate-900 group-hover:text-emerald-600'}`}>{test.nm_perawatan}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">{test.kd_jenis_prw}</p>
                          </div>
                          {isAdded ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                          ) : (
                            <Plus className="w-5 h-5 text-slate-200 group-hover:text-emerald-500 transform group-hover:scale-110 transition-all" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
             </div>
           ) : (
             <div className="bg-slate-50/50 rounded-[2.5rem] border-2 border-dashed border-slate-200 py-24 px-8 text-center space-y-6">
                <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto shadow-xl group-hover:rotate-12 transition-transform">
                   <LayoutGrid className="w-10 h-10 text-slate-300" />
                </div>
                <div className="max-w-xs mx-auto space-y-2">
                   <h4 className="font-black text-slate-900 uppercase text-sm tracking-widest">Pilih Kategori</h4>
                   <p className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed font-mono">Pilih kategori di sebelah kiri atau ketikkan pencarian di atas untuk mulai menambahkan pemeriksaan lab.</p>
                </div>
             </div>
           )}
        </div>
      </div>

      {/* Selected Tests Rendering */}
      {selectedTests?.length > 0 && (
        <div className="space-y-8">
          <div className="flex items-center gap-4">
             <div className="w-1.5 h-10 bg-blue-500 rounded-full"></div>
             <div>
                <h3 className="text-xl font-black text-slate-900 tracking-widest uppercase">Pemeriksaan Terpilih</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">{selectedTests.length} Item dalam antrian</p>
             </div>
          </div>
          
          <div className="grid gap-8">
            {selectedTests.map((test) => (
              <div key={test.kd_jenis_prw} className="bg-white border-2 border-slate-100 rounded-[3rem] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 group/item">
                <div className="bg-slate-900 p-8 flex items-center justify-between relative overflow-hidden">
                   <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                   <div className="flex items-center gap-6 relative z-10">
                      <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-white backdrop-blur-md group-hover/item:bg-blue-500/20 group-hover/item:scale-110 transition-all duration-500">
                         <FlaskConical className="w-7 h-7" />
                      </div>
                      <div>
                         <p className="text-white font-black text-sm uppercase tracking-widest">{test.nm_perawatan}</p>
                         <p className="text-white/40 text-[10px] font-bold uppercase mt-1">{test.kd_jenis_prw}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-6">
                      <div className="hidden sm:flex items-center gap-4">
                         <button 
                           onClick={() => selectAllTemplates(test.kd_jenis_prw, true)}
                           className="px-4 py-2 bg-emerald-500/10 text-emerald-500 rounded-xl text-[10px] font-bold uppercase hover:bg-emerald-500 hover:text-white transition-all duration-300 flex items-center gap-2"
                         >
                           <CheckCircle2 className="w-4 h-4" />
                           Pilih Semua
                         </button>
                         <button 
                           onClick={() => selectAllTemplates(test.kd_jenis_prw, false)}
                           className="px-4 py-2 bg-slate-800 text-slate-400 rounded-xl text-[10px] font-bold uppercase hover:bg-slate-700 hover:text-white transition-all duration-300"
                         >
                           Bersihkan
                         </button>
                      </div>
                      <div className="w-[1px] h-8 bg-white/10 mx-2"></div>
                      <button onClick={() => removeTest(test.kd_jenis_prw)} className="bg-red-500/10 text-red-500 p-4 rounded-xl hover:bg-red-500 hover:text-white transition-all duration-300 shadow-lg">
                          <Trash2 className="w-5 h-5" />
                      </button>
                   </div>
                </div>

                {test.templates?.length > 0 && (
                  <div className="p-0 overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="px-8 py-6 w-10 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">P</th>
                          <th className="px-2 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Komponen Pemeriksaan</th>
                          <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Satuan</th>
                          <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Rujukan L.D</th>
                          <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Rujukan L.A</th>
                          <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Rujukan P.D</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {test.templates.map((tmpl: any) => (
                          <tr key={tmpl.id_template} className={`hover:bg-slate-50 transition-colors ${test.selectedTemplateIds.includes(tmpl.id_template) ? 'bg-blue-50/20' : 'opacity-60'}`}>
                            <td className="px-8 py-5 text-center">
                              <div className="flex items-center justify-center">
                                 <input 
                                   type="checkbox"
                                   checked={test.selectedTemplateIds.includes(tmpl.id_template)}
                                   onChange={() => toggleTemplateSelection(test.kd_jenis_prw, tmpl.id_template)}
                                   className="w-5 h-5 rounded-lg border-slate-200 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer"
                                 />
                              </div>
                            </td>
                            <td className="px-2 py-5 whitespace-nowrap">
                              <span className={`text-[13px] font-bold ${test.selectedTemplateIds.includes(tmpl.id_template) ? 'text-slate-900 border-b-2 border-blue-100' : 'text-slate-400'}`}>
                                {tmpl.pemeriksaan}
                              </span>
                            </td>
                            <td className="px-6 py-5 text-center">
                              <span className="text-[11px] font-black text-slate-300 uppercase font-mono">{tmpl.satuan || '-'}</span>
                            </td>
                            <td className="px-6 py-5 text-center">
                              <span className="text-[12px] font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full">{tmpl.nilai_rujukan_ld || '-'}</span>
                            </td>
                            <td className="px-6 py-5 text-center">
                              <span className="text-[12px] font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full">{tmpl.nilai_rujukan_la || '-'}</span>
                            </td>
                            <td className="px-8 py-5 text-center">
                              <span className="text-[12px] font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full">{tmpl.nilai_rujukan_pd || '-'}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-12 border-t border-slate-100">
         <div className="space-y-4">
            <label className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] px-4 flex items-center gap-3">
               <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
               Diagnosa Klinis
            </label>
            <textarea 
               className="w-full h-40 bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] p-8 outline-none focus:border-blue-500 focus:bg-white transition-all font-medium text-slate-700 resize-none shadow-inner"
               placeholder="Tuliskan diagnosa klinis awal..."
               value={notes.diagnosa}
               onChange={(e) => setNotes({ ...notes, diagnosa: e.target.value })}
            />
         </div>
         <div className="space-y-4">
            <label className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] px-4 flex items-center gap-3">
               <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
               Informasi Tambahan
            </label>
            <textarea 
               className="w-full h-40 bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] p-8 outline-none focus:border-emerald-500 focus:bg-white transition-all font-medium text-slate-700 resize-none shadow-inner"
               placeholder="Catatan tambahan untuk petugas lab..."
               value={notes.informasi}
               onChange={(e) => setNotes({ ...notes, informasi: e.target.value })}
            />
         </div>
      </div>
    </div>
  )
}
