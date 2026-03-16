use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use sqlx::MySqlPool;
use crate::models::resume::ResumeMedis;

pub async fn get_resume(
    Path(no_rawat): Path<String>,
    State(pool): State<MySqlPool>,
) -> Result<Json<Option<ResumeMedis>>, (StatusCode, String)> {
    let slash_no_rawat = no_rawat.replace('-', "/");
    
    let resume = sqlx::query_as::<_, ResumeMedis>(
        "SELECT no_rawat, kd_dokter, diagnosa_awal, alasan, keluhan_utama, pemeriksaan_fisik, 
         jalannya_penyakit, pemeriksaan_penunjang, hasil_laborat, tindakan_dan_operasi, obat_di_rs, 
         diagnosa_utama, kd_diagnosa_utama, diagnosa_sekunder, kd_diagnosa_sekunder, 
         diagnosa_sekunder2, kd_diagnosa_sekunder2, diagnosa_sekunder3, kd_diagnosa_sekunder3, 
         diagnosa_sekunder4, kd_diagnosa_sekunder4, prosedur_utama, kd_prosedur_utama, 
         prosedur_sekunder, kd_prosedur_sekunder, prosedur_sekunder2, kd_prosedur_sekunder2, 
         prosedur_sekunder3, kd_prosedur_sekunder3, alergi, diet, lab_belum, edukasi, 
         cara_keluar, ket_keluar, keadaan, ket_keadaan, dilanjutkan, ket_dilanjutkan, 
         CAST(kontrol AS CHAR) as kontrol, obat_pulang 
         FROM resume_pasien_ranap WHERE no_rawat = ?"
    )
    .bind(&slash_no_rawat)
    .fetch_optional(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(resume))
}

pub async fn save_resume(
    State(pool): State<MySqlPool>,
    Json(payload): Json<ResumeMedis>,
) -> Result<Json<serde_json::Value>, (StatusCode, String)> {
    let slash_no_rawat = payload.no_rawat.replace('-', "/");

    sqlx::query(
        "INSERT INTO resume_pasien_ranap (
            no_rawat, kd_dokter, diagnosa_awal, alasan, keluhan_utama, pemeriksaan_fisik, jalannya_penyakit, 
            pemeriksaan_penunjang, hasil_laborat, tindakan_dan_operasi, obat_di_rs, 
            diagnosa_utama, kd_diagnosa_utama, diagnosa_sekunder, kd_diagnosa_sekunder, 
            diagnosa_sekunder2, kd_diagnosa_sekunder2, diagnosa_sekunder3, kd_diagnosa_sekunder3, 
            diagnosa_sekunder4, kd_diagnosa_sekunder4, prosedur_utama, kd_prosedur_utama, 
            prosedur_sekunder, kd_prosedur_sekunder, prosedur_sekunder2, kd_prosedur_sekunder2, 
            prosedur_sekunder3, kd_prosedur_sekunder3, alergi, diet, lab_belum, edukasi, 
            cara_keluar, ket_keluar, keadaan, ket_keadaan, dilanjutkan, ket_dilanjutkan, 
            kontrol, obat_pulang
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
            kd_dokter = VALUES(kd_dokter),
            diagnosa_awal = VALUES(diagnosa_awal),
            alasan = VALUES(alasan),
            keluhan_utama = VALUES(keluhan_utama),
            pemeriksaan_fisik = VALUES(pemeriksaan_fisik),
            jalannya_penyakit = VALUES(jalannya_penyakit),
            pemeriksaan_penunjang = VALUES(pemeriksaan_penunjang),
            hasil_laborat = VALUES(hasil_laborat),
            tindakan_dan_operasi = VALUES(tindakan_dan_operasi),
            obat_di_rs = VALUES(obat_di_rs),
            diagnosa_utama = VALUES(diagnosa_utama),
            kd_diagnosa_utama = VALUES(kd_diagnosa_utama),
            diagnosa_sekunder = VALUES(diagnosa_sekunder),
            kd_diagnosa_sekunder = VALUES(kd_diagnosa_sekunder),
            diagnosa_sekunder2 = VALUES(diagnosa_sekunder2),
            kd_diagnosa_sekunder2 = VALUES(kd_diagnosa_sekunder2),
            diagnosa_sekunder3 = VALUES(diagnosa_sekunder3),
            kd_diagnosa_sekunder3 = VALUES(kd_diagnosa_sekunder3),
            diagnosa_sekunder4 = VALUES(diagnosa_sekunder4),
            kd_diagnosa_sekunder4 = VALUES(kd_diagnosa_sekunder4),
            prosedur_utama = VALUES(prosedur_utama),
            kd_prosedur_utama = VALUES(kd_prosedur_utama),
            prosedur_sekunder = VALUES(prosedur_sekunder),
            kd_prosedur_sekunder = VALUES(kd_prosedur_sekunder),
            prosedur_sekunder2 = VALUES(prosedur_sekunder2),
            kd_prosedur_sekunder2 = VALUES(kd_prosedur_sekunder2),
            prosedur_sekunder3 = VALUES(prosedur_sekunder3),
            kd_prosedur_sekunder3 = VALUES(kd_prosedur_sekunder3),
            alergi = VALUES(alergi),
            diet = VALUES(diet),
            lab_belum = VALUES(lab_belum),
            edukasi = VALUES(edukasi),
            cara_keluar = VALUES(cara_keluar),
            ket_keluar = VALUES(ket_keluar),
            keadaan = VALUES(keadaan),
            ket_keadaan = VALUES(ket_keadaan),
            dilanjutkan = VALUES(dilanjutkan),
            ket_dilanjutkan = VALUES(ket_dilanjutkan),
            kontrol = VALUES(kontrol),
            obat_pulang = VALUES(obat_pulang)"
    )
    .bind(&slash_no_rawat)
    .bind(&payload.kd_dokter)
    .bind(&payload.diagnosa_awal)
    .bind(&payload.alasan)
    .bind(&payload.keluhan_utama)
    .bind(&payload.pemeriksaan_fisik)
    .bind(&payload.jalannya_penyakit)
    .bind(&payload.pemeriksaan_penunjang)
    .bind(&payload.hasil_laborat)
    .bind(&payload.tindakan_dan_operasi)
    .bind(&payload.obat_di_rs)
    .bind(&payload.diagnosa_utama)
    .bind(&payload.kd_diagnosa_utama)
    .bind(&payload.diagnosa_sekunder)
    .bind(&payload.kd_diagnosa_sekunder)
    .bind(&payload.diagnosa_sekunder2)
    .bind(&payload.kd_diagnosa_sekunder2)
    .bind(&payload.diagnosa_sekunder3)
    .bind(&payload.kd_diagnosa_sekunder3)
    .bind(&payload.diagnosa_sekunder4)
    .bind(&payload.kd_diagnosa_sekunder4)
    .bind(&payload.prosedur_utama)
    .bind(&payload.kd_prosedur_utama)
    .bind(&payload.prosedur_sekunder)
    .bind(&payload.kd_prosedur_sekunder)
    .bind(&payload.prosedur_sekunder2)
    .bind(&payload.kd_prosedur_sekunder2)
    .bind(&payload.prosedur_sekunder3)
    .bind(&payload.kd_prosedur_sekunder3)
    .bind(&payload.alergi)
    .bind(&payload.diet)
    .bind(&payload.lab_belum)
    .bind(&payload.edukasi)
    .bind(&payload.cara_keluar)
    .bind(&payload.ket_keluar)
    .bind(&payload.keadaan)
    .bind(&payload.ket_keadaan)
    .bind(&payload.dilanjutkan)
    .bind(&payload.ket_dilanjutkan)
    .bind(&payload.kontrol)
    .bind(&payload.obat_pulang)
    .execute(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Error saving resume ranap: {}", e.to_string())))?;

    Ok(Json(serde_json::json!({ "success": true })))
}

pub async fn get_resume_ralan(
    Path(no_rawat): Path<String>,
    State(pool): State<MySqlPool>,
) -> Result<Json<Option<crate::models::resume::ResumeMedisRalan>>, (StatusCode, String)> {
    let slash_no_rawat = no_rawat.replace('-', "/");
    
    let resume = sqlx::query_as::<_, crate::models::resume::ResumeMedisRalan>(
        "SELECT no_rawat, kd_dokter, keluhan_utama, jalannya_penyakit, pemeriksaan_penunjang, 
         hasil_laborat, diagnosa_utama, kd_diagnosa_utama, diagnosa_sekunder, kd_diagnosa_sekunder, 
         diagnosa_sekunder2, kd_diagnosa_sekunder2, diagnosa_sekunder3, kd_diagnosa_sekunder3, 
         diagnosa_sekunder4, kd_diagnosa_sekunder4, prosedur_utama, kd_prosedur_utama, 
         prosedur_sekunder, kd_prosedur_sekunder, prosedur_sekunder2, kd_prosedur_sekunder2, 
         prosedur_sekunder3, kd_prosedur_sekunder3, kondisi_pulang, obat_pulang 
         FROM resume_pasien WHERE no_rawat = ?"
    )
    .bind(&slash_no_rawat)
    .fetch_optional(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(resume))
}

pub async fn save_resume_ralan(
    State(pool): State<MySqlPool>,
    Json(payload): Json<crate::models::resume::ResumeMedisRalan>,
) -> Result<Json<serde_json::Value>, (StatusCode, String)> {
    let slash_no_rawat = payload.no_rawat.replace('-', "/");
    tracing::debug!("DEBUG: Saving resume ralan for no_rawat: {}", slash_no_rawat);

    sqlx::query(
        "INSERT INTO resume_pasien (
            no_rawat, kd_dokter, keluhan_utama, jalannya_penyakit, pemeriksaan_penunjang, hasil_laborat, 
            diagnosa_utama, kd_diagnosa_utama, diagnosa_sekunder, kd_diagnosa_sekunder, 
            diagnosa_sekunder2, kd_diagnosa_sekunder2, diagnosa_sekunder3, kd_diagnosa_sekunder3, 
            diagnosa_sekunder4, kd_diagnosa_sekunder4, prosedur_utama, kd_prosedur_utama, 
            prosedur_sekunder, kd_prosedur_sekunder, prosedur_sekunder2, kd_prosedur_sekunder2, 
            prosedur_sekunder3, kd_prosedur_sekunder3, kondisi_pulang, obat_pulang
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
            kd_dokter = VALUES(kd_dokter),
            keluhan_utama = VALUES(keluhan_utama),
            jalannya_penyakit = VALUES(jalannya_penyakit),
            pemeriksaan_penunjang = VALUES(pemeriksaan_penunjang),
            hasil_laborat = VALUES(hasil_laborat),
            diagnosa_utama = VALUES(diagnosa_utama),
            kd_diagnosa_utama = VALUES(kd_diagnosa_utama),
            diagnosa_sekunder = VALUES(diagnosa_sekunder),
            kd_diagnosa_sekunder = VALUES(kd_diagnosa_sekunder),
            diagnosa_sekunder2 = VALUES(diagnosa_sekunder2),
            kd_diagnosa_sekunder2 = VALUES(kd_diagnosa_sekunder2),
            diagnosa_sekunder3 = VALUES(diagnosa_sekunder3),
            kd_diagnosa_sekunder3 = VALUES(kd_diagnosa_sekunder3),
            diagnosa_sekunder4 = VALUES(diagnosa_sekunder4),
            kd_diagnosa_sekunder4 = VALUES(kd_diagnosa_sekunder4),
            prosedur_utama = VALUES(prosedur_utama),
            kd_prosedur_utama = VALUES(kd_prosedur_utama),
            prosedur_sekunder = VALUES(prosedur_sekunder),
            kd_prosedur_sekunder = VALUES(kd_prosedur_sekunder),
            prosedur_sekunder2 = VALUES(prosedur_sekunder2),
            kd_prosedur_sekunder2 = VALUES(kd_prosedur_sekunder2),
            prosedur_sekunder3 = VALUES(prosedur_sekunder3),
            kd_prosedur_sekunder3 = VALUES(kd_prosedur_sekunder3),
            kondisi_pulang = VALUES(kondisi_pulang),
            obat_pulang = VALUES(obat_pulang)"
    )
    .bind(&slash_no_rawat)
    .bind(&payload.kd_dokter)
    .bind(&payload.keluhan_utama)
    .bind(&payload.jalannya_penyakit)
    .bind(&payload.pemeriksaan_penunjang)
    .bind(&payload.hasil_laborat)
    .bind(&payload.diagnosa_utama)
    .bind(&payload.kd_diagnosa_utama)
    .bind(&payload.diagnosa_sekunder)
    .bind(&payload.kd_diagnosa_sekunder)
    .bind(&payload.diagnosa_sekunder2)
    .bind(&payload.kd_diagnosa_sekunder2)
    .bind(&payload.diagnosa_sekunder3)
    .bind(&payload.kd_diagnosa_sekunder3)
    .bind(&payload.diagnosa_sekunder4)
    .bind(&payload.kd_diagnosa_sekunder4)
    .bind(&payload.prosedur_utama)
    .bind(&payload.kd_prosedur_utama)
    .bind(&payload.prosedur_sekunder)
    .bind(&payload.kd_prosedur_sekunder)
    .bind(&payload.prosedur_sekunder2)
    .bind(&payload.kd_prosedur_sekunder2)
    .bind(&payload.prosedur_sekunder3)
    .bind(&payload.kd_prosedur_sekunder3)
    .bind(&payload.kondisi_pulang)
    .bind(&payload.obat_pulang)
    .execute(&pool)
    .await
    .map_err(|e| {
        tracing::error!("Error saving resume ralan for {}: {}", slash_no_rawat, e);
        (StatusCode::INTERNAL_SERVER_ERROR, format!("Error saving resume ralan: {}", e.to_string()))
    })?;

    tracing::debug!("DEBUG: Successfully saved resume ralan for {}", slash_no_rawat);
    Ok(Json(serde_json::json!({ "success": true })))
}
