use std::env;
use std::net::SocketAddr;

#[derive(Debug, Clone)]
pub struct Config {
    pub bind_addr: SocketAddr,

    pub surreal_url: String,
    pub surreal_user: String,
    pub surreal_pass: String,
    pub surreal_ns: String,
    pub surreal_db: String,

    pub yandex: YandexConfig,
    pub telegram: TelegramConfig,
}

#[derive(Debug, Clone)]
pub struct YandexConfig {
    pub oauth_token: Option<String>,
    pub api_key: Option<String>,
    pub folder_id: Option<String>,
    pub gpt_model: String,
}

#[derive(Debug, Clone)]
pub struct TelegramConfig {
    pub bot_token: Option<String>,
    pub chat_id: Option<String>,
}

impl YandexConfig {
    /// True when we have at least one viable credential path and a folder.
    pub fn is_configured(&self) -> bool {
        self.folder_id.is_some() && (self.oauth_token.is_some() || self.api_key.is_some())
    }
}

impl Config {
    pub fn from_env() -> anyhow::Result<Self> {
        // dotenvy is best-effort — fine if no .env file exists.
        let _ = dotenvy::dotenv();

        let bind_addr: SocketAddr = env::var("BIND_ADDR")
            .unwrap_or_else(|_| "0.0.0.0:3000".to_string())
            .parse()?;

        let surreal_url  = env::var("SURREAL_URL").unwrap_or_else(|_| "http://localhost:8000".into());
        let surreal_user = env::var("SURREAL_USER").unwrap_or_else(|_| "root".into());
        let surreal_pass = env::var("SURREAL_PASS").unwrap_or_else(|_| "root".into());
        let surreal_ns   = env::var("SURREAL_NS").unwrap_or_else(|_| "rshb".into());
        let surreal_db   = env::var("SURREAL_DB").unwrap_or_else(|_| "svoe_rodnoe".into());

        let yandex = YandexConfig {
            oauth_token: opt_env("YANDEX_OAUTH_TOKEN"),
            api_key:     opt_env("YANDEX_API_KEY"),
            folder_id:   opt_env("YANDEX_FOLDER_ID"),
            gpt_model:   env::var("YANDEX_GPT_MODEL").unwrap_or_else(|_| "yandexgpt-lite/latest".into()),
        };

        let telegram = TelegramConfig {
            bot_token: opt_env("TELEGRAM_BOT_TOKEN"),
            chat_id:   opt_env("TELEGRAM_CHAT_ID"),
        };

        Ok(Self {
            bind_addr,
            surreal_url, surreal_user, surreal_pass, surreal_ns, surreal_db,
            yandex, telegram,
        })
    }
}

fn opt_env(key: &str) -> Option<String> {
    env::var(key).ok().filter(|v| !v.trim().is_empty())
}
