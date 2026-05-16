use axum::{
    extract::ws::{Message, WebSocket, WebSocketUpgrade},
    response::IntoResponse,
};
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
struct ClientMsg {
    text: String,
    to_ru: bool,
}

#[derive(Serialize)]
struct ServerMsg {
    translated: String,
}

pub async fn ws(upgrade: WebSocketUpgrade) -> impl IntoResponse {
    upgrade.on_upgrade(handle)
}

async fn handle(mut socket: WebSocket) {
    while let Some(Ok(msg)) = socket.recv().await {
        if let Message::Text(t) = msg {
            let payload: ClientMsg = match serde_json::from_str(&t) {
                Ok(p) => p,
                Err(_) => continue,
            };
            // TODO: pipe through Yandex Speechkit + Translate.
            let translated = if payload.to_ru {
                format!("(ru) {}", payload.text)
            } else {
                format!("(en) {}", payload.text)
            };
            let _ = socket
                .send(Message::Text(serde_json::to_string(&ServerMsg { translated }).unwrap()))
                .await;
        }
    }
}
