// Yandex Vision · OCR (recognizeText).
// https://yandex.cloud/en/docs/vision/ocr/api-ref/TextRecognition/recognize

use anyhow::{bail, Context, Result};
use serde::{Deserialize, Serialize};

use super::YandexClient;

const OCR_URL: &str = "https://ocr.api.cloud.yandex.net/ocr/v1/recognizeText";

#[derive(Serialize)]
struct OcrRequest<'a> {
    #[serde(rename = "mimeType")]
    mime_type: &'a str,
    #[serde(rename = "languageCodes")]
    language_codes: Vec<&'a str>,
    model: &'a str,
    content: &'a str, // base64
}

#[derive(Deserialize)]
struct OcrResponse {
    result: OcrResult,
}

#[derive(Deserialize)]
struct OcrResult {
    #[serde(rename = "textAnnotation")]
    text_annotation: TextAnnotation,
}

#[derive(Deserialize)]
struct TextAnnotation {
    width: Option<String>,
    height: Option<String>,
    blocks: Vec<Block>,
}

#[derive(Deserialize)]
struct Block {
    #[serde(rename = "boundingBox")]
    bounding_box: BoundingBox,
    lines: Vec<Line>,
}

#[derive(Deserialize)]
struct Line {
    #[serde(rename = "boundingBox")]
    bounding_box: BoundingBox,
    text: String,
}

#[derive(Deserialize)]
struct BoundingBox {
    vertices: Vec<Vertex>,
}

#[derive(Deserialize)]
struct Vertex {
    x: Option<String>,
    y: Option<String>,
}

#[derive(Debug, Clone)]
pub struct OcrLine {
    pub text: String,
    /// Normalized 0..1 box
    pub x: f32, pub y: f32, pub w: f32, pub h: f32,
}

impl YandexClient {
    /// `image_base64` is a *plain* base64 string (no data: prefix).
    /// Returns a flat list of recognized lines with normalized coords.
    pub async fn ocr(&self, image_base64: &str) -> Result<Vec<OcrLine>> {
        let folder = match self.folder_id() {
            Some(f) => f,
            None => bail!("YANDEX_FOLDER_ID not set"),
        };

        let (auth_k, auth_v) = self.auth_header().await?;
        let resp: OcrResponse = self
            .http
            .post(OCR_URL)
            .header(auth_k, auth_v)
            .header("x-folder-id", folder)
            .json(&OcrRequest {
                mime_type: "image/jpeg",
                language_codes: vec!["ru", "en"],
                model: "page",
                content: image_base64,
            })
            .send()
            .await
            .context("yandex ocr send")?
            .error_for_status()
            .context("yandex ocr status")?
            .json()
            .await
            .context("yandex ocr decode")?;

        let ann = resp.result.text_annotation;
        let w = ann.width.as_deref().and_then(|s| s.parse::<f32>().ok()).unwrap_or(1.0).max(1.0);
        let h = ann.height.as_deref().and_then(|s| s.parse::<f32>().ok()).unwrap_or(1.0).max(1.0);

        let mut out = Vec::new();
        for block in ann.blocks {
            for line in block.lines {
                if let Some(b) = normalize_box(&line.bounding_box, w, h) {
                    out.push(OcrLine {
                        text: line.text,
                        x: b.0, y: b.1, w: b.2, h: b.3,
                    });
                }
            }
            let _ = block.bounding_box; // unused, but informative
        }
        Ok(out)
    }
}

fn normalize_box(bb: &BoundingBox, img_w: f32, img_h: f32) -> Option<(f32, f32, f32, f32)> {
    if bb.vertices.is_empty() {
        return None;
    }
    let xs: Vec<f32> = bb.vertices.iter().filter_map(|v| v.x.as_deref().and_then(|s| s.parse().ok())).collect();
    let ys: Vec<f32> = bb.vertices.iter().filter_map(|v| v.y.as_deref().and_then(|s| s.parse().ok())).collect();
    if xs.is_empty() || ys.is_empty() {
        return None;
    }
    let x0 = xs.iter().cloned().fold(f32::INFINITY, f32::min);
    let x1 = xs.iter().cloned().fold(f32::NEG_INFINITY, f32::max);
    let y0 = ys.iter().cloned().fold(f32::INFINITY, f32::min);
    let y1 = ys.iter().cloned().fold(f32::NEG_INFINITY, f32::max);
    Some((x0 / img_w, y0 / img_h, (x1 - x0) / img_w, (y1 - y0) / img_h))
}
