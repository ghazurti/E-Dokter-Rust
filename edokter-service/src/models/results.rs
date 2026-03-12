use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct LabResult {
    pub no_rawat: String,
    pub kd_jenis_prw: String,
    pub nm_perawatan: String,
    pub tgl_periksa: String,
    pub jam: String,
    pub pemeriksaan: String,
    pub nilai: String,
    pub satuan: String,
    pub nilai_rujukan: String,
    pub keterangan: String,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct RadiologyResult {
    pub no_rawat: String,
    pub nm_perawatan: String,
    pub tgl_periksa: String,
    pub jam: String,
    pub hasil: String,
}
