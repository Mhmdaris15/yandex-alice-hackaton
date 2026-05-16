mod config;
mod db;
mod error;
mod prompts;
mod routes;
mod worker;
mod yandex;

use std::sync::Arc;

use axum::{routing::{get, post}, Router};
use tower_http::{cors::CorsLayer, trace::TraceLayer};
use tracing_subscriber::EnvFilter;

use crate::config::Config;
use crate::yandex::YandexClient;

#[derive(Clone)]
pub struct AppState {
    pub db: Arc<db::Db>,
    pub yandex: YandexClient,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let cfg = Config::from_env()?;

    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::try_from_default_env().unwrap_or_else(|_| "info,tower_http=debug".into()))
        .compact()
        .init();

    tracing::info!("starting welcome-to-russia · bind={}", cfg.bind_addr);
    if cfg.yandex.is_configured() {
        tracing::info!("yandex: configured (folder={:?})", cfg.yandex.folder_id);
    } else {
        tracing::warn!("yandex: NOT configured — routes will use mock responses");
    }

    let db = Arc::new(db::Db::connect(&cfg).await?);

    let http = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(30))
        .user_agent("welcome-to-russia/0.1")
        .build()?;
    let yandex = YandexClient::new(http, cfg.yandex.clone());

    let state = AppState { db: db.clone(), yandex: yandex.clone() };

    // Proactive expiry worker (logs to stdout; pipes to Telegram if configured).
    tokio::spawn(worker::run(db.clone(), cfg.telegram.clone()));

    let app = Router::new()
        .route("/health", get(|| async { "ok" }))
        .route("/api/ai/chat",        post(routes::ai::chat))
        .route("/api/ocr",            post(routes::ocr::analyze))
        .route("/api/community/pulse", get(routes::community::pulse))
        .route("/api/journey",         get(routes::journey::list))
        .route("/ws/translate",        get(routes::translate::ws))
        .with_state(state)
        .layer(CorsLayer::permissive())
        .layer(TraceLayer::new_for_http());

    let listener = tokio::net::TcpListener::bind(cfg.bind_addr).await?;
    tracing::info!("listening on http://{}", cfg.bind_addr);
    axum::serve(listener, app).await?;
    Ok(())
}
