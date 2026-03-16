"use client"

import { useState, useEffect } from "react"
import { 
  Search, 
  Radiation, 
  Plus, 
  Trash2,
  Box,
  Waves,
  FileText,
  Dna,
  Check,
  ChevronRight,
  Loader2,
  Info
} from "lucide-react"
import { searchRadiologyTestAction } from "@/app/pasien-rawat-jalan/actions"

interface RadiologiTabProps {
  noRawat: string
  kdDokter: string
  selectedTests: any[]
  setSelectedTests: (tests: any[]) => void
  notes: { diagnosa: string; informasi: string }
  setNotes: (notes: { diagnosa: string; informasi: string }) => void
  onSave?: () => Promise<void>
  isSaving?: boolean
}

const CATEGORIES = [
  { id: 'polos', name: 'Radiologi Polos', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50' },
  { id: 'usg', name: 'USG', icon: Waves, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { id: 'ct', name: 'CT Scan', icon: Box, color: 'text-orange-500', bg: 'bg-orange-50' },
  { id: 'mri', name: 'MRI', icon: Dna, color: 'text-purple-500', bg: 'bg-purple-50' },
]

export function RadiologiTab({ 
  noRawat, 
  kdDokter, 
  selectedTests, 
  setSelectedTests, 
  notes, 
  setNotes,
  onSave,
  isSaving
}: RadiologiTabProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("polos")
  const [categoryResults, setCategoryResults] = useState<any[]>([])
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)

  // Fetch tests by category
  useEffect(() => {
    async function fetchCategory() {
      setIsLoading(true)
      const data = await searchRadiologyTestAction("", selectedCategory)
      setCategoryResults(data)
      setIsLoading(false)
    }
    fetchCategory()
  }, [selectedCategory])

  // Handle Search
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length > 2) {
        setIsSearching(true)
        const data = await searchRadiologyTestAction(searchQuery)
        setSearchResults(data)
        setIsSearching(false)
      } else {
        setSearchResults([])
      }
    }, 500)

    return () => clearTimeout(delayDebounceFn)
  }, [searchQuery])

  const addTest = (test: any) => {
    if (!selectedTests.find(t => t.kd_jenis_prw === test.kd_jenis_prw)) {
      setSelectedTests([...selectedTests, test])
    }
  }

  const removeTest = (kd_jenis_prw: string) => {
    setSelectedTests(selectedTests.filter(t => t.kd_jenis_prw !== kd_jenis_prw))
  }

  return (
    <div className="flex gap-8 animate-in fade-in duration-700">
      {/* Sidebar Katalog */}
      <aside className="w-64 flex flex-col gap-2">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 mb-2">Katalog Radiologi</h3>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              setSelectedCategory(cat.id)
              setSearchQuery("")
            }}
            className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${
              selectedCategory === cat.id && !searchQuery
                ? 'bg-slate-900 text-white shadow-xl shadow-slate-200'
                : 'bg-white text-slate-400 hover:bg-slate-50'
            }`}
          >
            <cat.icon className={`w-4 h-4 ${selectedCategory === cat.id && !searchQuery ? 'text-white' : cat.color}`} />
            <span className="text-xs font-black tracking-tight uppercase">{cat.name}</span>
          </button>
        ))}
      </aside>

      {/* Konten Utama */}
      <div className="flex-1 flex flex-col gap-6">
        {/* Search Bar */}
        <div className="relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
          <input
            type="text"
            placeholder="Cari pemeriksaan radiologi (e.g Thorax, USG Abdomen)..."
            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-14 pr-6 outline-none focus:border-emerald-500 focus:bg-white transition-all font-medium text-slate-700 shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {isSearching && (
            <div className="absolute right-6 top-1/2 -translate-y-1/2">
              <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
            </div>
          )}
        </div>

        {/* List Hasil Pencarian atau Kategori */}
        <div className="grid grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {isLoading ? (
            <div className="col-span-2 py-20 flex flex-col items-center justify-center gap-4 text-slate-300">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="text-[10px] font-black uppercase tracking-widest">Memuat Katalog...</p>
            </div>
          ) : (searchQuery ? searchResults : categoryResults).map((test) => {
            const isSelected = selectedTests.find(t => t.kd_jenis_prw === test.kd_jenis_prw)
            return (
              <button
                key={test.kd_jenis_prw}
                onClick={() => isSelected ? removeTest(test.kd_jenis_prw) : addTest(test)}
                className={`group flex items-center justify-between p-5 rounded-2xl border-2 transition-all text-left ${
                  isSelected 
                    ? 'border-emerald-500 bg-emerald-50/30 shadow-lg shadow-emerald-50 scale-[0.98]' 
                    : 'border-slate-100 hover:border-emerald-200 hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                    isSelected ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-white group-hover:text-emerald-500'
                  }`}>
                    {isSelected ? <Check className="w-5 h-5" /> : <Radiation className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className={`text-xs font-black uppercase tracking-tight ${isSelected ? 'text-emerald-700' : 'text-slate-700'}`}>
                      {test.nm_perawatan}
                    </h4>
                    <p className={`text-[10px] font-bold ${isSelected ? 'text-emerald-500' : 'text-slate-400'}`}>
                      {test.kd_jenis_prw}
                    </p>
                  </div>
                </div>
                {!isSelected && <Plus className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 transition-all opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0" />}
              </button>
            )
          })}
        </div>

        {/* Pemeriksaan Terpilih */}
        {selectedTests.length > 0 && (
          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white mt-4 shadow-2xl shadow-slate-200 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                  <Radiation className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight uppercase">Pemeriksaan Terpilih</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedTests.length} Item Dalam Antrian</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedTests([])}
                className="px-6 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-slate-400 hover:text-white"
              >
                Bersihkan
              </button>
            </div>

            <div className="flex flex-wrap gap-3 mb-8">
              {selectedTests.map((test) => (
                <div key={test.kd_jenis_prw} className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-xl group hover:bg-white/10 transition-all">
                  <span className="text-[11px] font-bold tracking-tight">{test.nm_perawatan}</span>
                  <button onClick={() => removeTest(test.kd_jenis_prw)} className="text-white/20 hover:text-red-400 transition-colors">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-8 mt-4">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Info className="w-3 h-3" /> Diagnosa Klinis
                </label>
                <input 
                  type="text" 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs outline-none focus:border-emerald-500 transition-all"
                  placeholder="Ketik diagnosa..."
                  value={notes.diagnosa}
                  onChange={(e) => setNotes({ ...notes, diagnosa: e.target.value })}
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Info className="w-3 h-3" /> Informasi Tambahan
                </label>
                <input 
                  type="text" 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs outline-none focus:border-emerald-500 transition-all"
                  placeholder="Ketik catatan tambahan..."
                  value={notes.informasi}
                  onChange={(e) => setNotes({ ...notes, informasi: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="pt-8 flex justify-end">
        <button 
          onClick={onSave}
          disabled={isSaving || selectedTests.length === 0}
          className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-xs hover:bg-emerald-600 transition-all flex items-center gap-3 shadow-xl active:scale-95 disabled:opacity-50 min-w-[240px] justify-center"
        >
          {isSaving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <Radiation className="w-5 h-5 text-emerald-400" />
          )}
          {isSaving ? 'Mengirim Permintaan...' : 'Kirim Permintaan Radiologi'}
        </button>
      </div>
    </div>
  )
}
