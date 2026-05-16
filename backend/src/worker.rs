// Background worker — wakes up periodically, queries the graph for
// expiring documents, and emits proactive alerts. Falls back to a stdout
// log when TELEGRAM_BOT_TOKEN is absent.

use std::sync::Arc;
use tokio::time::{interval, Duration};

use crate::config::TelegramConfig;
use crate::db::Db;

pub async fn run(db: Arc<Db>, tg: TelegramConfig) {
    // 5 min in dev so the demo actually shows something.
    let mut tick = interval(Duration::from_secs(5 * 60));
    let http = reqwest::Client::new();

    loop {
        tick.tick().await;
        match db.expiring_documents(14).await {
            Ok(docs) if !docs.is_empty() => {
                for d in docs {
                    let line = format!(
                        "🔔 {} expires {} at {} — propose action",
                        d.kind,
                        d.expires_at.format("%d %B"),
                        d.location
                    );
                    tracing::info!(target: "alerts", "{line}");

                    if let (Some(token), Some(chat_id)) = (tg.bot_token.as_deref(), tg.chat_id.as_deref()) {
                        if let Err(e) = send_telegram(&http, token, chat_id, &line).await {
                            tracing::warn!("telegram send failed: {e:#}");
                        }
                    }
                }
            }
            Ok(_) => tracing::debug!("worker: nothing expiring"),
            Err(e) => tracing::warn!("worker query failed: {e}"),
        }
    }
}

async fn send_telegram(
    http: &reqwest::Client,
    token: &str,
    chat_id: &str,
    text: &str,
) -> anyhow::Result<()> {
    let url = format!("https://api.telegram.org/bot{token}/sendMessage");
    http.post(url)
        .form(&[("chat_id", chat_id), ("text", text), ("parse_mode", "Markdown")])
        .send()
        .await?
        .error_for_status()?;
    Ok(())
}
