use axum::{
    http::StatusCode,
    Json,
};
use serde::{Deserialize, Serialize};
use std::env;

#[derive(Deserialize)]
pub struct AiSummaryRequest {
    pub notes: String,
}

#[derive(Serialize, Deserialize)]
pub struct AiSoapResponse {
    pub subjective: Option<String>,
    pub objective: Option<String>,
    pub assessment: Option<String>,
    pub plan: Option<String>,
    pub td: Option<serde_json::Value>,
    pub suhu: Option<serde_json::Value>,
    pub nadi: Option<serde_json::Value>,
    pub rr: Option<serde_json::Value>,
    pub bb: Option<serde_json::Value>,
    pub nyeri: Option<serde_json::Value>,
    pub gcs: Option<serde_json::Value>,
    pub spo2: Option<serde_json::Value>,
}

#[derive(Serialize, Deserialize)]
pub struct AiSbarResponse {
    pub situation: String,
    pub background: String,
    pub assessment: String,
    pub recommendation: String,
}

pub async fn get_soap_summary(
    Json(payload): Json<AiSummaryRequest>,
) -> Result<Json<AiSoapResponse>, (StatusCode, String)> {
    let api_key = env::var("GEMINI_API_KEY").map_err(|_| (StatusCode::INTERNAL_SERVER_ERROR, "GEMINI_API_KEY tidak dikonfigurasi di .env".to_string()))?;
    let api_url = env::var("GEMINI_API_URL").map_err(|_| (StatusCode::INTERNAL_SERVER_ERROR, "GEMINI_API_URL tidak dikonfigurasi di .env".to_string()))?;
    
    let client = reqwest::Client::new();
    
    let prompt = format!(
        "Anda adalah asisten medis profesional. Analisis catatan dokter berikut dan rangkum ke dalam format SOAP yang terstruktur. \
        Berikan jawaban HANYA dalam format JSON dengan field: \
        \"subjective\", \"objective\", \"assessment\", \"plan\", \"td\", \"suhu\", \"nadi\", \"rr\", \"bb\", \"nyeri\", \"gcs\", \"spo2\". \
        \nAturan pengisian vital signs: \
        - Ambil hanya angka atau nilai yang sesuai dari catatan. \
        - Semua field vital signs HARUS dikembalikan sebagai STRING (dibungkus tanda kutip), contoh: \"37.8\", \"80\", \"120/80\", \"98%\". \
        - Jika tidak ada di catatan, biarkan null. \
        - Pastikan output adalah JSON yang valid. \
        \nCatatan dokter: \n\"{}\"", 
        payload.notes
    );

    let request_body = serde_json::json!({
        "contents": [{
            "parts": [{
                "text": prompt
            }]
        }]
    });

    let url = format!("{}?key={}", api_url, api_key);
    tracing::info!("🤖 Memanggil Gemini AI untuk merangkum catatan...");
    
    let response = client.post(&url)
        .header("Content-Type", "application/json")
        .json(&request_body)
        .send()
        .await
        .map_err(|e| {
            tracing::error!("❌ Gagal terhubung ke Gemini: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, format!("Gagal menghubungi Gemini: {}", e))
        })?;

    if !response.status().is_success() {
        let error_status = response.status();
        let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
        tracing::error!("⚠️ Gemini API Error: {} - {}", error_status, error_text);
        return Err((StatusCode::INTERNAL_SERVER_ERROR, format!("Gemini API Error ({}): {}", error_status, error_text)));
    }

    tracing::info!("✅ Respon diterima dari Gemini AI.");

    let gemini_response: serde_json::Value = response.json().await
        .map_err(|e| {
            tracing::error!("Failed to parse Gemini JSON: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, format!("Gagal memproses JSON Gemini: {}", e))
        })?;

    let mut text_content = gemini_response["candidates"][0]["content"]["parts"][0]["text"]
        .as_str()
        .ok_or_else(|| {
            tracing::error!("AI response missing text part: {:?}", gemini_response);
            (StatusCode::INTERNAL_SERVER_ERROR, "AI tidak memberikan respon teks".to_string())
        })?
        .trim();

    // Bersihkan markdown jika AI memberikan output dalam blok ```json ... ```
    if text_content.starts_with("```") {
        text_content = text_content.trim_start_matches("```");
        if text_content.starts_with("json") {
            text_content = text_content.trim_start_matches("json");
        }
        text_content = text_content.trim_end_matches("```").trim();
    }

    tracing::info!("✨ Berhasil merangkum menjadi format SOAP terstruktur.");
    tracing::debug!("🔍 Cleaned AI response: {}", text_content);

    let soap_response: AiSoapResponse = serde_json::from_str(text_content)
        .map_err(|e| {
            tracing::error!("JSON parsing error of AI content: {}. Raw text: {}", e, text_content);
            (StatusCode::INTERNAL_SERVER_ERROR, format!("Format JSON AI tidak valid: {}. Konten: {}", e, text_content))
        })?;

    Ok(Json(soap_response))
}

pub async fn get_sbar_summary(
    Json(payload): Json<AiSummaryRequest>,
) -> Result<Json<AiSbarResponse>, (StatusCode, String)> {
    let api_key = env::var("GEMINI_API_KEY").map_err(|_| (StatusCode::INTERNAL_SERVER_ERROR, "GEMINI_API_KEY tidak dikonfigurasi di .env".to_string()))?;
    let api_url = env::var("GEMINI_API_URL").map_err(|_| (StatusCode::INTERNAL_SERVER_ERROR, "GEMINI_API_URL tidak dikonfigurasi di .env".to_string()))?;
    
    let client = reqwest::Client::new();
    
    let prompt = format!(
        "Anda adalah asisten medis profesional. Gunakan data SOAP pasien berikut untuk membuat ringkasan serah terima (handover) menggunakan format SBAR (Situation, Background, Assessment, Recommendation). \
        \nAturan pengisian: \
        - **Situation**: Kondisi mendesak saat ini, alasan handover, dan perubahan status pasien terbaru. \
        - **Background**: Riwayat singkat, prosedur yang sudah dilakukan, dan data pendukung yang relevan. \
        - **Assessment**: Analisis klinis Anda terhadap kondisi pasien saat ini. \
        - **Recommendation**: Saran tindakan segera atau monitoring yang perlu dilanjutkan oleh dokter penerima. \
        \nBerikan jawaban HANYA dalam format JSON dengan field: \"situation\", \"background\", \"assessment\", \"recommendation\". \
        \nData SOAP: \n\"{}\"", 
        payload.notes
    );

    let request_body = serde_json::json!({
        "contents": [{
            "parts": [{
                "text": prompt
            }]
        }]
    });

    let url = format!("{}?key={}", api_url, api_key);
    tracing::info!("🤖 Memanggil Gemini AI untuk generate SBAR...");
    
    let response = client.post(&url)
        .header("Content-Type", "application/json")
        .json(&request_body)
        .send()
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Gagal menghubungi Gemini: {}", e)))?;

    if !response.status().is_success() {
        return Err((StatusCode::INTERNAL_SERVER_ERROR, "Gemini API Error".to_string()));
    }

    let gemini_response: serde_json::Value = response.json().await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Gagal memproses JSON Gemini: {}", e)))?;

    let mut text_content = gemini_response["candidates"][0]["content"]["parts"][0]["text"]
        .as_str()
        .ok_or_else(|| (StatusCode::INTERNAL_SERVER_ERROR, "AI tidak memberikan respon teks".to_string()))?
        .trim();

    if text_content.starts_with("```") {
        text_content = text_content.trim_start_matches("```");
        if text_content.starts_with("json") {
            text_content = text_content.trim_start_matches("json");
        }
        text_content = text_content.trim_end_matches("```").trim();
    }

    tracing::info!("✨ Berhasil merangkum menjadi format SBAR.");

    let sbar_response: AiSbarResponse = serde_json::from_str(text_content)
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Format JSON AI tidak valid: {}", e)))?;

    Ok(Json(sbar_response))
}
