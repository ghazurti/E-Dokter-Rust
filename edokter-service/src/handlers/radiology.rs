use axum::{
    extract::{Query, State},
    Json,
};
use serde::Deserialize;
use sqlx::{MySqlPool, Row};
use crate::models::radiology::{RadiologyTest, RadiologyRequest};
use chrono::Local;

#[derive(Deserialize)]
pub struct SearchQuery {
    pub q: Option<String>,
    pub category: Option<String>,
}

pub async fn search_radiology_test(
    State(pool): State<MySqlPool>,
    Query(query): Query<SearchQuery>,
) -> Result<Json<Vec<RadiologyTest>>, (axum::http::StatusCode, String)> {
    let mut sql = String::from("SELECT kd_jenis_prw, nm_perawatan FROM jns_perawatan_radiologi WHERE status = '1'");
    let tests;

    if let Some(cat) = query.category {
        let prefixes = match cat.as_str() {
            "polos" => vec!["RO"],
            "usg" => vec!["US"],
            "ct" => vec!["CT"],
            "mri" => vec!["MR"],
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
        tests = sqlx::query_as::<_, RadiologyTest>(&sql)
            .bind(format!("%{}%", q))
            .bind(format!("%{}%", q))
            .fetch_all(&pool)
            .await
            .map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    } else {
        sql.push_str(" LIMIT 50");
        tests = sqlx::query_as::<_, RadiologyTest>(&sql)
            .fetch_all(&pool)
            .await
            .map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    }

    Ok(Json(tests))
}

pub async fn save_radiology_request(
    State(pool): State<MySqlPool>,
    Json(payload): Json<RadiologyRequest>,
) -> Result<Json<serde_json::Value>, (axum::http::StatusCode, String)> {
    let mut tx = pool.begin().await.map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let now = Local::now();
    let date_str = now.format("%Y%m%d").to_string();
    let prefix = format!("PR{}", date_str);

    let last_order = sqlx::query("SELECT noorder FROM permintaan_radiologi WHERE noorder LIKE ? ORDER BY noorder DESC LIMIT 1")
        .bind(format!("{}%", prefix))
        .fetch_optional(&mut *tx)
        .await
        .map_err(|e: sqlx::Error| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let next_num = match last_order {
        Some(row) => {
            let no_order_val: String = row.get("noorder");
            let num_part = &no_order_val[prefix.len()..];
            num_part.parse::<i32>().unwrap_or(0) + 1
        }
        None => 1,
    };
    let noorder = format!("{}{:04}", prefix, next_num);

    let now_date = now.format("%Y-%m-%d").to_string();
    let now_time = now.format("%H:%M:%S").to_string();

    sqlx::query("INSERT INTO permintaan_radiologi (noorder, no_rawat, tgl_permintaan, jam_permintaan, tgl_sampel, jam_sampel, tgl_hasil, jam_hasil, dokter_perujuk, status, informasi_tambahan, diagnosa_klinis) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
        .bind(&noorder)
        .bind(&payload.no_rawat)
        .bind(&now_date)
        .bind(&now_time)
        .bind("0000-00-00") // tgl_sampel empty
        .bind("00:00:00") // jam_sampel empty
        .bind("0000-00-00") // tgl_hasil empty
        .bind("00:00:00") // jam_hasil empty
        .bind(&payload.dokter_perujuk)
        .bind(payload.status.unwrap_or_else(|| "ralan".to_string()))
        .bind(payload.informasi_tambahan.as_deref().unwrap_or("-").chars().take(60).collect::<String>())
        .bind(payload.diagnosa_klinis.as_deref().unwrap_or("-").chars().take(80).collect::<String>())
        .execute(&mut *tx)
        .await
        .map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, format!("Error inserting permintaan_radiologi: {}", e.to_string())))?;

    for test in payload.tests {
        sqlx::query(
            "INSERT INTO permintaan_pemeriksaan_radiologi (noorder, kd_jenis_prw, stts_bayar) VALUES (?, ?, 'Belum')"
        )
        .bind(&noorder)
        .bind(&test.kd_jenis_prw)
        .execute(&mut *tx)
        .await
        .map_err(|e: sqlx::Error| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    }

    tx.commit().await.map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(serde_json::json!({ "success": true, "noorder": noorder })))
}
