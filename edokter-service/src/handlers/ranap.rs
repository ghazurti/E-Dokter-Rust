use axum::{extract::{State, Query}, http::StatusCode, Json};
use sqlx::{MySql, Pool};
use crate::models::prescription::{RanapItemRaw, RanapParams};
use chrono::Local;

pub async fn get_ranap_patients(
    State(pool): State<Pool<MySql>>,
    Query(params): Query<RanapParams>,
) -> Result<Json<Vec<RanapItemRaw>>, (StatusCode, String)> {
    let tgl_akhir = params.tgl_akhir.unwrap_or_else(|| Local::now().format("%Y-%m-%d").to_string());
    let kd_dokter = params.dokter.clone().unwrap_or_else(|| "none".to_string());

    tracing::debug!("DEBUG: Fetching Ranap patients: tgl_akhir={}, dokter={}, keyword={:?}", 
        tgl_akhir, kd_dokter, params.keyword);

    // Diagnostic: Count all active patients regardless of doctor
    let total_active = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM kamar_inap WHERE stts_pulang = '-'")
        .fetch_one(&pool).await.unwrap_or(0);
    tracing::debug!("DIAGNOSTIC: Total active patients (stts_pulang = '-'): {}", total_active);

    let mut sql = String::from(
        "SELECT ki.no_rawat, reg.no_rkm_medis, p.nm_pasien, d.nm_dokter, 
                concat(ki.kd_kamar, ' ', b.nm_bangsal) as kamar, k.kelas, CAST(ki.tgl_masuk AS CHAR) as tgl_masuk,
                (SELECT COUNT(*) FROM periksa_lab WHERE no_rawat = ki.no_rawat AND tgl_periksa >= DATE_SUB(CURDATE(), INTERVAL 2 DAY)) as has_lab
         FROM kamar_inap ki
         JOIN reg_periksa reg ON ki.no_rawat = reg.no_rawat
         JOIN pasien p ON reg.no_rkm_medis = p.no_rkm_medis
         LEFT JOIN dpjp_ranap dr ON ki.no_rawat = dr.no_rawat
         JOIN dokter d ON (CASE WHEN dr.kd_dokter IS NOT NULL THEN dr.kd_dokter ELSE reg.kd_dokter END) = d.kd_dokter
         JOIN kamar k ON ki.kd_kamar = k.kd_kamar
         JOIN bangsal b ON k.kd_bangsal = b.kd_bangsal
         WHERE ki.stts_pulang = '-' AND ki.tgl_masuk <= ?"
    );

    if params.dokter.is_some() {
        sql.push_str(" AND (reg.kd_dokter = ? OR dr.kd_dokter = ?)");
    }

    if let Some(ref keyword) = params.keyword {
        if !keyword.is_empty() {
             sql.push_str(" AND (p.nm_pasien LIKE ? OR reg.no_rkm_medis LIKE ? OR ki.no_rawat LIKE ?)");
        }
    }

    sql.push_str(" ORDER BY ki.tgl_masuk DESC, ki.jam_masuk DESC");

    let mut query = sqlx::query_as::<_, RanapItemRaw>(&sql)
        .bind(&tgl_akhir);

    if let Some(ref kd_dokter) = params.dokter {
        query = query.bind(kd_dokter).bind(kd_dokter);
    }

    if let Some(ref keyword) = params.keyword {
        if !keyword.is_empty() {
            let k = format!("%{}%", keyword);
            query = query.bind(k.clone()).bind(k.clone()).bind(k);
        }
    }

    let results = query.fetch_all(&pool).await
        .map_err(|e| {
            tracing::error!("Database error fetching Ranap patients: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, e.to_string())
        })?;

    tracing::debug!("Found {} Ranap patients", results.len());

    Ok(Json(results))
}
