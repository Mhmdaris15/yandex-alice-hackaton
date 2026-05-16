import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SectionIndex, CyrillicTag } from "@/landing/atoms";
import { buddy as buddyApi, type Buddy } from "@/lib/api";
import { ForumPanel } from "./ForumPanel";
import { BuddyProfileModal } from "./BuddyProfileModal";

interface Pulse {
  id: string;
  lat: number;
  lon: number;
  kind: "queue" | "tip" | "warning";
  message: string;
  ageMin: number;
}

const PULSES: Pulse[] = [
  { id: "p1", lat: 0.34, lon: 0.22, kind: "queue",   message: "MFTs Krasnogvardeysky — 3h queue right now", ageMin: 12 },
  { id: "p2", lat: 0.58, lon: 0.46, kind: "tip",     message: "Clinic on Nevsky speaks English",            ageMin: 90 },
  { id: "p3", lat: 0.72, lon: 0.71, kind: "warning", message: "Yandex Taxi surge after 23:00 in Petrogradka", ageMin: 30 },
  { id: "p4", lat: 0.18, lon: 0.62, kind: "tip",     message: "Cheap sim activation at Yota kiosk · Pioneerskaya", ageMin: 220 },
  { id: "p5", lat: 0.45, lon: 0.32, kind: "queue",   message: "T-Bank Vasileostrovskaya — short queue, 12 min", ageMin: 4 },
];

const FALLBACK_BUDDIES: Buddy[] = [
  { id: "b1", name: "Aigerim K.", country: "Kazakhstan", country_code: "KZ", university: "HSE", years_in_russia: 3, langs: ["RU","KZ","EN"], interests: ["bureaucracy","notary","cooking"], neighborhood: "Petrogradskaya · SPb", bio: "Almaty → SPb 2022. Survived two migration renewals. Will walk you through your first FMS visit.", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=240", online: true, telegram: "https://t.me/aigerim_k", match_score: 0.94 },
  { id: "b2", name: "Liu Wei",    country: "China",      country_code: "CN", university: "MGU", years_in_russia: 2, langs: ["RU","ZH","EN"], interests: ["banking","metro","food"], neighborhood: "Vasilievsky Island · SPb", bio: "Shanghai → SPb 2023.", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=240", online: false, telegram: "https://t.me/liu_wei_spb", match_score: 0.81 },
  { id: "b3", name: "Hassan A.",  country: "Egypt",      country_code: "EG", university: "Bauman", years_in_russia: 4, langs: ["RU","AR","EN"], interests: ["medical","translation","mosque"], neighborhood: "Sportivnaya · SPb", bio: "Cairo → SPb 2021.", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=240", online: true, telegram: "https://t.me/hassan_spb", whatsapp: "https://wa.me/79991234567", match_score: 0.77 },
  { id: "b4", name: "Sofía M.",   country: "Colombia",   country_code: "CO", university: "RUDN", years_in_russia: 1, langs: ["RU","ES","EN"], interests: ["dorm life","yandex eda","language exchange"], neighborhood: "Vyazemsky · SPb", bio: "Bogotá → SPb 2024.", avatar: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=240", online: true, telegram: "https://t.me/sofia_spb", match_score: 0.69 },
];

const KIND_COLOR: Record<Pulse["kind"], string> = {
  queue:   "#fbbf24",
  tip:     "#22d3ee",
  warning: "#d63b2c"
};

type Tab = "map" | "forum" | "buddy";

const TABS: { id: Tab; label: string; n: string }[] = [
  { id: "map",   label: "Live Map",    n: "01" },
  { id: "forum", label: "Letters Wall", n: "02" },
  { id: "buddy", label: "Buddy Match", n: "03" },
];

export function Community() {
  const [selected, setSelected] = useState<Pulse | null>(null);
  const [tab, setTab] = useState<Tab>("map");

  return (
    <section className="relative">
      <Watermark>ПУЛЬС</Watermark>

      <header className="relative z-10">
        <SectionIndex n="04" label="file · community · live pulse" />
        <h1 className="mt-6 display-grotesk text-cream text-[clamp(2.5rem,8vw,5.5rem)]">
          Locals saw it <em className="display-italic text-cinnabar">first.</em>
        </h1>
        <p className="mt-5 max-w-xl font-serif italic text-cream/65 text-base sm:text-lg leading-relaxed">
          Real-time tips, queue lengths, and warnings dropped by senior
          students on the ground. Open a letter on the wall, or get matched
          with a buddy who's been here longer than you.
        </p>
        <div className="mt-4">
          <CyrillicTag>свои · подскажут · своим</CyrillicTag>
        </div>
      </header>

      <div className="relative z-10 mt-8 inline-flex border border-cream/15 bg-cream/[0.02] backdrop-blur-md rounded-full p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`relative px-5 py-2 small-caps text-[10px] rounded-full transition ${
              tab === t.id ? "text-cream" : "text-cream/40 hover:text-cream/80"
            }`}
          >
            {tab === t.id && (
              <motion.span
                layoutId="comm-tab"
                className="absolute inset-0 rounded-full bg-cinnabar"
                transition={{ type: "spring", stiffness: 360, damping: 30 }}
              />
            )}
            <span className="relative flex items-center gap-2">
              <span className="font-mono opacity-65">{t.n}</span>
              {t.label}
            </span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === "map" && (
          <motion.div
            key="map"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="relative z-10 mt-6 grid lg:grid-cols-[1.6fr,1fr] gap-6"
          >
            <MapPanel pulses={PULSES} selected={selected} onSelect={setSelected} />
            <PulseList pulses={PULSES} selected={selected} onSelect={setSelected} />
          </motion.div>
        )}
        {tab === "forum" && (
          <motion.div
            key="forum"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="relative z-10 mt-6"
          >
            <ForumPanel />
          </motion.div>
        )}
        {tab === "buddy" && (
          <motion.div
            key="buddy"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="relative z-10 mt-6"
          >
            <BuddyMatch />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function Watermark({ children }: { children: string }) {
  return (
    <div className="absolute -top-10 inset-x-0 flex justify-center pointer-events-none -z-0">
      <span className="display-grotesk text-cream/[0.045] text-[22vw] leading-none whitespace-nowrap">
        {children}
      </span>
    </div>
  );
}

// ─── Map ─────────────────────────────────────────────────────────

function MapPanel({
  pulses, selected, onSelect
}: { pulses: Pulse[]; selected: Pulse | null; onSelect: (p: Pulse | null) => void }) {
  return (
    <div className="relative aspect-[4/3] rounded-3xl overflow-hidden border border-cream/12 bg-cream/[0.02]">
      <svg viewBox="0 0 100 75" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="mapGlow" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#1a1d4a" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#0c0a14" stopOpacity="0" />
          </radialGradient>
          <pattern id="grid" width="6" height="6" patternUnits="userSpaceOnUse">
            <path d="M 6 0 L 0 0 0 6" fill="none" stroke="rgba(244,235,217,0.05)" strokeWidth="0.2" />
          </pattern>
        </defs>
        <rect width="100" height="75" fill="url(#mapGlow)" />
        <rect width="100" height="75" fill="url(#grid)" />

        <ellipse cx="50" cy="37" rx="34" ry="26" fill="none" stroke="rgba(244,235,217,0.10)" strokeWidth="0.4" />
        <ellipse cx="50" cy="37" rx="22" ry="17" fill="none" stroke="rgba(244,235,217,0.13)" strokeWidth="0.4" />
        <ellipse cx="50" cy="37" rx="12" ry="9"  fill="none" stroke="rgba(244,235,217,0.18)" strokeWidth="0.4" />

        {[0,45,90,135,180,225,270,315].map((deg) => {
          const rad = (deg * Math.PI) / 180;
          return (
            <line key={deg}
                  x1={50} y1={37}
                  x2={50 + Math.cos(rad) * 36}
                  y2={37 + Math.sin(rad) * 28}
                  stroke="rgba(244,235,217,0.05)" strokeWidth="0.3" />
          );
        })}

        {pulses.map((p) => (
          <g key={p.id}
             transform={`translate(${p.lat * 100}, ${p.lon * 75})`}
             className="cursor-pointer"
             onClick={() => onSelect(p)}>
            <circle r="3.5" fill={KIND_COLOR[p.kind]} opacity="0.18">
              <animate attributeName="r" values="3;6;3" dur="2.6s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.18;0;0.18" dur="2.6s" repeatCount="indefinite" />
            </circle>
            <circle r="1.4" fill={KIND_COLOR[p.kind]} />
            {selected?.id === p.id && (
              <circle r="2.6" fill="none" stroke={KIND_COLOR[p.kind]} strokeWidth="0.4" />
            )}
          </g>
        ))}
      </svg>

      <div className="absolute top-3 left-3 flex gap-2 small-caps text-[9px]">
        <Legend swatch="#fbbf24" label="queue" />
        <Legend swatch="#22d3ee" label="tip" />
        <Legend swatch="#d63b2c" label="warn" />
      </div>

      <div className="absolute top-3 right-3 small-caps text-[9px] text-cream/45 font-mono">
        SAINT PETERSBURG · 59.94°N
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 8, opacity: 0 }}
            className="absolute left-4 right-4 bottom-4 border border-cream/15 bg-ink/80 backdrop-blur-md rounded-2xl p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 small-caps text-[10px] text-cream/45">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: KIND_COLOR[selected.kind] }} />
                  <span>{selected.kind}</span>
                  <span className="text-cream/25">·</span>
                  <span className="font-mono">{selected.ageMin}m ago</span>
                </div>
                <div className="mt-1.5 font-serif text-cream text-base">{selected.message}</div>
              </div>
              <button
                onClick={() => onSelect(null)}
                className="text-cream/45 hover:text-cream text-xs"
              >✕</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="px-2 py-1 rounded-full bg-ink/60 border border-cream/15 flex items-center gap-1.5 text-cream/65 backdrop-blur-md">
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: swatch }} />
      {label}
    </span>
  );
}

function PulseList({
  pulses, selected, onSelect
}: { pulses: Pulse[]; selected: Pulse | null; onSelect: (p: Pulse | null) => void }) {
  return (
    <div className="border border-cream/12 bg-cream/[0.02] rounded-3xl p-5 flex flex-col">
      <div className="flex items-center gap-3">
        <span className="font-mono text-[10px] text-cinnabar tracking-[0.22em]">LIVE</span>
        <span className="h-px flex-1 bg-cream/15" />
        <span className="font-mono text-[10px] text-cream/40">{pulses.length} pings</span>
      </div>

      <div className="mt-3 flex flex-col divide-y divide-cream/8">
        {pulses.map((p) => (
          <button
            key={p.id}
            onClick={() => onSelect(p)}
            className={`text-left py-3 group flex items-start gap-3 transition ${
              selected?.id === p.id ? "" : "opacity-85 hover:opacity-100"
            }`}
          >
            <span
              className="mt-1.5 w-2 h-2 rounded-full shrink-0"
              style={{ background: KIND_COLOR[p.kind], boxShadow: `0 0 14px ${KIND_COLOR[p.kind]}` }}
            />
            <div className="min-w-0">
              <div className="font-serif text-cream/90 text-[15px] leading-snug">{p.message}</div>
              <div className="mt-1 small-caps text-[9px] text-cream/40 font-mono">
                {p.kind} · {p.ageMin}m ago
              </div>
            </div>
          </button>
        ))}
      </div>

      <button className="mt-4 px-5 py-2.5 rounded-full bg-cinnabar text-cream text-sm font-display font-semibold tracking-wide hover:brightness-110 transition">
        Drop a pulse →
      </button>
    </div>
  );
}

// ─── Buddy ───────────────────────────────────────────────────────

function BuddyMatch() {
  const [buddies, setBuddies] = useState<Buddy[]>(FALLBACK_BUDDIES);
  const [active, setActive] = useState<Buddy | null>(null);

  useEffect(() => {
    buddyApi.list().then(setBuddies).catch(() => setBuddies(FALLBACK_BUDDIES));
  }, []);

  const sorted = useMemo(
    () => [...buddies].sort((a, b) => b.match_score - a.match_score),
    [buddies]
  );

  return (
    <>
      <div className="grid sm:grid-cols-2 gap-4">
        {sorted.map((b, i) => (
          <BuddyCard key={b.id} buddy={b} index={i} onOpen={() => setActive(b)} />
        ))}
      </div>
      <BuddyProfileModal
        buddy={active}
        open={!!active}
        onClose={() => setActive(null)}
      />
    </>
  );
}

function BuddyCard({
  buddy, index, onOpen
}: { buddy: Buddy; index: number; onOpen: () => void }) {
  const pct = Math.round(buddy.match_score * 100);
  return (
    <motion.button
      layoutId={`buddy-${buddy.id}`}
      onClick={onOpen}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="relative text-left border border-cream/12 bg-cream/[0.025] rounded-3xl p-5 overflow-hidden backdrop-blur-md group hover:bg-cream/[0.05] transition"
    >
      <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-cinnabar/12 blur-3xl pointer-events-none" />

      <div className="flex items-baseline gap-3">
        <span className="font-mono text-[10px] text-cinnabar tracking-[0.22em]">
          MATCH 0{index + 1}
        </span>
        <span className="h-px flex-1 bg-cream/15" />
        <MatchRing pct={pct} />
      </div>

      <div className="mt-4 flex items-center gap-3">
        <div className="relative w-12 h-12 rounded-2xl bg-cream text-ink grid place-items-center font-display font-bold overflow-hidden">
          <img
            src={buddy.avatar}
            alt={buddy.name}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
          <span className="relative">{buddy.name.split(/\s+/).slice(0,2).map(w => w[0]).join("")}</span>
          {buddy.online && (
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-ink" />
          )}
        </div>
        <div>
          <div className="font-display font-semibold text-cream text-lg leading-tight">{buddy.name}</div>
          <div className="font-serif italic text-cream/55 text-xs mt-0.5">
            {buddy.country} · {buddy.university} · year {buddy.years_in_russia + 1}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {buddy.langs.map((l) => (
          <span key={l} className="font-mono text-[10px] tracking-wider px-2 py-0.5 rounded-md bg-cream/5 border border-cream/15 text-cream/70">
            {l}
          </span>
        ))}
      </div>

      <p className="mt-3 font-serif italic text-cream/55 text-sm leading-relaxed line-clamp-2">
        {buddy.bio}
      </p>

      <div className="mt-4 flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-cream/45 group-hover:text-cinnabar transition">
        <span>open profile</span>
        <span className="transition-transform group-hover:translate-x-1">→</span>
      </div>
    </motion.button>
  );
}

function MatchRing({ pct }: { pct: number }) {
  const C = 2 * Math.PI * 18;
  const dash = (pct / 100) * C;
  return (
    <div className="relative w-12 h-12">
      <svg viewBox="0 0 44 44" className="w-full h-full -rotate-90">
        <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(244,235,217,0.10)" strokeWidth="3" />
        <motion.circle
          cx="22" cy="22" r="18" fill="none"
          stroke="#d63b2c"
          strokeWidth="3"
          strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${C}` }}
          animate={{ strokeDasharray: `${dash} ${C}` }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center font-mono text-[11px] text-cream">
        {pct}<span className="text-cream/40">%</span>
      </div>
    </div>
  );
}
