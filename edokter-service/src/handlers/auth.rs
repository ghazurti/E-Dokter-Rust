use axum::{extract::State, http::StatusCode, Json};
use sqlx::{MySql, Pool, Row};
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
pub struct LoginRequest {
    pub username: String,
    pub password: String,
    pub kd_poli: String,
}

#[derive(Serialize)]
pub struct AuthResponse {
    pub success: bool,
    pub token: String,
    pub kd_dokter: String,
    pub nm_dokter: String,
    pub kd_poli: String,
    pub nm_poli: String,
}

pub async fn login(
    State(pool): State<Pool<MySql>>,
    Json(payload): Json<LoginRequest>,
) -> Result<Json<AuthResponse>, (StatusCode, String)> {
    
    tracing::debug!("Login attempt for user: {}, poli: {}", payload.username, payload.kd_poli);

    // 1. Try Standard AES_ENCRYPT (id_user: 'nur', password: 'windi')
    // We join on kd_dokter using decrypted id_user to ensure it's a valid doctor
    let query_windi = "SELECT u.id_user, d.nm_dokter 
                       FROM user u 
                       JOIN dokter d ON d.kd_dokter = ? 
                       WHERE u.id_user = AES_ENCRYPT(?, 'nur') AND u.password = AES_ENCRYPT(?, 'windi') 
                       LIMIT 1";

    let result = sqlx::query(query_windi)
        .bind(&payload.username) // for d.kd_dokter
        .bind(&payload.username) // for u.id_user
        .bind(&payload.password) // for u.password
        .fetch_optional(&pool)
        .await
        .map_err(|e| {
            tracing::error!("Database error in windi login query: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, format!("Database error: {}", e))
        })?;

    if let Some(row) = result {
        return handle_success(&pool, &payload, row, "AES_WINDI").await;
    }

    // 2. Try AES_ENCRYPT (id_user: 'nur', password: 'nur') 
    tracing::debug!("WINDI login failed, trying NUR for both for user: {}", payload.username);
    let query_nur = "SELECT u.id_user, d.nm_dokter 
                     FROM user u 
                     JOIN dokter d ON d.kd_dokter = ? 
                     WHERE u.id_user = AES_ENCRYPT(?, 'nur') AND u.password = AES_ENCRYPT(?, 'nur') 
                     LIMIT 1";

    let result_nur = sqlx::query(query_nur)
        .bind(&payload.username)
        .bind(&payload.username)
        .bind(&payload.password)
        .fetch_optional(&pool)
        .await
        .map_err(|e| {
            tracing::error!("Database error in nur login query: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, format!("Database error: {}", e))
        })?;

    if let Some(row) = result_nur {
        return handle_success(&pool, &payload, row, "AES_NUR").await;
    }

    // 3. Try MD5 fallback
    tracing::debug!("AES login failed, trying MD5 for user: {}", payload.username);
    let query_md5 = "SELECT u.id_user, d.nm_dokter 
                     FROM user u 
                     JOIN dokter d ON d.kd_dokter = ? 
                     WHERE u.id_user = AES_ENCRYPT(?, 'nur') AND u.password = MD5(?) 
                     LIMIT 1";
    
    let result_md5 = sqlx::query(query_md5)
        .bind(&payload.username)
        .bind(&payload.username)
        .bind(&payload.password)
        .fetch_optional(&pool)
        .await
        .map_err(|e| {
            tracing::error!("Database error in MD5 login query: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, format!("Database error: {}", e))
        })?;

    if let Some(row) = result_md5 {
        return handle_success(&pool, &payload, row, "MD5").await;
    }

    // 4. Try Plain text with encrypted id_user
    tracing::debug!("MD5 login failed, trying plain text for user: {}", payload.username);
    let query_plain = "SELECT u.id_user, d.nm_dokter 
                       FROM user u 
                       JOIN dokter d ON d.kd_dokter = ? 
                       WHERE u.id_user = AES_ENCRYPT(?, 'nur') AND u.password = ? 
                       LIMIT 1";

    let result_plain = sqlx::query(query_plain)
        .bind(&payload.username)
        .bind(&payload.username)
        .bind(&payload.password)
        .fetch_optional(&pool)
        .await
        .map_err(|e| {
            tracing::error!("Database error in plain login query: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, format!("Database error: {}", e))
        })?;

    if let Some(row) = result_plain {
        return handle_success(&pool, &payload, row, "PLAIN").await;
    }

    tracing::warn!("All login methods failed for user: {}", payload.username);
    Err((StatusCode::UNAUTHORIZED, "Invalid username or password".to_string()))
}

async fn handle_success(
    pool: &Pool<MySql>,
    payload: &LoginRequest,
    row: sqlx::mysql::MySqlRow,
    method: &str,
) -> Result<Json<AuthResponse>, (StatusCode, String)> {
    let kd_dokter: String = payload.username.clone();
    let nm_dokter: String = row.get("nm_dokter");
    
    let nm_poli = sqlx::query_scalar::<_, String>("SELECT nm_poli FROM poliklinik WHERE kd_poli = ?")
        .bind(&payload.kd_poli)
        .fetch_optional(pool)
        .await
        .unwrap_or(None)
        .unwrap_or_else(|| "Poli Tidak Diketahui".to_string());

    tracing::info!("Login successful using {} for user: {} at poli: {}", method, kd_dokter, nm_poli);

    Ok(Json(AuthResponse {
        success: true,
        token: "dummy-jwt-token".to_string(), 
        kd_dokter,
        nm_dokter,
        kd_poli: payload.kd_poli.clone(),
        nm_poli,
    }))
}
