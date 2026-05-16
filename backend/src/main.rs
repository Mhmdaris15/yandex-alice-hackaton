mod db;
mod error;
mod prompts;
mod routes;
mod worker;

use axum::{routing::{get, post}, Router};
use std::net::SocketAddr;
use std::sync::Arc;
use tower_http::{cors::CorsLayer, trace::TraceLayer};
use tracing_subscriber::EnvFilter;

#[derive(Clone)]
pub struct AppState {
    pub db: Arc<db::Db>,
    pub http: reqwest::Client,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::try_from_default_env().unwrap_or_else(|_| "info,tower_http=debug".into()))
        .compact()
        .init();

    let db = Arc::new(db::Db::connect().await?);
    let http = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(20))
        .build()?;
    let state = AppState { db: db.clone(), http };

    // Fire-and-forget background worker (proactive Telegram alerts).
    tokio::spawn(worker::run(db.clone()));

    let app = Router::new()
        .route("/health", get(|| async { "ok" }))
        .route("/api/ai/chat", post(routes::ai::chat))
        .route("/api/ocr", post(routes::ocr::analyze))
        .route("/api/community/pulse", get(routes::community::pulse))
        .route("/api/journey", get(routes::journey::list))
        .route("/ws/translate", get(routes::translate::ws))
        .with_state(state)
        .layer(CorsLayer::permissive())
        .layer(TraceLayer::new_for_http());

    let addr: SocketAddr = "0.0.0.0:3000".parse()?;
    tracing::info!("welcome-to-russia listening on http://{addr}");
    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;
    Ok(())
}
