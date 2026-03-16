"use client"

import { useState } from 'react'
import { searchMedicineAction, getMetodeRacikAction, getMedicineRestrictionsAction } from '@/app/pasien-rawat-jalan/actions'
import { AlertCircle, Search, Plus, Trash2, Box, Pill, CheckCircle2, XCircle } from 'lucide-react'
import { AturanPakaiSelect } from '../AturanPakaiSelect'

interface PrescriptionTabProps {
  standardMeds: any[]
  setStandardMeds: (meds: any[]) => void
  compoundedMeds: any[]
  setCompoundedMeds: (meds: any[]) => void
  patient?: any
  noRawat: string
  onSave?: () => Promise<void>
  isSaving?: boolean
}

export function PrescriptionTab({ 
  standardMeds, 
  setStandardMeds, 
  compoundedMeds, 
  setCompoundedMeds, 
  patient, 
  noRawat,
  onSave,
  isSaving
}: PrescriptionTabProps) {
  const [resepTab, setResepTab] = useState<'standar' | 'racikan'>('standar')
  const [medSearch, setMedSearch] = useState('')
  const [medResults, setMedResults] = useState<any[]>([])
  const [metodeRacik, setMetodeRacik] = useState<any[]>([])
  const [restrictionAlert, setRestrictionAlert] = useState<{msg: string, color: string} | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  const handleSelectMed = async (med: any, rIdx?: number) => {
    // BPJS Restriction Logic
    const isBpjs = patient?.kd_pj?.includes('BPJ') || patient?.png_jawab?.toLowerCase().includes('bpjs');
    
    if (isBpjs && patient?.kd_sps) {
      const restriction = await getMedicineRestrictionsAction(med.kode_brng, patient.kd_sps);
      if (restriction) {
        setRestrictionAlert({ 
          msg: `RESTRIKSI BPJS: ${med.nama_brng} dibatasi untuk spesialis ini. Keterangan: ${restriction.keterangan}. Maks: ${restriction.jumlah}`,
          color: 'red'
        });
        setTimeout(() => setRestrictionAlert(null), 10000);
      }
    }

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
    <div className="space-y-10 w-full text-[13px]">
      {restrictionAlert && (
        <div className={`p-5 rounded-2xl border-2 flex items-center gap-4 animate-in slide-in-from-top-4 duration-300 ${restrictionAlert.color === 'red' ? 'bg-red-50 border-red-100 text-red-600' : 'bg-amber-50 border-amber-100 text-amber-600'}`}>
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="font-bold text-xs uppercase tracking-wider leading-relaxed flex-1">{restrictionAlert.msg}</p>
            <button onClick={() => setRestrictionAlert(null)} className="text-[10px] font-black underline opacity-50 hover:opacity-100 transition-all uppercase">Tutup</button>
        </div>
      )}
      <div className="flex bg-slate-100/50 p-2 rounded-[1.5rem] gap-2 w-fit">
        <button 
          onClick={() => setResepTab('standar')}
          className={`px-8 py-3 rounded-2xl font-black text-xs tracking-widest transition-all ${resepTab === 'standar' ? 'bg-white shadow-lg text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          OBAT STANDAR
        </button>
        <button 
          onClick={() => {
             setResepTab('racikan');
             if (metodeRacik.length === 0) getMetodeRacikAction().then(setMetodeRacik);
          }}
          className={`px-8 py-3 rounded-2xl font-black text-xs tracking-widest transition-all ${resepTab === 'racikan' ? 'bg-white shadow-lg text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          OBAT RACIKAN
        </button>
      </div>

      {resepTab === 'standar' ? (
        <div className="space-y-8 animate-in fade-in duration-500">
           <div className="relative">
              <div className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                <input 
                  type="text"
                  placeholder="Cari Nama Obat di Gudang Farmasi..."
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] py-5 pl-16 pr-8 font-bold outline-none focus:border-emerald-500 transition-all text-slate-900"
                  value={medSearch}
                  onChange={(e) => {
                     setMedSearch(e.target.value);
                     if (e.target.value.length > 1) searchMedicineAction(e.target.value, noRawat).then(setMedResults);
                     else setMedResults([]);
                  }}
                />
              </div>
              {medResults.length > 0 && (
                <div className="absolute z-30 top-full left-0 right-0 mt-4 bg-white rounded-[1.5rem] border border-slate-100 shadow-2xl overflow-hidden max-h-[300px] overflow-y-auto">
                   {medResults.map(m => (
                     <button 
                        key={m.kode_brng}
                        onClick={() => handleSelectMed(m)}
                        className="w-full text-left px-8 py-5 hover:bg-slate-50 flex items-center justify-between border-b border-slate-50 last:border-0 transition-colors"
                     >
                        <div className="flex flex-col">
                           <span className="font-bold text-slate-800">{m.nama_brng}</span>
                           <span className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-widest">{m.kode_brng}</span>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${parseFloat(m.stok) > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                             Stok: {parseFloat(m.stok).toFixed(0)}
                          </span>
                        </div>
                     </button>
                   ))}
                </div>
              )}
           </div>

           <div className="grid grid-cols-1 gap-4">
              {standardMeds.map((m, idx) => (
                <div key={idx} className="bg-white p-6 rounded-[1.5rem] border-2 border-slate-50 flex items-center gap-6 group hover:border-emerald-100 transition-all">
                   <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center shrink-0">
                      <Pill className="w-6 h-6 text-slate-300" />
                   </div>
                   <div className="flex-1">
                      <p className="font-black text-slate-900">{m.nama_brng}</p>
                      <p className="text-[10px] font-black text-slate-400 flex items-center gap-2">
                         <span>{m.kode_brng}</span>
                      </p>
                   </div>
                   <div className="w-24">
                      <input 
                         type="number"
                         className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-center font-black text-slate-900 focus:ring-2 focus:ring-emerald-500"
                         value={m.jml}
                         onChange={(e) => {
                            const next = [...standardMeds];
                            next[idx].jml = e.target.value;
                            setStandardMeds(next);
                         }}
                      />
                   </div>
                   <div className="flex-1">
                      <AturanPakaiSelect 
                         value={m.aturan_pakai}
                         onChange={(val) => {
                            const next = [...standardMeds];
                            next[idx].aturan_pakai = val;
                            setStandardMeds(next);
                         }}
                      />
                   </div>
                   <button 
                      onClick={() => setStandardMeds(standardMeds.filter((_, i) => i !== idx))}
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                   >
                      <Trash2 className="w-5 h-5" />
                   </button>
                </div>
              ))}
           </div>
        </div>
      ) : (
        <div className="space-y-10 animate-in fade-in duration-500">
           <button 
              onClick={() => setCompoundedMeds([...compoundedMeds, { nama_racik: `RACIKAN ${compoundedMeds.length + 1}`, kd_racik: 'R01', jml_dr: '10', aturan_pakai: '3 x 1', items: [] }])}
              className="bg-emerald-600 text-white px-8 py-4 rounded-[1.2rem] font-black text-xs tracking-widest hover:bg-emerald-700 transition-all flex items-center gap-3 shadow-lg shadow-emerald-100"
           >
              <Plus className="w-4 h-4" />
              TAMBAH GRUP RACIKAN BARU
           </button>

           <div className="grid grid-cols-1 gap-8">
              {compoundedMeds.map((racik, rIdx) => (
                <div key={rIdx} className="bg-white border-2 border-slate-100 rounded-[2.5rem] p-8 shadow-sm group">
                   <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                      <div className="md:col-span-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block px-1">Nama Racikan</label>
                         <input 
                            className="w-full bg-slate-50 border-none rounded-xl px-5 py-3.5 font-black text-slate-900 focus:ring-2 focus:ring-emerald-500"
                            value={racik.nama_racik}
                            onChange={(e) => {
                               const next = [...compoundedMeds];
                               next[rIdx].nama_racik = e.target.value.toUpperCase();
                               setCompoundedMeds(next);
                            }}
                         />
                      </div>
                      <div>
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block px-1">Metode</label>
                         <select 
                            className="w-full bg-slate-50 border-none rounded-xl px-5 py-3.5 font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
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
                      <div>
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block px-1">Jumlah</label>
                         <input 
                            type="number"
                            className="w-full bg-slate-50 border-none rounded-xl px-5 py-3.5 font-black text-slate-900 focus:ring-2 focus:ring-emerald-500"
                            value={racik.jml_dr}
                            onChange={(e) => {
                               const next = [...compoundedMeds];
                               next[rIdx].jml_dr = e.target.value;
                               setCompoundedMeds(next);
                            }}
                         />
                      </div>
                   </div>

                   <div className="space-y-4 mb-8">
                      {racik.items.map((item: any, iIdx: number) => (
                        <div key={iIdx} className="bg-slate-50/50 p-4 rounded-2xl flex items-center gap-6 border border-slate-50">
                           <div className="flex-1 font-bold text-slate-800 text-sm tracking-tight">{item.nama_brng}</div>
                           <div className="w-28">
                              <input 
                                 placeholder="KANDUNGAN"
                                 className="w-full bg-white border-none rounded-xl px-4 py-2 text-center font-black text-xs focus:ring-2 focus:ring-emerald-500"
                                 value={item.knd}
                                 onChange={(e) => {
                                    const next = [...compoundedMeds];
                                    next[rIdx].items[iIdx].knd = e.target.value;
                                    next[rIdx].items[iIdx].jml = parseFloat(e.target.value) * (parseInt(racik.jml_dr) || 0);
                                    setCompoundedMeds(next);
                                 }}
                              />
                           </div>
                           <div className="w-20 font-black text-emerald-600 text-xs text-right bg-emerald-50 px-3 py-2 rounded-lg">{item.jml}</div>
                           <button 
                              onClick={() => {
                                 const next = [...compoundedMeds];
                                 next[rIdx].items = next[rIdx].items.filter((_: any, i: number) => i !== iIdx);
                                 setCompoundedMeds(next);
                              }}
                              className="text-slate-300 hover:text-red-500 transition-colors"
                           >
                              <Trash2 className="w-4 h-4" />
                           </button>
                        </div>
                      ))}
                      
                      <div className="relative pt-2">
                         <div className="relative">
                            <Plus className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />
                            <input 
                               placeholder="TAMBAH BAHAN RACIKAN..."
                               className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-12 pr-6 text-xs font-black outline-none ring-2 ring-emerald-50 focus:ring-emerald-500 transition-all"
                               onChange={(e) => {
                                  if (e.target.value.length > 1) {
                                     searchMedicineAction(e.target.value, noRawat).then(res => {
                                        setMedResults(res.map(m => ({ ...m, targetRacikIdx: rIdx })));
                                     });
                                  } else setMedResults([]);
                               }}
                            />
                         </div>
                         {medResults.length > 0 && medResults[0].targetRacikIdx === rIdx && (
                            <div className="absolute z-30 top-full left-0 right-0 mt-3 bg-white rounded-[1.5rem] border border-slate-100 shadow-2xl overflow-hidden max-h-[250px] overflow-y-auto">
                               {medResults.map(m => (
                                 <button 
                                    key={m.kode_brng}
                                    onClick={() => handleSelectMed(m, rIdx)}
                                    className="w-full text-left px-6 py-4 hover:bg-slate-50 flex items-center justify-between border-b border-slate-50 last:border-0 transition-colors"
                                 >
                                    <div className="flex flex-col">
                                       <span className="font-bold text-slate-800 text-xs">{m.nama_brng}</span>
                                       <span className="text-[9px] font-black text-slate-400 mt-0.5 tracking-wider">{m.kode_brng}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                       <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${parseFloat(m.stok) > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                          Stok: {parseFloat(m.stok).toFixed(0)}
                                       </span>
                                    </div>
                                 </button>
                               ))}
                            </div>
                         )}
                      </div>
                   </div>

                    <div className="flex justify-between items-center gap-6 pt-6 border-t border-slate-50">
                       <div className="flex-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block px-1">Aturan Pakai</label>
                          <AturanPakaiSelect 
                             value={racik.aturan_pakai}
                             placeholder="Contoh: 3 x 1 Sesudah Makan"
                             onChange={(val) => {
                                const next = [...compoundedMeds];
                                next[rIdx].aturan_pakai = val;
                                setCompoundedMeds(next);
                             }}
                          />
                       </div>
                      <button 
                         onClick={() => setCompoundedMeds(compoundedMeds.filter((_, i) => i !== rIdx))}
                         className="flex items-center gap-2 text-red-400 hover:text-red-600 font-black text-[10px] tracking-widest uppercase transition-colors"
                      >
                         <Trash2 className="w-4 h-4" />
                         HAPUS GRUP
                      </button>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      <div className="pt-8 flex justify-end">
        <button 
          onClick={() => setShowConfirmModal(true)}
          disabled={isSaving || (standardMeds.length === 0 && compoundedMeds.length === 0)}
          className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-xs hover:bg-blue-600 transition-all flex items-center gap-3 shadow-xl active:scale-95 disabled:opacity-50 min-w-[200px] justify-center"
        >
          {isSaving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <Pill className="w-5 h-5 text-blue-400" />
          )}
          {isSaving ? 'Mengirim Resep...' : 'Kirim Ke Farmasi'}
        </button>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 text-center space-y-6">
              <div className="w-20 h-20 bg-blue-50 rounded-[2rem] flex items-center justify-center mx-auto mb-2">
                <Pill className="w-10 h-10 text-blue-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Konfirmasi Resep 💊</h3>
                <p className="text-sm font-bold text-slate-500 leading-relaxed">Apakah obatnya sudah benar?</p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <button 
                  onClick={() => setShowConfirmModal(false)}
                  className="px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                >
                  <XCircle className="w-4 h-4" /> Tidak
                </button>
                <button 
                  onClick={() => {
                    setShowConfirmModal(false);
                    if (onSave) onSave();
                  }}
                  className="px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" /> Ya, Benar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
