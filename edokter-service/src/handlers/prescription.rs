use axum::{
    extract::{Query, State, Path},
    http::StatusCode,
    Json,
};
use serde::Deserialize;
use sqlx::{MySql, Pool, Row};
use crate::models::prescription::{
    PrescriptionRequest, MedicineResult, MetodeRacikResult,
    LastPrescription, StandardMed, CompoundedMed, CompoundedMedItem, RestriksiObat
};
use chrono::Local;
// Removed rand import

#[derive(Deserialize)]
pub struct MedicineQuery {
    pub q: String,
    pub no_rawat: Option<String>,
}

pub async fn save_prescription(
    State(pool): State<Pool<MySql>>,
    Json(payload): Json<PrescriptionRequest>,
) -> Result<(StatusCode, Json<serde_json::Value>), (StatusCode, String)> {
    let now = Local::now();
    let tgl_str = now.format("%Y%m%d").to_string();
    let random_suffix = now.timestamp_subsec_millis() % 1000;
    let no_resep = format!("{}{:03}", tgl_str, random_suffix);

    let mut tx = pool.begin().await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // 1. Create Resep Header
    // tgl_perawatan and jam are used for validation by pharmacists, so they are set to default '0'
    sqlx::query(
        "INSERT INTO resep_obat (
            no_resep, tgl_perawatan, jam, no_rawat, kd_dokter, 
            tgl_peresepan, jam_peresepan, status,
            tgl_penyerahan, jam_penyerahan
        ) VALUES (?, '0000-00-00', '00:00:00', ?, ?, ?, ?, ?, '0000-00-00', '00:00:00')"
    )
    .bind(&no_resep)
    .bind(&payload.no_rawat)
    .bind(&payload.kd_dokter)
    .bind(now.naive_local().date())
    .bind(now.naive_local().time())
    .bind(&payload.status)
    .execute(&mut *tx)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // 2. Save Standard Meds
    for med in payload.standard_meds {
        let jml: f64 = med.jml.parse().unwrap_or(0.0);
        sqlx::query(
            "INSERT INTO resep_dokter (no_resep, kode_brng, jml, aturan_pakai) 
             VALUES (?, ?, ?, ?)"
        )
        .bind(&no_resep)
        .bind(&med.kode_brng)
        .bind(jml)
        .bind(&med.aturan_pakai)
        .execute(&mut *tx)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    }

    // 3. Save Compounded Meds
    for (i, racik) in payload.compounded_meds.iter().enumerate() {
        let no_racik = (i + 1) as i32;
        let jml_dr: i32 = racik.jml_dr.parse().unwrap_or(0);

        sqlx::query(
            "INSERT INTO resep_dokter_racikan (
                no_resep, no_racik, nama_racik, kd_racik, jml_dr, aturan_pakai, keterangan
            ) VALUES (?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(&no_resep)
        .bind(no_racik)
        .bind(&racik.nama_racik)
        .bind(&racik.kd_racik)
        .bind(jml_dr)
        .bind(&racik.aturan_pakai)
        .bind(racik.keterangan.as_deref().unwrap_or("-"))
        .execute(&mut *tx)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

        for item in &racik.items {
            let knd: f64 = item.knd.parse().unwrap_or(1.0);
            sqlx::query(
                "INSERT INTO resep_dokter_racikan_detail (no_resep, no_racik, kode_brng, p1, p2, kandungan, jml) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)"
            )
            .bind(&no_resep)
            .bind(no_racik)
            .bind(&item.kode_brng)
            .bind(1.0) // p1
            .bind(1.0) // p2
            .bind(knd) // kandungan
            .bind(item.jml)
            .execute(&mut *tx)
            .await
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
        }
    }

    tx.commit().await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok((StatusCode::CREATED, Json(serde_json::json!({ "success": true, "no_resep": no_resep }))))
}

pub async fn search_medicine(
    State(pool): State<Pool<MySql>>,
    Query(params): Query<MedicineQuery>,
) -> Result<Json<Vec<MedicineResult>>, (StatusCode, String)> {
    let query_str = format!("%{}%", params.q);
    
    // Resolve kd_depo if no_rawat is provided
    let mut kd_depo = String::from("B0041"); // Default to APOTIK
    
    if let Some(ref no_rawat) = params.no_rawat {
        let slash_no_rawat = no_rawat.replace('-', "/");
        
        // 1. Try Inpatient Depot
        let resolved_ranap = sqlx::query_scalar::<_, String>(
            "SELECT sdr.kd_depo 
             FROM kamar_inap ki 
             JOIN kamar k ON ki.kd_kamar = k.kd_kamar 
             JOIN set_depo_ranap sdr ON k.kd_bangsal = sdr.kd_bangsal 
             WHERE ki.no_rawat = ? AND ki.stts_pulang = '-' 
             LIMIT 1"
        )
        .bind(&slash_no_rawat)
        .fetch_optional(&pool)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
        
        if let Some(depo) = resolved_ranap {
            kd_depo = depo;
        } else {
            // 2. Try Outpatient Depot
            let resolved_ralan = sqlx::query_scalar::<_, String>(
                "SELECT sdr.kd_bangsal 
                 FROM reg_periksa rp 
                 JOIN set_depo_ralan sdr ON rp.kd_poli = sdr.kd_poli 
                 WHERE rp.no_rawat = ? 
                 LIMIT 1"
            )
            .bind(&slash_no_rawat)
            .fetch_optional(&pool)
            .await
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

            if let Some(depo) = resolved_ralan {
                kd_depo = depo;
            }
        }
    }

    let results = sqlx::query_as::<_, MedicineResult>(
        "SELECT db.kode_brng, db.nama_brng, FLOOR(IFNULL(sum(gb.stok), 0)) as stok 
         FROM databarang db 
         LEFT JOIN gudangbarang gb ON db.kode_brng = gb.kode_brng AND gb.kd_bangsal = ? 
         WHERE db.kode_brng LIKE ? OR db.nama_brng LIKE ? 
         GROUP BY db.kode_brng, db.nama_brng 
         LIMIT 15"
    )
    .bind(&kd_depo)
    .bind(&query_str)
    .bind(&query_str)
    .fetch_all(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(results))
}
pub async fn get_metode_racik(
    State(pool): State<Pool<MySql>>,
) -> Result<Json<Vec<MetodeRacikResult>>, (StatusCode, String)> {
    let results = sqlx::query_as::<_, MetodeRacikResult>(
        "SELECT kd_racik, nm_racik FROM metode_racik"
    )
    .fetch_all(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(results))
}

pub async fn get_last_prescription(
    State(pool): State<Pool<MySql>>,
    Path(no_rkm_medis): Path<String>,
) -> Result<Json<LastPrescription>, (StatusCode, String)> {
    // 1. Find last no_resep for this patient
    let no_resep = sqlx::query_scalar::<_, String>(
        "SELECT ro.no_resep 
         FROM resep_obat ro
         JOIN reg_periksa rp ON ro.no_rawat = rp.no_rawat
         WHERE rp.no_rkm_medis = ?
         ORDER BY ro.tgl_peresepan DESC, ro.jam_peresepan DESC
         LIMIT 1"
    )
    .bind(&no_rkm_medis)
    .fetch_optional(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let nr = match no_resep {
        Some(n) => n,
        None => return Ok(Json(LastPrescription { standard_meds: vec![], compounded_meds: vec![] })),
    };

    // 2. Fetch Standard Meds
    let standard_meds = sqlx::query_as::<_, StandardMed>(
        "SELECT rd.kode_brng, db.nama_brng, CAST(rd.jml AS CHAR) as jml, rd.aturan_pakai 
         FROM resep_dokter rd
         JOIN databarang db ON rd.kode_brng = db.kode_brng
         WHERE rd.no_resep = ?"
    )
    .bind(&nr)
    .fetch_all(&pool).await
    .map_err(|e: sqlx::Error| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // 3. Fetch Compounded Meds
    let racikan_headers = sqlx::query(
        "SELECT no_racik, nama_racik, kd_racik, CAST(jml_dr AS CHAR) as jml_dr_str, aturan_pakai, keterangan 
         FROM resep_dokter_racikan 
         WHERE no_resep = ? 
         ORDER BY no_racik ASC"
    )
    .bind(&nr)
    .fetch_all(&pool).await
    .map_err(|e: sqlx::Error| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let mut compounded_meds = Vec::new();

    for h in racikan_headers {
        let no_racik: i32 = h.get("no_racik");
        let nama_racik: String = h.get("nama_racik");
        let kd_racik: String = h.get("kd_racik");
        let jml_dr_str: Option<String> = h.get("jml_dr_str");
        let aturan_pakai: String = h.get("aturan_pakai");
        let keterangan: String = h.get("keterangan");

        // 3b. Detail
        let items = sqlx::query_as::<_, CompoundedMedItem>(
            "SELECT rdrd.kode_brng, db.nama_brng, CAST(rdrd.kandungan AS CHAR) as knd, rdrd.jml 
             FROM resep_dokter_racikan_detail rdrd
             JOIN databarang db ON rdrd.kode_brng = db.kode_brng
             WHERE rdrd.no_resep = ? AND rdrd.no_racik = ?"
        )
        .bind(&nr)
        .bind(no_racik)
        .fetch_all(&pool).await
        .map_err(|e: sqlx::Error| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

        compounded_meds.push(CompoundedMed {
            nama_racik,
            kd_racik,
            jml_dr: jml_dr_str.unwrap_or_else(|| "0".to_string()),
            aturan_pakai,
            keterangan: Some(keterangan),
            items,
        });
    }

    Ok(Json(LastPrescription { standard_meds, compounded_meds }))
}

pub async fn get_medicine_restrictions(
    State(pool): State<Pool<MySql>>,
    Path((kode_brng, kd_sps)): Path<(String, String)>,
) -> Result<Json<Option<RestriksiObat>>, (StatusCode, String)> {
    let result = sqlx::query_as::<_, RestriksiObat>(
        "SELECT kode_brng, kd_sps, keterangan, jumlah FROM restriksi_obat 
         WHERE kode_brng = ? AND kd_sps = ?"
    )
    .bind(&kode_brng)
    .bind(&kd_sps)
    .fetch_optional(&pool).await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(result))
}
