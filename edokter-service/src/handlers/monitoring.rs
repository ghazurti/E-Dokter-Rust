use axum::{extract::State, http::StatusCode, Json};
use sqlx::{MySql, Pool};
use crate::models::prescription::MonitoringResep;

pub async fn get_monitoring(
    State(pool): State<Pool<MySql>>,
) -> Result<Json<Vec<MonitoringResep>>, (StatusCode, String)> {
    // We fetch resep joined with pasien and dokter
    let resep_list = sqlx::query(
        "SELECT r.no_resep, r.tgl_perawatan, p.nm_pasien, d.nm_dokter
         FROM resep_obat r
         LEFT JOIN reg_periksa rp ON r.no_rawat = rp.no_rawat
         LEFT JOIN pasien p ON rp.no_rkm_medis = p.no_rkm_medis
         LEFT JOIN dokter d ON r.kd_dokter = d.kd_dokter
         ORDER BY r.tgl_perawatan DESC LIMIT 50"
    )
    .fetch_all(&pool).await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let mut response = Vec::new();

    use sqlx::Row;
    for r in resep_list {
        let no_resep: String = r.get("no_resep");
        let tgl_perawatan: Option<chrono::NaiveDate> = r.get("tgl_perawatan");
        let nm_pasien: Option<String> = r.get("nm_pasien");
        let nm_dokter: Option<String> = r.get("nm_dokter");

        // Fetch standard meds
        let std_meds = sqlx::query_scalar::<_, String>(
            "SELECT CONCAT(db.nama_brng, ' (', rd.jml, ' ', rd.aturan_pakai, ')') 
             FROM resep_dokter rd 
             JOIN databarang db ON rd.kode_brng = db.kode_brng 
             WHERE rd.no_resep = ?"
        )
        .bind(&no_resep)
        .fetch_all(&pool).await
        .unwrap_or_default();

        // Fetch racikan meds
        let racik_meds = sqlx::query_scalar::<_, String>(
            "SELECT CONCAT(rr.nama_racik, ' (', rr.jml_dr, ' ', rr.aturan_pakai, ')') 
             FROM resep_dokter_racikan rr 
             WHERE rr.no_resep = ?"
        )
        .bind(&no_resep)
        .fetch_all(&pool).await
        .unwrap_or_default();

        response.push(MonitoringResep {
            no_resep,
            tgl_perawatan,
            nm_pasien,
            nm_dokter,
            detail_standar: std_meds,
            detail_racikan: racik_meds,
        });
    }

    Ok(Json(response))
}
