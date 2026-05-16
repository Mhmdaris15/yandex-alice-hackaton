use axum::Json;
use serde::{Deserialize, Serialize};

use crate::error::ApiResult;

#[derive(Deserialize)]
pub struct OcrRequest {
    pub image: String,
}

#[derive(Serialize)]
pub struct OcrBox {
    pub ru: String,
    pub en: String,
    pub x: f32, pub y: f32, pub w: f32, pub h: f32,
    pub hint: Option<String>,
}

#[derive(Serialize)]
pub struct OcrResponse {
    pub boxes: Vec<OcrBox>,
    pub latency_ms: u64,
}

pub async fn analyze(Json(_req): Json<OcrRequest>) -> ApiResult<Json<OcrResponse>> {
    let start = std::time::Instant::now();
    // Production: POST image to Yandex Vision OCR, then map word boxes
    // → field labels via a known-template matcher.
    // Mock for the hackathon — return common Russian form fields.
    tokio::time::sleep(std::time::Duration::from_millis(420)).await;
    let boxes = vec![
        OcrBox { ru: "Фамилия".into(),       en: "Surname".into(),       x: 0.08, y: 0.18, w: 0.32, h: 0.08, hint: Some("Latin letters, as in passport".into()) },
        OcrBox { ru: "Имя".into(),           en: "Given name".into(),    x: 0.08, y: 0.30, w: 0.32, h: 0.08, hint: None },
        OcrBox { ru: "Дата рождения".into(), en: "Date of birth".into(), x: 0.08, y: 0.42, w: 0.42, h: 0.08, hint: Some("Format: DD.MM.YYYY".into()) },
        OcrBox { ru: "Подпись".into(),       en: "Signature".into(),     x: 0.55, y: 0.78, w: 0.35, h: 0.12, hint: Some("Must match the signature in your passport".into()) },
    ];
    Ok(Json(OcrResponse { boxes, latency_ms: start.elapsed().as_millis() as u64 }))
}
