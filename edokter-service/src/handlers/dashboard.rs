use axum::{extract::{State, Query}, http::StatusCode, Json};
use sqlx::{MySql, Pool};
use crate::models::soap::{DashboardData, DashboardStats, TrendItem, GenderItem, StatusItem};
use chrono::Local;
use serde::Deserialize;

#[derive(Deserialize)]
pub struct DashboardParams {
    pub dokter: Option<String>,
    pub poli: Option<String>,
    pub tgl_mulai: Option<String>,
    pub tgl_selesai: Option<String>,
}

pub async fn get_dashboard(
    State(pool): State<Pool<MySql>>,
    Query(params): Query<DashboardParams>,
) -> Result<Json<DashboardData>, (StatusCode, String)> {
    let today = Local::now().naive_local().date();
    let default_start = today - chrono::Duration::days(7);
    
    let tgl_mulai = params.tgl_mulai.as_deref().unwrap_or(&default_start.to_string()).to_string();
    let tgl_selesai = params.tgl_selesai.as_deref().unwrap_or(&today.to_string()).to_string();

    // Filter construction helper
    let mut filter_sql = String::new();
    if params.dokter.is_some() {
        filter_sql.push_str(" AND kd_dokter = ?");
    }
    if params.poli.is_some() {
        filter_sql.push_str(" AND kd_poli = ?");
    }

    // 1. Stats
    let total_pasien = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM pasien")
        .fetch_one(&pool).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let rawat_query_sql = format!("SELECT COUNT(*) FROM reg_periksa WHERE tgl_registrasi BETWEEN ? AND ? {}", filter_sql);
    let mut rawat_query = sqlx::query_scalar::<_, i64>(&rawat_query_sql).bind(&tgl_mulai).bind(&tgl_selesai);
    if let Some(ref d) = params.dokter { rawat_query = rawat_query.bind(d); }
    if let Some(ref p) = params.poli { rawat_query = rawat_query.bind(p); }
    
    let rawat_hari_ini = rawat_query.fetch_one(&pool).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let resep_total = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM resep_obat")
        .fetch_one(&pool).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // 2. Trend
    let trend_query_sql = format!(
        "SELECT tgl_registrasi as date, COUNT(*) as count 
         FROM reg_periksa WHERE tgl_registrasi BETWEEN ? AND ? {} GROUP BY tgl_registrasi ORDER BY tgl_registrasi ASC",
         filter_sql
    );
    let mut trend_query = sqlx::query_as::<_, TrendItem>(&trend_query_sql).bind(&tgl_mulai).bind(&tgl_selesai);
    if let Some(ref d) = params.dokter { trend_query = trend_query.bind(d); }
    if let Some(ref p) = params.poli { trend_query = trend_query.bind(p); }

    let trend = trend_query.fetch_all(&pool).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // 3. Gender
    let mut gender_query_sql = String::from("SELECT jk, COUNT(*) as count FROM pasien GROUP BY jk");
    if params.dokter.is_some() || params.poli.is_some() || params.tgl_mulai.is_some() {
        gender_query_sql = format!(
            "SELECT p.jk, COUNT(DISTINCT p.no_rkm_medis) as count 
             FROM pasien p JOIN reg_periksa r ON p.no_rkm_medis = r.no_rkm_medis 
             WHERE r.tgl_registrasi BETWEEN ? AND ? {} GROUP BY p.jk", filter_sql
        );
    }
    let mut gender_query = sqlx::query_as::<_, GenderItem>(&gender_query_sql);
    if params.dokter.is_some() || params.poli.is_some() || params.tgl_mulai.is_some() {
        gender_query = gender_query.bind(&tgl_mulai).bind(&tgl_selesai);
        if let Some(ref d) = params.dokter { gender_query = gender_query.bind(d); }
        if let Some(ref p) = params.poli { gender_query = gender_query.bind(p); }
    }

    let gender = gender_query.fetch_all(&pool).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // 4. Status
    let status_query_sql = format!("SELECT stts, COUNT(*) as count FROM reg_periksa WHERE tgl_registrasi BETWEEN ? AND ? {} GROUP BY stts", filter_sql);
    let mut status_query = sqlx::query_as::<_, StatusItem>(&status_query_sql).bind(&tgl_mulai).bind(&tgl_selesai);
    if let Some(ref d) = params.dokter { status_query = status_query.bind(d); }
    if let Some(ref p) = params.poli { status_query = status_query.bind(p); }

    let status = status_query.fetch_all(&pool).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(DashboardData {
        stats: DashboardStats { total_pasien, rawat_hari_ini, resep_total },
        trend,
        gender,
        status,
    }))
}
