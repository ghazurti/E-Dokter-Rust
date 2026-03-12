"use client"

import { useState } from 'react'
import Link from 'next/link'
import { ClipboardCheck, ArrowRight, UserCircle2, Clock, MapPin } from 'lucide-react'

interface QueueItem {
  no_rawat: string
  no_reg: string
  jam_reg: Date
  stts: string
  pasien: { nm_pasien: string; no_rkm_medis: string }
  poliklinik_rel: { nm_poli: string }
  dokter: { nm_dokter: string }
  penjab: { png_jawab: string }
}

export function QueueTable({ data, kdPoli }: { data: any[], kdPoli?: string }) {
  // Navigation is handled via Link component now

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50/50 border-b border-slate-100">
            <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">No. Reg</th>
            <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">No. Rawat</th>
            <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Pasien</th>
            <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Jam</th>
            <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Poli</th>
            <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Bayar</th>
            <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
            <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 text-[13px]">
          {data.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-8 py-20 text-center">
                <div className="flex flex-col items-center justify-center opacity-40">
                  <ClipboardCheck className="w-16 h-16 mb-4" />
                  <p className="font-bold text-lg">Tidak ada antrian hari ini</p>
                </div>
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr 
                key={item.no_rawat} 
                className="hover:bg-slate-50 transition-all duration-300 group ring-inset hover:ring-2 hover:ring-emerald-500/20"
              >
                <td className="px-6 py-6 font-black text-slate-400">{item.no_reg}</td>
                <td className="px-6 py-6 font-bold text-slate-500">
                  {(() => {
                    const assessmentMap: Record<string, string> = {
                      'U0025': 'umum',
                      'U0002': 'anak',
                      'U0001': 'kandungan',
                      'U0004': 'bedah',
                      'U0022': 'bedah-mulut',
                      'U0029': 'geriatri',
                      'U0031': 'hemodialisa',
                      'U0012': 'jantung',
                      'U0006': 'kulit-kelamin',
                      'U0005': 'mata',
                      'U0008': 'paru',
                      'U0003': 'penyakit-dalam',
                      'U0007': 'neurologi',
                      'U0011': 'tht',
                      'U0009': 'urologi',
                      'U0030': 'orthopedi',
                      'U0018': 'rehab-medik',
                      'IGDK': 'igd',
                    }
                    
                    const slug = kdPoli ? assessmentMap[kdPoli] : null
                    
                    if (kdPoli === 'IGDK') {
                      return (
                        <Link 
                          href={`/igd/pemeriksaan/${item.no_rawat.replace(/\//g, '-')}`}
                          className="text-blue-600 hover:text-blue-800 hover:underline transition-all"
                        >
                          {item.no_rawat}
                        </Link>
                      )
                    }

                    return slug ? (
                      <Link 
                        href={`/asesmen/${slug}/${item.no_rawat.replace(/\//g, '-')}`}
                        className="text-blue-600 hover:text-blue-800 hover:underline transition-all"
                      >
                        {item.no_rawat}
                      </Link>
                    ) : (
                      <span>{item.no_rawat}</span>
                    )
                  })()}
                </td>
                <td className="px-6 py-6">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                       <span className="text-slate-900 font-extrabold">{item.pasien.nm_pasien}</span>
                       {item.has_lab > 0 && (
                          <span className="bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full text-[9px] font-black animate-pulse shadow-sm">
                             LAB READY
                          </span>
                       )}
                    </div>
                    <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">{item.pasien.no_rkm_medis}</span>
                  </div>
                </td>
                <td className="px-6 py-6 text-center">
                  <span className="bg-white px-2.5 py-1 rounded-lg border border-slate-100 font-black text-slate-700 shadow-sm">
                    {item.jam_reg?.toString().substring(0, 5) || '--:--'}
                  </span>
                </td>
                <td className="px-6 py-6 font-bold text-slate-600">{item.poliklinik_rel.nm_poli}</td>
                <td className="px-6 py-6">
                  <span className="px-3 py-1 bg-slate-100 rounded-full font-bold text-slate-500 text-[11px] uppercase tracking-tighter">
                    {item.penjab.png_jawab}
                  </span>
                </td>
                <td className="px-6 py-6">
                   <StatusBadge status={item.stts} />
                </td>
                <td className="px-6 py-6 text-right">
                  <Link 
                    href={kdPoli === 'IGDK' ? `/igd/pemeriksaan/${item.no_rawat.replace(/\//g, '-')}` : `/pemeriksaan/${item.no_rawat}`}
                    className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-emerald-600 transition-all shadow-lg active:scale-95 inline-flex items-center gap-2 ml-auto group/btn"
                  >
                    Periksa
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    'Belum': 'bg-amber-50 text-amber-700 border-amber-100',
    'Sudah': 'bg-emerald-50 text-emerald-700 border-emerald-100',
    'Batal': 'bg-red-50 text-red-700 border-red-100',
    'Default': 'bg-slate-50 text-slate-600 border-slate-100'
  }
  
  const currentStyle = styles[status] || styles['Default']
  
  return (
    <span className={`px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-tighter ${currentStyle}`}>
      {status}
    </span>
  )
}
