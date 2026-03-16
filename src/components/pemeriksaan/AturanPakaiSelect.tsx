"use client"

import { useState, useEffect, useRef } from 'react'
import { getAturanPakaiAction } from '@/app/pasien-rawat-jalan/actions'
import { Search, ChevronDown, X, Pill, CornerDownRight } from 'lucide-react'

interface AturanPakaiSelectProps {
  value: string
  onChange: (val: string) => void
  placeholder?: string
}

export function AturanPakaiSelect({ value, onChange, placeholder = "Aturan Pakai..." }: AturanPakaiSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [options, setOptions] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getAturanPakaiAction().then(res => {
      if (Array.isArray(res)) {
        setOptions(res.map((item: any) => item.aturan))
      }
    })
  }, [])

  // Lock scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      // Focus search input after modal animation
      const timer = setTimeout(() => {
        if (inputRef.current) inputRef.current.focus()
      }, 100)
      return () => {
        document.body.style.overflow = 'auto'
        clearTimeout(timer)
      }
    }
  }, [isOpen])

  const filteredOptions = options.filter(opt => 
    opt.toLowerCase().includes(search.toLowerCase())
  )

  const handleSelect = (val: string) => {
    onChange(val)
    setIsOpen(false)
    setSearch('')
  }

  return (
    <>
      {/* Trigger Area */}
      <div className="relative flex items-center group cursor-pointer" onClick={() => setIsOpen(true)}>
        <input 
          readOnly
          type="text"
          placeholder={placeholder}
          className="w-full bg-slate-50 border-none rounded-xl px-5 py-3 font-bold text-slate-700 text-sm focus:ring-2 focus:ring-emerald-500 transition-all outline-none pr-12 cursor-pointer"
          value={value}
        />
        <div className="absolute right-4 flex items-center gap-2">
          {value && (
            <button 
              onClick={(e) => {
                e.stopPropagation()
                onChange('')
              }}
              className="text-slate-300 hover:text-slate-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <ChevronDown className="w-4 h-4 text-slate-300" />
        </div>
      </div>

      {/* Modal Interface */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
          <div 
            className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header / Search Box */}
            <div className="p-6 border-b border-slate-50 shadow-sm relative">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center">
                            <Pill className="w-5 h-5 text-emerald-600" />
                        </div>
                        <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400">Pilih Aturan Pakai</h3>
                    </div>
                    <button 
                        onClick={() => setIsOpen(false)}
                        className="w-10 h-10 rounded-full hover:bg-slate-50 flex items-center justify-center text-slate-300 hover:text-slate-900 transition-all"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="relative group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                    <input 
                        ref={inputRef}
                        type="text"
                        placeholder="Cari atau Ketik Manual Baru..."
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-5 pl-16 pr-6 font-bold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-inner"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && search) {
                                handleSelect(search)
                            }
                        }}
                    />
                </div>
            </div>

            {/* Modal List Area */}
            <div className="overflow-y-auto p-4 space-y-2 custom-scrollbar flex-grow">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelect(opt)}
                    className={`w-full text-left px-6 py-4 rounded-2xl transition-all flex items-center justify-between group ${
                      value === opt ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <span className="font-bold">{opt}</span>
                    <CornerDownRight className={`w-4 h-4 opacity-0 group-hover:opacity-100 transition-all ${value === opt ? 'text-white/50' : 'text-slate-300'}`} />
                  </button>
                ))
              ) : (
                <div className="py-20 flex flex-col items-center justify-center text-center px-10">
                   <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-6">
                       <Search className="w-8 h-8 text-slate-200" />
                   </div>
                   <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                      Tidak ditemukan hasil untuk<br/>
                      <span className="text-emerald-600 font-black">&quot;{search}&quot;</span>
                   </p>
                </div>
              )}
            </div>

            {/* Modal Footer / Manual Option */}
            {search && !options.includes(search) && (
                <div className="p-6 bg-slate-50 border-t border-slate-100">
                    <button 
                        onClick={() => handleSelect(search)}
                        className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black text-xs tracking-widest hover:bg-slate-900 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3 uppercase"
                    >
                        Gunakan Manual: &quot;{search}&quot;
                    </button>
                </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
