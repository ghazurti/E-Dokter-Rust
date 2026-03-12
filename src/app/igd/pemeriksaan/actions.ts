"use server"

export async function saveTriaseIgdAction(noRawat: string, data: any) {
  try {
    const serviceUrl = process.env.NEXT_PUBLIC_RUST_SERVICE_URL || 'http://localhost:3001'
    const res = await fetch(`${serviceUrl}/triase-igd/save/${noRawat.replace(/\//g, '-')}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!res.ok) {
      const errorText = await res.text()
      return { success: false, error: errorText }
    }
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function saveAsesmenIgdAction(noRawat: string, data: any) {
  try {
    const serviceUrl = process.env.NEXT_PUBLIC_RUST_SERVICE_URL || 'http://localhost:3001'
    const res = await fetch(`${serviceUrl}/penilaian-medis-igd/save/${noRawat.replace(/\//g, '-')}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!res.ok) {
      const errorText = await res.text()
      return { success: false, error: errorText }
    }
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}
