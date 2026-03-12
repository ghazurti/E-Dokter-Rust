use axum::{extract::State, http::StatusCode, Json};
use sqlx::{MySql, Pool};
use serde::Serialize;

#[derive(Serialize, sqlx::FromRow)]
pub struct PoliItem {
    pub kd_poli: String,
    pub nm_poli: String,
}

pub async fn get_poliklinik(
    State(pool): State<Pool<MySql>>,
) -> Result<Json<Vec<PoliItem>>, (StatusCode, String)> {
    let result = sqlx::query_as::<_, PoliItem>("SELECT kd_poli, nm_poli FROM poliklinik ORDER BY nm_poli ASC")
        .fetch_all(&pool)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Database error: {}", e)))?;

    Ok(Json(result))
}
