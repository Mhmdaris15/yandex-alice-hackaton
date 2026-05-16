// Background worker — wakes up daily, queries the graph for expiring
// documents, and ships proactive alerts. For the hackathon we log to
// stdout; in production swap in the Telegram Bot API call.

use std::sync::Arc;
use tokio::time::{interval, Duration};

use crate::db::Db;

pub async fn run(db: Arc<Db>) {
    // Tick every 5 min in dev so the demo actually shows something.
    let mut tick = interval(Duration::from_secs(60 * 5));
    loop {
        tick.tick().await;
        match db.expiring_documents(14).await {
            Ok(docs) if !docs.is_empty() => {
                for d in docs {
                    tracing::info!(
                        target: "alerts",
                        kind = %d.kind,
                        expires = %d.expires_at,
                        "🔔 proactive: {} expires soon — propose action",
                        d.kind
                    );
                    // TODO: telegram_send(&d).await;
                }
            }
            Ok(_) => tracing::debug!("worker: nothing expiring"),
            Err(e) => tracing::warn!("worker query failed: {e}"),
        }
    }
}
