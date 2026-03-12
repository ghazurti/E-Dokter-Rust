use axum::{extract::{State, Query}, http::StatusCode, Json};
use sqlx::{MySql, Pool};
use crate::models::prescription::{QueueItemRaw, DoctorItem};
use serde::Deserialize;
use chrono::Local;

#[derive(Deserialize)]
pub struct QueueParams {
    pub tgl: Option<String>,
    pub tgl_mulai: Option<String>,
    pub tgl_selesai: Option<String>,
    pub dokter: Option<String>,
    pub poli: Option<String>,
}

pub async fn get_queue(
    State(pool): State<Pool<MySql>>,
    Query(params): Query<QueueParams>,
) -> Result<Json<Vec<QueueItemRaw>>, (StatusCode, String)> {
    let today = Local::now().format("%Y-%m-%d").to_string();
    let tgl_mulai = params.tgl_mulai.as_deref().unwrap_or(params.tgl.as_deref().unwrap_or(&today));
    let tgl_selesai = params.tgl_selesai.as_deref().unwrap_or(params.tgl.as_deref().unwrap_or(&today));
    
    let mut sql = String::from(
        "SELECT r.no_reg, r.no_rawat, r.tgl_registrasi, r.jam_reg, r.stts,
         p.nm_pasien, p.no_rkm_medis, d.nm_dokter, pk.nm_poli, pj.png_jawab,
         (SELECT COUNT(*) FROM periksa_lab WHERE no_rawat = r.no_rawat AND tgl_periksa >= DATE_SUB(CURDATE(), INTERVAL 2 DAY)) as has_lab
         FROM reg_periksa r
         LEFT JOIN pasien p ON r.no_rkm_medis = p.no_rkm_medis
         LEFT JOIN dokter d ON r.kd_dokter = d.kd_dokter
         LEFT JOIN poliklinik pk ON r.kd_poli = pk.kd_poli
         LEFT JOIN penjab pj ON r.kd_pj = pj.kd_pj
         WHERE r.tgl_registrasi BETWEEN ? AND ?"
    );

    if params.dokter.is_some() {
        sql.push_str(" AND r.kd_dokter = ?");
    }
    if params.poli.is_some() {
        sql.push_str(" AND r.kd_poli = ?");
    }
    sql.push_str(" ORDER BY r.tgl_registrasi DESC, r.jam_reg DESC");

    let mut query = sqlx::query_as::<_, QueueItemRaw>(&sql).bind(tgl_mulai).bind(tgl_selesai);
    if let Some(kd_dokter) = params.dokter {
        query = query.bind(kd_dokter);
    }
    if let Some(kd_poli) = params.poli {
        query = query.bind(kd_poli);
    }

    let results = query.fetch_all(&pool).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(results))
}

pub async fn get_doctors(
    State(pool): State<Pool<MySql>>,
) -> Result<Json<Vec<DoctorItem>>, (StatusCode, String)> {
    let doctors = sqlx::query_as::<_, DoctorItem>("SELECT kd_dokter, nm_dokter FROM dokter ORDER BY nm_dokter ASC")
        .fetch_all(&pool).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    Ok(Json(doctors))
}
