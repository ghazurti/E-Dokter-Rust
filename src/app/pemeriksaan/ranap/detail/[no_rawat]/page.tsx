"use client"

import { useState, use, useEffect } from 'react'
import { ArrowLeft, Bed, Stethoscope, ClipboardList, Pill, Beaker, Monitor, Save, Loader2 } from 'lucide-react'
import SoapInapTab from '@/components/pemeriksaan/tabs/soapInapTab'
import ResumeInapTab from '@/components/pemeriksaan/tabs/ResumeInapTab'
import ResepInapTab from '@/components/pemeriksaan/tabs/ResepInapTab'
import LabInapTab from '@/components/pemeriksaan/tabs/PeriksaLabInap'
import RadiologiInapTab from '@/components/pemeriksaan/tabs/PeriksaRadInap'
import HasilLabTab from '@/components/pemeriksaan/tabs/HasilLabTab'
import HasilRadTab from '@/components/pemeriksaan/tabs/HasilRadTab'

import { savePrescriptionFullAction } from '@/app/pasien-rawat-jalan/actions'

export default function DetailRanapPage({ params }: { params: Promise<{ no_rawat: string }> }) {
  const resolvedParams = use(params);
  const noRawat = resolvedParams.no_rawat;
  const displayNoRawat = noRawat.replace(/-/g, '/')
  
  const [activeTab, setActiveTab] = useState('SOAP')
  const [isSaving, setIsSaving] = useState(false)
  const [history, setHistory] = useState([])

  // Prescription States
  const [standardMeds, setStandardMeds] = useState<any[]>([])
  const [compoundedMeds, setCompoundedMeds] = useState<any[]>([])
  const [patient, setPatient] = useState<any>(null)

  const [formData, setFormData] = useState({
    no_rawat: noRawat, 
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
  })

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

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const serviceUrl = process.env.NEXT_PUBLIC_RUST_SERVICE_URL || 'http://localhost:3001';
      
      // Map formData to SoapRequest expected by backend
      const payload = {
        keluhan: formData.keluhan,
        pemeriksaan: formData.pemeriksaan,
        alergi: formData.alergi,
        suhu: formData.suhu_tubuh,
        tensi: formData.tensi,
        nadi: formData.nadi,
        respirasi: formData.respirasi,
        spo2: formData.spo2,
        berat: formData.berat,
        tinggi: formData.tinggi,
        lingkar_perut: '-', // Not in UI yet
        lingkar_kepala: '-',
        lingkar_dada: '-',
        gcs: formData.gcs,
        kesadaran: formData.kesadaran,
        penilaian: formData.penilaian,
        tindak_lanjut: formData.rtl,
        instruksi: formData.instruksi,
        evaluasi: formData.evaluasi,
        nip: formData.nip || 'P0001'
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
        fetchHistory(); // Refresh history
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
             {activeTab === 'SOAP' && (
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-blue-600 transition-all shadow-lg shadow-slate-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {isSaving ? 'Menyimpan...' : 'Simpan SOAP'}
                </button>
             )}

             {activeTab === 'RESEP' && (
                <button 
                  onClick={handleSavePrescription}
                  disabled={isSaving || (standardMeds.length === 0 && compoundedMeds.length === 0)}
                  className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-900 transition-all shadow-lg shadow-blue-100 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {isSaving ? 'Mengirim...' : 'Kirim Resep'}
                </button>
             )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 mt-4 space-y-6">
        
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
  )
}