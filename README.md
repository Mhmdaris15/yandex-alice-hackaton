# Welcome to Russia — AI Fixer for International Students

> Yandex Alice Hackathon entry. AI-native "fixer" that manages bureaucracy, translates in real-time, and connects students with a geo-aware community.

## Structure

```
frontend/   React PWA — Vite + TS + Tailwind + Framer Motion + GSAP
backend/    Rust Axum — SurrealDB + Yandex AI Studio + Speechkit + Vision
```

## Quick start

### 1. SurrealDB (one-time)

```bash
# Start a local SurrealDB on :8000 with root/root
surreal start --user root --pass root --bind 0.0.0.0:8000 memory
```

### 2. Backend

```bash
cd backend
cp .env.example .env             # fill in Yandex keys if you have them
cargo run
```

Without Yandex keys the backend boots and every route falls back to deterministic mocks — so the demo is never broken by missing credentials.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev                      # → http://localhost:5173
```

## Environment variables (backend)

| Var | Purpose |
|---|---|
| `BIND_ADDR` | Axum bind address (default `0.0.0.0:3000`) |
| `SURREAL_URL` `SURREAL_USER` `SURREAL_PASS` | SurrealDB connection |
| `SURREAL_NS` `SURREAL_DB` | namespace + database (default `rshb` / `svoe_rodnoe`) |
| `YANDEX_OAUTH_TOKEN` | OAuth → IAM token exchange (AI Studio / Vision / Translate) |
| `YANDEX_API_KEY` | Direct Api-Key auth (Speechkit) |
| `YANDEX_FOLDER_ID` | Required for AI Studio / OCR / Translate |
| `YANDEX_GPT_MODEL` | e.g. `yandexgpt-lite/latest` |
| `TELEGRAM_BOT_TOKEN` `TELEGRAM_CHAT_ID` | Proactive expiry alerts |

See `backend/.env.example` for the full template.

## Architecture notes

- **SurrealDB** (single engine) holds the graph (`student → document_status → location`), is seed-guarded so restarts don't duplicate rows.
- **Yandex client** centralises IAM token refresh (12h tokens, refreshed at T-5min); each service (AI Studio, Vision OCR, Translate, Speechkit STT/TTS) is one module under `backend/src/yandex/`.
- **Routes** call the Yandex client when `is_configured()`; otherwise they fall back to mocks. The response body includes a `source: "yandex" | "mock"` field so the frontend can show provenance.
- **Frontend** is offline-first (vite-plugin-pwa); the dev proxy forwards `/api/*` and `/ws/*` to `:3000`.

## Hackathon features

- [x] Landing page (editorial, awwwards-grade)
- [x] Spatial Journey Timeline (GSAP draggable)
- [x] Walkie-Talkie split-screen translator
- [x] AR Document Scanner (WebRTC + bbox overlays)
- [x] Glassmorphic AI Orb (persistent contextual assistant)
- [x] Geo-aware community pulse map
- [x] Buddy matching cards
- [x] Real SurrealDB (graph + idempotent seed)
- [x] Yandex Cloud client (AI Studio, Vision OCR, Translate, Speechkit STT/TTS)
- [ ] Community forum threads (next)
- [ ] Buddy match flow + messaging (next)
- [ ] Telegram bot for proactive alerts (worker scaffolded, needs token)
