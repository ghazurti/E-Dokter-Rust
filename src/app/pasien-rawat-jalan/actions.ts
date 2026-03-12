"use server"

import { revalidatePath } from 'next/cache'

export async function saveSoapAction(no_rawat: string, data: any) {
  try {
    const serviceUrl = process.env.RUST_SERVICE_URL || 'http://localhost:3001';
    
    const response = await fetch(`${serviceUrl}/soap/${no_rawat}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...data,
        tindak_lanjut: data.tindak_lanjut || "-",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Rust Service Error: ${errorText}`);
    }

    revalidatePath('/pasien-rawat-jalan');
    return { success: true };
  } catch (error) {
    console.error('Failed to save SOAP via Rust Service:', error);
    return { success: false, error: 'Microservice synchronization failed' };
  }
}

export async function searchIcdAction(query: string) {
  if (!query || query.length < 2) return []
  
  try {
    const serviceUrl = process.env.RUST_SERVICE_URL || 'http://localhost:3001';
    const response = await fetch(`${serviceUrl}/search/icd?q=${encodeURIComponent(query)}`);
    
    if (!response.ok) throw new Error('Rust Service error');
    
    return await response.json();
  } catch (error) {
    console.error('ICD Search via Rust failed:', error);
    return []
  }
}
export async function searchMedicineAction(query: string, no_rawat?: string) {
  if (!query || query.length < 2) return []
  try {
    const serviceUrl = process.env.RUST_SERVICE_URL || 'http://localhost:3001';
    let url = `${serviceUrl}/search/medicine?q=${encodeURIComponent(query)}`;
    if (no_rawat) url += `&no_rawat=${encodeURIComponent(no_rawat)}`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Rust Service error');
    return await response.json();
  } catch (error) {
    console.error('Medicine Search via Rust failed:', error)
    return []
  }
}

export async function getMetodeRacikAction() {
  try {
    const serviceUrl = process.env.RUST_SERVICE_URL || 'http://localhost:3001';
    const response = await fetch(`${serviceUrl}/metode-racik`);
    if (!response.ok) throw new Error('Rust Service error');
    return await response.json();
  } catch (error) {
    console.error('Fetch metode via Rust failed:', error)
    return []
  }
}

export async function savePrescriptionFullAction(no_rawat: string, kd_dokter: string, status: string, standardMeds: any[], compoundedMeds: any[]) {
  try {
    const serviceUrl = process.env.RUST_SERVICE_URL || 'http://localhost:3001';
    
    const response = await fetch(`${serviceUrl}/resep`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        no_rawat,
        kd_dokter,
        status,
        standard_meds: standardMeds,
        compounded_meds: compoundedMeds,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Rust Service Error: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Save Prescription via Rust failed:', error)
    return { success: false, error: 'Gagal menghubungkan ke microservice resep' }
  }
}

export async function searchLabTestAction(query?: string, category?: string) {
  try {
    const serviceUrl = process.env.RUST_SERVICE_URL || 'http://localhost:3001';
    const url = new URL(`${serviceUrl}/search/lab`);
    if (query) url.searchParams.append('q', query);
    if (category) url.searchParams.append('category', category);
    
    const response = await fetch(url.toString());
    if (!response.ok) throw new Error('Rust Service error');
    return await response.json();
  } catch (error) {
    console.error('Lab Search via Rust failed:', error)
    return []
  }
}

export async function getLabTemplateAction(kd_jenis_prw: string) {
  try {
    const serviceUrl = process.env.RUST_SERVICE_URL || 'http://localhost:3001';
    const response = await fetch(`${serviceUrl}/lab/template/${kd_jenis_prw}`);
    if (!response.ok) throw new Error('Rust Service error');
    return await response.json();
  } catch (error) {
    console.error('Fetch Lab Template via Rust failed:', error)
    return []
  }
}

export async function saveLabRequestAction(data: any) {
  try {
    const serviceUrl = process.env.RUST_SERVICE_URL || 'http://localhost:3001';
    const response = await fetch(`${serviceUrl}/lab/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Rust Service Error: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Save Lab Request via Rust failed:', error)
    return { success: false, error: 'Gagal menyimpan permintaan lab' }
  }
}

export async function searchRadiologyTestAction(query?: string, category?: string) {
  try {
    const serviceUrl = process.env.RUST_SERVICE_URL || 'http://localhost:3001';
    const url = new URL(`${serviceUrl}/search/radiology`);
    if (query) url.searchParams.append('q', query);
    if (category) url.searchParams.append('category', category);
    
    const response = await fetch(url.toString());
    if (!response.ok) throw new Error('Rust Service error');
    return await response.json();
  } catch (error) {
    console.error('Radiology Search via Rust failed:', error)
    return []
  }
}

export async function saveRadiologyRequestAction(data: any) {
  try {
    const serviceUrl = process.env.RUST_SERVICE_URL || 'http://localhost:3001';
    const response = await fetch(`${serviceUrl}/radiology/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Rust Service Error: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Save Radiology Request via Rust failed:', error)
    return { success: false, error: 'Gagal menyimpan permintaan radiologi' }
  }
}

export async function getLastPrescriptionAction(no_rkm_medis: string) {
  try {
    const serviceUrl = process.env.RUST_SERVICE_URL || 'http://localhost:3001';
    const response = await fetch(`${serviceUrl}/resep/last/${encodeURIComponent(no_rkm_medis)}`, { cache: 'no-store' });
    if (!response.ok) throw new Error('Rust Service error');
    return await response.json();
  } catch (error) {
    console.error('Fetch last prescription via Rust failed:', error);
    return { standard_meds: [], compounded_meds: [] };
  }
}

export async function getMedicineRestrictionsAction(kode_brng: string, kd_sps: string) {
  try {
    const serviceUrl = process.env.RUST_SERVICE_URL || 'http://localhost:3001';
    const response = await fetch(`${serviceUrl}/resep/restriction/${encodeURIComponent(kode_brng)}/${encodeURIComponent(kd_sps)}`, { cache: 'no-store' });
    if (!response.ok) throw new Error('Rust Service error');
    return await response.json();
  } catch (error) {
    console.error('Fetch medicine restrictions via Rust failed:', error);
    return null;
  }
}
