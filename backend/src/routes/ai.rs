use axum::{extract::State, Json};
use serde::{Deserialize, Serialize};

use crate::{error::ApiResult, prompts, AppState};

#[derive(Deserialize)]
pub struct ChatRequest {
    pub message: String,
    pub context: Option<String>,
}

#[derive(Serialize)]
pub struct ChatResponse {
    pub reply: String,
    pub tokens: u32,
}

pub async fn chat(
    State(state): State<AppState>,
    Json(req): Json<ChatRequest>,
) -> ApiResult<Json<ChatResponse>> {
    // In production: call Yandex AI Studio chat completion here using
    // `state.http`, signed with the IAM token from env.
    // For the hackathon: deterministic mock that reads expiring docs
    // from SurrealDB so the assistant feels alive.
    let _ = &state.http;
    let user = prompts::build_user_prompt(&req.message, req.context.as_deref());

    let reply = if user.to_lowercase().contains("migration") || user.to_lowercase().contains("миграц") {
        let docs = state.db.expiring_documents(30).await.unwrap_or_default();
        if let Some(first) = docs.iter().find(|d| d.kind == "Migration Card") {
            format!(
                "Your migration card expires on {}. Bring passport + university registration to {}. Mornings have the shortest queue.",
                first.expires_at.format("%d %B"), first.location
            )
        } else {
            "I don't see a migration card on file — open the Journey tab and add Day 0 first.".into()
        }
    } else if user.to_lowercase().contains("metro") || user.to_lowercase().contains("метро") {
        "Where you stand right now → walk to the nearest синяя М sign. Single ride 70₽, but buy a Тройка card (50₽ deposit, refundable).".into()
    } else {
        format!("Heard. I'll pin that to your timeline and follow up. (echo: {})", req.message.chars().take(80).collect::<String>())
    };

    let tokens = reply.split_whitespace().count() as u32;
    Ok(Json(ChatResponse { reply, tokens }))
}
