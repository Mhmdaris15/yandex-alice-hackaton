use axum::Json;
use serde::Serialize;

#[derive(Serialize)]
pub struct Pulse {
    pub id: String,
    pub lat: f64,
    pub lon: f64,
    pub kind: &'static str,
    pub message: String,
    pub age_min: u32,
}

pub async fn pulse() -> Json<Vec<Pulse>> {
    Json(vec![
        Pulse { id: "1".into(), lat: 55.7340, lon: 37.5880, kind: "queue",   message: "MFTs Sokol — 3h queue right now".into(), age_min: 12 },
        Pulse { id: "2".into(), lat: 55.7558, lon: 37.6173, kind: "tip",     message: "Clinic on Tverskaya speaks English".into(), age_min: 90 },
        Pulse { id: "3".into(), lat: 55.7903, lon: 37.5350, kind: "warning", message: "Avoid Yandex Taxi surge after 23:00 here".into(), age_min: 30 },
    ])
}
