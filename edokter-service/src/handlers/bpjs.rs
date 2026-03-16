use axum::{
    extract::{Json, State},
    response::IntoResponse,
    http::StatusCode,
};
use serde::{Deserialize, Serialize};
use crate::services::bpjs_service::{self, BpjsConfig};
use std::env;

#[derive(Deserialize)]
pub struct IcareValidatePayload {
    pub nik_atau_kartu: String,
    pub kode_dokter: String,
}

#[derive(Serialize)]
pub struct IcareSuccessResponse {
    pub url: String,
}

#[derive(Serialize)]
pub struct IcareErrorResponse {
    pub message: String,
}

pub async fn validate_icare(
    State(pool): State<sqlx::MySqlPool>,
    Json(payload): Json<IcareValidatePayload>,
) -> impl IntoResponse {
    // Mapping kd_dokter to kd_dokter_bpjs (from maping_dokter_dpjpvclaim)
    let mapped_dokter = match sqlx::query(
        "SELECT kd_dokter_bpjs FROM maping_dokter_dpjpvclaim WHERE kd_dokter = ?"
    )
    .bind(&payload.kode_dokter)
    .fetch_optional(&pool)
    .await {
        Ok(Some(row)) => {
            use sqlx::Row;
            let kd = row.get::<Option<String>, _>("kd_dokter_bpjs").unwrap_or_default();
            if kd.is_empty() {
                return (
                    StatusCode::BAD_REQUEST,
                    Json(IcareErrorResponse { message: format!("Mapping BPJS untuk dokter {} kosong di tabel maping_dokter_dpjpvclaim", payload.kode_dokter) }),
                ).into_response();
            }
            kd
        },
        Ok(None) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(IcareErrorResponse { message: format!("Dokter {} belum di-mapping ke BPJS (Tabel: maping_dokter_dpjpvclaim)", payload.kode_dokter) }),
            ).into_response();
        }
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(IcareErrorResponse { message: format!("Gagal akses database: {}", e) }),
            ).into_response();
        }
    };

    let config = BpjsConfig {
        cons_id: env::var("BPJS_CONS_ID").unwrap_or_default(),
        secret_key: env::var("BPJS_SECRET_KEY").unwrap_or_default(),
        user_key: env::var("BPJS_USER_KEY").unwrap_or_default(),
        base_url: env::var("BPJS_ICARE_BASE_URL").unwrap_or_default(),
    };

    match bpjs_service::validate_icare(&config, &payload.nik_atau_kartu, &mapped_dokter).await {
        Ok(url) => (StatusCode::OK, Json(IcareSuccessResponse { url })).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(IcareErrorResponse { message: e.to_string() }),
        ).into_response(),
    }
}
