use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct RadiologyTest {
    pub kd_jenis_prw: String,
    pub nm_perawatan: String,
}

#[derive(Debug, Deserialize)]
pub struct RadiologyRequestItem {
    pub kd_jenis_prw: String,
}

#[derive(Debug, Deserialize)]
pub struct RadiologyRequest {
    pub no_rawat: String,
    pub tests: Vec<RadiologyRequestItem>,
    pub informasi_tambahan: Option<String>,
    pub diagnosa_klinis: Option<String>,
    pub dokter_perujuk: String,
    pub status: Option<String>,
}
