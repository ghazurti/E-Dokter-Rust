use axum::{extract::{State, Query}, http::StatusCode, Json};
use sqlx::{MySql, Pool};
use serde::{Serialize, Deserialize};

#[derive(Deserialize)]
pub struct RegistrationParams {
    pub no_rawat: String,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct RegistrationDetail {
    pub no_reg: Option<String>,
    pub no_rawat: String,
    pub tgl_registrasi: Option<chrono::NaiveDate>,
    pub jam_reg: Option<chrono::NaiveTime>,
    pub stts: Option<String>,
    pub nm_pasien: Option<String>,
    pub no_rkm_medis: Option<String>,
    pub nm_dokter: Option<String>,
    pub nm_poli: Option<String>,
    pub png_jawab: Option<String>,
    pub jk: Option<String>,
    pub tgl_lahir: Option<chrono::NaiveDate>,
    pub kd_dokter: Option<String>,
    pub kd_poli: Option<String>,
    pub kd_pj: Option<String>,
    pub kd_sps: Option<String>,
}

pub async fn get_registration_detail(
    State(pool): State<Pool<MySql>>,
    Query(params): Query<RegistrationParams>,
) -> Result<Json<RegistrationDetail>, (StatusCode, String)> {
    let detail = sqlx::query_as::<_, RegistrationDetail>(
        "SELECT r.no_reg, r.no_rawat, r.tgl_registrasi, r.jam_reg, r.stts,
         p.nm_pasien, p.no_rkm_medis, p.jk, p.tgl_lahir,
         d.nm_dokter, d.kd_dokter, d.kd_sps, pk.nm_poli, pk.kd_poli, pj.png_jawab, r.kd_pj
         FROM reg_periksa r
         LEFT JOIN pasien p ON r.no_rkm_medis = p.no_rkm_medis
         LEFT JOIN dokter d ON r.kd_dokter = d.kd_dokter
         LEFT JOIN poliklinik pk ON r.kd_poli = pk.kd_poli
         LEFT JOIN penjab pj ON r.kd_pj = pj.kd_pj
         WHERE r.no_rawat = ?"
    )
    .bind(&params.no_rawat)
    .fetch_optional(&pool).await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
    .ok_or((StatusCode::NOT_FOUND, "Registrasi tidak ditemukan".to_string()))?;

    Ok(Json(detail))
}
