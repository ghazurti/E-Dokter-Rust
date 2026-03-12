"use client"

import React, { useState } from 'react'
import { Pill, Plus, Trash2, Search, ShoppingCart, Clock, Send, RotateCcw, Box, AlertCircle, Copy, Loader2 } from 'lucide-react'
import { searchMedicineAction, getMetodeRacikAction, getLastPrescriptionAction, getMedicineRestrictionsAction } from '@/app/pasien-rawat-jalan/actions'

interface ResepInapTabProps {
  standardMeds: any[]
  setStandardMeds: (meds: any[]) => void
  compoundedMeds: any[]
  setCompoundedMeds: (meds: any[]) => void
  noRawat: string
  patient?: any
}

export default function ResepInapTab({ standardMeds, setStandardMeds, compoundedMeds, setCompoundedMeds, noRawat, patient }: ResepInapTabProps) {
  const [resepSubTab, setResepSubTab] = useState<'standar' | 'racikan'>('standar')
  const [medSearch, setMedSearch] = useState('')
  const [medResults, setMedResults] = useState<any[]>([])
  const [metodeRacik, setMetodeRacik] = useState<any[]>([])
  const [isCopying, setIsCopying] = useState(false)

  const searchObat = async (q: string) => {
    setMedSearch(q);
    if (q.length > 1) {
      const res = await searchMedicineAction(q, noRawat);
      setMedResults(res);
    } else {
      setMedResults([]);
    }
  }

  const handleCopyLast = async () => {
    if (!patient?.no_rkm_medis) return;
    setIsCopying(true);
    try {
      const res = await getLastPrescriptionAction(patient.no_rkm_medis);
      if (res.standard_meds.length > 0 || res.compounded_meds.length > 0) {
        setStandardMeds([...standardMeds, ...res.standard_meds]);
        setCompoundedMeds([...compoundedMeds, ...res.compounded_meds]);
      } else {
        alert("Tidak ada resep kunjungan terakhir.");
      }
    } catch (error) {
       console.error(error);
    } finally {
      setIsCopying(false);
    }
  }

  const handleSelectMed = async (med: any, rIdx?: number) => {
    if (rIdx !== undefined) {
      const next = [...compoundedMeds];
      next[rIdx].items.push({ ...med, knd: '1', jml: parseFloat(compoundedMeds[rIdx].jml_dr) || 1 });
      setCompoundedMeds(next);
    } else {
      setStandardMeds([...standardMeds, { ...med, jml: '1', aturan_pakai: '3 x 1' }]);
    }
    setMedSearch('');
    setMedResults([]);
  }

  return (
    <div className="space-y-8">
      {/* SUB-TAB SELECTOR */}
      <div className="flex bg-white/50 backdrop-blur-md p-1.5 rounded-2xl gap-2 w-fit border border-slate-200 shadow-sm">
        <button 
          onClick={() => setResepSubTab('standar')}
          className={`px-8 py-2.5 rounded-xl font-black text-[10px] tracking-widest transition-all uppercase flex items-center gap-2 ${
            resepSubTab === 'standar' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Pill className="w-3.5 h-3.5" /> OBAT STANDAR
        </button>
        <button 
          onClick={() => {
             setResepSubTab('racikan');
             if (metodeRacik.length === 0) getMetodeRacikAction().then(setMetodeRacik);
          }}
          className={`px-8 py-2.5 rounded-xl font-black text-[10px] tracking-widest transition-all uppercase flex items-center gap-2 ${
            resepSubTab === 'racikan' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Box className="w-3.5 h-3.5" /> OBAT RACIKAN
        </button>
      </div>

      <div className="flex justify-end -mt-14">
         <button 
           onClick={handleCopyLast}
           disabled={isCopying || !patient?.no_rkm_medis}
           className="bg-white border-2 border-slate-100 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-slate-600 hover:border-blue-200 hover:text-blue-600 transition-all shadow-sm active:scale-95 disabled:opacity-30"
         >
           {isCopying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Copy className="w-3.5 h-3.5" />}
           Salin Resep Terakhir
         </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* KIRI: CARI OBAT (Hidden if Racikan) */}
        {resepSubTab === 'standar' && (
          <div className="lg:col-span-1 space-y-6 lg:animate-in lg:fade-in lg:slide-in-from-left-4 lg:duration-500">
            <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm p-8">
              <h3 className="text-[10px] font-black text-blue-600 mb-6 uppercase tracking-widest flex items-center gap-2">
                <Search className="w-4 h-4" /> Cari Obat / Alkes
              </h3>
              
              <div className="relative mb-6">
                <input 
                  className="w-full p-5 pl-14 border-2 border-slate-50 rounded-2xl text-xs font-bold bg-slate-50 focus:border-blue-500 focus:bg-white outline-none transition-all shadow-inner text-slate-700 placeholder:text-slate-300"
                  placeholder="Ketik nama obat..."
                  value={medSearch}
                  onChange={(e) => searchObat(e.target.value)}
                />
                <Search className="w-5 h-5 text-slate-300 absolute left-5 top-4.5" />
              </div>

              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 no-scrollbar">
                {medResults.length > 0 ? (
                  medResults.map((m, i) => (
                    <div 
                      key={i}
                      onClick={() => handleSelectMed(m)}
                      className="p-4 border border-slate-50 rounded-2xl hover:bg-blue-50 cursor-pointer transition-all flex justify-between items-center group bg-white shadow-sm hover:border-blue-100"
                    >
                      <div className="flex flex-col">
                          <span className="text-[11px] font-black text-slate-800 uppercase tracking-tight">{m.nama_brng}</span>
                          <div className="flex items-center gap-2 mt-1">
                              <span className="text-[9px] font-bold text-slate-400 uppercase">{m.kode_brng}</span>
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${m.stok > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                                  STOK: {Math.floor(m.stok)}
                              </span>
                          </div>
                      </div>
                      <Plus className="w-4 h-4 text-blue-500 opacity-0 group-hover:opacity-100 transition-all" />
                    </div>
                  ))
                ) : (
                  <div className="py-10 text-center opacity-20">
                      <Search className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-[9px] font-black uppercase tracking-widest">Hasil tidak ditemukan</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* KANAN: DAFTAR RESEP */}
        <div className={`${resepSubTab === 'standar' ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-8 transition-all duration-500`}>
          {resepSubTab === 'standar' ? (
            <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden flex flex-col">
                <div className="bg-slate-900 p-6 px-10 flex justify-between items-center">
                    <h3 className="font-black text-white uppercase tracking-widest text-[10px] flex items-center gap-3">
                        <Pill className="w-4 h-4 text-emerald-400" /> Daftar Obat Standar
                    </h3>
                    <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] px-3 py-1 rounded-full font-black uppercase">
                        {standardMeds.length} Item
                    </span>
                </div>

                <div className="p-0 overflow-x-auto min-h-[400px]">
                    <table className="w-full border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="p-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Obat</th>
                                <th className="p-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest w-28">Jumlah</th>
                                <th className="p-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Aturan Pakai</th>
                                <th className="p-5 w-14"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {standardMeds.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-32 text-center">
                                        <div className="flex flex-col items-center gap-4 opacity-10">
                                            <Pill className="w-16 h-16 text-slate-900" />
                                            <p className="text-[10px] font-black text-slate-900 uppercase tracking-[0.4em]">Belum ada obat terpilih</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                standardMeds.map((m, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="p-5">
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-black text-slate-800 uppercase">{m.nama_brng}</span>
                                                <span className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{m.kode_brng}</span>
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <input 
                                                type="text"
                                                className="w-full p-3 border-2 border-slate-50 rounded-xl text-center text-xs font-black bg-slate-50 focus:border-blue-500 bg-white outline-none shadow-inner" 
                                                value={m.jml}
                                                onChange={(e) => {
                                                    const next = [...standardMeds];
                                                    next[idx].jml = e.target.value;
                                                    setStandardMeds(next);
                                                }}
                                            />
                                        </td>
                                        <td className="p-5">
                                            <div className="relative">
                                                <input 
                                                    className="w-full p-3 pl-10 border-2 border-slate-50 rounded-xl text-xs font-bold bg-slate-50 focus:border-blue-500 bg-white outline-none shadow-sm" 
                                                    value={m.aturan_pakai}
                                                    onChange={(e) => {
                                                        const next = [...standardMeds];
                                                        next[idx].aturan_pakai = e.target.value;
                                                        setStandardMeds(next);
                                                    }}
                                                />
                                                <Clock className="w-4 h-4 text-slate-200 absolute left-3.5 top-3" />
                                            </div>
                                        </td>
                                        <td className="p-5 text-right">
                                            <button 
                                                onClick={() => setStandardMeds(standardMeds.filter((_, i) => i !== idx))}
                                                className="p-2 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                            >
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
          ) : (
            <div className="space-y-10 animate-in fade-in zoom-in-95 duration-500">
                <div className="flex justify-center">
                    <button 
                        onClick={() => setCompoundedMeds([...compoundedMeds, { nama_racik: `RACIKAN ${compoundedMeds.length + 1}`, kd_racik: 'R01', jml_dr: '10', aturan_pakai: '3 x 1', items: [] }])}
                        className="bg-blue-600 text-white px-12 py-7 rounded-[2rem] font-black text-xs tracking-[0.2em] hover:bg-slate-900 transition-all flex items-center gap-4 shadow-2xl shadow-blue-200 uppercase active:scale-95"
                    >
                        <Plus className="w-6 h-6" /> TAMBAH GRUP RACIKAN BARU
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-12 max-w-6xl mx-auto">
                    {compoundedMeds.map((racik, rIdx) => (
                        <div key={rIdx} className="bg-white border-2 border-slate-100 rounded-[3.5rem] shadow-xl p-12 group hover:border-blue-200 transition-all">
                            <div className="flex flex-wrap items-end gap-10 mb-12 bg-slate-50/50 p-10 rounded-[2.5rem] border border-slate-100">
                                <div className="flex-1 min-w-[300px]">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 block px-2">Nama Racikan</label>
                                    <input 
                                        className="w-full bg-white border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-black text-slate-900 focus:border-blue-500 outline-none uppercase shadow-sm"
                                        value={racik.nama_racik}
                                        onChange={(e) => {
                                            const next = [...compoundedMeds];
                                            next[rIdx].nama_racik = e.target.value.toUpperCase();
                                            setCompoundedMeds(next);
                                        }}
                                    />
                                </div>
                                <div className="w-52">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 block px-2">Metode</label>
                                    <select 
                                        className="w-full bg-white border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-black text-slate-900 focus:border-blue-500 outline-none shadow-sm appearance-none cursor-pointer"
                                        value={racik.kd_racik}
                                        onChange={(e) => {
                                            const next = [...compoundedMeds];
                                            next[rIdx].kd_racik = e.target.value;
                                            setCompoundedMeds(next);
                                        }}
                                    >
                                        {metodeRacik.map(m => <option key={m.kd_racik} value={m.kd_racik}>{m.nm_racik}</option>)}
                                    </select>
                                </div>
                                <div className="w-36">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 block px-2">Jumlah</label>
                                    <input 
                                        type="number"
                                        className="w-full bg-white border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-black text-center text-slate-900 focus:border-blue-500 outline-none shadow-sm"
                                        value={racik.jml_dr}
                                        onChange={(e) => {
                                            const next = [...compoundedMeds];
                                            next[rIdx].jml_dr = e.target.value;
                                            setCompoundedMeds(next);
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4 mb-10">
                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] px-4 mb-6">Bahan - bahan Racikan</p>
                                {racik.items.map((item: any, iIdx: number) => (
                                    <div key={iIdx} className="bg-slate-50/30 p-6 rounded-[2rem] flex items-center justify-between border-2 border-slate-50 shadow-sm hover:bg-white hover:border-blue-200 transition-all duration-300">
                                        <div className="flex-1">
                                            <p className="text-sm font-black text-slate-800 uppercase italic tracking-tight">{item.nama_brng}</p>
                                            <p className="text-[10px] font-bold text-slate-400 mt-1.5 tracking-widest uppercase">{item.kode_brng}</p>
                                        </div>
                                        <div className="flex items-center gap-8">
                                            <div className="w-32">
                                                <label className="text-[9px] font-black text-slate-300 uppercase block mb-2 text-center">Kandungan</label>
                                                <input 
                                                    placeholder="KND"
                                                    className="w-full bg-white border-2 border-slate-100 rounded-xl px-4 py-3 text-center font-black text-xs focus:border-blue-400 outline-none shadow-inner"
                                                    value={item.knd}
                                                    onChange={(e) => {
                                                        const next = [...compoundedMeds];
                                                        next[rIdx].items[iIdx].knd = e.target.value;
                                                        next[rIdx].items[iIdx].jml = parseFloat(e.target.value) * (parseInt(racik.jml_dr) || 0);
                                                        setCompoundedMeds(next);
                                                    }}
                                                />
                                            </div>
                                            <div className="flex flex-col items-center">
                                                <label className="text-[9px] font-black text-slate-300 uppercase block mb-2 text-center">Total JML</label>
                                                <div className="w-28 font-black text-blue-600 text-sm text-center bg-blue-50 px-4 py-3 rounded-xl border-2 border-blue-100 shadow-sm">
                                                    {item.jml}
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    const next = [...compoundedMeds];
                                                    next[rIdx].items = next[rIdx].items.filter((_: any, i: number) => i !== iIdx);
                                                    setCompoundedMeds(next);
                                                }}
                                                className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                
                                <div className="relative pt-6">
                                    <div className="relative">
                                        <Search className="absolute left-6 top-6 w-5 h-5 text-blue-500" />
                                        <input 
                                            placeholder="CARI & TAMBAH BAHAN RACIKAN..."
                                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2rem] py-6 pl-16 pr-8 text-xs font-black outline-none focus:border-blue-400 focus:bg-white transition-all shadow-inner tracking-[0.1em] placeholder:text-slate-300"
                                            onChange={(e) => {
                                                if (e.target.value.length > 1) {
                                                    searchMedicineAction(e.target.value, noRawat).then(res => {
                                                        setMedResults(res.map((m:any) => ({ ...m, targetRacikIdx: rIdx })));
                                                    });
                                                } else setMedResults([]);
                                            }}
                                        />
                                    </div>
                                    {medResults.length > 0 && medResults[0].targetRacikIdx === rIdx && (
                                        <div className="absolute z-30 top-full left-0 right-0 mt-4 bg-white rounded-[2.5rem] border-2 border-slate-100 shadow-2xl overflow-hidden max-h-[400px] overflow-y-auto no-scrollbar">
                                            {medResults.map((m:any) => (
                                                <button 
                                                    key={m.kode_brng}
                                                    onClick={() => handleSelectMed(m, rIdx)}
                                                    className="w-full text-left px-10 py-5 hover:bg-blue-50 flex items-center justify-between border-b border-slate-50 last:border-0 transition-colors group"
                                                >
                                                    <div className="flex flex-col">
                                                        <span className="font-black text-slate-800 text-xs uppercase">{m.nama_brng}</span>
                                                        <div className="flex items-center gap-3 mt-1.5">
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{m.kode_brng}</span>
                                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${m.stok > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                                                                STOK: {Math.floor(m.stok)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <Plus className="w-5 h-5 text-blue-500 opacity-0 group-hover:opacity-100 transition-all" />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row justify-between items-center gap-10 pt-10 border-t-2 border-slate-50">
                                <div className="w-full flex-1">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 block px-2">Aturan Pakai Racikan</label>
                                    <div className="relative">
                                        <input 
                                            placeholder="Contoh: 3 x 1 Sesudah Makan"
                                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-14 py-5 text-base font-black text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm"
                                            value={racik.aturan_pakai}
                                            onChange={(e) => {
                                                const next = [...compoundedMeds];
                                                next[rIdx].aturan_pakai = e.target.value;
                                                setCompoundedMeds(next);
                                            }}
                                        />
                                        <Clock className="w-6 h-6 text-slate-300 absolute left-5 top-4.5" />
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setCompoundedMeds(compoundedMeds.filter((_, i) => i !== rIdx))}
                                    className="px-8 py-5 rounded-2xl bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-all font-black text-xs tracking-widest uppercase flex items-center gap-3 active:scale-95 shadow-lg shadow-red-100/50"
                                >
                                    <Trash2 className="w-5 h-5" /> HAPUS GRUP
                                </button>
                            </div>
                        </div>
                    ))}
                    {compoundedMeds.length === 0 && (
                        <div className="bg-slate-50/50 rounded-[3rem] p-24 text-center border-2 border-dashed border-slate-200 opacity-20">
                            <Box className="w-16 h-16 mx-auto mb-4" />
                            <p className="text-[10px] font-black uppercase tracking-[0.4em]">Belum ada resep racikan</p>
                        </div>
                    )}
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}