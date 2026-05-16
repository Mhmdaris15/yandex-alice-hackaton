// Buddy endpoints.
//
// Buddies are intentionally kept in-process (constant data) for the
// hackathon — only the intro-message composer round-trips through
// SurrealDB / Yandex AI. This keeps the demo working without forcing a
// new schema while still showing real AI integration.

use axum::{extract::{Path, State}, Json};
use serde::{Deserialize, Serialize};

use crate::error::{ApiError, ApiResult};
use crate::yandex::ai::Message;
use crate::AppState;

#[derive(Serialize, Clone)]
pub struct Buddy {
    pub id: &'static str,
    pub name: &'static str,
    pub country: &'static str,
    pub country_code: &'static str,
    pub university: &'static str,
    pub years_in_russia: u8,
    pub langs: Vec<&'static str>,
    pub interests: Vec<&'static str>,
    pub neighborhood: &'static str,
    pub bio: &'static str,
    pub avatar: &'static str,
    pub online: bool,
    pub telegram: &'static str,
    pub whatsapp: Option<&'static str>,
    pub match_score: f32,
}

pub fn buddies() -> Vec<Buddy> {
    vec![
        Buddy {
            id: "b1", name: "Aigerim K.", country: "Kazakhstan", country_code: "KZ",
            university: "HSE", years_in_russia: 3,
            langs: vec!["RU","KZ","EN"],
            interests: vec!["bureaucracy","notary","cooking"],
            neighborhood: "Petrogradskaya · SPb",
            bio: "Almaty → SPb 2022. Survived two migration renewals. Will walk you through your first FMS visit.",
            avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=240&q=80&auto=format&fit=crop",
            online: true,  telegram: "https://t.me/aigerim_k", whatsapp: None,
            match_score: 0.94,
        },
        Buddy {
            id: "b2", name: "Liu Wei", country: "China", country_code: "CN",
            university: "MGU", years_in_russia: 2,
            langs: vec!["RU","ZH","EN"],
            interests: vec!["banking","metro","food"],
            neighborhood: "Vasilievsky Island · SPb",
            bio: "Shanghai → SPb 2023. Knows every halal canteen near campus and which T-Bank branch processes foreigners fastest.",
            avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=240&q=80&auto=format&fit=crop",
            online: false, telegram: "https://t.me/liu_wei_spb", whatsapp: None,
            match_score: 0.81,
        },
        Buddy {
            id: "b3", name: "Hassan A.", country: "Egypt", country_code: "EG",
            university: "Bauman", years_in_russia: 4,
            langs: vec!["RU","AR","EN"],
            interests: vec!["medical","translation","mosque"],
            neighborhood: "Sportivnaya · SPb",
            bio: "Cairo → SPb 2021. Has done every medical clinic in SPb that does foreign certificates. Ask anything.",
            avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=240&q=80&auto=format&fit=crop",
            online: true,  telegram: "https://t.me/hassan_spb",  whatsapp: Some("https://wa.me/79991234567"),
            match_score: 0.77,
        },
        Buddy {
            id: "b4", name: "Sofía M.", country: "Colombia", country_code: "CO",
            university: "RUDN", years_in_russia: 1,
            langs: vec!["RU","ES","EN"],
            interests: vec!["dorm life","yandex eda","language exchange"],
            neighborhood: "Vyazemsky · SPb",
            bio: "Bogotá → SPb 2024. Latest arrival in this list — remembers exactly how confusing the first 30 days are.",
            avatar: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=240&q=80&auto=format&fit=crop",
            online: true,  telegram: "https://t.me/sofia_spb",   whatsapp: None,
            match_score: 0.69,
        },
    ]
}

pub async fn list() -> Json<Vec<Buddy>> {
    Json(buddies())
}

pub async fn get(Path(id): Path<String>) -> ApiResult<Json<Buddy>> {
    buddies()
        .into_iter()
        .find(|b| b.id == id.as_str())
        .map(Json)
        .ok_or(ApiError::NotFound)
}

#[derive(Deserialize)]
pub struct IntroRequest {
    /// What the user wants to ask / why they're reaching out
    pub topic: String,
    /// "ru" or "en" — what language the draft should be in
    pub lang: String,
    /// Optional, who the user is — gives the AI more to work with
    pub from_name: Option<String>,
    pub from_country: Option<String>,
}

#[derive(Serialize)]
pub struct IntroResponse {
    pub draft: String,
    pub source: &'static str,
}

/// Compose a friendly intro message in the requested language.
/// Uses Yandex AI Studio when configured, deterministic template otherwise.
pub async fn intro(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Json(req): Json<IntroRequest>,
) -> ApiResult<Json<IntroResponse>> {
    let buddy = buddies()
        .into_iter()
        .find(|b| b.id == id.as_str())
        .ok_or(ApiError::NotFound)?;

    if req.topic.trim().is_empty() {
        return Err(ApiError::BadRequest("topic required".into()));
    }

    // Real path.
    if state.yandex.is_configured() {
        let system = format!(
            "You draft short, warm intro messages from one international student in Saint Petersburg to another. \
             Write 2-3 sentences max, second person friendly, no emojis, no \"Dear X\". \
             The receiver is {name} ({country}, {uni}, in Russia {years} years), \
             whose strengths are: {interests}. \
             Output ONLY the message text, no preface. Write in {lang_full}.",
            name = buddy.name,
            country = buddy.country,
            uni = buddy.university,
            years = buddy.years_in_russia,
            interests = buddy.interests.join(", "),
            lang_full = if req.lang == "ru" { "Russian" } else { "English" },
        );
        let user = format!(
            "Sender: {} from {}. They want to reach out about: {}",
            req.from_name.as_deref().unwrap_or("a new student"),
            req.from_country.as_deref().unwrap_or("abroad"),
            req.topic,
        );
        match state.yandex.chat_completion(&[
            Message { role: "system".into(), text: system },
            Message { role: "user".into(),   text: user },
        ]).await {
            Ok(c) => return Ok(Json(IntroResponse { draft: c.text.trim().to_string(), source: "yandex" })),
            Err(e) => tracing::warn!("yandex intro failed, falling back: {e:#}"),
        }
    }

    // Mock path — deterministic but personalised, since the user expects to
    // see *something* good even without API keys.
    let draft = if req.lang == "ru" {
        format!(
            "Привет, {}! Меня зовут {}, я из {}, только что приехал(а) в Питер и учусь в ITMO. \
             Заметил(а), что ты разбираешься в теме «{}» — можешь подсказать, с чего начать? Заранее спасибо!",
            buddy.name,
            req.from_name.as_deref().unwrap_or("новый студент"),
            req.from_country.as_deref().unwrap_or("заграницы"),
            req.topic.trim(),
        )
    } else {
        format!(
            "Hi {}, I'm {} from {} — just arrived in Saint Petersburg and studying at ITMO. \
             I saw you've been here {} years and know about {}. Could you point me in the right direction with: {}? \
             Thanks in advance.",
            buddy.name,
            req.from_name.as_deref().unwrap_or("a new student"),
            req.from_country.as_deref().unwrap_or("abroad"),
            buddy.years_in_russia,
            buddy.interests.join(" / "),
            req.topic.trim(),
        )
    };
    Ok(Json(IntroResponse { draft, source: "mock" }))
}
