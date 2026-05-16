// SurrealDB wrapper — connects to a remote server over WebSocket.
//
// Schema sketch (graph + vector + time-series, all in one engine):
//   student            { id, country, university, arrived_at }
//   student -[:HAS_STATUS]-> document_status
//   document_status -[:AT]-> location
//   regulation         { id, body, embedding<f32, 256> }   // vector search
//   forum_thread       { id, country, university, author, title, body,
//                        lang, body_translated?, created_at, reply_count }
//   forum_reply        { id, thread, author, body, lang, created_at }
//
// All seeds are idempotent: tables are only populated when empty.

use anyhow::{Context, Result};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use surrealdb::engine::remote::ws::{Client, Ws};
use surrealdb::opt::auth::Root;
use surrealdb::sql::Thing;
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
        db.ensure_seed_documents().await?;
        db.ensure_seed_forum().await?;
        Ok(db)
    }

    // ─────────────────────────────────────────── document_status ──

    /// Insert demo `document_status` rows if and only if the table is empty.
    async fn ensure_seed_documents(&self) -> Result<()> {
        if self.count("document_status").await? > 0 {
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
        tracing::info!("surreal: seeded 3 document_status rows");
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

    // ──────────────────────────────────────────────────── forum ──

    async fn ensure_seed_forum(&self) -> Result<()> {
        if self.count("forum_thread").await? > 0 {
            return Ok(());
        }
        let now = Utc::now();
        let seeds: Vec<SeedThread> = vec![
            SeedThread {
                country: "KZ", university: "HSE", author: "Aigerim K.",
                avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&q=80&auto=format&fit=crop",
                title: "Where do I find a notary who won't make me cry?",
                body: "Need a sworn translation of my diploma. Tried 3 places near Sennaya and none speak English. Anyone in SPb with a recommendation?",
                lang: "en",
                replies: vec![
                    SeedReply { author: "Hassan A.", lang: "en",
                                body: "Notarius Petrov on Dekabristov 12. Speaks decent English, ₽1800/page. Bring original + 2 photocopies." },
                    SeedReply { author: "Liu Wei",   lang: "en",
                                body: "Don't go to the one inside the metro Spasskaya. Long queue and they refuse foreign docs after 16:00." },
                ],
                age_min: 18,
            },
            SeedThread {
                country: "ID", university: "ITMO", author: "Riza P.",
                avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&q=80&auto=format&fit=crop",
                title: "Halal food near Vyazemsky dormitory?",
                body: "Hi everyone, just moved into общежитие №3. Any halal places within walking distance? Map suggestions appreciated 🙏",
                lang: "en",
                replies: vec![
                    SeedReply { author: "Sofía M.",  lang: "en",
                                body: "Shaurma Karakol on Vasilievskiy, 10 min walk. Also a small Uzbek cafeteria inside the Lentochka grocery." },
                    SeedReply { author: "Aigerim K.", lang: "en",
                                body: "There's a halal aisle in VkusVill near metro Sportivnaya — vacuum-packed kebabs, OK for late nights." },
                    SeedReply { author: "Hassan A.",  lang: "en",
                                body: "DM me, I'll send a Yandex Maps list with everything I've vetted in 4 years here." },
                ],
                age_min: 92,
            },
            SeedThread {
                country: "RU", university: "ITMO", author: "Alyona M.",
                avatar: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=120&q=80&auto=format&fit=crop",
                title: "ITMO international office — closed Friday?",
                body: "Кажется, отдел не работал сегодня. У кого-то есть актуальное расписание на эту неделю?",
                lang: "ru",
                replies: vec![
                    SeedReply { author: "Liu Wei", lang: "ru",
                                body: "Да, закрыто. На двери записка — будут работать в субботу с 10:00 до 13:00." },
                ],
                age_min: 240,
            },
            SeedThread {
                country: "NG", university: "Polytech", author: "Chinedu O.",
                avatar: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=120&q=80&auto=format&fit=crop",
                title: "Yandex.Bank card got blocked — what now?",
                body: "Card stopped working at the metro turnstile. App says \"verification pending\". I have classes in 20 min — anyone hit this?",
                lang: "en",
                replies: vec![],
                age_min: 6,
            },
        ];

        for seed in seeds {
            let thread = ForumThread {
                id: None,
                country: seed.country.into(),
                university: seed.university.into(),
                author: seed.author.into(),
                avatar: seed.avatar.into(),
                title: seed.title.into(),
                body: seed.body.into(),
                lang: seed.lang.into(),
                created_at: now - chrono::Duration::minutes(seed.age_min),
                reply_count: seed.replies.len() as i64,
            };
            let created: Option<ForumThread> = self
                .conn
                .create("forum_thread")
                .content(thread)
                .await
                .context("seed forum_thread")?;

            let Some(parent) = created.and_then(|t| t.id) else { continue };

            for (i, r) in seed.replies.into_iter().enumerate() {
                let _: Option<ForumReply> = self
                    .conn
                    .create("forum_reply")
                    .content(ForumReply {
                        id: None,
                        thread: parent.clone(),
                        author: r.author.into(),
                        body: r.body.into(),
                        lang: r.lang.into(),
                        created_at: now - chrono::Duration::minutes(seed.age_min)
                            + chrono::Duration::minutes((i as i64 + 1) * 9),
                    })
                    .await
                    .context("seed forum_reply")?;
            }
        }
        tracing::info!("surreal: seeded forum_thread + forum_reply rows");
        Ok(())
    }

    pub async fn list_threads(&self) -> Result<Vec<ForumThread>> {
        let mut res = self
            .conn
            .query("SELECT * FROM forum_thread ORDER BY created_at DESC LIMIT 50")
            .await
            .context("list_threads")?;
        Ok(res.take(0)?)
    }

    pub async fn get_thread(&self, thing_id: &str) -> Result<Option<ForumThread>> {
        let Some((tb, id)) = split_thing(thing_id) else { return Ok(None) };
        let thread: Option<ForumThread> = self
            .conn
            .select((tb.to_string(), id.to_string()))
            .await?;
        Ok(thread)
    }

    pub async fn list_replies(&self, thread_id: &str) -> Result<Vec<ForumReply>> {
        let Some(thing) = parse_thing(thread_id) else { return Ok(vec![]) };
        let mut res = self
            .conn
            .query("SELECT * FROM forum_reply WHERE thread = $t ORDER BY created_at ASC")
            .bind(("t", thing))
            .await
            .context("list_replies")?;
        Ok(res.take(0)?)
    }

    pub async fn create_thread(&self, t: NewThread) -> Result<ForumThread> {
        let row = ForumThread {
            id: None,
            country: t.country,
            university: t.university,
            author: t.author,
            avatar: t.avatar.unwrap_or_else(|| "".into()),
            title: t.title,
            body: t.body,
            lang: t.lang,
            created_at: Utc::now(),
            reply_count: 0,
        };
        let created: Option<ForumThread> = self
            .conn
            .create("forum_thread")
            .content(row)
            .await
            .context("create_thread")?;
        created.ok_or_else(|| anyhow::anyhow!("create_thread: no row returned"))
    }

    pub async fn create_reply(&self, thread_id: &str, r: NewReply) -> Result<ForumReply> {
        let parent = parse_thing(thread_id)
            .ok_or_else(|| anyhow::anyhow!("invalid thread id"))?;

        let row = ForumReply {
            id: None,
            thread: parent.clone(),
            author: r.author,
            body: r.body,
            lang: r.lang,
            created_at: Utc::now(),
        };
        let created: Option<ForumReply> = self
            .conn
            .create("forum_reply")
            .content(row)
            .await
            .context("create_reply")?;

        // Bump parent reply count (best-effort).
        let _ = self
            .conn
            .query("UPDATE $p SET reply_count = (reply_count ?? 0) + 1")
            .bind(("p", parent))
            .await;

        created.ok_or_else(|| anyhow::anyhow!("create_reply: no row returned"))
    }

    // ───────────────────────────────────────────────── helpers ──

    async fn count(&self, table: &str) -> Result<i64> {
        let q = format!("SELECT count() FROM {table} GROUP ALL");
        let mut res = self.conn.query(q).await?;
        let counts: Vec<CountRow> = res.take(0).unwrap_or_default();
        Ok(counts.first().map(|c| c.count).unwrap_or(0))
    }
}

/// "forum_thread:abc123" → ("forum_thread", "abc123")
fn split_thing(s: &str) -> Option<(&str, &str)> {
    s.split_once(':').filter(|(a, b)| !a.is_empty() && !b.is_empty())
}

/// "forum_thread:abc123" → Thing parsed via SurrealDB's FromStr,
/// used when we need a record-link value to bind into a SurrealQL query.
fn parse_thing(s: &str) -> Option<Thing> {
    s.parse().ok()
}

#[derive(Debug, Deserialize)]
struct CountRow {
    count: i64,
}

// ─── public domain types ──────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DocumentStatus {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<Thing>,
    pub student: String,
    pub kind: String,
    pub expires_at: DateTime<Utc>,
    pub location: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ForumThread {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<Thing>,
    pub country: String,
    pub university: String,
    pub author: String,
    pub avatar: String,
    pub title: String,
    pub body: String,
    pub lang: String,
    pub created_at: DateTime<Utc>,
    pub reply_count: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ForumReply {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<Thing>,
    pub thread: Thing,
    pub author: String,
    pub body: String,
    pub lang: String,
    pub created_at: DateTime<Utc>,
}

pub struct NewThread {
    pub country: String,
    pub university: String,
    pub author: String,
    pub avatar: Option<String>,
    pub title: String,
    pub body: String,
    pub lang: String,
}

pub struct NewReply {
    pub author: String,
    pub body: String,
    pub lang: String,
}

// ─── seed helpers ─────────────────────────────────────────────────

struct SeedThread {
    country: &'static str,
    university: &'static str,
    author: &'static str,
    avatar: &'static str,
    title: &'static str,
    body: &'static str,
    lang: &'static str,
    replies: Vec<SeedReply>,
    age_min: i64,
}

struct SeedReply {
    author: &'static str,
    body: &'static str,
    lang: &'static str,
}
