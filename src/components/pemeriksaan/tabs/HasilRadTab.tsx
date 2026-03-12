"use client"

import React, { useState, useEffect } from 'react'
import { Monitor, Loader2, Calendar, Clock, AlertCircle, FileText } from 'lucide-react'
import { getRadiologyResultsAction } from '@/app/pasien-rawat-inap/actions'

export default function HasilRadTab({ noRawat }: { noRawat: string }) {
  const [results, setResults] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchResults = async () => {
      setIsLoading(true)
      const data = await getRadiologyResultsAction(noRawat)
      setResults(data)
      setIsLoading(false)
    }
    fetchResults()
  }, [noRawat])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Memuat Hasil Radiologi...</p>
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-[32px] p-20 text-center shadow-sm">
        <AlertCircle className="w-12 h-12 text-slate-200 mx-auto mb-4" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Belum Ada Hasil Radiologi Yang Tervalidasi</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {results.map((result: any, idx: number) => (
        <div key={idx} className="bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-sm hover:shadow-md transition-all">
          <div className="bg-slate-50/80 border-b p-6 px-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-2xl shadow-sm">
                <Monitor className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-black text-slate-800 uppercase tracking-wider text-sm">{result.nm_perawatan}</h3>
                <div className="flex items-center gap-4 mt-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase italic">
                    <Calendar className="w-3.5 h-3.5" /> {result.tgl_periksa}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase">
                    <Clock className="w-3.5 h-3.5" /> {result.jam}
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-amber-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-amber-100">
               Hasil Expertise
            </div>
          </div>
          <div className="p-10 space-y-4">
             <div className="flex items-center gap-2 text-slate-400 mb-2">
                <FileText className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Hasil Interpretasi / Expertise</span>
             </div>
             <div className="bg-slate-50/50 p-8 rounded-[24px] border border-slate-100">
                <pre className="text-xs font-medium text-slate-700 leading-relaxed whitespace-pre-wrap font-sans italic">
                  {result.hasil}
                </pre>
             </div>
          </div>
        </div>
      ))}
    </div>
  )
}
