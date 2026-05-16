// IAM token exchange — converts a long-lived OAuth token (or service-account
// JWT, not implemented here) into a 12h IAM bearer token, cached in memory
// and refreshed when within 5 minutes of expiry.

use std::sync::Arc;

use anyhow::{bail, Context, Result};
use chrono::{DateTime, Duration, Utc};
use serde::{Deserialize, Serialize};
use tokio::sync::RwLock;

use crate::config::YandexConfig;

const IAM_URL: &str = "https://iam.api.cloud.yandex.net/iam/v1/tokens";
const REFRESH_BUFFER_SECS: i64 = 5 * 60;

#[derive(Clone)]
pub struct IamToken {
    pub token: String,
    pub expires_at: DateTime<Utc>,
}

#[derive(Serialize)]
struct ExchangeRequest<'a> {
    #[serde(rename = "yandexPassportOauthToken")]
    yandex_passport_oauth_token: &'a str,
}

#[derive(Deserialize)]
struct ExchangeResponse {
    #[serde(rename = "iamToken")]
    iam_token: String,
    #[serde(rename = "expiresAt")]
    expires_at: DateTime<Utc>,
}

pub async fn ensure_iam_token(
    http: &reqwest::Client,
    cfg: &YandexConfig,
    cache: &Arc<RwLock<Option<IamToken>>>,
) -> Result<String> {
    // Fast path — read lock; return if still fresh.
    if let Some(tok) = cache.read().await.as_ref() {
        if tok.expires_at - Utc::now() > Duration::seconds(REFRESH_BUFFER_SECS) {
            return Ok(tok.token.clone());
        }
    }

    // Slow path — acquire write lock and refresh.
    let mut guard = cache.write().await;
    // Recheck after acquiring write lock (another task may have refreshed).
    if let Some(tok) = guard.as_ref() {
        if tok.expires_at - Utc::now() > Duration::seconds(REFRESH_BUFFER_SECS) {
            return Ok(tok.token.clone());
        }
    }

    let oauth = match &cfg.oauth_token {
        Some(t) => t,
        None => bail!("Yandex IAM exchange requires YANDEX_OAUTH_TOKEN"),
    };

    let resp: ExchangeResponse = http
        .post(IAM_URL)
        .json(&ExchangeRequest { yandex_passport_oauth_token: oauth })
        .send()
        .await
        .context("iam exchange request")?
        .error_for_status()
        .context("iam exchange status")?
        .json()
        .await
        .context("iam exchange decode")?;

    tracing::info!("yandex: refreshed IAM token, expires at {}", resp.expires_at);

    *guard = Some(IamToken {
        token: resp.iam_token.clone(),
        expires_at: resp.expires_at,
    });
    Ok(resp.iam_token)
}
