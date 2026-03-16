use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    Json,
};
use serde::Deserialize;
use sqlx::{MySql, Pool, Column};
use crate::models::soap::{SoapRequest, IcdResult, PemeriksaanRalan, PenilaianMedisUmum, PenilaianMedisAnak, PenilaianMedisKandungan, PenilaianMedisBedah, PenilaianMedisTHT, PenilaianMedisMata, PenilaianMedisNeurologi, PenilaianMedisParu, PenilaianMedisJantung, PenilaianMedisBedahMulut, PenilaianMedisPsikiatrik, PenilaianMedisOrthopedi, PenilaianMedisUrologi, PenilaianMedisGeriatri, PenilaianMedisRehabMedik, PenilaianMedisKulitKelamin, PenilaianMedisGDPsikiatri, PenilaianPenyakitDalamCustom};
use chrono::Local;

#[derive(Deserialize)]
pub struct IcdQuery {
    pub q: String,
}

pub async fn save_soap(
    State(pool): State<Pool<MySql>>,
    Path(no_rawat_raw): Path<String>,
    Json(payload): Json<SoapRequest>,
) -> Result<StatusCode, (StatusCode, String)> {
    let no_rawat = no_rawat_raw.replace("-", "/");
    let now = Local::now();
    let tgl_perawatan = now.format("%Y-%m-%d").to_string();
    let jam_rawat = now.format("%H:%M:%S").to_string();

    tracing::debug!("Saving SOAP for no_rawat: {}", no_rawat);
    
    let mut tx = pool.begin().await
        .map_err(|e| {
            tracing::error!("Failed to begin transaction: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, e.to_string())
        })?;

    // 1. Insert into pemeriksaan_ralan
    sqlx::query(
        "INSERT INTO pemeriksaan_ralan (
            no_rawat, tgl_perawatan, jam_rawat, suhu_tubuh, tensi, nadi, respirasi, 
            tinggi, berat, spo2, gcs, kesadaran, keluhan, pemeriksaan, alergi, 
            lingkar_perut, lingkar_kepala, lingkar_dada, rtl, penilaian, instruksi, evaluasi, nip
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(&no_rawat)
    .bind(&tgl_perawatan)
    .bind(&jam_rawat)
    .bind(&payload.suhu)
    .bind(&payload.tensi)
    .bind(&payload.nadi)
    .bind(&payload.respirasi)
    .bind(&payload.tinggi)
    .bind(&payload.berat)
    .bind(&payload.spo2)
    .bind(&payload.gcs)
    .bind(&payload.kesadaran)
    .bind(&payload.keluhan)
    .bind(&payload.pemeriksaan)
    .bind(&payload.alergi)
    .bind(&payload.lingkar_perut)
    .bind(&payload.lingkar_kepala)
    .bind(&payload.lingkar_dada)
    .bind(&payload.tindak_lanjut)
    .bind(&payload.penilaian)
    .bind(&payload.instruksi)
    .bind(&payload.evaluasi)
    .bind(payload.nip)
    .execute(&mut *tx)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // 2. Update reg_periksa status
    sqlx::query("UPDATE reg_periksa SET stts = 'Sudah' WHERE no_rawat = ?")
    .bind(&no_rawat)
    .execute(&mut *tx)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    tx.commit().await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(StatusCode::CREATED)
}

pub async fn save_soap_ranap(
    State(pool): State<Pool<MySql>>,
    Path(no_rawat_raw): Path<String>,
    Json(payload): Json<SoapRequest>,
) -> Result<StatusCode, (StatusCode, String)> {
    let no_rawat = no_rawat_raw.replace("-", "/");
    let now = Local::now();
    let tgl_perawatan = now.format("%Y-%m-%d").to_string();
    let jam_rawat = now.format("%H:%M:%S").to_string();

    tracing::debug!("Saving Ranap SOAP for no_rawat: {}", no_rawat);
    
    let mut tx = pool.begin().await
        .map_err(|e| {
            tracing::error!("Failed to begin transaction: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, e.to_string())
        })?;

    // Insert into pemeriksaan_ranap
    sqlx::query(
        "INSERT INTO pemeriksaan_ranap (
            no_rawat, tgl_perawatan, jam_rawat, suhu_tubuh, tensi, nadi, respirasi, 
            tinggi, berat, spo2, gcs, kesadaran, keluhan, pemeriksaan, alergi, 
            rtl, penilaian, instruksi, evaluasi, nip
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(&no_rawat)
    .bind(&tgl_perawatan)
    .bind(&jam_rawat)
    .bind(&payload.suhu)
    .bind(&payload.tensi)
    .bind(&payload.nadi)
    .bind(&payload.respirasi)
    .bind(&payload.tinggi)
    .bind(&payload.berat)
    .bind(&payload.spo2)
    .bind(&payload.gcs)
    .bind(&payload.kesadaran)
    .bind(&payload.keluhan)
    .bind(&payload.pemeriksaan)
    .bind(&payload.alergi)
    .bind(&payload.tindak_lanjut)
    .bind(&payload.penilaian)
    .bind(&payload.instruksi)
    .bind(&payload.evaluasi)
    .bind(payload.nip)
    .execute(&mut *tx)
    .await
    .map_err(|e| {
        tracing::error!("Error inserting into pemeriksaan_ranap: {}", e);
        (StatusCode::INTERNAL_SERVER_ERROR, e.to_string())
    })?;

    tx.commit().await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(StatusCode::CREATED)
}

pub async fn get_soap_history(
    State(pool): State<Pool<MySql>>,
    Path(no_rawat_raw): Path<String>,
) -> Result<Json<Vec<serde_json::Value>>, (StatusCode, String)> {
    let no_rawat = no_rawat_raw.replace("-", "/");
    
    let results = sqlx::query(
        "SELECT CAST(tgl_perawatan AS CHAR) as tgl_perawatan, 
                CAST(jam_rawat AS CHAR) as jam_rawat, 
                suhu_tubuh, tensi, nadi, respirasi, 
                tinggi, berat, spo2, gcs, kesadaran, keluhan, pemeriksaan, alergi, 
                rtl, penilaian, instruksi, evaluasi, nip
         FROM pemeriksaan_ranap 
         WHERE no_rawat = ? 
         ORDER BY tgl_perawatan DESC, jam_rawat DESC"
    )
    .bind(&no_rawat)
    .fetch_all(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let mut history = Vec::new();
    for row in results {
        use sqlx::Row;
        history.push(serde_json::json!({
            "tgl_perawatan": row.get::<Option<String>, _>("tgl_perawatan").unwrap_or_default(),
            "jam_rawat": row.get::<Option<String>, _>("jam_rawat").unwrap_or_default(),
            "suhu": row.get::<String, _>("suhu_tubuh"),
            "tensi": row.get::<String, _>("tensi"),
            "nadi": row.get::<String, _>("nadi"),
            "respirasi": row.get::<String, _>("respirasi"),
            "tinggi": row.get::<String, _>("tinggi"),
            "berat": row.get::<String, _>("berat"),
            "spo2": row.get::<String, _>("spo2"),
            "gcs": row.get::<String, _>("gcs"),
            "kesadaran": row.get::<String, _>("kesadaran"),
            "keluhan": row.get::<String, _>("keluhan"),
            "pemeriksaan": row.get::<String, _>("pemeriksaan"),
            "alergi": row.get::<String, _>("alergi"),
            "rtl": row.get::<String, _>("rtl"),
            "penilaian": row.get::<String, _>("penilaian"),
            "instruksi": row.get::<String, _>("instruksi"),
            "evaluasi": row.get::<String, _>("evaluasi"),
            "nip": row.get::<String, _>("nip"),
        }));
    }

    Ok(Json(history))
}

pub async fn search_icd(
    State(pool): State<Pool<MySql>>,
    Query(params): Query<IcdQuery>,
) -> Result<Json<Vec<IcdResult>>, (StatusCode, String)> {
    let query_str = format!("%{}%", params.q);
    
    let results = sqlx::query_as::<_, IcdResult>(
        "SELECT kd_penyakit as kd, nm_penyakit as nm FROM penyakit 
         WHERE kd_penyakit LIKE ? OR nm_penyakit LIKE ? LIMIT 10"
    )
    .bind(&query_str)
    .bind(&query_str)
    .fetch_all(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(results))
}


pub async fn get_latest_pemeriksaan_ralan(
    State(pool): State<Pool<MySql>>,
    Path(no_rawat_raw): Path<String>,
) -> Result<Json<Option<PemeriksaanRalan>>, (StatusCode, String)> {
    let no_rawat = no_rawat_raw.replace("-", "/");
    
    let result = sqlx::query_as::<_, PemeriksaanRalan>(
        "SELECT no_rawat, CAST(tgl_perawatan AS CHAR) as tgl_perawatan, CAST(jam_rawat AS CHAR) as jam_rawat, 
         suhu_tubuh, tensi, nadi, respirasi, tinggi, berat, spo2, gcs, kesadaran, keluhan, pemeriksaan, 
         alergi, lingkar_perut, lingkar_kepala, lingkar_dada, rtl, penilaian, instruksi, evaluasi, nip
         FROM pemeriksaan_ralan 
         WHERE no_rawat = ? 
         ORDER BY tgl_perawatan DESC, jam_rawat DESC 
         LIMIT 1"
    )
    .bind(&no_rawat)
    .fetch_optional(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(result))
}

pub async fn get_penilaian_medis_umum(
    State(pool): State<Pool<MySql>>,
    Path(no_rawat_raw): Path<String>,
) -> Result<Json<Option<PenilaianMedisUmum>>, (StatusCode, String)> {
    let no_rawat = no_rawat_raw.replace("-", "/");
    
    let result = sqlx::query_as::<_, PenilaianMedisUmum>(
        "SELECT no_rawat, CAST(tanggal AS CHAR) as tanggal, kd_dokter, anamnesis, hubungan, keluhan_utama, rps, rpd, rpo, alergi, keadaan, kesadaran, gcs, td, nadi, rr, suhu, bb, tb, bmi, keluhan, kepala, mata, tht, mulut, leher, thoraks, jantung, paru, abdomen, genital, ekstremitas, kulit, ket_fisik, ket_lokalis, penunjang, diagnosis, tata, konsulrujuk FROM penilaian_medis_ralan WHERE no_rawat = ?"
    )
    .bind(&no_rawat)
    .fetch_optional(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(result))
}

pub async fn save_penilaian_medis_umum(
    State(pool): State<Pool<MySql>>,
    Path(no_rawat_raw): Path<String>,
    Json(payload): Json<PenilaianMedisUmum>,
) -> Result<StatusCode, (StatusCode, String)> {
    let no_rawat = no_rawat_raw.replace("-", "/");
    let now = Local::now().naive_local();

    sqlx::query(
        "REPLACE INTO penilaian_medis_ralan (
            no_rawat, tanggal, kd_dokter, anamnesis, hubungan, keluhan_utama, rps, rpd, rpo, 
            alergi, keadaan, kesadaran, gcs, td, nadi, rr, suhu, bb, tb, bmi, keluhan, 
            kepala, mata, tht, mulut, leher, thoraks, jantung, paru, abdomen, genital, 
            ekstremitas, kulit, ket_fisik, ket_lokalis, penunjang, diagnosis, tata, konsulrujuk
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(&no_rawat)
    .bind(now)
    .bind(&payload.kd_dokter)
    .bind(&payload.anamnesis)
    .bind(&payload.hubungan)
    .bind(&payload.keluhan_utama)
    .bind(&payload.rps)
    .bind(&payload.rpd)
    .bind(&payload.rpo)
    .bind(&payload.alergi)
    .bind(&payload.keadaan)
    .bind(&payload.kesadaran)
    .bind(&payload.gcs)
    .bind(&payload.td)
    .bind(&payload.nadi)
    .bind(&payload.rr)
    .bind(&payload.suhu)
    .bind(&payload.bb)
    .bind(&payload.tb)
    .bind(&payload.bmi)
    .bind(&payload.keluhan)
    .bind(&payload.kepala)
    .bind(&payload.mata)
    .bind(&payload.tht)
    .bind(&payload.mulut)
    .bind(&payload.leher)
    .bind(&payload.thoraks)
    .bind(&payload.jantung)
    .bind(&payload.paru)
    .bind(&payload.abdomen)
    .bind(&payload.genital)
    .bind(&payload.ekstremitas)
    .bind(&payload.kulit)
    .bind(&payload.ket_fisik)
    .bind(&payload.ket_lokalis)
    .bind(&payload.penunjang)
    .bind(&payload.diagnosis)
    .bind(&payload.tata)
    .bind(&payload.konsulrujuk)
    .execute(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(StatusCode::CREATED)
}

pub async fn get_penilaian_medis_anak(
    State(pool): State<Pool<MySql>>,
    Path(no_rawat_raw): Path<String>,
) -> Result<Json<Option<PenilaianMedisAnak>>, (StatusCode, String)> {
    let no_rawat = no_rawat_raw.replace("-", "/");
    
    let result = sqlx::query_as::<_, PenilaianMedisAnak>(
        "SELECT *, CAST(tanggal AS CHAR) as tanggal FROM penilaian_medis_ralan_anak WHERE no_rawat = ?"
    )
    .bind(&no_rawat)
    .fetch_optional(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(result))
}

pub async fn save_penilaian_medis_anak(
    State(pool): State<Pool<MySql>>,
    Path(no_rawat_raw): Path<String>,
    Json(payload): Json<PenilaianMedisAnak>,
) -> Result<StatusCode, (StatusCode, String)> {
    let no_rawat = no_rawat_raw.replace("-", "/");
    let now = Local::now().naive_local();

    sqlx::query(
        "REPLACE INTO penilaian_medis_ralan_anak (
            no_rawat, tanggal, kd_dokter, anamnesis, hubungan, keluhan_utama, rps, rpd, rpo, 
            alergi, keadaan, kesadaran, gcs, td, nadi, rr, suhu, bb, tb, bmi, keluhan, 
            kepala, mata, gigi, tht, thoraks, abdomen, genital, ekstremitas, kulit, 
            ket_fisik, ket_lokalis, penunjang, diagnosis, tata, konsul
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(&no_rawat)
    .bind(now)
    .bind(&payload.kd_dokter)
    .bind(&payload.anamnesis)
    .bind(&payload.hubungan)
    .bind(&payload.keluhan_utama)
    .bind(&payload.rps)
    .bind(&payload.rpd)
    .bind(&payload.rpo)
    .bind(&payload.alergi)
    .bind(&payload.keadaan)
    .bind(&payload.kesadaran)
    .bind(&payload.gcs)
    .bind(&payload.td)
    .bind(&payload.nadi)
    .bind(&payload.rr)
    .bind(&payload.suhu)
    .bind(&payload.bb)
    .bind(&payload.tb)
    .bind(&payload.bmi)
    .bind(&payload.keluhan)
    .bind(&payload.kepala)
    .bind(&payload.mata)
    .bind(&payload.gigi)
    .bind(&payload.tht)
    .bind(&payload.thoraks)
    .bind(&payload.abdomen)
    .bind(&payload.genital)
    .bind(&payload.ekstremitas)
    .bind(&payload.kulit)
    .bind(&payload.ket_fisik)
    .bind(&payload.ket_lokalis)
    .bind(&payload.penunjang)
    .bind(&payload.diagnosis)
    .bind(&payload.tata)
    .bind(&payload.konsul)
    .execute(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(StatusCode::CREATED)
}

pub async fn get_penilaian_medis_kandungan(
    State(pool): State<Pool<MySql>>,
    Path(no_rawat_raw): Path<String>,
) -> Result<Json<Option<PenilaianMedisKandungan>>, (StatusCode, String)> {
    let no_rawat = no_rawat_raw.replace("-", "/");
    
    let result = sqlx::query_as::<_, PenilaianMedisKandungan>(
        "SELECT *, CAST(tanggal AS CHAR) as tanggal FROM penilaian_medis_ralan_kandungan WHERE no_rawat = ?"
    )
    .bind(&no_rawat)
    .fetch_optional(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(result))
}

pub async fn save_penilaian_medis_kandungan(
    State(pool): State<Pool<MySql>>,
    Path(no_rawat_raw): Path<String>,
    Json(payload): Json<PenilaianMedisKandungan>,
) -> Result<StatusCode, (StatusCode, String)> {
    let no_rawat = no_rawat_raw.replace("-", "/");
    let now = Local::now().naive_local();

    sqlx::query(
        "REPLACE INTO penilaian_medis_ralan_kandungan (
            no_rawat, tanggal, kd_dokter, anamnesis, hubungan, keluhan_utama, rps, rpd, rpo, 
            alergi, keadaan, kesadaran, gcs, td, nadi, rr, suhu, bb, tb, bmi, kepala, 
            mata, tht, thoraks, abdomen, ekstremitas, kulit, ket_fisik, tfu, tbj, his, 
            kontraksi, djj, inspeksi, inspekulo, vt, rt, ultra, kardio, lab, diagnosis, 
            tata, konsul
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(&no_rawat)
    .bind(now)
    .bind(&payload.kd_dokter)
    .bind(&payload.anamnesis)
    .bind(&payload.hubungan)
    .bind(&payload.keluhan_utama)
    .bind(&payload.rps)
    .bind(&payload.rpd)
    .bind(&payload.rpo)
    .bind(&payload.alergi)
    .bind(&payload.keadaan)
    .bind(&payload.kesadaran)
    .bind(&payload.gcs)
    .bind(&payload.td)
    .bind(&payload.nadi)
    .bind(&payload.rr)
    .bind(&payload.suhu)
    .bind(&payload.bb)
    .bind(&payload.tb)
    .bind(&payload.bmi)
    .bind(&payload.kepala)
    .bind(&payload.mata)
    .bind(&payload.tht)
    .bind(&payload.thoraks)
    .bind(&payload.abdomen)
    .bind(&payload.ekstremitas)
    .bind(&payload.kulit)
    .bind(&payload.ket_fisik)
    .bind(&payload.tfu)
    .bind(&payload.tbj)
    .bind(&payload.his)
    .bind(&payload.kontraksi)
    .bind(&payload.djj)
    .bind(&payload.inspeksi)
    .bind(&payload.inspekulo)
    .bind(&payload.vt)
    .bind(&payload.rt)
    .bind(&payload.ultra)
    .bind(&payload.kardio)
    .bind(&payload.lab)
    .bind(&payload.diagnosis)
    .bind(&payload.tata)
    .bind(&payload.konsul)
    .execute(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(StatusCode::CREATED)
}

pub async fn get_penilaian_medis_bedah(
    State(pool): State<Pool<MySql>>,
    Path(no_rawat_raw): Path<String>,
) -> Result<Json<Option<PenilaianMedisBedah>>, (StatusCode, String)> {
    let no_rawat = no_rawat_raw.replace("-", "/");
    
    let result = sqlx::query_as::<_, PenilaianMedisBedah>(
        "SELECT *, CAST(tanggal AS CHAR) as tanggal FROM penilaian_medis_ralan_bedah WHERE no_rawat = ?"
    )
    .bind(&no_rawat)
    .fetch_optional(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(result))
}

pub async fn save_penilaian_medis_bedah(
    State(pool): State<Pool<MySql>>,
    Path(no_rawat_raw): Path<String>,
    Json(payload): Json<PenilaianMedisBedah>,
) -> Result<StatusCode, (StatusCode, String)> {
    let no_rawat = no_rawat_raw.replace("-", "/");
    let now = Local::now().naive_local();

    sqlx::query(
        "REPLACE INTO penilaian_medis_ralan_bedah (
            no_rawat, tanggal, kd_dokter, anamnesis, hubungan, keluhan_utama, rps, rpd, rpo, 
            alergi, keadaan, kesadaran, gcs, td, nadi, rr, suhu, bb, tb, bmi, kepala, 
            mata, tht, thoraks, abdomen, ekstremitas, kulit, ket_fisik, ket_lokalis, 
            penunjang, diagnosis, tata, konsulrujuk
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(&no_rawat)
    .bind(now)
    .bind(&payload.kd_dokter)
    .bind(&payload.anamnesis)
    .bind(&payload.hubungan)
    .bind(&payload.keluhan_utama)
    .bind(&payload.rps)
    .bind(&payload.rpd)
    .bind(&payload.rpo)
    .bind(&payload.alergi)
    .bind(&payload.keadaan)
    .bind(&payload.kesadaran)
    .bind(&payload.gcs)
    .bind(&payload.td)
    .bind(&payload.nadi)
    .bind(&payload.rr)
    .bind(&payload.suhu)
    .bind(&payload.bb)
    .bind(&payload.tb)
    .bind(&payload.bmi)
    .bind(&payload.kepala)
    .bind(&payload.mata)
    .bind(&payload.tht)
    .bind(&payload.thoraks)
    .bind(&payload.abdomen)
    .bind(&payload.ekstremitas)
    .bind(&payload.kulit)
    .bind(&payload.ket_fisik)
    .bind(&payload.ket_lokalis)
    .bind(&payload.penunjang)
    .bind(&payload.diagnosis)
    .bind(&payload.tata)
    .bind(&payload.konsulrujuk)
    .execute(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(StatusCode::CREATED)
}

pub async fn get_penilaian_medis_tht(
    State(pool): State<Pool<MySql>>,
    Path(no_rawat_raw): Path<String>,
) -> Result<Json<Option<PenilaianMedisTHT>>, (StatusCode, String)> {
    let no_rawat = no_rawat_raw.replace("-", "/");
    
    let result = sqlx::query_as::<_, PenilaianMedisTHT>(
        "SELECT *, CAST(tanggal AS CHAR) as tanggal FROM penilaian_medis_ralan_tht WHERE no_rawat = ?"
    )
    .bind(&no_rawat)
    .fetch_optional(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(result))
}

pub async fn save_penilaian_medis_tht(
    State(pool): State<Pool<MySql>>,
    Path(no_rawat_raw): Path<String>,
    Json(payload): Json<PenilaianMedisTHT>,
) -> Result<StatusCode, (StatusCode, String)> {
    let no_rawat = no_rawat_raw.replace("-", "/");
    let now = Local::now().naive_local();

    sqlx::query(
        "REPLACE INTO penilaian_medis_ralan_tht (
            no_rawat, tanggal, kd_dokter, anamnesis, hubungan, keluhan_utama, rps, rpd, rpo, 
            alergi, td, nadi, rr, suhu, bb, tb, nyeri, status_nutrisi, kondisi, 
            ket_lokalis, lab, rad, tes_pendengaran, penunjang, diagnosis, diagnosisbanding, 
            permasalahan, terapi, tindakan, tatalaksana, edukasi
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(&no_rawat)
    .bind(now)
    .bind(&payload.kd_dokter)
    .bind(&payload.anamnesis)
    .bind(&payload.hubungan)
    .bind(&payload.keluhan_utama)
    .bind(&payload.rps)
    .bind(&payload.rpd)
    .bind(&payload.rpo)
    .bind(&payload.alergi)
    .bind(&payload.td)
    .bind(&payload.nadi)
    .bind(&payload.rr)
    .bind(&payload.suhu)
    .bind(&payload.bb)
    .bind(&payload.tb)
    .bind(&payload.nyeri)
    .bind(&payload.status_nutrisi)
    .bind(&payload.kondisi)
    .bind(&payload.ket_lokalis)
    .bind(&payload.lab)
    .bind(&payload.rad)
    .bind(&payload.tes_pendengaran)
    .bind(&payload.penunjang)
    .bind(&payload.diagnosis)
    .bind(&payload.diagnosisbanding)
    .bind(&payload.permasalahan)
    .bind(&payload.terapi)
    .bind(&payload.tindakan)
    .bind(&payload.tatalaksana)
    .bind(&payload.edukasi)
    .execute(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(StatusCode::CREATED)
}

pub async fn get_penilaian_medis_mata(
    State(pool): State<Pool<MySql>>,
    Path(no_rawat_raw): Path<String>,
) -> Result<Json<Option<PenilaianMedisMata>>, (StatusCode, String)> {
    let no_rawat = no_rawat_raw.replace("-", "/");
    
    let result = sqlx::query_as::<_, PenilaianMedisMata>(
        "SELECT *, CAST(tanggal AS CHAR) as tanggal FROM penilaian_medis_ralan_mata WHERE no_rawat = ?"
    )
    .bind(&no_rawat)
    .fetch_optional(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(result))
}

pub async fn save_penilaian_medis_mata(
    State(pool): State<Pool<MySql>>,
    Path(no_rawat_raw): Path<String>,
    Json(payload): Json<PenilaianMedisMata>,
) -> Result<StatusCode, (StatusCode, String)> {
    let no_rawat = no_rawat_raw.replace("-", "/");
    let now = Local::now().naive_local();

    sqlx::query(
        "REPLACE INTO penilaian_medis_ralan_mata (
            no_rawat, tanggal, kd_dokter, anamnesis, hubungan, keluhan_utama, rps, rpd, rpo, 
            alergi, visuskanan, visuskiri, periksakanan, periksakiri, ekskanan, ekskiri, 
            palpebrakanan, palpebrakiri, konjungtivakanan, konjungtivakiri, korneakanan, 
            korneakiri, coakanan, coakiri, pupilkanan, pupilkiri, lensakanan, lensakiri, 
            funduskanan, funduskiri, papilkanan, papilkiri, retinakanan, retinakiri, 
            makulakanan, makulakiri, tiokanan, tiokiri, mbokanan, mbokiri, lab, rad, 
            penunjang, tes, pemeriksaan, diagnosis, diagnosisbdg, permasalahan, terapi, 
            tindakan, edukasi
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(&no_rawat)
    .bind(now)
    .bind(&payload.kd_dokter)
    .bind(&payload.anamnesis)
    .bind(&payload.hubungan)
    .bind(&payload.keluhan_utama)
    .bind(&payload.rps)
    .bind(&payload.rpd)
    .bind(&payload.rpo)
    .bind(&payload.alergi)
    .bind(&payload.visuskanan)
    .bind(&payload.visuskiri)
    .bind(&payload.periksakanan)
    .bind(&payload.periksakiri)
    .bind(&payload.ekskanan)
    .bind(&payload.ekskiri)
    .bind(&payload.palpebrakanan)
    .bind(&payload.palpebrakiri)
    .bind(&payload.konjungtivakanan)
    .bind(&payload.konjungtivakiri)
    .bind(&payload.korneakanan)
    .bind(&payload.korneakiri)
    .bind(&payload.coakanan)
    .bind(&payload.coakiri)
    .bind(&payload.pupilkanan)
    .bind(&payload.pupilkiri)
    .bind(&payload.lensakanan)
    .bind(&payload.lensakiri)
    .bind(&payload.funduskanan)
    .bind(&payload.funduskiri)
    .bind(&payload.papilkanan)
    .bind(&payload.papilkiri)
    .bind(&payload.retinakanan)
    .bind(&payload.retinakiri)
    .bind(&payload.makulakanan)
    .bind(&payload.makulakiri)
    .bind(&payload.tiokanan)
    .bind(&payload.tiokiri)
    .bind(&payload.mbokanan)
    .bind(&payload.mbokiri)
    .bind(&payload.lab)
    .bind(&payload.rad)
    .bind(&payload.penunjang)
    .bind(&payload.tes)
    .bind(&payload.pemeriksaan)
    .bind(&payload.diagnosis)
    .bind(&payload.diagnosisbdg)
    .bind(&payload.permasalahan)
    .bind(&payload.terapi)
    .bind(&payload.tindakan)
    .bind(&payload.edukasi)
    .execute(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(StatusCode::CREATED)
}

pub async fn get_penilaian_medis_neurologi(
    State(pool): State<Pool<MySql>>,
    Path(no_rawat_raw): Path<String>,
) -> Result<Json<Option<PenilaianMedisNeurologi>>, (StatusCode, String)> {
    let no_rawat = no_rawat_raw.replace("-", "/");
    
    let result = sqlx::query_as::<_, PenilaianMedisNeurologi>(
        "SELECT *, CAST(tanggal AS CHAR) as tanggal FROM penilaian_medis_ralan_neurologi WHERE no_rawat = ?"
    )
    .bind(&no_rawat)
    .fetch_optional(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(result))
}

pub async fn save_penilaian_medis_neurologi(
    State(pool): State<Pool<MySql>>,
    Path(no_rawat_raw): Path<String>,
    Json(payload): Json<PenilaianMedisNeurologi>,
) -> Result<StatusCode, (StatusCode, String)> {
    let no_rawat = no_rawat_raw.replace("-", "/");
    let now = Local::now().naive_local();

    sqlx::query(
        "REPLACE INTO penilaian_medis_ralan_neurologi (
            no_rawat, tanggal, kd_dokter, anamnesis, hubungan, keluhan_utama, rps, rpd, rpo, 
            alergi, keadaan, kesadaran, td, nadi, rr, suhu, gcs, kepala, keterangan_kepala, 
            thoraks, keterangan_thoraks, abdomen, keterangan_abdomen, ekstremitas, 
            keterangan_ekstremitas, columna, keterangan_columna, muskulos, 
            keterangan_muskulos, lainnya, lab, rad, penunjanglain, diagnosis, 
            diagnosis2, permasalahan, terapi, tindakan, edukasi
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(&no_rawat)
    .bind(now)
    .bind(&payload.kd_dokter)
    .bind(&payload.anamnesis)
    .bind(&payload.hubungan)
    .bind(&payload.keluhan_utama)
    .bind(&payload.rps)
    .bind(&payload.rpd)
    .bind(&payload.rpo)
    .bind(&payload.alergi)
    .bind(&payload.keadaan)
    .bind(&payload.kesadaran)
    .bind(&payload.td)
    .bind(&payload.nadi)
    .bind(&payload.rr)
    .bind(&payload.suhu)
    .bind(&payload.gcs)
    .bind(&payload.kepala)
    .bind(&payload.keterangan_kepala)
    .bind(&payload.thoraks)
    .bind(&payload.keterangan_thoraks)
    .bind(&payload.abdomen)
    .bind(&payload.keterangan_abdomen)
    .bind(&payload.ekstremitas)
    .bind(&payload.keterangan_ekstremitas)
    .bind(&payload.columna)
    .bind(&payload.keterangan_columna)
    .bind(&payload.muskulos)
    .bind(&payload.keterangan_muskulos)
    .bind(&payload.lainnya)
    .bind(&payload.lab)
    .bind(&payload.rad)
    .bind(&payload.penunjanglain)
    .bind(&payload.diagnosis)
    .bind(&payload.diagnosis2)
    .bind(&payload.permasalahan)
    .bind(&payload.terapi)
    .bind(&payload.tindakan)
    .bind(&payload.edukasi)
    .execute(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(StatusCode::CREATED)
}

pub async fn get_penilaian_medis_paru(
    State(pool): State<Pool<MySql>>,
    Path(no_rawat_raw): Path<String>,
) -> Result<Json<Option<PenilaianMedisParu>>, (StatusCode, String)> {
    let no_rawat = no_rawat_raw.replace("-", "/");
    
    let result = sqlx::query_as::<_, PenilaianMedisParu>(
        "SELECT *, CAST(tanggal AS CHAR) as tanggal FROM penilaian_medis_ralan_paru WHERE no_rawat = ?"
    )
    .bind(&no_rawat)
    .fetch_optional(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(result))
}

pub async fn save_penilaian_medis_paru(
    State(pool): State<Pool<MySql>>,
    Path(no_rawat_raw): Path<String>,
    Json(payload): Json<PenilaianMedisParu>,
) -> Result<StatusCode, (StatusCode, String)> {
    let no_rawat = no_rawat_raw.replace("-", "/");
    let now = Local::now().naive_local();

    sqlx::query(
        "REPLACE INTO penilaian_medis_ralan_paru (
            no_rawat, tanggal, kd_dokter, anamnesis, hubungan, keluhan_utama, rps, rpd, rpo, 
            alergi, kesadaran, status, td, nadi, suhu, rr, bb, nyeri, gcs, kepala, 
            thoraks, abdomen, muskulos, lainnya, ket_lokalis, lab, rad, pemeriksaan, 
            diagnosis, diagnosis2, permasalahan, terapi, tindakan, edukasi
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(&no_rawat)
    .bind(now)
    .bind(&payload.kd_dokter)
    .bind(&payload.anamnesis)
    .bind(&payload.hubungan)
    .bind(&payload.keluhan_utama)
    .bind(&payload.rps)
    .bind(&payload.rpd)
    .bind(&payload.rpo)
    .bind(&payload.alergi)
    .bind(&payload.kesadaran)
    .bind(&payload.status)
    .bind(&payload.td)
    .bind(&payload.nadi)
    .bind(&payload.suhu)
    .bind(&payload.rr)
    .bind(&payload.bb)
    .bind(&payload.nyeri)
    .bind(&payload.gcs)
    .bind(&payload.kepala)
    .bind(&payload.thoraks)
    .bind(&payload.abdomen)
    .bind(&payload.muskulos)
    .bind(&payload.lainnya)
    .bind(&payload.ket_lokalis)
    .bind(&payload.lab)
    .bind(&payload.rad)
    .bind(&payload.pemeriksaan)
    .bind(&payload.diagnosis)
    .bind(&payload.diagnosis2)
    .bind(&payload.permasalahan)
    .bind(&payload.terapi)
    .bind(&payload.tindakan)
    .bind(&payload.edukasi)
    .execute(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(StatusCode::CREATED)
}

pub async fn get_penilaian_medis_jantung(
    State(pool): State<Pool<MySql>>,
    Path(no_rawat_raw): Path<String>,
) -> Result<Json<Option<PenilaianMedisJantung>>, (StatusCode, String)> {
    let no_rawat = no_rawat_raw.replace("-", "/");
    
    let result = sqlx::query_as::<_, PenilaianMedisJantung>(
        "SELECT *, CAST(tanggal AS CHAR) as tanggal FROM penilaian_medis_ralan_jantung WHERE no_rawat = ?"
    )
    .bind(&no_rawat)
    .fetch_optional(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(result))
}

pub async fn save_penilaian_medis_jantung(
    State(pool): State<Pool<MySql>>,
    Path(no_rawat_raw): Path<String>,
    Json(payload): Json<PenilaianMedisJantung>,
) -> Result<StatusCode, (StatusCode, String)> {
    let no_rawat = no_rawat_raw.replace("-", "/");
    let now = Local::now().naive_local();

    sqlx::query(
        "REPLACE INTO penilaian_medis_ralan_jantung (
            no_rawat, tanggal, kd_dokter, anamnesis, hubungan, keluhan_utama, rps, rpd, rpo, 
            alergi, td, bb, tb, suhu, nadi, rr, keadaan_umum, nyeri, status_nutrisi, 
            jantung, keterangan_jantung, paru, keterangan_paru, ekstrimitas, 
            keterangan_ekstrimitas, lainnya, lab, ekg, penunjang_lain, diagnosis, 
            diagnosis2, permasalahan, terapi, tindakan, edukasi
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(&no_rawat)
    .bind(now)
    .bind(&payload.kd_dokter)
    .bind(&payload.anamnesis)
    .bind(&payload.hubungan)
    .bind(&payload.keluhan_utama)
    .bind(&payload.rps)
    .bind(&payload.rpd)
    .bind(&payload.rpo)
    .bind(&payload.alergi)
    .bind(&payload.td)
    .bind(&payload.bb)
    .bind(&payload.tb)
    .bind(&payload.suhu)
    .bind(&payload.nadi)
    .bind(&payload.rr)
    .bind(&payload.keadaan_umum)
    .bind(&payload.nyeri)
    .bind(&payload.status_nutrisi)
    .bind(&payload.jantung)
    .bind(&payload.keterangan_jantung)
    .bind(&payload.paru)
    .bind(&payload.keterangan_paru)
    .bind(&payload.ekstrimitas)
    .bind(&payload.keterangan_ekstrimitas)
    .bind(&payload.lainnya)
    .bind(&payload.lab)
    .bind(&payload.ekg)
    .bind(&payload.penunjang_lain)
    .bind(&payload.diagnosis)
    .bind(&payload.diagnosis2)
    .bind(&payload.permasalahan)
    .bind(&payload.terapi)
    .bind(&payload.tindakan)
    .bind(&payload.edukasi)
    .execute(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(StatusCode::CREATED)
}

pub async fn get_penilaian_medis_bedah_mulut(
    State(pool): State<Pool<MySql>>,
    Path(no_rawat_raw): Path<String>,
) -> Result<Json<Option<PenilaianMedisBedahMulut>>, (StatusCode, String)> {
    let no_rawat = no_rawat_raw.replace("-", "/");
    
    let result = sqlx::query_as::<_, PenilaianMedisBedahMulut>(
        "SELECT *, CAST(tanggal AS CHAR) as tanggal FROM penilaian_medis_ralan_bedah_mulut WHERE no_rawat = ?"
    )
    .bind(&no_rawat)
    .fetch_optional(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(result))
}

pub async fn save_penilaian_medis_bedah_mulut(
    State(pool): State<Pool<MySql>>,
    Path(no_rawat_raw): Path<String>,
    Json(payload): Json<PenilaianMedisBedahMulut>,
) -> Result<StatusCode, (StatusCode, String)> {
    let no_rawat = no_rawat_raw.replace("-", "/");
    let now = Local::now().naive_local();

    sqlx::query(
        "REPLACE INTO penilaian_medis_ralan_bedah_mulut (
            no_rawat, tanggal, kd_dokter, anamnesis, hubungan, keluhan_utama, rps, rpd, rpo, 
            alergi, kesadaran, td, nadi, suhu, rr, kepala, keterangan_kepala, mata, 
            keterangan_mata, leher, keterangan_leher, kelenjar, keterangan_kelenjar, 
            dada, keterangan_dada, perut, keterangan_perut, ekstremitas, 
            keterangan_ekstremitas, wajah, intra, gigigeligi, lab, rad, penunjang, 
            diagnosis, diagnosis2, permasalahan, terapi, tindakan, edukasi
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(&no_rawat)
    .bind(now)
    .bind(&payload.kd_dokter)
    .bind(&payload.anamnesis)
    .bind(&payload.hubungan)
    .bind(&payload.keluhan_utama)
    .bind(&payload.rps)
    .bind(&payload.rpd)
    .bind(&payload.rpo)
    .bind(&payload.alergi)
    .bind(&payload.kesadaran)
    .bind(&payload.td)
    .bind(&payload.nadi)
    .bind(&payload.suhu)
    .bind(&payload.rr)
    .bind(&payload.kepala)
    .bind(&payload.keterangan_kepala)
    .bind(&payload.mata)
    .bind(&payload.keterangan_mata)
    .bind(&payload.leher)
    .bind(&payload.keterangan_leher)
    .bind(&payload.kelenjar)
    .bind(&payload.keterangan_kelenjar)
    .bind(&payload.dada)
    .bind(&payload.keterangan_dada)
    .bind(&payload.perut)
    .bind(&payload.keterangan_perut)
    .bind(&payload.ekstremitas)
    .bind(&payload.keterangan_ekstremitas)
    .bind(&payload.wajah)
    .bind(&payload.intra)
    .bind(&payload.gigigeligi)
    .bind(&payload.lab)
    .bind(&payload.rad)
    .bind(&payload.penunjang)
    .bind(&payload.diagnosis)
    .bind(&payload.diagnosis2)
    .bind(&payload.permasalahan)
    .bind(&payload.terapi)
    .bind(&payload.tindakan)
    .bind(&payload.edukasi)
    .execute(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(StatusCode::CREATED)
}

pub async fn get_penilaian_medis_psikiatrik(
    State(pool): State<Pool<MySql>>,
    Path(no_rawat_raw): Path<String>,
) -> Result<Json<Option<PenilaianMedisPsikiatrik>>, (StatusCode, String)> {
    let no_rawat = no_rawat_raw.replace("-", "/");
    
    let result = sqlx::query_as::<_, PenilaianMedisPsikiatrik>(
        "SELECT *, CAST(tanggal AS CHAR) as tanggal FROM penilaian_medis_ralan_psikiatrik WHERE no_rawat = ?"
    )
    .bind(&no_rawat)
    .fetch_optional(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(result))
}

pub async fn save_penilaian_medis_psikiatrik(
    State(pool): State<Pool<MySql>>,
    Path(no_rawat_raw): Path<String>,
    Json(payload): Json<PenilaianMedisPsikiatrik>,
) -> Result<StatusCode, (StatusCode, String)> {
    let no_rawat = no_rawat_raw.replace("-", "/");
    let now = Local::now().naive_local();

    sqlx::query(
        "REPLACE INTO penilaian_medis_ralan_psikiatrik (
            no_rawat, tanggal, kd_dokter, anamnesis, hubungan, keluhan_utama, rps, rpd, rpo, 
            alergi, penampilan, sikap, mood, fungsi_kognitif, gangguan_persepsi, 
            proses_pikir, pengendalian_impuls, tilikan, rta, keadaan, gcs, kesadaran, 
            td, nadi, rr, suhu, spo, bb, tb, kepala, gigi, tht, thoraks, abdomen, 
            genital, ekstremitas, kulit, ket_fisik, penunjang, diagnosis, tata, 
            konsulrujuk
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(&no_rawat)
    .bind(now)
    .bind(&payload.kd_dokter)
    .bind(&payload.anamnesis)
    .bind(&payload.hubungan)
    .bind(&payload.keluhan_utama)
    .bind(&payload.rps)
    .bind(&payload.rpd)
    .bind(&payload.rpo)
    .bind(&payload.alergi)
    .bind(&payload.penampilan)
    .bind(&payload.sikap)
    .bind(&payload.mood)
    .bind(&payload.fungsi_kognitif)
    .bind(&payload.gangguan_persepsi)
    .bind(&payload.proses_pikir)
    .bind(&payload.pengendalian_impuls)
    .bind(&payload.tilikan)
    .bind(&payload.rta)
    .bind(&payload.keadaan)
    .bind(&payload.gcs)
    .bind(&payload.kesadaran)
    .bind(&payload.td)
    .bind(&payload.nadi)
    .bind(&payload.rr)
    .bind(&payload.suhu)
    .bind(&payload.spo)
    .bind(&payload.bb)
    .bind(&payload.tb)
    .bind(&payload.kepala)
    .bind(&payload.gigi)
    .bind(&payload.tht)
    .bind(&payload.thoraks)
    .bind(&payload.abdomen)
    .bind(&payload.genital)
    .bind(&payload.ekstremitas)
    .bind(&payload.kulit)
    .bind(&payload.ket_fisik)
    .bind(&payload.penunjang)
    .bind(&payload.diagnosis)
    .bind(&payload.tata)
    .bind(&payload.konsulrujuk)
    .execute(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(StatusCode::CREATED)
}

pub async fn get_penilaian_medis_orthopedi(
    State(pool): State<Pool<MySql>>,
    Path(no_rawat_raw): Path<String>,
) -> Result<Json<Option<PenilaianMedisOrthopedi>>, (StatusCode, String)> {
    let no_rawat = no_rawat_raw.replace("-", "/");
    
    let result = sqlx::query_as::<_, PenilaianMedisOrthopedi>(
        "SELECT *, CAST(tanggal AS CHAR) as tanggal FROM penilaian_medis_ralan_orthopedi WHERE no_rawat = ?"
    )
    .bind(&no_rawat)
    .fetch_optional(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(result))
}

pub async fn save_penilaian_medis_orthopedi(
    State(pool): State<Pool<MySql>>,
    Path(no_rawat_raw): Path<String>,
    Json(payload): Json<PenilaianMedisOrthopedi>,
) -> Result<StatusCode, (StatusCode, String)> {
    let no_rawat = no_rawat_raw.replace("-", "/");
    let now = Local::now().naive_local();

    sqlx::query(
        "REPLACE INTO penilaian_medis_ralan_orthopedi (
            no_rawat, tanggal, kd_dokter, anamnesis, hubungan, keluhan_utama, rps, rpd, rpo, 
            alergi, kesadaran, status, td, nadi, suhu, rr, bb, nyeri, gcs, kepala, 
            thoraks, abdomen, ekstremitas, genetalia, columna, muskulos, lainnya, 
            ket_lokalis, lab, rad, pemeriksaan, diagnosis, diagnosis2, permasalahan, 
            terapi, tindakan, edukasi
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(&no_rawat)
    .bind(now)
    .bind(&payload.kd_dokter)
    .bind(&payload.anamnesis)
    .bind(&payload.hubungan)
    .bind(&payload.keluhan_utama)
    .bind(&payload.rps)
    .bind(&payload.rpd)
    .bind(&payload.rpo)
    .bind(&payload.alergi)
    .bind(&payload.kesadaran)
    .bind(&payload.status)
    .bind(&payload.td)
    .bind(&payload.nadi)
    .bind(&payload.suhu)
    .bind(&payload.rr)
    .bind(&payload.bb)
    .bind(&payload.nyeri)
    .bind(&payload.gcs)
    .bind(&payload.kepala)
    .bind(&payload.thoraks)
    .bind(&payload.abdomen)
    .bind(&payload.ekstremitas)
    .bind(&payload.genetalia)
    .bind(&payload.columna)
    .bind(&payload.muskulos)
    .bind(&payload.lainnya)
    .bind(&payload.ket_lokalis)
    .bind(&payload.lab)
    .bind(&payload.rad)
    .bind(&payload.pemeriksaan)
    .bind(&payload.diagnosis)
    .bind(&payload.diagnosis2)
    .bind(&payload.permasalahan)
    .bind(&payload.terapi)
    .bind(&payload.tindakan)
    .bind(&payload.edukasi)
    .execute(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(StatusCode::CREATED)
}

pub async fn get_penilaian_medis_urologi(
    State(pool): State<Pool<MySql>>,
    Path(no_rawat_raw): Path<String>,
) -> Result<Json<Option<PenilaianMedisUrologi>>, (StatusCode, String)> {
    let no_rawat = no_rawat_raw.replace("-", "/");
    
    let result = sqlx::query_as::<_, PenilaianMedisUrologi>(
        "SELECT *, CAST(tanggal AS CHAR) as tanggal FROM penilaian_medis_ralan_urologi WHERE no_rawat = ?"
    )
    .bind(&no_rawat)
    .fetch_optional(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(result))
}

pub async fn save_penilaian_medis_urologi(
    State(pool): State<Pool<MySql>>,
    Path(no_rawat_raw): Path<String>,
    Json(payload): Json<PenilaianMedisUrologi>,
) -> Result<StatusCode, (StatusCode, String)> {
    let no_rawat = no_rawat_raw.replace("-", "/");
    let now = Local::now().naive_local();

    sqlx::query(
        "REPLACE INTO penilaian_medis_ralan_urologi (
            no_rawat, tanggal, kd_dokter, anamnesis, hubungan, keluhan_utama, rps, rpd, rpo, 
            riwayat_kebiasaan, riwayat_operasi_urologi, alergi, td, bb, tb, suhu, nadi, 
            rr, keadaan_umum, nyeri, status_nutrisi, thoraks, keterangan_thoraks, 
            abdomen, keterangan_abdomen, ekstrimitas, keterangan_ekstrimitas, 
            nyeri_ketok_cva, genitalia_eksternal, colok_dubur, lainnya, urinalisis, 
            darah, usg_urologi, radiologi, penunjang_lain, diagnosis, diagnosis2, 
            permasalahan, terapi, tindakan, edukasi
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(&no_rawat)
    .bind(now)
    .bind(&payload.kd_dokter)
    .bind(&payload.anamnesis)
    .bind(&payload.hubungan)
    .bind(&payload.keluhan_utama)
    .bind(&payload.rps)
    .bind(&payload.rpd)
    .bind(&payload.rpo)
    .bind(&payload.riwayat_kebiasaan)
    .bind(&payload.riwayat_operasi_urologi)
    .bind(&payload.alergi)
    .bind(&payload.td)
    .bind(&payload.bb)
    .bind(&payload.tb)
    .bind(&payload.suhu)
    .bind(&payload.nadi)
    .bind(&payload.rr)
    .bind(&payload.keadaan_umum)
    .bind(&payload.nyeri)
    .bind(&payload.status_nutrisi)
    .bind(&payload.thoraks)
    .bind(&payload.keterangan_thoraks)
    .bind(&payload.abdomen)
    .bind(&payload.keterangan_abdomen)
    .bind(&payload.ekstrimitas)
    .bind(&payload.keterangan_ekstrimitas)
    .bind(&payload.nyeri_ketok_cva)
    .bind(&payload.genitalia_eksternal)
    .bind(&payload.colok_dubur)
    .bind(&payload.lainnya)
    .bind(&payload.urinalisis)
    .bind(&payload.darah)
    .bind(&payload.usg_urologi)
    .bind(&payload.radiologi)
    .bind(&payload.penunjang_lain)
    .bind(&payload.diagnosis)
    .bind(&payload.diagnosis2)
    .bind(&payload.permasalahan)
    .bind(&payload.terapi)
    .bind(&payload.tindakan)
    .bind(&payload.edukasi)
    .execute(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(StatusCode::CREATED)
}

pub async fn get_penilaian_medis_geriatri(
    State(pool): State<Pool<MySql>>,
    Path(no_rawat_raw): Path<String>,
) -> Result<Json<Option<PenilaianMedisGeriatri>>, (StatusCode, String)> {
    let no_rawat = no_rawat_raw.replace("-", "/");
    
    let result = sqlx::query_as::<_, PenilaianMedisGeriatri>(
        "SELECT *, CAST(tanggal AS CHAR) as tanggal FROM penilaian_medis_ralan_geriatri WHERE no_rawat = ?"
    )
    .bind(&no_rawat)
    .fetch_optional(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(result))
}

pub async fn save_penilaian_medis_geriatri(
    State(pool): State<Pool<MySql>>,
    Path(no_rawat_raw): Path<String>,
    Json(payload): Json<PenilaianMedisGeriatri>,
) -> Result<StatusCode, (StatusCode, String)> {
    let no_rawat = no_rawat_raw.replace("-", "/");
    let now = Local::now().naive_local();

    sqlx::query(
        "REPLACE INTO penilaian_medis_ralan_geriatri (
            no_rawat, tanggal, kd_dokter, anamnesis, hubungan, keluhan_utama, rps, rpd, rpo, 
            alergi, kesadaran, td, nadi, suhu, rr, bb, nyeri, gcs, kepala, 
            keterangan_kepala, thoraks, keterangan_thoraks, abdomen, keterangan_abdomen, 
            ekstremitas, keterangan_ekstremitas, Integument_kebersihan, Integument_warna, 
            Integument_kelembaban, Integument_gangguan_kulit, status_fungsional, 
            skrining_jatuh, status_nutrisi, lainnya, lab, rad, pemeriksaan, 
            diagnosis, diagnosis2, permasalahan, terapi, tindakan, edukasi
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(&no_rawat)
    .bind(now)
    .bind(&payload.kd_dokter)
    .bind(&payload.anamnesis)
    .bind(&payload.hubungan)
    .bind(&payload.keluhan_utama)
    .bind(&payload.rps)
    .bind(&payload.rpd)
    .bind(&payload.rpo)
    .bind(&payload.alergi)
    .bind(&payload.kesadaran)
    .bind(&payload.td)
    .bind(&payload.nadi)
    .bind(&payload.suhu)
    .bind(&payload.rr)
    .bind(&payload.bb)
    .bind(&payload.nyeri)
    .bind(&payload.gcs)
    .bind(&payload.kepala)
    .bind(&payload.keterangan_kepala)
    .bind(&payload.thoraks)
    .bind(&payload.keterangan_thoraks)
    .bind(&payload.abdomen)
    .bind(&payload.keterangan_abdomen)
    .bind(&payload.ekstremitas)
    .bind(&payload.keterangan_ekstremitas)
    .bind(&payload.integument_kebersihan)
    .bind(&payload.integument_warna)
    .bind(&payload.integument_kelembaban)
    .bind(&payload.integument_gangguan_kulit)
    .bind(&payload.status_fungsional)
    .bind(&payload.skrining_jatuh)
    .bind(&payload.status_nutrisi)
    .bind(&payload.lainnya)
    .bind(&payload.lab)
    .bind(&payload.rad)
    .bind(&payload.pemeriksaan)
    .bind(&payload.diagnosis)
    .bind(&payload.diagnosis2)
    .bind(&payload.permasalahan)
    .bind(&payload.terapi)
    .bind(&payload.tindakan)
    .bind(&payload.edukasi)
    .execute(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(StatusCode::CREATED)
}

pub async fn get_penilaian_medis_rehab_medik(
    State(pool): State<Pool<MySql>>,
    Path(no_rawat_raw): Path<String>,
) -> Result<Json<Option<PenilaianMedisRehabMedik>>, (StatusCode, String)> {
    let no_rawat = no_rawat_raw.replace("-", "/");
    
    let result = sqlx::query_as::<_, PenilaianMedisRehabMedik>(
        "SELECT *, CAST(tanggal AS CHAR) as tanggal FROM penilaian_medis_ralan_rehab_medik WHERE no_rawat = ?"
    )
    .bind(&no_rawat)
    .fetch_optional(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(result))
}

pub async fn save_penilaian_medis_rehab_medik(
    State(pool): State<Pool<MySql>>,
    Path(no_rawat_raw): Path<String>,
    Json(payload): Json<PenilaianMedisRehabMedik>,
) -> Result<StatusCode, (StatusCode, String)> {
    let no_rawat = no_rawat_raw.replace("-", "/");
    let now = Local::now().naive_local();

    sqlx::query(
        "REPLACE INTO penilaian_medis_ralan_rehab_medik (
            no_rawat, tanggal, kd_dokter, anamnesis, hubungan, keluhan_utama, rps, rpd, rpo, 
            alergi, kesadaran, td, nadi, suhu, rr, bb, nyeri, gcs, kepala, 
            keterangan_kepala, thoraks, keterangan_thoraks, abdomen, keterangan_abdomen, 
            ekstremitas, keterangan_ekstremitas, columna, keterangan_columna, muskulos, 
            keterangan_muskulos, lainnya, resiko_jatuh, resiko_nutrisional, 
            kebutuhan_fungsional, diagnosa_medis, diagnosa_fungsi, penunjang_lain, 
            fisio, okupasi, wicara, akupuntur, tatalain, frekuensi_terapi, 
            fisioterapi, terapi_okupasi, terapi_wicara, terapi_akupuntur, 
            terapi_lainnya, edukasi
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(&no_rawat)
    .bind(now)
    .bind(&payload.kd_dokter)
    .bind(&payload.anamnesis)
    .bind(&payload.hubungan)
    .bind(&payload.keluhan_utama)
    .bind(&payload.rps)
    .bind(&payload.rpd)
    .bind(&payload.rpo)
    .bind(&payload.alergi)
    .bind(&payload.kesadaran)
    .bind(&payload.td)
    .bind(&payload.nadi)
    .bind(&payload.suhu)
    .bind(&payload.rr)
    .bind(&payload.bb)
    .bind(&payload.nyeri)
    .bind(&payload.gcs)
    .bind(&payload.kepala)
    .bind(&payload.keterangan_kepala)
    .bind(&payload.thoraks)
    .bind(&payload.keterangan_thoraks)
    .bind(&payload.abdomen)
    .bind(&payload.keterangan_abdomen)
    .bind(&payload.ekstremitas)
    .bind(&payload.keterangan_ekstremitas)
    .bind(&payload.columna)
    .bind(&payload.keterangan_columna)
    .bind(&payload.muskulos)
    .bind(&payload.keterangan_muskulos)
    .bind(&payload.lainnya)
    .bind(&payload.resiko_jatuh)
    .bind(&payload.resiko_nutrisional)
    .bind(&payload.kebutuhan_fungsional)
    .bind(&payload.diagnosa_medis)
    .bind(&payload.diagnosa_fungsi)
    .bind(&payload.penunjang_lain)
    .bind(&payload.fisio)
    .bind(&payload.okupasi)
    .bind(&payload.wicara)
    .bind(&payload.akupuntur)
    .bind(&payload.tatalain)
    .bind(&payload.frekuensi_terapi)
    .bind(&payload.fisioterapi)
    .bind(&payload.terapi_okupasi)
    .bind(&payload.terapi_wicara)
    .bind(&payload.terapi_akupuntur)
    .bind(&payload.terapi_lainnya)
    .bind(&payload.edukasi)
    .execute(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(StatusCode::CREATED)
}

pub async fn get_penilaian_medis_kulitdankelamin(
    State(pool): State<Pool<MySql>>,
    Path(no_rawat_raw): Path<String>,
) -> Result<Json<Option<PenilaianMedisKulitKelamin>>, (StatusCode, String)> {
    let no_rawat = no_rawat_raw.replace("-", "/");
    
    let result = sqlx::query_as::<_, PenilaianMedisKulitKelamin>(
        "SELECT *, CAST(tanggal AS CHAR) as tanggal FROM penilaian_medis_ralan_kulitdankelamin WHERE no_rawat = ?"
    )
    .bind(&no_rawat)
    .fetch_optional(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(result))
}

pub async fn save_penilaian_medis_kulitdankelamin(
    State(pool): State<Pool<MySql>>,
    Path(no_rawat_raw): Path<String>,
    Json(payload): Json<PenilaianMedisKulitKelamin>,
) -> Result<StatusCode, (StatusCode, String)> {
    let no_rawat = no_rawat_raw.replace("-", "/");
    let now = Local::now().naive_local();

    sqlx::query(
        "REPLACE INTO penilaian_medis_ralan_kulitdankelamin (
            no_rawat, tanggal, kd_dokter, anamnesis, hubungan, keluhan_utama, rps, rpd, rpo, 
            rpk, kesadaran, status, td, nadi, suhu, rr, bb, nyeri, gcs, 
            statusderma, pemeriksaan, diagnosis, diagnosis2, permasalahan, 
            terapi, tindakan, edukasi
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(&no_rawat)
    .bind(now)
    .bind(&payload.kd_dokter)
    .bind(&payload.anamnesis)
    .bind(&payload.hubungan)
    .bind(&payload.keluhan_utama)
    .bind(&payload.rps)
    .bind(&payload.rpd)
    .bind(&payload.rpo)
    .bind(&payload.rpk)
    .bind(&payload.kesadaran)
    .bind(&payload.status)
    .bind(&payload.td)
    .bind(&payload.nadi)
    .bind(&payload.suhu)
    .bind(&payload.rr)
    .bind(&payload.bb)
    .bind(&payload.nyeri)
    .bind(&payload.gcs)
    .bind(&payload.statusderma)
    .bind(&payload.pemeriksaan)
    .bind(&payload.diagnosis)
    .bind(&payload.diagnosis2)
    .bind(&payload.permasalahan)
    .bind(&payload.terapi)
    .bind(&payload.tindakan)
    .bind(&payload.edukasi)
    .execute(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(StatusCode::CREATED)
}

pub async fn get_penilaian_medis_gd_psikiatri(
    State(pool): State<Pool<MySql>>,
    Path(no_rawat_raw): Path<String>,
) -> Result<Json<Option<PenilaianMedisGDPsikiatri>>, (StatusCode, String)> {
    let no_rawat = no_rawat_raw.replace("-", "/");
    
    let result = sqlx::query_as::<_, PenilaianMedisGDPsikiatri>(
        "SELECT *, CAST(tanggal AS CHAR) as tanggal FROM penilaian_medis_ralan_gawat_darurat_psikiatri WHERE no_rawat = ?"
    )
    .bind(&no_rawat)
    .fetch_optional(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(result))
}

pub async fn save_penilaian_medis_gd_psikiatri(
    State(pool): State<Pool<MySql>>,
    Path(no_rawat_raw): Path<String>,
    Json(payload): Json<PenilaianMedisGDPsikiatri>,
) -> Result<StatusCode, (StatusCode, String)> {
    let no_rawat = no_rawat_raw.replace("-", "/");
    let now = Local::now().naive_local();

    sqlx::query(
        "REPLACE INTO penilaian_medis_ralan_gawat_darurat_psikiatri (
            no_rawat, tanggal, kd_dokter, anamnesis, hubungan, keluhan_utama, gejala_menyertai, 
            faktor_pencetus, riwayat_penyakit_dahulu, keterangan_riwayat_penyakit_dahulu, 
            riwayat_kehamilan, riwayat_sosial, keterangan_riwayat_sosial, riwayat_pekerjaan, 
            keterangan_riwayat_pekerjaan, riwayat_obat_diminum, faktor_kepribadian_premorbid, 
            faktor_keturunan, keterangan_faktor_keturunan, faktor_organik, 
            keterangan_faktor_organik, riwayat_alergi, fisik_kesadaran, fisik_td, 
            fisik_rr, fisik_suhu, fisik_nyeri, fisik_nadi, fisik_bb, fisik_tb, 
            fisik_status_nutrisi, fisik_gcs, status_kelainan_kepala, 
            keterangan_status_kelainan_kepala, status_kelainan_leher, 
            keterangan_status_kelainan_leher, status_kelainan_dada, 
            keterangan_status_kelainan_dada, status_kelainan_perut, 
            keterangan_status_kelainan_perut, status_kelainan_anggota_gerak, 
            keterangan_status_kelainan_anggota_gerak, status_lokalisata, 
            psikiatrik_kesan_umum, psikiatrik_sikap_prilaku, psikiatrik_kesadaran, 
            psikiatrik_orientasi, psikiatrik_daya_ingat, psikiatrik_persepsi, 
            psikiatrik_pikiran, psikiatrik_insight, laborat, radiologi, ekg, 
            diagnosis, permasalahan, instruksi_medis, rencana_target, 
            pulang_dipulangkan, keterangan_pulang_dipulangkan, pulang_dirawat_diruang, 
            pulang_indikasi_ranap, pulang_dirujuk_ke, pulang_alasan_dirujuk, 
            pulang_paksa, keterangan_pulang_paksa, pulang_meninggal_igd, 
            pulang_penyebab_kematian, fisik_pulang_kesadaran, fisik_pulang_td, 
            fisik_pulang_nadi, fisik_pulang_gcs, fisik_pulang_suhu, fisik_pulang_rr, 
            edukasi
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(&no_rawat)
    .bind(now)
    .bind(&payload.kd_dokter)
    .bind(&payload.anamnesis)
    .bind(&payload.hubungan)
    .bind(&payload.keluhan_utama)
    .bind(&payload.gejala_menyertai)
    .bind(&payload.faktor_pencetus)
    .bind(&payload.riwayat_penyakit_dahulu)
    .bind(&payload.keterangan_riwayat_penyakit_dahulu)
    .bind(&payload.riwayat_kehamilan)
    .bind(&payload.riwayat_sosial)
    .bind(&payload.keterangan_riwayat_sosial)
    .bind(&payload.riwayat_pekerjaan)
    .bind(&payload.keterangan_riwayat_pekerjaan)
    .bind(&payload.riwayat_obat_diminum)
    .bind(&payload.faktor_kepribadian_premorbid)
    .bind(&payload.faktor_keturunan)
    .bind(&payload.keterangan_faktor_keturunan)
    .bind(&payload.faktor_organik)
    .bind(&payload.keterangan_faktor_organik)
    .bind(&payload.riwayat_alergi)
    .bind(&payload.fisik_kesadaran)
    .bind(&payload.fisik_td)
    .bind(&payload.fisik_rr)
    .bind(&payload.fisik_suhu)
    .bind(&payload.fisik_nyeri)
    .bind(&payload.fisik_nadi)
    .bind(&payload.fisik_bb)
    .bind(&payload.fisik_tb)
    .bind(&payload.fisik_status_nutrisi)
    .bind(&payload.fisik_gcs)
    .bind(&payload.status_kelainan_kepala)
    .bind(&payload.keterangan_status_kelainan_kepala)
    .bind(&payload.status_kelainan_leher)
    .bind(&payload.keterangan_status_kelainan_leher)
    .bind(&payload.status_kelainan_dada)
    .bind(&payload.keterangan_status_kelainan_dada)
    .bind(&payload.status_kelainan_perut)
    .bind(&payload.keterangan_status_kelainan_perut)
    .bind(&payload.status_kelainan_anggota_gerak)
    .bind(&payload.keterangan_status_kelainan_anggota_gerak)
    .bind(&payload.status_lokalisata)
    .bind(&payload.psikiatrik_kesan_umum)
    .bind(&payload.psikiatrik_sikap_prilaku)
    .bind(&payload.psikiatrik_kesadaran)
    .bind(&payload.psikiatrik_orientasi)
    .bind(&payload.psikiatrik_daya_ingat)
    .bind(&payload.psikiatrik_persepsi)
    .bind(&payload.psikiatrik_pikiran)
    .bind(&payload.psikiatrik_insight)
    .bind(&payload.laborat)
    .bind(&payload.radiologi)
    .bind(&payload.ekg)
    .bind(&payload.diagnosis)
    .bind(&payload.permasalahan)
    .bind(&payload.instruksi_medis)
    .bind(&payload.rencana_target)
    .bind(&payload.pulang_dipulangkan)
    .bind(&payload.keterangan_pulang_dipulangkan)
    .bind(&payload.pulang_dirawat_diruang)
    .bind(&payload.pulang_indikasi_ranap)
    .bind(&payload.pulang_dirujuk_ke)
    .bind(&payload.pulang_alasan_dirujuk)
    .bind(&payload.pulang_paksa)
    .bind(&payload.keterangan_pulang_paksa)
    .bind(&payload.pulang_meninggal_igd)
    .bind(&payload.pulang_penyebab_kematian)
    .bind(&payload.fisik_pulang_kesadaran)
    .bind(&payload.fisik_pulang_td)
    .bind(&payload.fisik_pulang_nadi)
    .bind(&payload.fisik_pulang_gcs)
    .bind(&payload.fisik_pulang_suhu)
    .bind(&payload.fisik_pulang_rr)
    .bind(&payload.edukasi)
    .execute(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(StatusCode::CREATED)
}

pub async fn get_penilaian_medis_penyakit_dalam(
    State(pool): State<Pool<MySql>>,
    Path(no_rawat_raw): Path<String>,
) -> Result<Json<Option<PenilaianPenyakitDalamCustom>>, (StatusCode, String)> {
    let no_rawat = no_rawat_raw.replace("-", "/");
    
    let result = sqlx::query_as::<_, PenilaianPenyakitDalamCustom>(
        "SELECT *, CAST(tanggal AS CHAR) as tanggal FROM penilaian_medis_ralan_penyakit_dalam WHERE no_rawat = ?"
    )
    .bind(&no_rawat)
    .fetch_optional(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(result))
}

pub async fn save_penilaian_medis_penyakit_dalam(
    State(pool): State<Pool<MySql>>,
    Path(no_rawat_raw): Path<String>,
    Json(payload): Json<PenilaianPenyakitDalamCustom>,
) -> Result<StatusCode, (StatusCode, String)> {
    let no_rawat = no_rawat_raw.replace("-", "/");
    let now = Local::now().naive_local();

    sqlx::query(
        "REPLACE INTO penilaian_medis_ralan_penyakit_dalam (
            no_rawat, tanggal, kd_dokter, anamnesis, hubungan, keluhan_utama, rps, rpd, rpo, 
            alergi, kondisi, status, td, nadi, suhu, rr, bb, nyeri, gcs, kepala, 
            keterangan_kepala, thoraks, keterangan_thorak, abdomen, keterangan_abdomen, 
            ekstremitas, keterangan_ekstremitas, lainnya, lab, rad, penunjanglain, 
            diagnosis, diagnosis2, permasalahan, terapi, tindakan, edukasi
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(&no_rawat)
    .bind(now)
    .bind(&payload.kd_dokter)
    .bind(&payload.anamnesis)
    .bind(&payload.hubungan)
    .bind(&payload.keluhan_utama)
    .bind(&payload.rps)
    .bind(&payload.rpd)
    .bind(&payload.rpo)
    .bind(&payload.alergi)
    .bind(&payload.kondisi)
    .bind(&payload.status)
    .bind(&payload.td)
    .bind(&payload.nadi)
    .bind(&payload.suhu)
    .bind(&payload.rr)
    .bind(&payload.bb)
    .bind(&payload.nyeri)
    .bind(&payload.gcs)
    .bind(&payload.kepala)
    .bind(&payload.keterangan_kepala)
    .bind(&payload.thoraks)
    .bind(&payload.keterangan_thorak)
    .bind(&payload.abdomen)
    .bind(&payload.keterangan_abdomen)
    .bind(&payload.ekstremitas)
    .bind(&payload.keterangan_ekstremitas)
    .bind(&payload.lainnya)
    .bind(&payload.lab)
    .bind(&payload.rad)
    .bind(&payload.penunjanglain)
    .bind(&payload.diagnosis)
    .bind(&payload.diagnosis2)
    .bind(&payload.permasalahan)
    .bind(&payload.terapi)
    .bind(&payload.tindakan)
    .bind(&payload.edukasi)
    .execute(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(StatusCode::CREATED)
}

pub async fn get_master_triase(
    State(pool): State<Pool<MySql>>,
) -> Result<Json<serde_json::Value>, (StatusCode, String)> {
    let pemeriksaan = sqlx::query("SELECT * FROM master_triase_pemeriksaan")
        .fetch_all(&pool).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    
    let kasus = sqlx::query("SELECT * FROM master_triase_macam_kasus")
        .fetch_all(&pool).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let skala1 = sqlx::query("SELECT * FROM master_triase_skala1")
        .fetch_all(&pool).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    let skala2 = sqlx::query("SELECT * FROM master_triase_skala2")
        .fetch_all(&pool).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    let skala3 = sqlx::query("SELECT * FROM master_triase_skala3")
        .fetch_all(&pool).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    let skala4 = sqlx::query("SELECT * FROM master_triase_skala4")
        .fetch_all(&pool).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    let skala5 = sqlx::query("SELECT * FROM master_triase_skala5")
        .fetch_all(&pool).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    use sqlx::Row;
    let map_rows = |rows: Vec<sqlx::mysql::MySqlRow>| {
        rows.into_iter().map(|r| {
            let mut obj = serde_json::Map::new();
            for col in r.columns() {
                let name = col.name();
                // Basic mapping, assuming strings for most
                let val: Option<String> = r.try_get(name).ok();
                obj.insert(name.to_string(), serde_json::json!(val));
            }
            serde_json::Value::Object(obj)
        }).collect::<Vec<_>>()
    };

    Ok(Json(serde_json::json!({
        "pemeriksaan": map_rows(pemeriksaan),
        "kasus": map_rows(kasus),
        "skala1": map_rows(skala1),
        "skala2": map_rows(skala2),
        "skala3": map_rows(skala3),
        "skala4": map_rows(skala4),
        "skala5": map_rows(skala5),
    })))
}

pub async fn save_triase_igd(
    State(pool): State<Pool<MySql>>,
    Path(no_rawat_raw): Path<String>,
    Json(payload): Json<crate::models::soap::TriageRequest>,
) -> Result<StatusCode, (StatusCode, String)> {
    let no_rawat = no_rawat_raw.replace("-", "/");
    let mut tx = pool.begin().await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // 1. Save data_triase_igd
    sqlx::query(
        "REPLACE INTO data_triase_igd (no_rawat, tgl_kunjungan, cara_masuk, alat_transportasi, alasan_kedatangan, keterangan_kedatangan, kode_kasus, tekanan_darah, nadi, pernapasan, suhu, saturasi_o2, nyeri) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(&no_rawat)
    .bind(payload.data.tgl_kunjungan)
    .bind(&payload.data.cara_masuk)
    .bind(&payload.data.alat_transportasi)
    .bind(&payload.data.alasan_kedatangan)
    .bind(&payload.data.keterangan_kedatangan)
    .bind(&payload.data.kode_kasus)
    .bind(&payload.data.tekanan_darah)
    .bind(&payload.data.nadi)
    .bind(&payload.data.pernapasan)
    .bind(&payload.data.suhu)
    .bind(&payload.data.saturasi_o2)
    .bind(&payload.data.nyeri)
    .execute(&mut *tx).await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // 2. Save Primer if exists
    if let Some(primer) = payload.primer {
        sqlx::query(
            "REPLACE INTO data_triase_igdprimer (no_rawat, keluhan_utama, kebutuhan_khusus, catatan, plan, tanggaltriase, nik) 
             VALUES (?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(&no_rawat)
        .bind(&primer.keluhan_utama)
        .bind(&primer.kebutuhan_khusus)
        .bind(&primer.catatan)
        .bind(&primer.plan)
        .bind(primer.tanggaltriase)
        .bind(&primer.nik)
        .execute(&mut *tx).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    }

    // 3. Save Sekunder if exists
    if let Some(sekunder) = payload.sekunder {
        sqlx::query(
            "REPLACE INTO data_triase_igdsekunder (no_rawat, anamnesa_singkat, catatan, plan, tanggaltriase, nik) 
             VALUES (?, ?, ?, ?, ?, ?)"
        )
        .bind(&no_rawat)
        .bind(&sekunder.anamnesa_singkat)
        .bind(&sekunder.catatan)
        .bind(&sekunder.plan)
        .bind(sekunder.tanggaltriase)
        .bind(&sekunder.nik)
        .execute(&mut *tx).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    }

    // 4. Save Details (Skala 1-5)
    let scales = vec![
        (&payload.skala1, "data_triase_igddetail_skala1", "kode_skala1"),
        (&payload.skala2, "data_triase_igddetail_skala2", "kode_skala2"),
        (&payload.skala3, "data_triase_igddetail_skala3", "kode_skala3"),
        (&payload.skala4, "data_triase_igddetail_skala4", "kode_skala4"),
        (&payload.skala5, "data_triase_igddetail_skala5", "kode_skala5"),
    ];

    for (codes, table, col) in scales {
        sqlx::query(&format!("DELETE FROM {} WHERE no_rawat = ?", table))
            .bind(&no_rawat)
            .execute(&mut *tx).await
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
        
        for code in codes {
            sqlx::query(&format!("INSERT INTO {} (no_rawat, {}) VALUES (?, ?)", table, col))
                .bind(&no_rawat)
                .bind(code)
                .execute(&mut *tx).await
                .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
        }
    }

    tx.commit().await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(StatusCode::CREATED)
}

pub async fn get_penilaian_medis_igd(
    State(pool): State<Pool<MySql>>,
    Path(no_rawat_raw): Path<String>,
) -> Result<Json<Option<crate::models::soap::PenilaianMedisIgd>>, (StatusCode, String)> {
    let no_rawat = no_rawat_raw.replace("-", "/");
    let result = sqlx::query_as::<_, crate::models::soap::PenilaianMedisIgd>(
        "SELECT *, CAST(tanggal AS CHAR) as tanggal FROM penilaian_medis_igd WHERE no_rawat = ?"
    )
    .bind(&no_rawat)
    .fetch_optional(&pool).await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(result))
}

pub async fn save_penilaian_medis_igd(
    State(pool): State<Pool<MySql>>,
    Path(no_rawat_raw): Path<String>,
    Json(payload): Json<crate::models::soap::PenilaianMedisIgd>,
) -> Result<StatusCode, (StatusCode, String)> {
    let no_rawat = no_rawat_raw.replace("-", "/");
    
    sqlx::query(
        "REPLACE INTO penilaian_medis_igd (
            no_rawat, tanggal, kd_dokter, anamnesis, hubungan, keluhan_utama, rps, rpd, rpk, rpo, 
            alergi, keadaan, gcs, kesadaran, td, nadi, rr, suhu, spo, bb, tb, 
            kepala, mata, gigi, leher, thoraks, abdomen, genital, ekstremitas, 
            ket_fisik, ket_lokalis, ekg, rad, lab, diagnosis, tata
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(&no_rawat)
    .bind(payload.tanggal)
    .bind(&payload.kd_dokter)
    .bind(&payload.anamnesis)
    .bind(&payload.hubungan)
    .bind(&payload.keluhan_utama)
    .bind(&payload.rps)
    .bind(&payload.rpd)
    .bind(&payload.rpk)
    .bind(&payload.rpo)
    .bind(&payload.alergi)
    .bind(&payload.keadaan)
    .bind(&payload.gcs)
    .bind(&payload.kesadaran)
    .bind(&payload.td)
    .bind(&payload.nadi)
    .bind(&payload.rr)
    .bind(&payload.suhu)
    .bind(&payload.spo)
    .bind(&payload.bb)
    .bind(&payload.tb)
    .bind(&payload.kepala)
    .bind(&payload.mata)
    .bind(&payload.gigi)
    .bind(&payload.leher)
    .bind(&payload.thoraks)
    .bind(&payload.abdomen)
    .bind(&payload.genital)
    .bind(&payload.ekstremitas)
    .bind(&payload.ket_fisik)
    .bind(&payload.ket_lokalis)
    .bind(&payload.ekg)
    .bind(&payload.rad)
    .bind(&payload.lab)
    .bind(&payload.diagnosis)
    .bind(&payload.tata)
    .execute(&pool).await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(StatusCode::CREATED)
}
