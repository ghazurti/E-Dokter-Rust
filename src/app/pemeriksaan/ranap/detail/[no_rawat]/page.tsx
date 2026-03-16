"use client"

import { useState, useEffect } from 'react'
import * as React from 'react'
import { ArrowLeft, Bed, Stethoscope, ClipboardList, Pill, Beaker, Monitor, Save, Loader2, CheckCircle2, ClipboardCheck } from 'lucide-react'
import SoapInapTab from '@/components/pemeriksaan/tabs/soapInapTab'
import ResumeInapTab from '@/components/pemeriksaan/tabs/ResumeInapTab'
import ResepInapTab from '@/components/pemeriksaan/tabs/ResepInapTab'
import LabInapTab from '@/components/pemeriksaan/tabs/PeriksaLabInap'
import RadiologiInapTab from '@/components/pemeriksaan/tabs/PeriksaRadInap'
import HasilLabTab from '@/components/pemeriksaan/tabs/HasilLabTab'
import HasilRadTab from '@/components/pemeriksaan/tabs/HasilRadTab'
import { AiQuickNotes } from '@/components/pemeriksaan/ai/AiQuickNotes'
import { AiSbarHandover } from '@/components/pemeriksaan/ai/AiSbarHandover'

import { savePrescriptionFullAction } from '@/app/pasien-rawat-jalan/actions'

const getInitialFormData = (no_rawat: string) => ({
  no_rawat, 
  tgl_perawatan: '', 
  jam_rawat: '',
  suhu_tubuh: '',
  tensi: '',
  nadi: '',
  respirasi: '',
  tinggi: '',
  berat: '',
  spo2: '',
  gcs: '',
  kesadaran: 'Compos Mentis',
  keluhan: '',
  pemeriksaan: '',
  alergi: '-',
  penilaian: '',
  rtl: '',
  instruksi: '',
  evaluasi: '',
  nip: ''
});

export default function DetailRanapPage({ params }: { params: any }) {
  const [resolvedParams, setResolvedParams] = useState<{ no_rawat: string } | null>(null)

  useEffect(() => {
    if (params instanceof Promise) {
      params.then(setResolvedParams)
    } else {
      setResolvedParams(params)
    }
  }, [params])

  const noRawat = resolvedParams?.no_rawat || '';
  const displayNoRawat = noRawat.replace(/-/g, '/')
  
  const [activeTab, setActiveTab] = useState('SOAP')
  const [isSaving, setIsSaving] = useState(false)
  const [history, setHistory] = useState([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [highlightActive, setHighlightActive] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [showSbar, setShowSbar] = useState(false)

  // Prescription States
  const [standardMeds, setStandardMeds] = useState<any[]>([])
  const [compoundedMeds, setCompoundedMeds] = useState<any[]>([])
  const [patient, setPatient] = useState<any>(null)

  const [formData, setFormData] = useState(getInitialFormData(noRawat))

  // Update formData when noRawat and patient are ready
  useEffect(() => {
    if (noRawat) {
      setFormData(prev => ({ ...prev, no_rawat: noRawat }));
    }
  }, [noRawat]);

  useEffect(() => {
    // Get NIP from cookie if available
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
    }
    const kd_dokter = getCookie('kd_dokter');
    if (kd_dokter) {
      setFormData(prev => ({ ...prev, nip: kd_dokter }));
    }

    // Fetch History
    fetchHistory();
    fetchPatientDetail();
  }, [noRawat]);

  const fetchPatientDetail = async () => {
    try {
      const serviceUrl = process.env.NEXT_PUBLIC_RUST_SERVICE_URL || 'http://localhost:3001';
      const slashNoRawat = noRawat.replace(/-/g, '/');
      const res = await fetch(`${serviceUrl}/registration?no_rawat=${encodeURIComponent(slashNoRawat)}`);
      if (res.ok) {
        setPatient(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch patient detail:", error);
    }
  };

  const fetchHistory = async () => {
    try {
      const serviceUrl = process.env.NEXT_PUBLIC_RUST_SERVICE_URL || 'http://localhost:3001';
      const res = await fetch(`${serviceUrl}/soap-ranap/history/${noRawat}`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (error) {
      console.error("Failed to fetch history:", error);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleAiSuggest = (data: any) => {
    setFormData((prev: any) => ({
      ...prev,
      keluhan: data.subjective || prev.keluhan,
      pemeriksaan: data.objective || prev.pemeriksaan,
      penilaian: data.assessment || prev.penilaian,
      rtl: data.plan || prev.rtl,
      // Vital Signs mapping (Ranap uses slightly different keys)
      suhu_tubuh: data.suhu != null ? String(data.suhu) : prev.suhu_tubuh,
      tensi: data.td != null ? String(data.td) : prev.tensi,
      nadi: data.nadi != null ? String(data.nadi) : prev.nadi,
      respirasi: data.rr != null ? String(data.rr) : prev.respirasi,
      berat: data.bb != null ? String(data.bb) : prev.berat,
      gcs: data.gcs != null ? String(data.gcs) : prev.gcs,
      spo2: data.spo2 != null ? String(data.spo2) : prev.spo2,
    }))
    
    setShowToast(true)
    setHighlightActive(true)
    setTimeout(() => setHighlightActive(false), 2000)
    setTimeout(() => setShowToast(false), 3000)
  }

  const handleSaveSoap = async (customData?: any) => {
    setIsSaving(true)
    try {
      const serviceUrl = process.env.NEXT_PUBLIC_RUST_SERVICE_URL || 'http://localhost:3001';
      const payload = {
        no_rawat: noRawat,
        tgl_perawatan: new Date().toISOString().split('T')[0],
        jam_rawat: new Date().toLocaleTimeString('en-GB', { hour12: false }),
        suhu: formData.suhu_tubuh,
        tensi: formData.tensi,
        nadi: formData.nadi,
        respirasi: formData.respirasi,
        tinggi: formData.tinggi,
        berat: formData.berat,
        spo2: formData.spo2,
        gcs: formData.gcs,
        kesadaran: formData.kesadaran,
        keluhan: formData.keluhan,
        pemeriksaan: formData.pemeriksaan,
        alergi: formData.alergi,
        penilaian: formData.penilaian,
        tindak_lanjut: formData.rtl,
        instruksi: formData.instruksi,
        evaluasi: formData.evaluasi,
        nip: patient?.kd_dokter || formData.nip || 'P0001'
      }

      const slashNoRawat = noRawat.replace(/-/g, '/');
      const response = await fetch(`${serviceUrl}/soap-ranap/${slashNoRawat}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert('Data SOAP berhasil disimpan!');
        setFormData(getInitialFormData(noRawat));
        fetchHistory();
      } else {
        const error = await response.text();
        throw new Error(error);
      }
    } catch (error: any) {
      console.error(error);
      alert('Gagal menyimpan data: ' + error.message);
    } finally {
      setIsSaving(false)
    }
  }

  const handleSavePrescription = async () => {
    if (standardMeds.length === 0 && compoundedMeds.length === 0) {
      alert('Pilih minimal satu obat!');
      return;
    }

    setIsSaving(true);
    try {
      const slashNoRawat = noRawat.replace(/-/g, '/');
      const result = await savePrescriptionFullAction(
        slashNoRawat,
        formData.nip || 'D0001',
        'ranap',
        standardMeds,
        compoundedMeds
      );

      if (result.success) {
        alert('Resep berhasil dikirim ke Farmasi!');
        setStandardMeds([]);
        setCompoundedMeds([]);
      } else {
        throw new Error(result.error || 'Gagal menyimpan resep');
      }
    } catch (error: any) {
      console.error(error);
      alert('Gagal mengirim resep: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSbar = async (sbarData: any) => {
    setIsSaving(true)
    try {
      const serviceUrl = process.env.NEXT_PUBLIC_RUST_SERVICE_URL || 'http://localhost:3001';
      
      const payload = {
        keluhan: `[SBAR: SITUATION & BACKGROUND]\n${sbarData.situation}\n${sbarData.background}`,
        pemeriksaan: `[SBAR: OBJECTIVE/VITALS]\nTD: ${formData.tensi}, Suhu: ${formData.suhu_tubuh}, Nadi: ${formData.nadi}`,
        alergi: formData.alergi,
        suhu: formData.suhu_tubuh,
        tensi: formData.tensi,
        nadi: formData.nadi,
        respirasi: formData.respirasi,
        spo2: formData.spo2,
        berat: formData.berat,
        tinggi: formData.tinggi,
        lingkar_perut: '-',
        lingkar_kepala: '-',
        lingkar_dada: '-',
        gcs: formData.gcs,
        kesadaran: formData.kesadaran,
        penilaian: `[SBAR: ASSESSMENT]\n${sbarData.assessment}`,
        tindak_lanjut: `[SBAR: RECOMMENDATION]\n${sbarData.recommendation}`,
        instruksi: `[TBAK: KONFIRMASI] Instruksi telah dibacakan ulang kepada Dokter ${sbarData.doctorReceiver}.`,
        evaluasi: 'Handover SBAR via AI',
        nip: patient?.kd_dokter || formData.nip || 'P0001'
      }

      const slashNoRawat = noRawat.replace(/-/g, '/');
      const response = await fetch(`${serviceUrl}/soap-ranap/${slashNoRawat}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert('Handover SBAR berhasil disimpan!');
        setShowSbar(false);
        setFormData(getInitialFormData(noRawat));
        fetchHistory();
      } else {
        const error = await response.text();
        throw new Error(error);
      }
    } catch (error: any) {
      console.error(error);
      alert('Gagal menyimpan SBAR: ' + error.message);
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 pb-10">
      {/* HEADER NAVIGATION */}
      <div className="bg-white border-b sticky top-0 z-30 shadow-sm p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => window.history.back()} className="p-2 hover:bg-slate-100 rounded-full transition-all">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h1 className="font-black text-slate-800 flex items-center gap-2 text-lg uppercase tracking-tight">
                <Bed className="w-5 h-5 text-blue-600" /> Pemeriksaan Ranap
              </h1>
              <p className="text-[10px] font-bold text-slate-400">NO. RAWAT: {displayNoRawat}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 mt-6 space-y-8">
        {/* AI Quick Notes Section */}
        <AiQuickNotes 
           onSuggest={handleAiSuggest} 
           onAnalyzing={setIsAnalyzing}
           variant="indigo"
        />
        
        <div className={`space-y-6 transition-all duration-500 ${highlightActive ? 'ai-highlight' : ''}`}>
        {/* TAB SWITCHER - Responsif & Berwarna */}
        <div className="flex gap-2 p-1.5 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-x-auto no-scrollbar">
          
          {/* TAB SOAP */}
          <button 
            onClick={() => setActiveTab('SOAP')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'SOAP' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Stethoscope className="w-4 h-4" /> INPUT SOAP
          </button>

          {/* TAB E-RESEP */}
          <button 
            onClick={() => setActiveTab('RESEP')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'RESEP' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Pill className="w-4 h-4" /> E-RESEP
          </button>

          {/* TAB LABORATORIUM */}
          <button 
            onClick={() => setActiveTab('LAB')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'LAB' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Beaker className="w-4 h-4" /> LABORATORIUM
          </button>

          {/* TAB RADIOLOGI */}
          <button 
            onClick={() => setActiveTab('RAD')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'RAD' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Monitor className="w-4 h-4" /> RADIOLOGI
          </button>

          {/* TAB HASIL LAB */}
          <button 
            onClick={() => setActiveTab('HASIL_LAB')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'HASIL_LAB' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Beaker className="w-4 h-4" /> HASIL LAB
          </button>

          {/* TAB HASIL RAD */}
          <button 
            onClick={() => setActiveTab('HASIL_RAD')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'HASIL_RAD' ? 'bg-orange-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Monitor className="w-4 h-4" /> HASIL RAD
          </button>

          {/* TAB RESUME */}
          <button 
            onClick={() => setActiveTab('RESUME')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'RESUME' ? 'bg-rose-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <ClipboardList className="w-4 h-4" /> RESUME PULANG
          </button>
        </div>

        {/* TAB CONTENT - Dinamis berdasarkan state activeTab */}
        <div className="transition-all duration-300">
          {activeTab === 'SOAP' && (
            <SoapInapTab 
              formData={formData} 
              updateField={updateField} 
              history={history}
              onSave={handleSaveSoap}
              isSaving={isSaving}
            />
          )}

          {activeTab === 'RESEP' && (
            <ResepInapTab 
              standardMeds={standardMeds} 
              setStandardMeds={setStandardMeds}
              compoundedMeds={compoundedMeds}
              setCompoundedMeds={setCompoundedMeds}
              noRawat={noRawat}
              patient={patient}
              onSave={handleSavePrescription}
              isSaving={isSaving}
            />
          )}

          {activeTab === 'LAB' && (
            <LabInapTab 
              noRawat={displayNoRawat} 
              kdDokter={formData.nip}
              kdPoli={patient?.kd_poli || ''}
            />
          )}

          {activeTab === 'RAD' && (
            <RadiologiInapTab 
              noRawat={displayNoRawat} 
              kdDokter={formData.nip} 
            />
          )}

          {activeTab === 'HASIL_LAB' && (
            <HasilLabTab noRawat={displayNoRawat} />
          )}

          {activeTab === 'HASIL_RAD' && (
            <HasilRadTab noRawat={displayNoRawat} />
          )}

          {activeTab === 'RESUME' && (
            <ResumeInapTab 
               noRawat={displayNoRawat}
               patient={patient} 
               kdDokter={formData.nip}
            />
          )}
          </div>
        </div>
      </div>

      {showSbar && (
        <AiSbarHandover 
          noRawat={noRawat}
          soapData={formData}
          onClose={() => setShowSbar(false)}
          onSave={handleSaveSbar}
        />
      )}
    </div>
  )
}