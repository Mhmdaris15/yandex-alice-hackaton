// Yandex Speechkit · Synthesis (MP3).
// https://yandex.cloud/en/docs/speechkit/tts/request

use anyhow::{bail, Context, Result};

use super::YandexClient;

const TTS_URL: &str = "https://tts.api.cloud.yandex.net/speech/v1/tts:synthesize";

impl YandexClient {
    /// Synthesize `text` to MP3 audio bytes. Defaults to a neutral Russian
    /// voice; callers can pass `voice` like "alyona", "filipp", etc.
    pub async fn tts_synthesize(&self, text: &str, lang: &str, voice: Option<&str>) -> Result<Vec<u8>> {
        let folder = match self.folder_id() {
            Some(f) => f,
            None => bail!("YANDEX_FOLDER_ID not set"),
        };

        let (auth_k, auth_v) = self.auth_header().await?;
        let voice = voice.unwrap_or("alena");

        let form = [
            ("text", text),
            ("lang", lang),
            ("voice", voice),
            ("format", "mp3"),
            ("folderId", folder),
        ];

        let bytes = self
            .http
            .post(TTS_URL)
            .header(auth_k, auth_v)
            .form(&form)
            .send()
            .await
            .context("yandex tts send")?
            .error_for_status()
            .context("yandex tts status")?
            .bytes()
            .await
            .context("yandex tts read")?;

        Ok(bytes.to_vec())
    }
}
