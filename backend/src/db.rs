// Thin SurrealDB wrapper. Hackathon mode uses the in-memory engine
// so there is zero infra to spin up. Schema sketch below.
//
// Graph:
//   student -[:HAS_STATUS]-> document_status
//   document_status -[:AT]-> location
// Vectors:
//   regulation { embedding: array<f32, 1536>, body: string }
//
// For the hackathon we keep CRUD minimal — proactive worker reads
// `document_status.expires_at` and emits alerts.

use anyhow::Result;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use surrealdb::engine::local::{Db as Engine, Mem};
use surrealdb::Surreal;

pub struct Db {
    pub conn: Surreal<Engine>,
}

impl Db {
    pub async fn connect() -> Result<Self> {
        let conn = Surreal::new::<Mem>(()).await?;
        conn.use_ns("wtr").use_db("hackathon").await?;
        seed(&conn).await?;
        Ok(Self { conn })
    }

    pub async fn expiring_documents(&self, within_days: i64) -> Result<Vec<DocumentStatus>> {
        let threshold = Utc::now() + chrono::Duration::days(within_days);
        let mut res = self.conn
            .query("SELECT * FROM document_status WHERE expires_at < $t ORDER BY expires_at")
            .bind(("t", threshold))
            .await?;
        Ok(res.take(0)?)
    }
}

async fn seed(conn: &Surreal<Engine>) -> Result<()> {
    let now = Utc::now();
    let docs: Vec<(&str, i64)> = vec![
        ("Migration Card",        14),
        ("Medical Certificate",   30),
        ("Dorm Registration",     45),
    ];
    for (name, days) in docs {
        let _: Option<DocumentStatus> = conn
            .create("document_status")
            .content(DocumentStatus {
                id: None,
                student: "student:demo".into(),
                kind: name.into(),
                expires_at: now + chrono::Duration::days(days),
                location: "Moscow MFTs".into(),
            })
            .await?;
    }
    Ok(())
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
