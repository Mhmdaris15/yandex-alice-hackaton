use axum::{extract::State, Json};
use serde::{Deserialize, Serialize};

use crate::error::ApiResult;
use crate::prompts::{self, build_user_prompt};
use crate::yandex::ai::Message;
use crate::AppState;

#[derive(Deserialize)]
pub struct ChatRequest {
    pub message: String,
    pub context: Option<String>,
}

#[derive(Serialize)]
pub struct ChatResponse {
    pub reply: String,
    pub tokens: u32,
    pub source: &'static str, // "yandex" | "mock"
}

pub async fn chat(
    State(state): State<AppState>,
    Json(req): Json<ChatRequest>,
) -> ApiResult<Json<ChatResponse>> {
    let user_prompt = build_user_prompt(&req.message, req.context.as_deref());

    // Real path: call Yandex AI Studio if a credential is wired up.
    if state.yandex.is_configured() {
        let messages = vec![
            Message { role: "system".into(), text: prompts::SYSTEM_PROMPT.trim().into() },
            Message { role: "user".into(),   text: user_prompt.clone() },
        ];
        match state.yandex.chat_completion(&messages).await {
            Ok(c) => {
                return Ok(Json(ChatResponse {
                    reply: c.text,
                    tokens: c.tokens,
                    source: "yandex",
                }));
            }
            Err(e) => {
                tracing::warn!("yandex chat failed, falling back to mock: {e:#}");
            }
        }
    }

    // Mock path — deterministic, references real DB rows so the assistant
    // feels alive even without an API key.
    let lower = user_prompt.to_lowercase();
    let reply = if lower.contains("migration") || lower.contains("миграц") {
        let docs = state.db.expiring_documents(60).await.unwrap_or_default();
        match docs.iter().find(|d| d.kind == "Migration Card") {
            Some(d) => format!(
                "Your migration card expires on {}. Bring passport + university registration to {}. Mornings have the shortest queue.",
                d.expires_at.format("%d %B"), d.location
            ),
            None => "I don't see a migration card on file — open the Journey tab and add Day 0 first.".into(),
        }
    } else if lower.contains("metro") || lower.contains("метро") {
        "Where you stand right now → walk to the nearest синяя М sign. Single ride 70₽, but buy a Тройка card (50₽ deposit, refundable).".into()
    } else {
        format!("Heard. I'll pin that to your timeline. (echo: {})", req.message.chars().take(80).collect::<String>())
    };

    let tokens = reply.split_whitespace().count() as u32;
    Ok(Json(ChatResponse { reply, tokens, source: "mock" }))
}
