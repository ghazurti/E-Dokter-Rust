import { Pill, User, Calendar, Clock, ChevronRight } from 'lucide-react'

export default async function ResepPage() {
  const serviceUrl = process.env.RUST_SERVICE_URL || 'http://localhost:3001';
  const response = await fetch(`${serviceUrl}/monitoring`, { cache: 'no-store' });
  
  if (!response.ok) throw new Error('Rust Service error');
  
  const prescriptions = await response.json();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Monitoring E-Resep</h1>
        <p className="text-slate-500 font-medium mt-1">Daftar resep obat standar dan racikan yang telah dikirim ke apotek.</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {prescriptions.map((resep) => (
          <div key={resep.no_resep} className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-xl shadow-slate-200/50 hover:scale-[1.01] transition-all">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
                  <Pill className="w-7 h-7" />
                </div>
                <div>
                   <h3 className="font-black text-slate-900 text-lg">{resep.no_resep}</h3>
                   <div className="flex items-center gap-3 text-slate-400 text-xs font-bold mt-1">
                      <span className="flex items-center gap-1 uppercase">
                         <User className="w-3 h-3" />
                         {resep.reg_periksa?.pasien?.nm_pasien || "-"}
                      </span>
                     <span className="flex items-center gap-1 uppercase">
                          <Calendar className="w-3 h-3" />
                          {resep.tgl_perawatan}
                       </span>
                    </div>
                 </div>
               </div>
 
               <div className="flex items-center gap-6">
                  <div className="text-right">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dokter Pengirim</p>
                     <p className="font-bold text-slate-700 text-sm">{resep.nm_dokter || "-"}</p>
                  </div>
                  <div className="h-10 w-10 rounded-full border-4 border-emerald-50 flex items-center justify-center">
                     <ChevronRight className="w-5 h-5 text-emerald-300" />
                  </div>
               </div>
             </div>
 
             <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Standard Meds Summary */}
                {resep.detail_standar.length > 0 && (
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Obat Standar ({resep.detail_standar.length})</p>
                     <ul className="space-y-1">
                        {resep.detail_standar.slice(0, 3).map((d: string, i: number) => (
                          <li key={i} className="text-xs font-bold text-slate-600 flex justify-between">
                             <span>{d}</span>
                          </li>
                        ))}
                        {resep.detail_standar.length > 3 && <li className="text-[10px] text-slate-400 font-bold italic">...dan {resep.detail_standar.length - 3} lainnya</li>}
                     </ul>
                  </div>
                )}
 
                {/* Compounded Meds Summary */}
                {resep.detail_racikan.length > 0 && (
                  <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100/50">
                     <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">Obat Racikan ({resep.detail_racikan.length})</p>
                     <ul className="space-y-1">
                        {resep.detail_racikan.slice(0, 3).map((r: string, i: number) => (
                          <li key={i} className="text-xs font-bold text-slate-600 flex justify-between">
                             <span>{r}</span>
                          </li>
                        ))}
                        {resep.detail_racikan.length > 3 && <li className="text-[10px] text-emerald-400 font-bold italic">...dan {resep.detail_racikan.length - 3} lainnya</li>}
                     </ul>
                  </div>
                )}
 
                {resep.detail_standar.length === 0 && resep.detail_racikan.length === 0 && (
                 <p className="text-xs text-slate-400 italic font-medium p-4">Tidak ada detail obat terekam.</p>
               )}
            </div>
          </div>
        ))}

        {prescriptions.length === 0 && (
          <div className="bg-white rounded-[2.5rem] p-20 border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-center">
            <Pill className="w-16 h-16 text-slate-200 mb-4" />
            <h3 className="text-xl font-black text-slate-900">Belum Ada Resep</h3>
            <p className="text-slate-500 font-medium mt-2">Daftar resep yang Anda buat melalui SOAP akan muncul di sini.</p>
          </div>
        )}
      </div>
    </div>
  )
}
