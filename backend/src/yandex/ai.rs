// Yandex AI Studio · Foundation Models (yandexgpt / yandexgpt-lite)
// https://yandex.cloud/en/docs/foundation-models/text-generation/api-ref/v1/TextGeneration/completion

use anyhow::{bail, Context, Result};
use serde::{Deserialize, Serialize};

use super::YandexClient;

const COMPLETION_URL: &str = "https://llm.api.cloud.yandex.net/foundationModels/v1/completion";

#[derive(Debug, Clone, Serialize)]
pub struct Message {
    pub role: String,
    pub text: String,
}

#[derive(Serialize)]
struct CompletionRequest<'a> {
    #[serde(rename = "modelUri")]
    model_uri: String,
    #[serde(rename = "completionOptions")]
    completion_options: CompletionOptions,
    messages: &'a [Message],
}

#[derive(Serialize)]
struct CompletionOptions {
    stream: bool,
    temperature: f32,
    #[serde(rename = "maxTokens")]
    max_tokens: String, // Yandex wants this as a string
}

#[derive(Deserialize)]
struct CompletionResponse {
    result: CompletionResult,
}

#[derive(Deserialize)]
struct CompletionResult {
    alternatives: Vec<Alternative>,
    usage: Option<Usage>,
}

#[derive(Deserialize)]
struct Alternative {
    message: AlternativeMessage,
}

#[derive(Deserialize)]
struct AlternativeMessage {
    text: String,
}

#[derive(Deserialize)]
struct Usage {
    #[serde(rename = "totalTokens")]
    total_tokens: Option<String>,
}

pub struct ChatCompletion {
    pub text: String,
    pub tokens: u32,
}

impl YandexClient {
    pub async fn chat_completion(&self, messages: &[Message]) -> Result<ChatCompletion> {
        let folder = match self.folder_id() {
            Some(f) => f,
            None => bail!("YANDEX_FOLDER_ID not set"),
        };
        let model_uri = format!("gpt://{folder}/{}", self.config.gpt_model);

        let (auth_k, auth_v) = self.auth_header().await?;
        let resp: CompletionResponse = self
            .http
            .post(COMPLETION_URL)
            .header(auth_k, auth_v)
            .header("x-folder-id", folder)
            .json(&CompletionRequest {
                model_uri,
                completion_options: CompletionOptions {
                    stream: false,
                    temperature: 0.4,
                    max_tokens: "800".into(),
                },
                messages,
            })
            .send()
            .await
            .context("yandex ai send")?
            .error_for_status()
            .context("yandex ai status")?
            .json()
            .await
            .context("yandex ai decode")?;

        let alt = resp.result.alternatives.into_iter().next()
            .ok_or_else(|| anyhow::anyhow!("yandex ai: empty alternatives"))?;
        let tokens = resp.result.usage
            .and_then(|u| u.total_tokens)
            .and_then(|s| s.parse().ok())
            .unwrap_or_else(|| alt.message.text.split_whitespace().count() as u32);

        Ok(ChatCompletion { text: alt.message.text, tokens })
    }
}
