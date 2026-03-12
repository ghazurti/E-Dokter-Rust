"use server"

import { revalidatePath } from 'next/cache'

export async function searchLabInapAction(query?: string, category?: string) {
  try {
    const serviceUrl = process.env.RUST_SERVICE_URL || 'http://localhost:3001';
    const url = new URL(`${serviceUrl}/search/lab`);
    if (query) url.searchParams.append('q', query);
    if (category) url.searchParams.append('category', category);
    
    const response = await fetch(url.toString(), { cache: 'no-store' });
    if (!response.ok) throw new Error('Rust Service error');
    return await response.json();
  } catch (error) {
    console.error('Lab Inpatient Search via Rust failed:', error);
    return [];
  }
}

export async function getLabTemplateInapAction(kd_jenis_prw: string) {
  try {
    const serviceUrl = process.env.RUST_SERVICE_URL || 'http://localhost:3001';
    const response = await fetch(`${serviceUrl}/lab/template/${kd_jenis_prw}`, { cache: 'no-store' });
    if (!response.ok) throw new Error('Rust Service error');
    return await response.json();
  } catch (error) {
    console.error('Fetch Lab Inpatient Template via Rust failed:', error);
    return [];
  }
}

export async function saveLabRequestInapAction(data: any) {
  try {
    const serviceUrl = process.env.RUST_SERVICE_URL || 'http://localhost:3001';
    const response = await fetch(`${serviceUrl}/lab/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...data,
        status: 'ranap'
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Rust Service Error: ${errorText}`);
    }

    revalidatePath('/pemeriksaan/ranap/detail');
    return await response.json();
  } catch (error) {
    console.error('Save Lab Inpatient Request via Rust failed:', error);
    return { success: false, error: 'Gagal menyimpan permintaan lab rawat inap' };
  }
}

export async function searchRadiologyInapAction(query?: string, category?: string) {
  try {
    const serviceUrl = process.env.RUST_SERVICE_URL || 'http://localhost:3001';
    const url = new URL(`${serviceUrl}/search/radiology`);
    if (query) url.searchParams.append('q', query);
    if (category) url.searchParams.append('category', category);
    
    const response = await fetch(url.toString(), { cache: 'no-store' });
    if (!response.ok) throw new Error('Rust Service error');
    return await response.json();
  } catch (error) {
    console.error('Radiology Inpatient Search via Rust failed:', error);
    return [];
  }
}

export async function saveRadiologyRequestInapAction(data: any) {
  try {
    const serviceUrl = process.env.RUST_SERVICE_URL || 'http://localhost:3001';
    const response = await fetch(`${serviceUrl}/radiology/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...data,
        status: 'ranap'
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Rust Service Error: ${errorText}`);
    }

    revalidatePath('/pemeriksaan/ranap/detail');
    return await response.json();
  } catch (error) {
    console.error('Save Radiology Inpatient Request via Rust failed:', error);
    return { success: false, error: 'Gagal menyimpan permintaan radiologi rawat inap' };
  }
}

// Medical Resume Hub Actions
export async function getResumeInapAction(noRawat: string) {
  try {
    const serviceUrl = process.env.RUST_SERVICE_URL || 'http://localhost:3001';
    const cleanNoRawat = noRawat.replace(/\//g, '-');
    const response = await fetch(`${serviceUrl}/resume-ranap/${cleanNoRawat}`, {
      cache: 'no-store',
    });
    
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Get Resume Inpatient failed:', error);
    return null;
  }
}

export async function saveResumeInapAction(payload: any) {
  try {
    const serviceUrl = process.env.RUST_SERVICE_URL || 'http://localhost:3001';
    const response = await fetch(`${serviceUrl}/resume-ranap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Gagal menyimpan resume medis');
    }

    revalidatePath('/pemeriksaan/ranap/detail/[no_rawat]', 'page');
    return await response.json();
  } catch (error: any) {
    console.error('Save Resume Inpatient failed:', error);
    return { success: false, error: error.message };
  }
}

export async function getLabResultsAction(noRawat: string) {
  try {
    const serviceUrl = process.env.RUST_SERVICE_URL || 'http://localhost:3001';
    const cleanNoRawat = noRawat.replace(/\//g, '-');
    const response = await fetch(`${serviceUrl}/results/lab/${cleanNoRawat}`, {
        cache: 'no-store'
    });
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error('Fetch Lab Results failed:', error);
    return [];
  }
}

export async function getRadiologyResultsAction(noRawat: string) {
  try {
    const serviceUrl = process.env.RUST_SERVICE_URL || 'http://localhost:3001';
    const cleanNoRawat = noRawat.replace(/\//g, '-');
    const response = await fetch(`${serviceUrl}/results/radiology/${cleanNoRawat}`, {
        cache: 'no-store'
    });
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error('Fetch Radiology Results failed:', error);
    return [];
  }
}
