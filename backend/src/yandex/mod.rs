// Yandex Cloud client — IAM token refresh + per-service callers.
//
// The client is constructed once at startup with the env-loaded
// `YandexConfig`. If credentials are absent, `is_configured()` returns
// false and every route falls back to deterministic mocks so the demo
// always boots.

pub mod ai;
pub mod iam;
pub mod ocr;
pub mod stt;
pub mod translate;
pub mod tts;

use std::sync::Arc;
use tokio::sync::RwLock;

use crate::config::YandexConfig;

#[derive(Clone)]
pub struct YandexClient {
    pub http: reqwest::Client,
    pub config: YandexConfig,
    iam_cache: Arc<RwLock<Option<iam::IamToken>>>,
}

impl YandexClient {
    pub fn new(http: reqwest::Client, config: YandexConfig) -> Self {
        Self {
            http,
            config,
            iam_cache: Arc::new(RwLock::new(None)),
        }
    }

    /// True if we have a folder id + at least one credential path.
    pub fn is_configured(&self) -> bool {
        self.config.is_configured()
    }

    /// Returns a fresh-enough IAM bearer token, refreshing if near expiry.
    /// Errors if no OAuth token is configured.
    pub async fn iam_token(&self) -> anyhow::Result<String> {
        iam::ensure_iam_token(&self.http, &self.config, &self.iam_cache).await
    }

    /// Build the auth header used by every Yandex Cloud call.
    /// Prefers `Api-Key` (simpler, for Speechkit) when present, otherwise
    /// exchanges the OAuth token for a Bearer IAM token.
    pub async fn auth_header(&self) -> anyhow::Result<(String, String)> {
        if let Some(key) = &self.config.api_key {
            return Ok(("Authorization".into(), format!("Api-Key {key}")));
        }
        let token = self.iam_token().await?;
        Ok(("Authorization".into(), format!("Bearer {token}")))
    }

    pub fn folder_id(&self) -> Option<&str> {
        self.config.folder_id.as_deref()
    }
}
