use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct LabTest {
    pub kd_jenis_prw: String,
    pub nm_perawatan: String,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct LabTemplate {
    pub id_template: i32,
    #[sqlx(rename = "Pemeriksaan")]
    pub pemeriksaan: String,
    pub satuan: String,
    pub nilai_rujukan_ld: String,
    pub nilai_rujukan_la: String,
    pub nilai_rujukan_pd: String,
}

#[derive(Debug, Deserialize)]
pub struct LabRequestItem {
    pub kd_jenis_prw: String,
    pub id_templates: Vec<i32>,
}

#[derive(Debug, Deserialize)]
pub struct LabRequest {
    pub no_rawat: String,
    pub tests: Vec<LabRequestItem>,
    pub informasi_tambahan: Option<String>,
    pub diagnosa_klinis: Option<String>,
    pub dokter_perujuk: String,
    pub status: Option<String>,
}
