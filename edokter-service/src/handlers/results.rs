use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use sqlx::MySqlPool;
use crate::models::results::{LabResult, RadiologyResult};

pub async fn get_lab_results(
    Path(no_rawat): Path<String>,
    State(pool): State<MySqlPool>,
) -> Result<Json<Vec<LabResult>>, (StatusCode, String)> {
    let slash_no_rawat = no_rawat.replace('-', "/");
    
    let results = sqlx::query_as::<_, LabResult>(
        "SELECT d.no_rawat, d.kd_jenis_prw, j.nm_perawatan, 
                CAST(d.tgl_periksa AS CHAR) as tgl_periksa, 
                CAST(d.jam AS CHAR) as jam, 
                t.Pemeriksaan as pemeriksaan, d.nilai, t.satuan, d.nilai_rujukan, d.keterangan
         FROM detail_periksa_lab d
         JOIN jns_perawatan_lab j ON d.kd_jenis_prw = j.kd_jenis_prw
         LEFT JOIN template_laboratorium t ON d.id_template = t.id_template
         WHERE d.no_rawat = ?
         ORDER BY d.tgl_periksa DESC, d.jam DESC, t.urut"
    )
    .bind(&slash_no_rawat)
    .fetch_all(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(results))
}

pub async fn get_radiology_results(
    Path(no_rawat): Path<String>,
    State(pool): State<MySqlPool>,
) -> Result<Json<Vec<RadiologyResult>>, (StatusCode, String)> {
    let slash_no_rawat = no_rawat.replace('-', "/");
    
    let results = sqlx::query_as::<_, RadiologyResult>(
        "SELECT h.no_rawat, j.nm_perawatan, 
                CAST(h.tgl_periksa AS CHAR) as tgl_periksa, 
                CAST(h.jam AS CHAR) as jam, h.hasil
         FROM hasil_radiologi h
         JOIN periksa_radiologi p ON h.no_rawat = p.no_rawat AND h.tgl_periksa = p.tgl_periksa AND h.jam = p.jam
         JOIN jns_perawatan_radiologi j ON p.kd_jenis_prw = j.kd_jenis_prw
         WHERE h.no_rawat = ?
         ORDER BY h.tgl_periksa DESC, h.jam DESC"
    )
    .bind(&slash_no_rawat)
    .fetch_all(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(results))
}
