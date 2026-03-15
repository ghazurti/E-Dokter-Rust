"use client"

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ShieldCheck, X, ExternalLink, Loader2 } from 'lucide-react'

interface IcareButtonProps {
    nik_atau_kartu: string;
    kode_dokter: string;
    variant?: 'ralan' | 'igd';
}

export function IcareButton({ nik_atau_kartu, kode_dokter, variant = 'ralan' }: IcareButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [icareUrl, setIcareUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    const handleOpenIcare = async () => {
        setIsOpen(true);
        if (icareUrl) return;

        setLoading(true);
        setError(null);
        try {
            const serviceUrl = process.env.NEXT_PUBLIC_RUST_SERVICE_URL || 'http://localhost:3001';
            const res = await fetch(`${serviceUrl}/bpjs/icare/validate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nik_atau_kartu, kode_dokter })
            });

            const text = await res.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                throw new Error(`Invalid JSON response: ${text.substring(0, 100)}...`);
            }

            if (!res.ok) throw new Error(data.message || 'Gagal validasi I-Care');
            
            setIcareUrl(data.url);
        } catch (err: any) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const colorClass = variant === 'igd' ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700';

    const modalContent = isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
            <div 
                className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" 
                onClick={() => setIsOpen(false)}
            />
            
            <div className="relative bg-white w-full h-full max-w-[95vw] max-h-[90vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Modal Header */}
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${colorClass}`}>
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 uppercase">Portal I-Care BPJS</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-0.5">Riwayat Pelayanan Pasien Lintas Faskes</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        {icareUrl && (
                            <a 
                                href={icareUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                title="Buka di Tab Baru"
                            >
                                <ExternalLink className="w-5 h-5" />
                            </a>
                        )}
                        <button 
                            onClick={() => setIsOpen(false)}
                            className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Modal Body */}
                <div className="flex-1 bg-slate-50 relative overflow-hidden">
                    {loading ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
                            <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Menghubungkan ke Server BPJS...</p>
                        </div>
                    ) : error ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center overflow-y-auto">
                            <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-6 shrink-0">
                                <X className="w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 mb-2 uppercase">Gagal Membuka I-Care</h3>
                            <p className="text-slate-500 max-w-md font-medium break-words leading-relaxed">
                                {error}
                                {(error?.toLowerCase().includes('json') || error?.toLowerCase().includes('decoding')) && (
                                    <span className="block mt-4 p-4 bg-amber-50 border border-amber-100 rounded-xl text-amber-700 text-xs font-bold text-left animate-bounce">
                                        💡 TIP: Pastikan file .env sudah dikonfigurasi dengan ConsID, SecretKey, dan UserKey yang valid dari portal BPJS.
                                    </span>
                                )}
                            </p>
                            <button 
                                onClick={handleOpenIcare}
                                className="mt-8 bg-slate-900 text-white px-8 py-3 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-800 transition-all shrink-0"
                            >
                                Coba Lagi
                            </button>
                        </div>
                    ) : icareUrl ? (
                        <iframe 
                            src={icareUrl} 
                            className="w-full h-full bg-white border-none"
                            title="I-Care BPJS"
                        />
                    ) : null}
                </div>
            </div>
        </div>
    );

    return (
        <>
            <button
                onClick={handleOpenIcare}
                className={`flex items-center gap-2 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 ${colorClass}`}
            >
                <ShieldCheck className="w-4 h-4" />
                BPJS I-Care
            </button>

            {mounted && createPortal(modalContent, document.body)}
        </>
    )
}
