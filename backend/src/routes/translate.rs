// WebSocket endpoint for the Walkie-Talkie. Client sends a JSON envelope
// per turn; we respond with the translated text. If Yandex is configured
// we hit Translate; otherwise we echo with a tag so the demo still works.

use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        State,
    },
    response::IntoResponse,
};
use serde::{Deserialize, Serialize};

use crate::AppState;

#[derive(Deserialize)]
struct ClientMsg {
    text: String,
    /// true = translate to Russian, false = translate to English.
    to_ru: bool,
}

#[derive(Serialize)]
struct ServerMsg {
    translated: String,
    source: &'static str,
}

pub async fn ws(
    upgrade: WebSocketUpgrade,
    State(state): State<AppState>,
) -> impl IntoResponse {
    upgrade.on_upgrade(move |socket| handle(socket, state))
}

async fn handle(mut socket: WebSocket, state: AppState) {
    while let Some(Ok(msg)) = socket.recv().await {
        let Message::Text(t) = msg else { continue };
        let payload: ClientMsg = match serde_json::from_str(&t) {
            Ok(p) => p,
            Err(_) => continue,
        };

        let (target, source_lang) = if payload.to_ru { ("ru", Some("en")) } else { ("en", Some("ru")) };

        let (translated, src) = if state.yandex.is_configured() {
            match state.yandex.translate(&payload.text, target, source_lang).await {
                Ok(t) => (t, "yandex"),
                Err(e) => {
                    tracing::warn!("yandex translate failed: {e:#}");
                    (mock_translate(&payload.text, payload.to_ru), "mock")
                }
            }
        } else {
            (mock_translate(&payload.text, payload.to_ru), "mock")
        };

        let _ = socket
            .send(Message::Text(serde_json::to_string(&ServerMsg { translated, source: src }).unwrap()))
            .await;
    }
}

fn mock_translate(text: &str, to_ru: bool) -> String {
    let dict: &[(&str, &str)] = &[
        ("hello",                "здравствуйте"),
        ("where is the metro",   "где метро"),
        ("how much",             "сколько"),
        ("i don't speak russian", "я не говорю по-русски"),
        ("please help me",       "пожалуйста, помогите мне"),
        ("i need a doctor",      "мне нужен врач"),
    ];
    let key = text.trim().to_lowercase();
    let found = dict.iter().find_map(|(en, ru)| {
        if to_ru && *en == key { Some(ru.to_string()) }
        else if !to_ru && *ru == key { Some(en.to_string()) }
        else { None }
    });
    found.unwrap_or_else(|| if to_ru {
        "(перевод недоступен — настройте YANDEX_OAUTH_TOKEN)".into()
    } else {
        "(translation unavailable — configure YANDEX_OAUTH_TOKEN)".into()
    })
}
