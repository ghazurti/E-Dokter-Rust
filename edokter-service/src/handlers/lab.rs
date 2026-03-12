use axum::{
    extract::{Path, Query, State},
    Json,
};
use sqlx::MySqlPool;
use serde::Deserialize;
use crate::models::lab::{LabTest, LabTemplate, LabRequest};

#[derive(Deserialize)]
pub struct SearchQuery {
    pub q: Option<String>,
    pub category: Option<String>,
}

pub async fn search_lab_test(
    State(pool): State<MySqlPool>,
    Query(query): Query<SearchQuery>,
) -> Result<Json<Vec<LabTest>>, (axum::http::StatusCode, String)> {
    let mut sql = String::from("SELECT kd_jenis_prw, nm_perawatan FROM jns_perawatan_lab WHERE status = '1'");
    let tests;

    if let Some(cat) = query.category {
        let prefixes = match cat.as_str() {
            "hematologi" => vec!["HM", "J0"],
            "kimia" => vec!["KK", "PL", "FJ"],
            "urin" => vec!["UR"],
            "serologi" => vec!["IM", "IS"],
            "mikro" => vec!["MI"],
            "narkoba" => vec!["NA"],
            "pa" => vec!["PA"],
            "pcr" => vec!["PC"],
            _ => vec![],
        };

        if !prefixes.is_empty() {
            sql.push_str(" AND (");
            for (i, prefix) in prefixes.iter().enumerate() {
                if i > 0 { sql.push_str(" OR "); }
                sql.push_str(&format!("kd_jenis_prw LIKE '{}%'", prefix));
            }
            sql.push_str(")");
        }
    }

    if let Some(q) = query.q {
        sql.push_str(" AND (nm_perawatan LIKE ? OR kd_jenis_prw LIKE ?)");
        tests = sqlx::query_as::<_, LabTest>(&sql)
            .bind(format!("%{}%", q))
            .bind(format!("%{}%", q))
            .fetch_all(&pool)
            .await
            .map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    } else {
        sql.push_str(" LIMIT 50");
        tests = sqlx::query_as::<_, LabTest>(&sql)
            .fetch_all(&pool)
            .await
            .map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    }

    Ok(Json(tests))
}

pub async fn get_lab_template(
    State(pool): State<MySqlPool>,
    Path(kd_jenis_prw): Path<String>,
) -> Result<Json<Vec<LabTemplate>>, (axum::http::StatusCode, String)> {
    let sql = "SELECT id_template, Pemeriksaan, satuan, nilai_rujukan_ld, nilai_rujukan_la, nilai_rujukan_pd 
               FROM template_laboratorium WHERE kd_jenis_prw = ? ORDER BY urut";
    
    let templates = sqlx::query_as::<_, LabTemplate>(sql)
        .bind(kd_jenis_prw)
        .fetch_all(&pool)
        .await
        .map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(templates))
}

pub async fn save_lab_request(
    State(pool): State<MySqlPool>,
    Json(payload): Json<LabRequest>,
) -> Result<Json<String>, (axum::http::StatusCode, String)> {
    let mut tx = pool.begin().await.map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // Generate noorder (e.g., PK-202603100001)
    let now = chrono::Local::now();
    let date_str = now.format("%Y%m%d").to_string();
    let prefix = format!("PK{}", date_str);
    
    let last_order = sqlx::query_scalar::<_, String>("SELECT noorder FROM permintaan_lab WHERE noorder LIKE ? ORDER BY noorder DESC LIMIT 1")
        .bind(format!("{}%", prefix))
        .fetch_optional(&mut *tx)
        .await
        .map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let next_num = match last_order {
        Some(last) => {
            if last.len() >= prefix.len() {
                last[prefix.len()..].parse::<u32>().unwrap_or(0) + 1
            } else {
                1
            }
        }
        None => 1,
    };
    let noorder = format!("{}{:04}", prefix, next_num);

    let tgl_permintaan = now.format("%Y-%m-%d").to_string();
    let jam_permintaan = now.format("%H:%M:%S").to_string();

    // Insert into permintaan_lab
    sqlx::query("INSERT INTO permintaan_lab (noorder, no_rawat, tgl_permintaan, jam_permintaan, tgl_sampel, jam_sampel, tgl_hasil, jam_hasil, dokter_perujuk, status, informasi_tambahan, diagnosa_klinis) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
        .bind(&noorder)
        .bind(&payload.no_rawat)
        .bind(&tgl_permintaan)
        .bind(&jam_permintaan)
        .bind("0000-00-00") // tgl_sampel default empty
        .bind("00:00:00") // jam_sampel default empty
        .bind("0000-00-00") // tgl_hasil default empty
        .bind("00:00:00") // jam_hasil default empty
        .bind(&payload.dokter_perujuk)
        .bind(payload.status.unwrap_or_else(|| "ralan".to_string()))
        .bind(payload.informasi_tambahan.as_deref().unwrap_or("-").chars().take(60).collect::<String>())
        .bind(payload.diagnosa_klinis.as_deref().unwrap_or("-").chars().take(80).collect::<String>())
        .execute(&mut *tx)
        .await
        .map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, format!("Error inserting permintaan_lab: {}", e.to_string())))?;

    // Insert into permintaan_pemeriksaan_lab and permintaan_detail_permintaan_lab
    for test in payload.tests {
        sqlx::query("INSERT INTO permintaan_pemeriksaan_lab (noorder, kd_jenis_prw, stts_bayar) VALUES (?, ?, ?)")
            .bind(&noorder)
            .bind(&test.kd_jenis_prw)
            .bind("Belum")
            .execute(&mut *tx)
            .await
            .map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

        for id_template in test.id_templates {
            sqlx::query("INSERT INTO permintaan_detail_permintaan_lab (noorder, kd_jenis_prw, id_template, stts_bayar) VALUES (?, ?, ?, ?)")
                .bind(&noorder)
                .bind(&test.kd_jenis_prw)
                .bind(id_template)
                .bind("Belum")
                .execute(&mut *tx)
                .await
                .map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
        }
    }

    tx.commit().await.map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(noorder))
}
