import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Link } from "react-router-dom";
import { SectionIndex } from "./atoms";
import { useHaptics } from "@/hooks/useHaptics";
import { mockTranslate } from "@/lib/api";

const TABS = [
  { id: "timeline", label: "Spatial Timeline",      sub: "30 days, one drag" },
  { id: "talkie",   label: "Walkie-Talkie",         sub: "press · speak · show" },
  { id: "scan",     label: "AR Document Scanner",   sub: "point · tap · understand" }
] as const;

export function Demo() {
  const [tab, setTab] = useState<typeof TABS[number]["id"]>("timeline");

  return (
    <section id="demo" className="relative py-28 sm:py-40 px-6 sm:px-12 bg-ink overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <SectionIndex n="03" label="The product" />

        <div className="mt-10 grid md:grid-cols-[1.1fr,1fr] gap-12 items-end">
          <h2 className="display-grotesk text-cream text-[clamp(2.5rem,7vw,6rem)]">
            Don't read about it.<br />
            <em className="display-italic text-cinnabar">Touch it.</em>
          </h2>
          <p className="font-serif text-cream/70 text-lg leading-relaxed">
            A taste, right here. The full experience is one tap away —
            launch the app and let Alice walk with you.
          </p>
        </div>

        <div className="mt-14 grid md:grid-cols-[280px,1fr] gap-10">
          <DemoNav tab={tab} onTab={setTab} />
          <div className="relative">
            <AnimatePresence mode="wait">
              {tab === "timeline" && <TimelinePreview key="timeline" />}
              {tab === "talkie"   && <WalkieTalkiePreview key="talkie" />}
              {tab === "scan"     && <ScannerPreview key="scan" />}
            </AnimatePresence>
          </div>
        </div>

        <div className="mt-14 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Link
            to="/app"
            className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-cream text-ink font-display font-semibold tracking-wide hover:brightness-95 transition"
          >
            Open the full app <span>→</span>
          </Link>
          <span className="font-serif italic text-cream/55 text-sm">
            offline-ready, installable as a PWA.
          </span>
        </div>
      </div>
    </section>
  );
}

function DemoNav({
  tab, onTab
}: { tab: string; onTab: (t: typeof TABS[number]["id"]) => void }) {
  return (
    <nav className="flex md:flex-col gap-2">
      {TABS.map((t, i) => {
        const active = t.id === tab;
        return (
          <button
            key={t.id}
            onClick={() => onTab(t.id)}
            className={`relative text-left p-4 rounded-2xl border transition group ${
              active
                ? "border-cream/30 bg-cream/[0.04]"
                : "border-white/5 hover:border-white/15 hover:bg-white/[0.02]"
            }`}
          >
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-[10px] tracking-[0.3em] text-cinnabar">
                0{i + 1}
              </span>
              <span className={`font-display font-semibold text-base ${active ? "text-cream" : "text-cream/70 group-hover:text-cream"}`}>
                {t.label}
              </span>
            </div>
            <div className="mt-1 pl-9 font-serif italic text-cream/45 text-sm">
              {t.sub}
            </div>
            {active && (
              <motion.span
                layoutId="demo-tab-dot"
                className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-1.5 h-8 rounded-full bg-cinnabar"
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}

/* ─── Preview frames ─── */

function PreviewFrame({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="relative rounded-3xl border border-white/10 bg-white/[0.03] overflow-hidden"
    >
      {/* Window chrome */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/[0.02]">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
          <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
          <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
        </div>
        <div className="font-mono text-[10px] tracking-[0.2em] text-cream/40">{label}</div>
        <div className="w-12" />
      </div>
      <div className="p-6 sm:p-8 min-h-[420px]">{children}</div>
    </motion.div>
  );
}

function TimelinePreview() {
  const nodes = [
    { d: "D-14", t: "Visa",         a: "violet"  as const },
    { d: "D-0",  t: "Arrival",      a: "cyan"    as const },
    { d: "D+3",  t: "Migration",    a: "amber"   as const, active: true },
    { d: "D+7",  t: "Medical",      a: "rose"    as const },
    { d: "D+10", t: "Bank",         a: "violet"  as const },
    { d: "D+30", t: "Settled",      a: "cyan"    as const }
  ];
  const accent = {
    violet: "#a855f7", cyan: "#22d3ee", rose: "#fb7185", amber: "#fbbf24"
  };
  return (
    <PreviewFrame label="/app/journey">
      <div className="relative">
        <div className="absolute left-0 right-0 top-1/2 h-px bg-cream/15" />
        <div className="relative flex gap-6 overflow-x-auto pb-4 -mx-2 px-2 scrollbar-thin">
          {nodes.map((n, i) => (
            <motion.div
              key={n.d}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="shrink-0 w-[180px]"
            >
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-md">
                <div className="font-mono text-[10px] tracking-[0.2em] text-cream/40">{n.d}</div>
                <div className="mt-1 font-display font-semibold text-cream">{n.t}</div>
                {n.active && (
                  <div className="mt-3 text-[10px] uppercase tracking-[0.18em] px-2 py-0.5 inline-block rounded-full bg-amber-400/15 text-amber-200 ring-1 ring-amber-400/40">
                    in progress
                  </div>
                )}
              </div>
              <div
                className="mt-3 mx-auto w-3 h-3 rounded-full"
                style={{ background: accent[n.a], boxShadow: `0 0 18px ${accent[n.a]}` }}
              />
            </motion.div>
          ))}
        </div>
      </div>
      <p className="mt-8 font-serif italic text-cream/55 text-sm">
        Drag the spine in the live app. Tap any node — it expands into a full
        dashboard with map, checklist, and community pulse.
      </p>
    </PreviewFrame>
  );
}

function WalkieTalkiePreview() {
  const [active, setActive] = useState(false);
  const [out, setOut] = useState<string>("");
  const { buzz } = useHaptics();

  async function tap() {
    setActive(true); buzz([8, 24, 8]);
    const ru = await mockTranslate("where is the metro", true);
    setOut(ru);
    setTimeout(() => { setActive(false); buzz(4); }, 900);
  }

  return (
    <PreviewFrame label="/app/talk">
      <div className="grid grid-rows-[1fr,auto,1fr] min-h-[360px]">
        <div className="grid place-items-center" style={{ transform: "rotate(180deg)" }}>
          <div className="font-serif italic text-2xl sm:text-3xl text-cream/85">
            {out || "Скажите 'привет' собеседнику"}
          </div>
        </div>
        <div className="grid place-items-center py-6 border-y border-white/10">
          <motion.button
            onPointerDown={tap}
            whileTap={{ scale: 0.94 }}
            animate={active ? { scale: 1.06 } : { scale: 1 }}
            className="relative w-24 h-24 rounded-full"
            style={{
              background: "radial-gradient(circle at 30% 30%, #a855f7, #5b21b6)",
              boxShadow: active
                ? "0 0 0 8px rgba(255,255,255,0.06), 0 0 80px rgba(168,85,247,0.7)"
                : "0 12px 36px -8px rgba(0,0,0,0.6)"
            }}
          >
            {active && (
              <motion.span
                className="absolute inset-0 rounded-full border border-white/30"
                animate={{ scale: [1, 1.8], opacity: [0.7, 0] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              />
            )}
            <span className="relative grid place-items-center w-full h-full text-white font-display text-[10px] uppercase tracking-[0.25em]">
              hold
            </span>
          </motion.button>
        </div>
        <div className="grid place-items-center">
          <div className="font-serif italic text-2xl sm:text-3xl text-cream/85">
            where is the metro
          </div>
        </div>
      </div>
      <p className="mt-6 font-serif italic text-cream/55 text-sm">
        Top side is rotated 180° — flip the phone toward whoever you're talking to.
      </p>
    </PreviewFrame>
  );
}

function ScannerPreview() {
  return (
    <PreviewFrame label="/app/scan">
      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gradient-to-br from-bg-rise to-ink border border-white/10">
        <svg viewBox="0 0 400 300" className="absolute inset-0 w-full h-full">
          <defs>
            <pattern id="lineGrid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(244,235,217,0.07)" strokeWidth="0.6" />
            </pattern>
          </defs>
          <rect width="400" height="300" fill="url(#lineGrid)" />
          {/* Fake form lines */}
          <line x1="40" y1="60"  x2="240" y2="60"  stroke="rgba(244,235,217,0.2)" strokeWidth="1.5" />
          <line x1="40" y1="110" x2="240" y2="110" stroke="rgba(244,235,217,0.2)" strokeWidth="1.5" />
          <line x1="40" y1="160" x2="200" y2="160" stroke="rgba(244,235,217,0.2)" strokeWidth="1.5" />
          <rect x="240" y="220" width="120" height="50" fill="none" stroke="rgba(244,235,217,0.2)" strokeWidth="1" />
        </svg>

        {/* Reticle corners */}
        {(["tl","tr","bl","br"] as const).map((c) => (
          <div key={c} className={`absolute w-10 h-10 border-aurora-cyan/80 ${
            c === "tl" ? "top-4 left-4 border-l-2 border-t-2 rounded-tl-lg" :
            c === "tr" ? "top-4 right-4 border-r-2 border-t-2 rounded-tr-lg" :
            c === "bl" ? "bottom-4 left-4 border-l-2 border-b-2 rounded-bl-lg" :
                         "bottom-4 right-4 border-r-2 border-b-2 rounded-br-lg"
          }`} />
        ))}

        {/* Animated scan line */}
        <motion.div
          className="absolute left-4 right-4 h-px bg-gradient-to-r from-transparent via-aurora-cyan to-transparent shadow-[0_0_18px_2px_rgba(34,211,238,0.7)]"
          animate={{ top: ["10%", "90%", "10%"] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Translated overlays */}
        {[
          { x: "10%", y: "18%", w: "40%", h: "12%", en: "Surname",       hint: "Latin letters, as in passport" },
          { x: "10%", y: "34%", w: "40%", h: "12%", en: "Given name",    hint: "" },
          { x: "10%", y: "50%", w: "32%", h: "12%", en: "Date of birth", hint: "DD.MM.YYYY" },
          { x: "60%", y: "72%", w: "30%", h: "16%", en: "Signature",     hint: "must match passport" }
        ].map((b, i) => (
          <motion.div
            key={b.en}
            initial={{ opacity: 0, scale: 0.92 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 + i * 0.12 }}
            className="absolute rounded-md border-2 border-aurora-violet shadow-[0_0_24px_-4px_rgba(168,85,247,0.6)]"
            style={{ left: b.x, top: b.y, width: b.w, height: b.h }}
          >
            <div className="absolute -top-2 left-0 -translate-y-full glass-strong rounded-lg px-2 py-1 whitespace-nowrap">
              <div className="text-[10px] uppercase tracking-wider text-aurora-cyan font-semibold">{b.en}</div>
              {b.hint && <div className="text-[10px] text-cream/55">{b.hint}</div>}
            </div>
          </motion.div>
        ))}
      </div>
      <p className="mt-6 font-serif italic text-cream/55 text-sm">
        Live OCR via Yandex Vision in the real app. Tap the shutter and Alice
        annotates every field, in your language.
      </p>
    </PreviewFrame>
  );
}
