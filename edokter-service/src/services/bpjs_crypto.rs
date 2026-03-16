use hmac::{Hmac, Mac};
use digest::KeyInit;
use sha2::{Sha256, Digest};
use aes::Aes256;
use cbc::Decryptor;
use cbc::cipher::{BlockDecryptMut, KeyIvInit};
use base64::{engine::general_purpose, Engine as _};
use std::str;

pub type HmacSha256 = Hmac<Sha256>;

pub fn generate_signature(cons_id: &str, secret_key: &str, timestamp: &str) -> String {
    let data = format!("{}&{}", cons_id, timestamp);
    let mut mac = <HmacSha256 as KeyInit>::new_from_slice(secret_key.as_bytes())
        .expect("HMAC can take key of any size");
    mac.update(data.as_bytes());
    let result = mac.finalize();
    general_purpose::STANDARD.encode(result.into_bytes())
}

pub fn decrypt_response(cons_id: &str, secret_key: &str, timestamp: &str, encrypted_data: &str) -> Result<String, Box<dyn std::error::Error>> {
    // 1. Generate Key and IV
    let key_string = format!("{}{}{}", cons_id, secret_key, timestamp);
    let mut hasher = Sha256::new();
    hasher.update(key_string.as_bytes());
    let hash_result = hasher.finalize();
    
    let key = &hash_result[..32]; // AES-256 uses 32 bytes key
    let iv = &hash_result[..16];  // CBC IV is 16 bytes
    
    // 2. Base64 Decode
    let ciphertext = general_purpose::STANDARD.decode(encrypted_data)?;
    
    // 3. AES Decrypt
    let decryptor: Decryptor<Aes256> = Decryptor::new(key.into(), iv.into());
    let mut buf = ciphertext.to_vec();
    let res = decryptor.decrypt_padded_mut::<cbc::cipher::block_padding::Pkcs7>(&mut buf)
        .map_err(|e| format!("Decryption error: {:?}", e))?;
    
    let decrypted_str = str::from_utf8(res)?;
    
    // 4. LZ-String Decompress
    if let Some(decompressed_u16) = lz_str::decompress_from_encoded_uri_component(decrypted_str) {
        let decompressed = String::from_utf16(&decompressed_u16)?;
        Ok(decompressed)
    } else {
        Err("LZ-String decompression failed".into())
    }
}
