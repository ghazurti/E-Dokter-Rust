use crate::services::bpjs_crypto;
use reqwest::header::{HeaderMap, HeaderValue, CONTENT_TYPE};
use serde::{Deserialize, Serialize};
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Serialize)]
pub struct ValidateRequest {
    pub param: String,
    pub kodedokter: i32,
}

#[derive(Deserialize)]
pub struct BpjsResponse {
    pub response: Option<String>,
    #[serde(rename = "metaData")]
    pub meta_data: MetaData,
}

#[derive(Deserialize)]
pub struct MetaData {
    #[serde(deserialize_with = "deserialize_code")]
    pub code: String,
    pub message: String,
}

fn deserialize_code<'de, D>(deserializer: D) -> Result<String, D::Error>
where
    D: serde::Deserializer<'de>,
{
    #[derive(Deserialize)]
    #[serde(untagged)]
    enum Code {
        Int(i64),
        String(String),
    }

    match Code::deserialize(deserializer)? {
        Code::Int(i) => Ok(i.to_string()),
        Code::String(s) => Ok(s),
    }
}

#[derive(Deserialize)]
pub struct DecryptedIcareResponse {
    pub url: String,
}

pub struct BpjsConfig {
    pub cons_id: String,
    pub secret_key: String,
    pub user_key: String,
    pub base_url: String,
}

pub async fn validate_icare(config: &BpjsConfig, nik_atau_kartu: &str, kode_dokter: &str) -> Result<String, Box<dyn std::error::Error>> {
    let client = reqwest::Client::new();
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)?
        .as_secs()
        .to_string();
    
    let signature = bpjs_crypto::generate_signature(&config.cons_id, &config.secret_key, &timestamp);
    
    let mut headers = HeaderMap::new();
    headers.insert(CONTENT_TYPE, HeaderValue::from_static("application/json"));
    headers.insert("x-cons-id", HeaderValue::from_str(&config.cons_id)?);
    headers.insert("x-timestamp", HeaderValue::from_str(&timestamp)?);
    headers.insert("x-signature", HeaderValue::from_str(&signature)?);
    headers.insert("user_key", HeaderValue::from_str(&config.user_key)?);
    
    let body = ValidateRequest {
        param: nik_atau_kartu.to_string(),
        kodedokter: kode_dokter.parse::<i32>().unwrap_or(0),
    };
    
    let url = format!("{}/validate", config.base_url);
    
    let res_text = client.post(url)
        .headers(headers)
        .json(&body)
        .send()
        .await?
        .text()
        .await?;
    
    tracing::debug!("Raw response from BPJS: {}", res_text);

    let res: BpjsResponse = match serde_json::from_str(&res_text) {
        Ok(parsed) => parsed,
        Err(e) => {
            tracing::error!("Failed to parse BPJS response: {}. Raw body: {}", e, res_text);
            return Err(format!(
                "Gagal membaca respon BPJS (JSON Error). Kemungkinan besar karena konfigurasi .env (ConsID/Secret/UserKey) belum benar atau IP server belum didaftarkan di BPJS. Detail: {}", 
                e
            ).into());
        }
    };
    
    if res.meta_data.code != "200" {
        return Err(format!("BPJS Error: {} ({})", res.meta_data.message, res.meta_data.code).into());
    }
    
    if let Some(encrypted_data) = res.response {
        let decrypted_json = bpjs_crypto::decrypt_response(&config.cons_id, &config.secret_key, &timestamp, &encrypted_data)?;
        let icare_res: DecryptedIcareResponse = serde_json::from_str(&decrypted_json)?;
        Ok(icare_res.url)
    } else {
        Err("Empty response from BPJS".into())
    }
}
