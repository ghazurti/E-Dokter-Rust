use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize, sqlx::FromRow)]
pub struct StandardMed {
    pub kode_brng: String,
    pub nama_brng: String,
    pub jml: String,
    pub aturan_pakai: String,
}

#[derive(Debug, Deserialize, Serialize, sqlx::FromRow)]
pub struct CompoundedMedItem {
    pub kode_brng: String,
    pub nama_brng: String,
    pub knd: String,
    pub jml: f64,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct CompoundedMed {
    pub nama_racik: String,
    pub kd_racik: String,
    pub jml_dr: String,
    pub aturan_pakai: String,
    pub keterangan: Option<String>,
    pub items: Vec<CompoundedMedItem>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct PrescriptionRequest {
    pub no_rawat: String,
    pub kd_dokter: String,
    pub status: String,
    pub standard_meds: Vec<StandardMed>,
    pub compounded_meds: Vec<CompoundedMed>,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct MedicineResult {
    pub kode_brng: String,
    pub nama_brng: String,
    pub stok: f64,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct MetodeRacikResult {
    pub kd_racik: String,
    pub nm_racik: String,
}
#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct AturanPakaiResult {
    pub aturan: String,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct QueueItemRaw {
    pub no_reg: Option<String>,
    pub no_rawat: String,
    pub tgl_registrasi: Option<String>,
    pub jam_reg: Option<String>,
    pub stts: Option<String>,
    pub nm_pasien: Option<String>,
    pub no_rkm_medis: Option<String>,
    pub nm_dokter: Option<String>,
    pub nm_poli: Option<String>,
    pub png_jawab: Option<String>,
    pub has_lab: Option<i32>,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct DoctorItem {
    pub kd_dokter: String,
    pub nm_dokter: String,
}

#[derive(Debug, Serialize)]
pub struct MonitoringResep {
    pub no_resep: String,
    pub tgl_perawatan: Option<String>,
    pub nm_pasien: Option<String>,
    pub nm_dokter: Option<String>,
    pub detail_standar: Vec<String>,
    pub detail_racikan: Vec<String>,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct RanapItemRaw {
    pub no_rawat: String,
    pub no_rkm_medis: String,
    pub nm_pasien: String,
    pub nm_dokter: String,
    pub kamar: String,
    pub kelas: String,
    pub tgl_masuk: Option<String>,
    pub has_lab: Option<i32>,
}

#[derive(Debug, serde::Deserialize)]
pub struct RanapParams {
    pub tgl_akhir: Option<String>,
    pub dokter: Option<String>,
    pub keyword: Option<String>,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct RestriksiObat {
    pub kode_brng: String,
    pub kd_sps: String,
    pub keterangan: String,
    pub jumlah: f64,
}

#[derive(Debug, Serialize)]
pub struct LastPrescription {
    pub standard_meds: Vec<StandardMed>,
    pub compounded_meds: Vec<CompoundedMed>,
}
