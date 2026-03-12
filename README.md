# E-Dokter SIMRS (Specialized for Doctors)

E-Dokter adalah sistem pengelolaan informasi medis rumah sakit (SIMRS) yang dirancang khusus untuk mempermudah alur kerja dokter. Dibangun dengan fokus pada performa tinggi, keamanan data, dan antarmuka pengguna yang premium.

## 🚀 Teknologi Utama

- **Frontend**: [Next.js](https://nextjs.org/) (React, Tailwind CSS, Lucide Icons) - Untuk antarmuka yang responsif dan modern.
- **Backend**: [Rust](https://www.rust-lang.org/) (Axum, SQLx, Tokio) - Digunakan untuk layanan API yang sangat cepat, aman, dan efisien dalam penggunaan memori.
- **Database**: MySQL/MariaDB - Menggunakan SQLx untuk interaksi database yang aman dari SQL injection.

## ✨ Fitur Unggulan

- **Dashboard Khusus IGD**: Grafik analitik real-time, tren pendaftaran, dan distribusi pasien untuk pemantauan unit gawat darurat yang cepat.
- **Sistem Triage IGD (Primer & Sekunder)**: Alur kerja triase standar rumah sakit yang terintegrasi langsung dengan asesmen medis.
- **19+ Asesmen Medis Spesialis**: Dukungan form pemeriksaan khusus untuk berbagai departemen (Umum, Anak, Kandungan, Bedah, Jantung, Neurologi, Mata, THT, Psikiatri, dll).
- **E-Resep Terotomasi**: Input resep obat standar dan racikan dengan integrasi stok otomatis dari depo farmasi terkait.
- **Sinkronisasi Data Perawat-Dokter**: Pengisian otomatis data tanda vital dan keluhan utama dari catatan keperawatan (Nurse SOAP) untuk menghemat waktu input dokter.

## 🛠️ Cara Menjalankan

### Frontend (Next.js)
```bash
# Install dependencies
npm install

# Jalankan dalam mode development
npm run dev
```

### Backend (Rust Service)
```bash
cd edokter-service

# Jalankan service
cargo run
```

Pastikan file `.env` sudah dikonfigurasi dengan `DATABASE_URL` yang benar sebelum menjalankan aplikasi.

## 📁 Struktur Proyek
- `/src`: Kode sumber aplikasi frontend (Next.js).
- `/edokter-service`: Kode sumber backend API (Rust).
- `/public`: Aset statis aplikasi.

---
Dikembangkan untuk kecepatan dan akurasi pelayanan medis.
