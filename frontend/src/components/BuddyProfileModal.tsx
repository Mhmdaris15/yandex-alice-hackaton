import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { buddy as buddyApi, type Buddy } from "@/lib/api";

const FLAGS: Record<string, string> = {
  KZ: "🇰🇿", CN: "🇨🇳", EG: "🇪🇬", CO: "🇨🇴",
  ID: "🇮🇩", RU: "🇷🇺", NG: "🇳🇬"
};

export function BuddyProfileModal({
  buddy,
  open,
  onClose
}: {
  buddy: Buddy | null;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && buddy && <BuddyContent buddy={buddy} onClose={onClose} />}
    </AnimatePresence>
  );
}

function BuddyContent({ buddy, onClose }: { buddy: Buddy; onClose: () => void }) {
  const [lang, setLang] = useState<"ru" | "en">("ru");
  const [topic, setTopic] = useState("");
  const [draft, setDraft] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [provenance, setProvenance] = useState<"yandex" | "mock" | null>(null);
  const pct = Math.round(buddy.match_score * 100);

  async function generate() {
    if (!topic.trim() || busy) return;
    setBusy(true);
    try {
      const r = await buddyApi.intro(buddy.id, {
        topic, lang,
        from_name: "Aris",
        from_country: "Indonesia",
      });
      setDraft(r.draft);
      setProvenance(r.source);
    } catch {
      const fallback = lang === "ru"
        ? `Привет, ${buddy.name}! Меня зовут Aris, я из Индонезии, учусь в ITMO. Можешь подсказать насчёт «${topic}»? Заранее спасибо!`
        : `Hi ${buddy.name}, I'm Aris from Indonesia studying at ITMO. Could you help me with: ${topic}? Thanks in advance.`;
      setDraft(fallback);
      setProvenance("mock");
    } finally {
      setBusy(false);
    }
  }

  function tgDeepLink() {
    const text = encodeURIComponent(draft || `Hi ${buddy.name}, found you via Welcome to Russia.`);
    // If buddy.telegram is "https://t.me/handle", best we can do client-side
    // is open the chat; Telegram doesn't accept prefilled message via t.me.
    // Copy the draft first so the user can paste.
    navigator.clipboard?.writeText(decodeURIComponent(text)).catch(() => {});
    window.open(buddy.telegram, "_blank", "noreferrer");
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 grid place-items-center p-4 sm:p-8"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <motion.div
        className="absolute inset-0 bg-ink/80 backdrop-blur-md"
        onClick={onClose}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      />
      <motion.div
        layoutId={`buddy-${buddy.id}`}
        initial={{ y: 40, opacity: 0, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 20, opacity: 0, scale: 0.98 }}
        transition={{ type: "spring", stiffness: 280, damping: 30 }}
        className="relative w-full max-w-3xl border border-cream/15 bg-ink/95 backdrop-blur-2xl rounded-3xl overflow-hidden shadow-deep"
      >
        <div className="absolute -top-32 -right-32 w-72 h-72 rounded-full bg-cinnabar/20 blur-3xl pointer-events-none" />

        {/* Header bar */}
        <div className="px-6 sm:px-8 pt-6 flex items-center justify-between">
          <div className="flex items-center gap-3 small-caps text-[10px] text-cream/45">
            <span className="font-mono text-cinnabar">MATCH · {pct}%</span>
            <span className="text-cream/25">/</span>
            <span>Verified senior buddy</span>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-cream/5 border border-cream/15 grid place-items-center text-cream/55 hover:bg-cream hover:text-ink transition"
          >✕</button>
        </div>

        {/* Identity block */}
        <div className="px-6 sm:px-8 pt-6 grid sm:grid-cols-[160px,1fr] gap-6 items-start">
          <div className="relative">
            <div className="aspect-[3/4] rounded-2xl overflow-hidden border border-cream/12 bg-ink">
              <img
                src={buddy.avatar}
                alt={buddy.name}
                loading="lazy"
                className="w-full h-full object-cover grayscale-[0.1]"
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = `https://picsum.photos/seed/${buddy.id}/240/320`; }}
              />
            </div>
            <div className="mt-2 font-mono text-[9px] tracking-[0.18em] text-cream/40 uppercase text-center">
              year {buddy.years_in_russia + 1} · {buddy.online ? "online" : "offline"}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xl">{FLAGS[buddy.country_code] ?? "🌐"}</span>
              <span className="font-mono text-[10px] text-cream/55 tracking-[0.22em] uppercase">
                {buddy.country} · {buddy.university}
              </span>
            </div>
            <h2 className="mt-1 display-grotesk text-cream text-3xl sm:text-4xl leading-tight">
              {buddy.name}
            </h2>
            <div className="mt-1 small-caps text-[10px] text-cream/45">{buddy.neighborhood}</div>
            <p className="mt-3 font-serif italic text-cream/75 leading-relaxed text-sm sm:text-base">
              {buddy.bio}
            </p>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {buddy.langs.map((l) => (
                <span key={l} className="font-mono text-[10px] tracking-wider px-2 py-0.5 rounded-md bg-cream/5 border border-cream/15 text-cream/70">
                  {l}
                </span>
              ))}
              {buddy.interests.map((tag) => (
                <span key={tag} className="font-mono text-[10px] tracking-wider px-2 py-0.5 rounded-md bg-cinnabar/15 border border-cinnabar/35 text-cinnabar uppercase">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Intro composer */}
        <div className="px-6 sm:px-8 mt-7 pt-6 border-t border-cream/10">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] text-cinnabar tracking-[0.22em]">DRAFT · INTRO</span>
            <span className="h-px flex-1 bg-cream/15" />
            <div className="inline-flex rounded-full border border-cream/15 p-0.5">
              {(["ru", "en"] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-3 py-1 rounded-full small-caps text-[10px] transition ${
                    lang === l ? "bg-cinnabar text-cream" : "text-cream/55 hover:text-cream"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <p className="mt-2 font-serif italic text-cream/55 text-sm">
            Tell Alice what you want to ask — she'll draft an intro for you in {lang === "ru" ? "Russian" : "English"}.
          </p>

          <div className="mt-3 flex gap-2">
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") generate(); }}
              placeholder='e.g. "registering my migration card"'
              className="flex-1 bg-cream/5 border border-cream/15 rounded-full px-5 py-2.5 text-sm text-cream placeholder:text-cream/30 focus:outline-none focus:ring-2 focus:ring-cinnabar/50 focus:border-cinnabar/40"
            />
            <button
              onClick={generate}
              disabled={busy || !topic.trim()}
              className="px-5 py-2.5 rounded-full bg-cinnabar text-cream text-sm font-display font-semibold tracking-wide disabled:opacity-40 hover:brightness-110 transition"
            >
              {busy ? "Drafting…" : "Draft →"}
            </button>
          </div>

          {draft && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 rounded-2xl border border-cinnabar/30 bg-cinnabar/[0.04] p-4"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="font-mono text-[9px] text-cinnabar tracking-[0.22em]">YOUR MESSAGE</span>
                <span className="h-px flex-1 bg-cream/10" />
                {provenance && (
                  <span className="font-mono text-[9px] text-cream/40 tracking-[0.18em] uppercase">
                    via {provenance}
                  </span>
                )}
              </div>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={4}
                className="w-full bg-transparent text-cream/90 font-serif text-[15px] leading-relaxed focus:outline-none resize-none"
              />
            </motion.div>
          )}
        </div>

        {/* Action footer */}
        <div className="px-6 sm:px-8 mt-6 pb-6 flex flex-wrap gap-2">
          <button
            onClick={tgDeepLink}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-cream text-ink text-sm font-display font-semibold tracking-wide hover:brightness-95 transition"
          >
            <span>Open Telegram</span>
            <span>→</span>
          </button>
          {buddy.whatsapp && (
            <a
              href={buddy.whatsapp}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-cream/20 text-cream/85 text-sm font-display font-semibold tracking-wide hover:bg-cream/5 transition"
            >
              WhatsApp
            </a>
          )}
          <span className="ml-auto self-center font-serif italic text-cream/40 text-xs">
            {draft ? "draft copied — paste it in chat." : "draft an intro first."}
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}
