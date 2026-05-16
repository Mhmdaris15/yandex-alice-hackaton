import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Pulse {
  id: string;
  lat: number;  // 0..1 normalized canvas coords
  lon: number;
  kind: "queue" | "tip" | "warning";
  message: string;
  ageMin: number;
}

interface Buddy {
  id: string;
  name: string;
  country: string;
  university: string;
  yearsInRussia: number;
  langs: string[];
  match: number; // 0..1
  online: boolean;
  avatarSeed: string;
}

const PULSES: Pulse[] = [
  { id: "p1", lat: 0.34, lon: 0.22, kind: "queue",   message: "MFTs Sokol — 3h queue right now", ageMin: 12 },
  { id: "p2", lat: 0.58, lon: 0.46, kind: "tip",     message: "Clinic on Tverskaya speaks English", ageMin: 90 },
  { id: "p3", lat: 0.72, lon: 0.71, kind: "warning", message: "Yandex Taxi surge after 23:00", ageMin: 30 },
  { id: "p4", lat: 0.18, lon: 0.62, kind: "tip",     message: "Cheap sim activation at Yota kiosk", ageMin: 220 },
  { id: "p5", lat: 0.45, lon: 0.32, kind: "queue",   message: "Bank Sber — short queue, 12 min", ageMin: 4 },
];

const BUDDIES: Buddy[] = [
  { id: "b1", name: "Aigerim K.",  country: "Kazakhstan",  university: "HSE",     yearsInRussia: 3, langs: ["RU","KZ","EN"], match: 0.94, online: true,  avatarSeed: "AK" },
  { id: "b2", name: "Liu Wei",     country: "China",       university: "MGU",     yearsInRussia: 2, langs: ["RU","ZH","EN"], match: 0.81, online: false, avatarSeed: "LW" },
  { id: "b3", name: "Hassan A.",   country: "Egypt",       university: "Bauman",  yearsInRussia: 4, langs: ["RU","AR","EN"], match: 0.77, online: true,  avatarSeed: "HA" },
  { id: "b4", name: "Sofía M.",    country: "Colombia",    university: "RUDN",    yearsInRussia: 1, langs: ["RU","ES","EN"], match: 0.69, online: true,  avatarSeed: "SM" },
];

const KIND_COLOR: Record<Pulse["kind"], string> = {
  queue:   "#fbbf24",
  tip:     "#22d3ee",
  warning: "#f43f5e"
};

export function Community() {
  const [selected, setSelected] = useState<Pulse | null>(null);
  const [tab, setTab] = useState<"map" | "buddy">("map");

  return (
    <section className="relative">
      <header>
        <div className="text-[11px] uppercase tracking-[0.25em] text-white/40">Community · Pulse</div>
        <h1 className="mt-1 font-display text-3xl sm:text-5xl font-bold text-gradient">
          Locals saw it first.
        </h1>
        <p className="mt-2 text-white/55 max-w-xl text-sm">
          Real-time tips, queue lengths, and warnings dropped by senior
          students on the ground. Or get matched with a buddy from your
          country who's been there.
        </p>
      </header>

      <div className="mt-6 inline-flex glass-strong rounded-full p-1">
        {(["map","buddy"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`relative px-5 py-2 text-xs uppercase tracking-[0.2em] rounded-full transition ${
              tab === t ? "text-white" : "text-white/40 hover:text-white/80"
            }`}
          >
            {tab === t && (
              <motion.span
                layoutId="comm-tab"
                className="absolute inset-0 rounded-full bg-white/10 ring-aurora"
              />
            )}
            <span className="relative">{t === "map" ? "Live Map" : "Buddy Match"}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === "map" ? (
          <motion.div
            key="map"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mt-6 grid lg:grid-cols-[1.6fr,1fr] gap-6"
          >
            <MapPanel pulses={PULSES} selected={selected} onSelect={setSelected} />
            <PulseList pulses={PULSES} selected={selected} onSelect={setSelected} />
          </motion.div>
        ) : (
          <motion.div
            key="buddy"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mt-6"
          >
            <BuddyMatch buddies={BUDDIES} />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function MapPanel({
  pulses, selected, onSelect
}: { pulses: Pulse[]; selected: Pulse | null; onSelect: (p: Pulse) => void }) {
  // Stylized Moscow — abstracted, not literal.
  return (
    <div className="relative aspect-[4/3] rounded-3xl overflow-hidden glass-strong">
      <svg viewBox="0 0 100 75" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="mapGlow" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#1a1d4a" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#06081a" stopOpacity="0" />
          </radialGradient>
          <pattern id="grid" width="6" height="6" patternUnits="userSpaceOnUse">
            <path d="M 6 0 L 0 0 0 6" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.2" />
          </pattern>
        </defs>
        <rect width="100" height="75" fill="url(#mapGlow)" />
        <rect width="100" height="75" fill="url(#grid)" />

        {/* Moscow ring road silhouette (abstracted) */}
        <ellipse cx="50" cy="37" rx="34" ry="26" fill="none" stroke="rgba(244,235,217,0.08)" strokeWidth="0.4" />
        <ellipse cx="50" cy="37" rx="22" ry="17" fill="none" stroke="rgba(244,235,217,0.10)" strokeWidth="0.4" />
        <ellipse cx="50" cy="37" rx="12" ry="9"  fill="none" stroke="rgba(244,235,217,0.14)" strokeWidth="0.4" />

        {/* Radial avenues */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
          const rad = (deg * Math.PI) / 180;
          return (
            <line
              key={deg}
              x1={50} y1={37}
              x2={50 + Math.cos(rad) * 36}
              y2={37 + Math.sin(rad) * 28}
              stroke="rgba(244,235,217,0.05)"
              strokeWidth="0.3"
            />
          );
        })}

        {/* Pulses */}
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

      <div className="absolute top-3 left-3 flex gap-2 text-[10px] uppercase tracking-[0.2em]">
        <Legend swatch="#fbbf24" label="queue" />
        <Legend swatch="#22d3ee" label="tip" />
        <Legend swatch="#f43f5e" label="warn" />
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 8, opacity: 0 }}
            className="absolute left-4 right-4 bottom-4 glass-strong rounded-2xl p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-[0.22em] text-white/40">
                  {selected.kind} · {selected.ageMin}m ago
                </div>
                <div className="mt-1 text-sm">{selected.message}</div>
              </div>
              <button
                onClick={() => onSelect(null as any)}
                className="text-white/40 hover:text-white text-xs"
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
    <span className="glass px-2 py-1 rounded-full flex items-center gap-1.5 text-white/60">
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: swatch }} />
      {label}
    </span>
  );
}

function PulseList({
  pulses, selected, onSelect
}: { pulses: Pulse[]; selected: Pulse | null; onSelect: (p: Pulse) => void }) {
  return (
    <div className="glass-strong rounded-3xl p-5 flex flex-col">
      <div className="text-[10px] uppercase tracking-[0.25em] text-white/40">Live feed</div>
      <div className="mt-3 flex flex-col divide-y divide-white/5">
        {pulses.map((p) => (
          <button
            key={p.id}
            onClick={() => onSelect(p)}
            className={`text-left py-3 group flex items-start gap-3 transition ${
              selected?.id === p.id ? "" : "opacity-80 hover:opacity-100"
            }`}
          >
            <span
              className="mt-1 w-2 h-2 rounded-full shrink-0"
              style={{ background: KIND_COLOR[p.kind], boxShadow: `0 0 12px ${KIND_COLOR[p.kind]}` }}
            />
            <div className="min-w-0">
              <div className="text-sm text-white/85 leading-snug">{p.message}</div>
              <div className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-white/35">
                {p.kind} · {p.ageMin}m ago
              </div>
            </div>
          </button>
        ))}
      </div>
      <button className="mt-4 text-xs px-4 py-2.5 rounded-xl bg-gradient-to-r from-aurora-violet to-aurora-cyan font-medium shadow-glow">
        Drop a pulse →
      </button>
    </div>
  );
}

function BuddyMatch({ buddies }: { buddies: Buddy[] }) {
  const sorted = useMemo(() => [...buddies].sort((a,b) => b.match - a.match), [buddies]);
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {sorted.map((b, i) => <BuddyCard key={b.id} buddy={b} index={i} />)}
    </div>
  );
}

function BuddyCard({ buddy, index }: { buddy: Buddy; index: number }) {
  const pct = Math.round(buddy.match * 100);
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="relative glass-strong rounded-3xl p-5 overflow-hidden"
    >
      <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-aurora-violet/20 blur-3xl pointer-events-none" />

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-aurora-violet to-aurora-cyan grid place-items-center font-display font-bold shadow-glow">
            {buddy.avatarSeed}
            {buddy.online && (
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-bg-deep" />
            )}
          </div>
          <div>
            <div className="font-display font-semibold leading-tight">{buddy.name}</div>
            <div className="text-[11px] text-white/50 mt-0.5">
              {buddy.country} · {buddy.university} · year {buddy.yearsInRussia + 1}
            </div>
          </div>
        </div>
        <MatchRing pct={pct} />
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {buddy.langs.map((l) => (
          <span key={l} className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-white/70">
            {l}
          </span>
        ))}
      </div>

      <p className="mt-3 text-xs text-white/55 leading-relaxed">
        Matched on country origin, university overlap, and arrival cohort.
        Senior students verified by their international office.
      </p>

      <div className="mt-4 flex gap-2">
        <button className="flex-1 px-3 py-2 rounded-xl bg-gradient-to-r from-aurora-violet to-aurora-cyan text-sm font-medium shadow-glow">
          Telegram →
        </button>
        <button className="px-3 py-2 rounded-xl glass text-sm">WhatsApp</button>
      </div>
    </motion.div>
  );
}

function MatchRing({ pct }: { pct: number }) {
  const C = 2 * Math.PI * 18;
  const dash = (pct / 100) * C;
  return (
    <div className="relative w-14 h-14">
      <svg viewBox="0 0 44 44" className="w-full h-full -rotate-90">
        <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
        <motion.circle
          cx="22" cy="22" r="18" fill="none"
          stroke="url(#matchGrad)"
          strokeWidth="3"
          strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${C}` }}
          animate={{ strokeDasharray: `${dash} ${C}` }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        />
        <defs>
          <linearGradient id="matchGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 grid place-items-center font-mono text-xs">
        {pct}<span className="text-white/40 text-[10px]">%</span>
      </div>
    </div>
  );
}
