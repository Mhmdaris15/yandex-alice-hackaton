# Welcome to Russia — AI Fixer for International Students

> Yandex Alice Hackathon entry. AI-native "fixer" that manages bureaucracy, translates in real-time, and connects students with a geo-aware community.

## Structure

```
frontend/   React PWA — Vite + TS + Tailwind + Framer Motion + GSAP
backend/    Rust Axum — SurrealDB + Yandex AI Studio + Telegram
```

## Quick start

```bash
# Frontend
cd frontend
npm install
npm run dev

# Backend
cd backend
cargo run
```

## Hackathon features (built)

- [x] Spatial Journey Timeline (GSAP draggable)
- [x] Walkie-Talkie split-screen translator
- [x] AR Document Scanner (WebRTC + overlay)
- [x] Glassmorphic AI Orb (persistent contextual assistant)
- [ ] SurrealDB graph + vector store
- [ ] Telegram proactive alerts worker

See `PLAN.md` for the full spec.
