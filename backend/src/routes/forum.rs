// Forum endpoints — backed by SurrealDB `forum_thread` + `forum_reply`.
//
// Bilingual model: every post carries a `lang` ("en" / "ru" / etc.) plus
// the original `body`. Translation is on-demand via /api/forum/translate
// to avoid burning Yandex tokens for posts nobody reads.

use axum::{
    extract::{Path, State},
    Json,
};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

use crate::error::{ApiError, ApiResult};
use crate::AppState;

#[derive(Serialize)]
pub struct ThreadView {
    pub id: String,
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

#[derive(Serialize)]
pub struct ReplyView {
    pub id: String,
    pub author: String,
    pub body: String,
    pub lang: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Serialize)]
pub struct ThreadDetail {
    pub thread: ThreadView,
    pub replies: Vec<ReplyView>,
}

#[derive(Deserialize)]
pub struct CreateThreadReq {
    pub country: String,
    pub university: String,
    pub author: String,
    pub avatar: Option<String>,
    pub title: String,
    pub body: String,
    pub lang: String, // "en" | "ru" | ...
}

#[derive(Deserialize)]
pub struct CreateReplyReq {
    pub author: String,
    pub body: String,
    pub lang: String,
}

#[derive(Deserialize)]
pub struct TranslateReq {
    pub text: String,
    pub target: String,           // "ru" or "en"
    pub source: Option<String>,
}

#[derive(Serialize)]
pub struct TranslateResp {
    pub translated: String,
    pub source: &'static str,     // "yandex" | "mock"
}

// ─── handlers ─────────────────────────────────────────────────────

pub async fn list(State(state): State<AppState>) -> ApiResult<Json<Vec<ThreadView>>> {
    let rows = state.db.list_threads().await.map_err(ApiError::Internal)?;
    Ok(Json(rows.into_iter().map(thread_view).collect()))
}

pub async fn detail(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> ApiResult<Json<ThreadDetail>> {
    let thread = state.db.get_thread(&id).await.map_err(ApiError::Internal)?
        .ok_or(ApiError::NotFound)?;
    let replies = state.db.list_replies(&id).await.map_err(ApiError::Internal)?;
    Ok(Json(ThreadDetail {
        thread: thread_view(thread),
        replies: replies.into_iter().map(reply_view).collect(),
    }))
}

pub async fn create(
    State(state): State<AppState>,
    Json(req): Json<CreateThreadReq>,
) -> ApiResult<Json<ThreadView>> {
    if req.title.trim().is_empty() || req.body.trim().is_empty() {
        return Err(ApiError::BadRequest("title and body required".into()));
    }
    let created = state.db.create_thread(crate::db::NewThread {
        country: req.country,
        university: req.university,
        author: req.author,
        avatar: req.avatar,
        title: req.title,
        body: req.body,
        lang: req.lang,
    }).await.map_err(ApiError::Internal)?;
    Ok(Json(thread_view(created)))
}

pub async fn reply(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Json(req): Json<CreateReplyReq>,
) -> ApiResult<Json<ReplyView>> {
    if req.body.trim().is_empty() {
        return Err(ApiError::BadRequest("body required".into()));
    }
    let created = state.db.create_reply(&id, crate::db::NewReply {
        author: req.author,
        body: req.body,
        lang: req.lang,
    }).await.map_err(ApiError::Internal)?;
    Ok(Json(reply_view(created)))
}

/// On-demand translation for a single post body.
pub async fn translate(
    State(state): State<AppState>,
    Json(req): Json<TranslateReq>,
) -> ApiResult<Json<TranslateResp>> {
    if state.yandex.is_configured() {
        match state.yandex.translate(&req.text, &req.target, req.source.as_deref()).await {
            Ok(t) => return Ok(Json(TranslateResp { translated: t, source: "yandex" })),
            Err(e) => tracing::warn!("yandex translate failed in forum: {e:#}"),
        }
    }
    // Fall back to a passthrough with a small hint so the UI surfaces it.
    let prefix = if req.target == "ru" { "[demo] " } else { "[demo] " };
    Ok(Json(TranslateResp {
        translated: format!("{prefix}{}", req.text),
        source: "mock",
    }))
}

// ─── mappers ──────────────────────────────────────────────────────

fn thing_string(t: &Option<surrealdb::sql::Thing>) -> String {
    t.as_ref().map(|t| format!("{}:{}", t.tb, t.id)).unwrap_or_default()
}

fn thread_view(t: crate::db::ForumThread) -> ThreadView {
    ThreadView {
        id: thing_string(&t.id),
        country: t.country,
        university: t.university,
        author: t.author,
        avatar: t.avatar,
        title: t.title,
        body: t.body,
        lang: t.lang,
        created_at: t.created_at,
        reply_count: t.reply_count,
    }
}

fn reply_view(r: crate::db::ForumReply) -> ReplyView {
    ReplyView {
        id: thing_string(&r.id),
        author: r.author,
        body: r.body,
        lang: r.lang,
        created_at: r.created_at,
    }
}
