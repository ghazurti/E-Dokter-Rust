"use client"

import React, { useState, useEffect } from 'react'
import { Beaker, Loader2, Calendar, Clock, AlertCircle } from 'lucide-react'
import { getLabResultsAction } from '@/app/pasien-rawat-inap/actions'

export default function HasilLabTab({ noRawat }: { noRawat: string }) {
  const [results, setResults] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchResults = async () => {
      setIsLoading(true)
      const data = await getLabResultsAction(noRawat)
      setResults(data)
      setIsLoading(false)
    }
    fetchResults()
  }, [noRawat])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Memuat Hasil Laboratorium...</p>
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-[32px] p-20 text-center shadow-sm">
        <AlertCircle className="w-12 h-12 text-slate-200 mx-auto mb-4" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Belum Ada Hasil Laboratorium Yang Tervalidasi</p>
      </div>
    )
  }

  // Group by date and examination name (kd_jenis_prw)
  const groupedResults = results.reduce((acc: any, curr: any) => {
    const key = `${curr.tgl_periksa} ${curr.jam} - ${curr.nm_perawatan}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(curr);
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      {Object.entries(groupedResults).map(([header, items]: [string, any]) => (
        <div key={header} className="bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-sm hover:shadow-md transition-all">
          <div className="bg-slate-50/80 border-b p-6 px-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-2xl shadow-sm">
                <Beaker className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-black text-slate-800 uppercase tracking-wider text-sm">{items[0].nm_perawatan}</h3>
                <div className="flex items-center gap-4 mt-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase italic">
                    <Calendar className="w-3.5 h-3.5" /> {items[0].tgl_periksa}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase">
                    <Clock className="w-3.5 h-3.5" /> {items[0].jam}
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-indigo-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100">
               {items.length} Parameter
            </div>
          </div>
          <div className="p-8 px-10 overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-1/3">Pemeriksaan</th>
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-1/6">Hasil</th>
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-1/6">Satuan</th>
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-1/6">Nilai Rujukan</th>
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {items.map((item: any, idx: number) => (
                  <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 text-xs font-bold text-slate-700">{item.pemeriksaan}</td>
                    <td className="py-4 text-xs font-black text-slate-900">{item.nilai}</td>
                    <td className="py-4 text-xs font-medium text-slate-500">{item.satuan}</td>
                    <td className="py-4 text-xs font-medium text-slate-500">{item.nilai_rujukan}</td>
                    <td className="py-4 text-xs font-medium text-slate-400 italic">{item.keterangan || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}
