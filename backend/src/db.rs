// SurrealDB wrapper — connects to a remote server over WebSocket.
//
// Schema sketch (graph + vector + time-series, all in one engine):
//   student            { id, country, university, arrived_at }
//   student -[:HAS_STATUS]-> document_status
//   document_status -[:AT]-> location
//   regulation         { id, body, embedding<f32, 256> }   // vector search
//
// For the hackathon we seed `document_status` once, idempotently. The
// proactive worker reads `expires_at` and emits alerts.

use anyhow::{Context, Result};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use surrealdb::engine::remote::ws::{Client, Ws};
use surrealdb::opt::auth::Root;
use surrealdb::Surreal;

use crate::config::Config;

pub struct Db {
    pub conn: Surreal<Client>,
}

impl Db {
    pub async fn connect(cfg: &Config) -> Result<Self> {
        // surrealdb's Ws engine wants `host:port` (no scheme). Strip if given.
        let endpoint = cfg
            .surreal_url
            .trim_start_matches("http://")
            .trim_start_matches("https://")
            .trim_start_matches("ws://")
            .trim_start_matches("wss://")
            .trim_end_matches('/')
            .to_string();

        tracing::info!("connecting to surreal at {endpoint}, ns={}, db={}", cfg.surreal_ns, cfg.surreal_db);

        let conn = Surreal::new::<Ws>(endpoint.as_str())
            .await
            .with_context(|| format!("surreal connect {endpoint}"))?;

        conn.signin(Root {
            username: &cfg.surreal_user,
            password: &cfg.surreal_pass,
        })
        .await
        .context("surreal signin (check root credentials)")?;

        conn.use_ns(cfg.surreal_ns.as_str())
            .use_db(cfg.surreal_db.as_str())
            .await
            .context("surreal use_ns/use_db")?;

        let db = Self { conn };
        db.ensure_seed().await?;
        Ok(db)
    }

    /// Insert demo `document_status` rows if and only if the table is empty.
    /// Idempotent — restarts won't duplicate seed data.
    async fn ensure_seed(&self) -> Result<()> {
        let mut res = self
            .conn
            .query("SELECT count() FROM document_status GROUP ALL")
            .await
            .context("surreal seed count query")?;
        let counts: Vec<CountRow> = res.take(0).unwrap_or_default();
        let current: i64 = counts.first().map(|c| c.count).unwrap_or(0);

        if current > 0 {
            tracing::info!("surreal: {current} document_status rows already present — skipping seed");
            return Ok(());
        }

        let now = Utc::now();
        let docs: Vec<(&str, i64, &str)> = vec![
            ("Migration Card",      14, "Saint Petersburg MFTs · Krasnogvardeysky"),
            ("Medical Certificate", 30, "ITMO clinic · Lomonosova 9"),
            ("Dorm Registration",   45, "ITMO dormitory №3 · Vyazemsky"),
        ];

        for (kind, days, location) in docs {
            let _: Option<DocumentStatus> = self
                .conn
                .create("document_status")
                .content(DocumentStatus {
                    id: None,
                    student: "student:demo".into(),
                    kind: kind.into(),
                    expires_at: now + chrono::Duration::days(days),
                    location: location.into(),
                })
                .await
                .with_context(|| format!("seed document_status {kind}"))?;
        }

        tracing::info!("surreal: seeded {} document_status rows", 3);
        Ok(())
    }

    pub async fn expiring_documents(&self, within_days: i64) -> Result<Vec<DocumentStatus>> {
        let threshold = Utc::now() + chrono::Duration::days(within_days);
        let mut res = self
            .conn
            .query("SELECT * FROM document_status WHERE expires_at < $t ORDER BY expires_at")
            .bind(("t", threshold))
            .await
            .context("expiring_documents query")?;
        Ok(res.take(0)?)
    }
}

#[derive(Debug, Deserialize)]
struct CountRow {
    count: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DocumentStatus {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<surrealdb::sql::Thing>,
    pub student: String,
    pub kind: String,
    pub expires_at: DateTime<Utc>,
    pub location: String,
}
