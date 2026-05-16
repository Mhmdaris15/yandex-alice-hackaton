use axum::{extract::State, Json};
use serde::Serialize;

use crate::AppState;

#[derive(Serialize)]
pub struct JourneyDoc {
    pub kind: String,
    pub expires_at: String,
    pub location: String,
    pub days_remaining: i64,
}

pub async fn list(State(state): State<AppState>) -> Json<Vec<JourneyDoc>> {
    let docs = state.db.expiring_documents(365).await.unwrap_or_default();
    let now = chrono::Utc::now();
    let out = docs.into_iter().map(|d| JourneyDoc {
        days_remaining: (d.expires_at - now).num_days(),
        expires_at: d.expires_at.to_rfc3339(),
        kind: d.kind,
        location: d.location,
    }).collect();
    Json(out)
}
