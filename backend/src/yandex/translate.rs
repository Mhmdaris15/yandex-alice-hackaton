// Yandex Translate API.
// https://yandex.cloud/en/docs/translate/api-ref/Translation/translate

use anyhow::{bail, Context, Result};
use serde::{Deserialize, Serialize};

use super::YandexClient;

const TRANSLATE_URL: &str = "https://translate.api.cloud.yandex.net/translate/v2/translate";

#[derive(Serialize)]
struct TranslateRequest<'a> {
    #[serde(rename = "folderId")]
    folder_id: &'a str,
    texts: Vec<&'a str>,
    #[serde(rename = "sourceLanguageCode", skip_serializing_if = "Option::is_none")]
    source_language_code: Option<&'a str>,
    #[serde(rename = "targetLanguageCode")]
    target_language_code: &'a str,
}

#[derive(Deserialize)]
struct TranslateResponse {
    translations: Vec<Translation>,
}

#[derive(Deserialize)]
struct Translation {
    text: String,
}

impl YandexClient {
    pub async fn translate(&self, text: &str, target: &str, source: Option<&str>) -> Result<String> {
        let folder = match self.folder_id() {
            Some(f) => f,
            None => bail!("YANDEX_FOLDER_ID not set"),
        };
        let (auth_k, auth_v) = self.auth_header().await?;

        let resp: TranslateResponse = self
            .http
            .post(TRANSLATE_URL)
            .header(auth_k, auth_v)
            .json(&TranslateRequest {
                folder_id: folder,
                texts: vec![text],
                source_language_code: source,
                target_language_code: target,
            })
            .send()
            .await
            .context("yandex translate send")?
            .error_for_status()
            .context("yandex translate status")?
            .json()
            .await
            .context("yandex translate decode")?;

        resp.translations.into_iter().next()
            .map(|t| t.text)
            .ok_or_else(|| anyhow::anyhow!("yandex translate: empty translations"))
    }
}
