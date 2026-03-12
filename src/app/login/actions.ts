"use server"

import { cookies } from 'next/headers'

export async function setAuthSessionAction(data: { token: string, kd_dokter: string, nm_dokter: string, kd_poli: string, nm_poli: string }) {
  const cookieStore = await cookies()
  
  // Set for 1 day
  cookieStore.set('token', data.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24,
    path: '/',
  })

  cookieStore.set('kd_dokter', data.kd_dokter, {
    maxAge: 60 * 60 * 24,
    path: '/',
  })

  cookieStore.set('nm_dokter', data.nm_dokter, {
    maxAge: 60 * 60 * 24,
    path: '/',
  })

  cookieStore.set('kd_poli', data.kd_poli, {
    maxAge: 60 * 60 * 24,
    path: '/',
  })

  cookieStore.set('nm_poli', data.nm_poli, {
    maxAge: 60 * 60 * 24,
    path: '/',
  })
}

export async function clearAuthSessionAction() {
  const cookieStore = await cookies()
  cookieStore.delete('token')
  cookieStore.delete('kd_dokter')
  cookieStore.delete('nm_dokter')
  cookieStore.delete('kd_poli')
  cookieStore.delete('nm_poli')
}
