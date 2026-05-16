// Yandex Speechkit · Short-audio Synchronous STT.
// https://yandex.cloud/en/docs/speechkit/stt/request

use anyhow::{bail, Context, Result};
use serde::Deserialize;

use super::YandexClient;

const STT_URL: &str = "https://stt.api.cloud.yandex.net/speech/v1/stt:recognize";

#[derive(Deserialize)]
struct SttResponse {
    result: String,
}

impl YandexClient {
    /// Recognize a short audio clip (≤1 MB, ≤30 s). `audio` is raw bytes
    /// in OGG Opus or LPCM.
    pub async fn stt_recognize(&self, audio: Vec<u8>, lang: &str) -> Result<String> {
        let folder = match self.folder_id() {
            Some(f) => f,
            None => bail!("YANDEX_FOLDER_ID not set"),
        };

        let (auth_k, auth_v) = self.auth_header().await?;

        let resp: SttResponse = self
            .http
            .post(STT_URL)
            .header(auth_k, auth_v)
            .header("content-type", "application/ogg")
            .query(&[("folderId", folder), ("lang", lang)])
            .body(audio)
            .send()
            .await
            .context("yandex stt send")?
            .error_for_status()
            .context("yandex stt status")?
            .json()
            .await
            .context("yandex stt decode")?;

        Ok(resp.result)
    }
}
