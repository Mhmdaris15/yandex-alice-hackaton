use axum::{extract::State, Json};
use base64::{engine::general_purpose, Engine};
use serde::{Deserialize, Serialize};

use crate::error::ApiResult;
use crate::AppState;

#[derive(Deserialize)]
pub struct OcrRequest {
    /// Either a `data:image/...;base64,XXX` URL, or a plain base64 string.
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
    pub source: &'static str, // "yandex" | "mock"
}

pub async fn analyze(
    State(state): State<AppState>,
    Json(req): Json<OcrRequest>,
) -> ApiResult<Json<OcrResponse>> {
    let started = std::time::Instant::now();

    if state.yandex.is_configured() {
        let raw = strip_data_url(&req.image);
        // Sanity-check decode so we fail fast with a clear error.
        if let Err(e) = general_purpose::STANDARD.decode(raw.as_bytes()) {
            tracing::warn!("ocr: image not valid base64: {e}");
        }
        match state.yandex.ocr(raw).await {
            Ok(lines) => {
                // Map raw recognized lines → field-style boxes. Production
                // would template-match against known Russian forms.
                let boxes = lines.into_iter().enumerate().map(|(i, l)| OcrBox {
                    ru: l.text.clone(),
                    en: translate_label(&l.text, i),
                    x: l.x, y: l.y, w: l.w, h: l.h,
                    hint: None,
                }).collect();
                return Ok(Json(OcrResponse {
                    boxes,
                    latency_ms: started.elapsed().as_millis() as u64,
                    source: "yandex",
                }));
            }
            Err(e) => tracing::warn!("yandex ocr failed, falling back to mock: {e:#}"),
        }
    }

    // Mock: canonical Russian form fields.
    tokio::time::sleep(std::time::Duration::from_millis(420)).await;
    let boxes = vec![
        OcrBox { ru: "Фамилия".into(),       en: "Surname".into(),       x: 0.08, y: 0.18, w: 0.32, h: 0.08, hint: Some("Latin letters, as in passport".into()) },
        OcrBox { ru: "Имя".into(),           en: "Given name".into(),    x: 0.08, y: 0.30, w: 0.32, h: 0.08, hint: None },
        OcrBox { ru: "Дата рождения".into(), en: "Date of birth".into(), x: 0.08, y: 0.42, w: 0.42, h: 0.08, hint: Some("Format: DD.MM.YYYY".into()) },
        OcrBox { ru: "Подпись".into(),       en: "Signature".into(),     x: 0.55, y: 0.78, w: 0.35, h: 0.12, hint: Some("Must match the signature in your passport".into()) },
    ];
    Ok(Json(OcrResponse {
        boxes,
        latency_ms: started.elapsed().as_millis() as u64,
        source: "mock",
    }))
}

fn strip_data_url(s: &str) -> &str {
    if let Some(idx) = s.find("base64,") {
        &s[idx + 7..]
    } else {
        s
    }
}

/// Cheap heuristic — translate a few common form labels. Anything else
/// gets passed through verbatim. Real pipeline calls `YandexClient::translate`
/// for unknown lines.
fn translate_label(ru: &str, _i: usize) -> String {
    match ru.trim().to_lowercase().as_str() {
        "фамилия"           => "Surname",
        "имя"               => "Given name",
        "отчество"          => "Patronymic",
        "дата рождения"     => "Date of birth",
        "место рождения"    => "Place of birth",
        "адрес регистрации" => "Registered address",
        "подпись"           => "Signature",
        "паспорт"           => "Passport",
        _ => return ru.to_string(),
    }.to_string()
}
