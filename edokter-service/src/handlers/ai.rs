use axum::{
    extract::State,
    http::StatusCode,
    Json,
};
use sqlx::{Pool, MySql};
use serde::{Deserialize, Serialize};
use std::env;

#[derive(Deserialize)]
pub struct AiSummaryRequest {
    pub notes: String,
}

#[derive(Deserialize)]
pub struct AiResumeRequest {
    pub no_rawat: String,
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

#[derive(Serialize, Deserialize)]
pub struct AiResumeResponse {
    pub jalannya_penyakit: Option<String>,
    pub pemeriksaan_fisik: Option<String>,
    pub pemeriksaan_penunjang: Option<String>,
    pub hasil_laborat: Option<String>,
    pub tindakan_dan_operasi: Option<String>,
    pub obat_di_rs: Option<String>,
    pub diagnosa_utama: Option<String>,
    pub kd_diagnosa_utama: Option<String>,
    pub diagnosa_sekunder: Option<String>,
    pub kd_diagnosa_sekunder: Option<String>,
    pub obat_pulang: Option<String>,
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

pub async fn get_resume_summary(
    State(pool): State<Pool<MySql>>,
    Json(payload): Json<AiResumeRequest>,
) -> Result<Json<AiResumeResponse>, (StatusCode, String)> {
    let api_key = env::var("GEMINI_API_KEY").map_err(|_| (StatusCode::INTERNAL_SERVER_ERROR, "GEMINI_API_KEY tidak dikonfigurasi".to_string()))?;
    let api_url = env::var("GEMINI_API_URL").map_err(|_| (StatusCode::INTERNAL_SERVER_ERROR, "GEMINI_API_URL tidak dikonfigurasi".to_string()))?;
    
    let no_rawat = payload.no_rawat.replace('-', "/");
    
    // 1. Fetch CPPT History
    let cppt_history = sqlx::query(
        "SELECT CAST(tgl_perawatan AS CHAR) as tgl_perawatan, 
                CAST(jam_rawat AS CHAR) as jam_rawat, 
                keluhan, pemeriksaan, penilaian, rtl, instruksi 
         FROM pemeriksaan_ranap 
         WHERE no_rawat = ? 
         ORDER BY tgl_perawatan ASC, jam_rawat ASC"
    )
    .bind(&no_rawat)
    .fetch_all(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Gagal ambil CPPT: {}", e)))?;

    let mut context_text = String::from("RIWAYAT CPPT PASIEN:\n");
    for row in cppt_history {
        use sqlx::Row;
        context_text.push_str(&format!(
            "[{}] S: {} O: {} A: {} P: {} Instruksi: {}\n",
            row.get::<String, _>("tgl_perawatan"), 
            row.get::<String, _>("keluhan"),
            row.get::<String, _>("pemeriksaan"),
            row.get::<String, _>("penilaian"),
            row.get::<String, _>("rtl"),
            row.get::<String, _>("instruksi")
        ));
    }

    // 2. Fetch Prescription/Medicine History
    let meds = sqlx::query(
        "SELECT rb.nama_brng, CAST(rd.jml AS CHAR) as jml, rd.aturan_pakai, CAST(ro.tgl_peresepan AS CHAR) as tgl 
         FROM resep_obat ro 
         JOIN resep_dokter rd ON ro.no_resep = rd.no_resep 
         JOIN databarang rb ON rd.kode_brng = rb.kode_brng 
         WHERE ro.no_rawat = ? 
         UNION 
         SELECT rb.nama_brng, CAST(rdrd.jml AS CHAR) as jml, rdr.aturan_pakai, CAST(ro.tgl_peresepan AS CHAR) as tgl 
         FROM resep_obat ro 
         JOIN resep_dokter_racikan rdr ON ro.no_resep = rdr.no_resep 
         JOIN resep_dokter_racikan_detail rdrd ON rdr.no_resep = rdrd.no_resep AND rdr.no_racik = rdrd.no_racik 
         JOIN databarang rb ON rdrd.kode_brng = rb.kode_brng 
         WHERE ro.no_rawat = ?"
    )
    .bind(&no_rawat)
    .bind(&no_rawat)
    .fetch_all(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Gagal ambil data obat: {}", e)))?;

    context_text.push_str("\nRIWAYAT OBAT/TERAPI:\n");
    for row in meds {
        use sqlx::Row;
        context_text.push_str(&format!(
            "- {} (Jumlah: {}, Aturan: {}) pada tgl {}\n",
            row.get::<String, _>(0),
            row.get::<String, _>(1),
            row.get::<String, _>(2),
            row.get::<String, _>(3)
        ));
    }

    let client = reqwest::Client::new();
    let prompt = format!(
        "Anda adalah asisten medis profesional. Rangkum seluruh riwayat CPPT dan obat pasien berikut menjadi Resume Medis (Ringkasan Pulang). \
        \nField yang harus diisi: \
        - **jalannya_penyakit**: Ringkasan kronologis perjalanan penyakit selama dirawat. \
        - **pemeriksaan_fisik**: Rangkuman temuan fisik penting. \
        - **pemeriksaan_penunjang**: Rangkuman hasil penunjang (Rad/Lainnya) jika ada di catatan. \
        - **hasil_laborat**: Rangkuman hasil lab penting. \
        - **tindakan_dan_operasi**: Tindakan atau prosedur yang dilakukan. \
        - **obat_di_rs**: Daftar obat yang diberikan selama perawatan. \
        - **diagnosa_utama**: Nama diagnosis utama saat pulang (teks lengkap). \
        - **kd_diagnosa_utama**: HANYA kode ICD-10 singkat, contoh: I10, J45, E11.9 (max 8 karakter, TANPA nama penyakit). \
        - **diagnosa_sekunder**: Nama komorbiditas atau diagnosa tambahan (teks lengkap). \
        - **kd_diagnosa_sekunder**: HANYA kode ICD-10 singkat (max 8 karakter, TANPA nama penyakit). \
        - **obat_pulang**: Rekomendasi obat yang dibawa pulang pasien. \
        \nPERINGATAN: Field kd_diagnosa_* HARUS berupa kode ICD-10 pendek saja (contoh: I10, J18.9, E11), BUKAN nama penyakit. \
        \nBerikan jawaban HANYA dalam format JSON tanpa markdown. \
        \nDATA PASIEN: \n\"{}\"", 
        context_text
    );

    let request_body = serde_json::json!({
        "contents": [{ "parts": [{ "text": prompt }] }]
    });

    let url = format!("{}?key={}", api_url, api_key);
    let response = client.post(&url)
        .header("Content-Type", "application/json")
        .json(&request_body)
        .send()
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Gemini Error: {}", e)))?;

    let gemini_response: serde_json::Value = response.json().await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Parse Error: {}", e)))?;

    let mut text_content = gemini_response["candidates"][0]["content"]["parts"][0]["text"]
        .as_str()
        .ok_or_else(|| (StatusCode::INTERNAL_SERVER_ERROR, "AI Error".to_string()))?
        .trim();

    if text_content.starts_with("```") {
        text_content = text_content.trim_start_matches("```").trim_start_matches("json").trim_end_matches("```").trim();
    }

    let mut resume_res: AiResumeResponse = serde_json::from_str(text_content)
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("JSON validasi AI gagal: {}", e)))?;

    // Safety: trim ICD-10 code fields to max 10 chars to fit database column
    let trim_icd = |s: Option<String>| -> Option<String> { s.map(|v| v.chars().take(10).collect()) };
    resume_res.kd_diagnosa_utama = trim_icd(resume_res.kd_diagnosa_utama);
    resume_res.kd_diagnosa_sekunder = trim_icd(resume_res.kd_diagnosa_sekunder);

    Ok(Json(resume_res))
}

pub async fn get_resume_summary_ralan(
    State(pool): State<Pool<MySql>>,
    Json(payload): Json<AiResumeRequest>,
) -> Result<Json<AiResumeResponse>, (StatusCode, String)> {
    let api_key = env::var("GEMINI_API_KEY").map_err(|_| (StatusCode::INTERNAL_SERVER_ERROR, "GEMINI_API_KEY tidak dikonfigurasi".to_string()))?;
    let api_url = env::var("GEMINI_API_URL").map_err(|_| (StatusCode::INTERNAL_SERVER_ERROR, "GEMINI_API_URL tidak dikonfigurasi".to_string()))?;
    
    let no_rawat = payload.no_rawat.replace('-', "/");
    
    // 1. Fetch CPPT History Rawat Jalan
    let cppt_history = sqlx::query(
        "SELECT CAST(tgl_perawatan AS CHAR) as tgl_perawatan, 
                CAST(jam_rawat AS CHAR) as jam_rawat, 
                keluhan, pemeriksaan, penilaian, rtl, instruksi 
         FROM pemeriksaan_ralan 
         WHERE no_rawat = ? 
         ORDER BY tgl_perawatan ASC, jam_rawat ASC"
    )
    .bind(&no_rawat)
    .fetch_all(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Gagal ambil CPPT Ralan: {}", e)))?;

    let mut context_text = String::from("RIWAYAT CPPT PASIEN RAWAT JALAN:\n");
    for row in cppt_history {
        use sqlx::Row;
        context_text.push_str(&format!(
            "[{}] S: {} O: {} A: {} P: {} Instruksi: {}\n",
            row.get::<String, _>("tgl_perawatan"), 
            row.get::<String, _>("keluhan"),
            row.get::<String, _>("pemeriksaan"),
            row.get::<String, _>("penilaian"),
            row.get::<String, _>("rtl"),
            row.get::<String, _>("instruksi")
        ));
    }

    // 2. Fetch Prescription/Medicine History
    let meds = sqlx::query(
        "SELECT rb.nama_brng, CAST(rd.jml AS CHAR) as jml, rd.aturan_pakai, CAST(ro.tgl_peresepan AS CHAR) as tgl 
         FROM resep_obat ro 
         JOIN resep_dokter rd ON ro.no_resep = rd.no_resep 
         JOIN databarang rb ON rd.kode_brng = rb.kode_brng 
         WHERE ro.no_rawat = ? 
         UNION 
         SELECT rb.nama_brng, CAST(rdrd.jml AS CHAR) as jml, rdr.aturan_pakai, CAST(ro.tgl_peresepan AS CHAR) as tgl 
         FROM resep_obat ro 
         JOIN resep_dokter_racikan rdr ON ro.no_resep = rdr.no_resep 
         JOIN resep_dokter_racikan_detail rdrd ON rdr.no_resep = rdrd.no_resep AND rdr.no_racik = rdrd.no_racik 
         JOIN databarang rb ON rdrd.kode_brng = rb.kode_brng 
         WHERE ro.no_rawat = ?"
    )
    .bind(&no_rawat)
    .bind(&no_rawat)
    .fetch_all(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Gagal ambil data obat: {}", e)))?;

    context_text.push_str("\nRIWAYAT OBAT/TERAPI:\n");
    for row in meds {
        use sqlx::Row;
        context_text.push_str(&format!(
            "- {} (Jumlah: {}, Aturan: {}) pada tgl {}\n",
            row.get::<String, _>(0),
            row.get::<String, _>(1),
            row.get::<String, _>(2),
            row.get::<String, _>(3)
        ));
    }

    let client = reqwest::Client::new();
    let prompt = format!(
        "Anda adalah asisten medis profesional. Rangkum seluruh riwayat CPPT dan obat pasien rawat jalan berikut menjadi Resume Medis (Ringkasan Pulang). \
        \nField yang harus diisi: \
        - **jalannya_penyakit**: Ringkasan kronologis perjalanan penyakit pasien. \
        - **pemeriksaan_fisik**: Rangkuman temuan fisik penting. \
        - **pemeriksaan_penunjang**: Rangkuman hasil penunjang (Rad/Lainnya) jika ada di catatan. \
        - **hasil_laborat**: Rangkuman hasil lab penting. \
        - **tindakan_dan_operasi**: Tindakan atau prosedur yang dilakukan. \
        - **obat_di_rs**: Daftar obat yang diberikan selama di RS atau poliklinik. \
        - **diagnosa_utama**: Nama diagnosis utama saat pulang (teks lengkap). \
        - **kd_diagnosa_utama**: HANYA kode ICD-10 singkat, contoh: I10, J45, E11.9 (max 8 karakter, TANPA nama penyakit). \
        - **diagnosa_sekunder**: Nama komorbiditas atau diagnosa tambahan (teks lengkap). \
        - **kd_diagnosa_sekunder**: HANYA kode ICD-10 singkat (max 8 karakter, TANPA nama penyakit). \
        - **obat_pulang**: Rekomendasi obat yang dibawa pulang pasien. \
        \nPERINGATAN: Field kd_diagnosa_* HARUS berupa kode ICD-10 pendek saja (contoh: I10, J18.9, E11), BUKAN nama penyakit. \
        \nBerikan jawaban HANYA dalam format JSON tanpa markdown. \
        \nDATA PASIEN: \n\"{}\"", 
        context_text
    );

    let request_body = serde_json::json!({
        "contents": [{ "parts": [{ "text": prompt }] }]
    });

    let url = format!("{}?key={}", api_url, api_key);
    let response = client.post(&url)
        .header("Content-Type", "application/json")
        .json(&request_body)
        .send()
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Gemini Error: {}", e)))?;

    let gemini_response: serde_json::Value = response.json().await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Parse Error: {}", e)))?;

    let mut text_content = gemini_response["candidates"][0]["content"]["parts"][0]["text"]
        .as_str()
        .ok_or_else(|| (StatusCode::INTERNAL_SERVER_ERROR, "AI Error".to_string()))?
        .trim();

    if text_content.starts_with("```") {
        text_content = text_content.trim_start_matches("```").trim_start_matches("json").trim_end_matches("```").trim();
    }

    let mut resume_res: AiResumeResponse = serde_json::from_str(text_content)
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("JSON validasi AI gagal: {}", e)))?;

    let trim_icd = |s: Option<String>| -> Option<String> { s.map(|v| v.chars().take(10).collect()) };
    resume_res.kd_diagnosa_utama = trim_icd(resume_res.kd_diagnosa_utama);
    resume_res.kd_diagnosa_sekunder = trim_icd(resume_res.kd_diagnosa_sekunder);

    Ok(Json(resume_res))
}
