import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import gsap from "gsap";
import { Draggable } from "gsap/Draggable";
import { JOURNEY, type JourneyNode, type JourneyAccent } from "@/data/journey";
import { SectionIndex, CyrillicTag } from "@/landing/atoms";

gsap.registerPlugin(Draggable);

const ACCENT_MAP: Record<JourneyAccent, { hex: string; glow: string }> = {
  violet: { hex: "#a855f7", glow: "rgba(168,85,247,0.5)" },
  cyan:   { hex: "#22d3ee", glow: "rgba(34,211,238,0.5)" },
  rose:   { hex: "#fb7185", glow: "rgba(251,113,133,0.5)" },
  amber:  { hex: "#fbbf24", glow: "rgba(251,191,36,0.5)" }
};

export function SpatialTimeline() {
  const trackRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<JourneyNode | null>(null);

  useEffect(() => {
    if (!trackRef.current || !railRef.current) return;
    const track = trackRef.current;
    const rail = railRef.current;

    const setBounds = () => {
      const maxDrag = Math.min(0, rail.clientWidth - track.scrollWidth - 64);
      return { minX: maxDrag, maxX: 32 };
    };

    const d = Draggable.create(track, {
      type: "x",
      inertia: true,
      bounds: setBounds(),
      edgeResistance: 0.85,
      cursor: "grab",
      activeCursor: "grabbing"
    });

    const onResize = () => {
      const b = setBounds();
      (d[0] as any).applyBounds(b);
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      d[0].kill();
    };
  }, []);

  return (
    <section className="relative">
      <Watermark>ПУТЬ</Watermark>
      <Hero />

      <div
        ref={railRef}
        className="relative mt-10 overflow-hidden rounded-3xl border border-cream/10 bg-cream/[0.02] p-6 sm:p-10"
        style={{ minHeight: 360 }}
      >
        <Spine />
        <div
          ref={trackRef}
          className="relative flex items-center gap-10 sm:gap-14 will-change-transform"
          style={{ paddingLeft: 16, paddingRight: 96 }}
        >
          {JOURNEY.map((n, i) => (
            <TimelineNode
              key={n.id}
              node={n}
              index={i}
              onOpen={() => setActive(n)}
            />
          ))}
        </div>
        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-ink to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-ink/60 to-transparent" />
      </div>

      <Hint />

      <AnimatePresence>
        {active && <NodeDetail node={active} onClose={() => setActive(null)} />}
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

function Hero() {
  return (
    <div className="relative z-10">
      <SectionIndex n="01" label="file · journey · 30 days" />
      <h1 className="mt-6 display-grotesk text-cream text-[clamp(2.5rem,8vw,5.5rem)]">
        Day zero starts <em className="display-italic text-cinnabar">here.</em>
      </h1>
      <p className="mt-5 max-w-xl font-serif italic text-cream/65 text-base sm:text-lg leading-relaxed">
        Drag the spine. Every node is a milestone Alice is already tracking
        for you — documents, deadlines, queues, taxis.
      </p>
      <div className="mt-4">
        <CyrillicTag>тридцать · дней · в · вашем · кармане</CyrillicTag>
      </div>
    </div>
  );
}

function Spine() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 h-px">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-cream/20 to-transparent" />
    </div>
  );
}

function Hint() {
  return (
    <div className="mt-6 flex items-center gap-3 small-caps text-[10px] text-cream/40">
      <kbd className="font-mono px-2 py-1 rounded-md bg-cream/5 border border-cream/10 text-cream/65 tracking-normal">drag</kbd>
      <span>the spine · tap any node to expand</span>
    </div>
  );
}

function TimelineNode({
  node, index, onOpen
}: { node: JourneyNode; index: number; onOpen: () => void }) {
  const accent = ACCENT_MAP[node.accent];
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateX = useTransform(my, [-1, 1], [6, -6]);
  const rotateY = useTransform(mx, [-1, 1], [-6, 6]);

  return (
    <motion.button
      layoutId={`card-${node.id}`}
      onClick={onOpen}
      onMouseMove={(e) => {
        const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
        mx.set(((e.clientX - r.left) / r.width - 0.5) * 2);
        my.set(((e.clientY - r.top) / r.height - 0.5) * 2);
      }}
      onMouseLeave={() => { mx.set(0); my.set(0); }}
      style={{ rotateX, rotateY, transformPerspective: 800 }}
      className="group relative shrink-0 w-[260px] sm:w-[300px] text-left"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        className="relative rounded-2xl p-5 border border-cream/12 bg-cream/[0.025] backdrop-blur-md overflow-hidden"
        whileHover={{ y: -4 }}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
      >
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-[10px] text-cinnabar tracking-[0.22em]">
            {labelDay(node.day)}
          </span>
          <span className="h-px flex-1 bg-cream/15" />
        </div>

        <div className="mt-2 small-caps text-[10px] text-cream/45">
          {node.phase}
        </div>
        <h3 className="mt-1 font-display text-2xl font-semibold leading-tight text-cream">
          {node.title}
        </h3>
        <p className="mt-3 font-serif text-cream/65 text-sm leading-snug">
          {node.subtitle}
        </p>

        <div className="mt-5 flex items-center justify-between">
          <StatusPill status={node.status} />
          <div
            className="w-8 h-8 rounded-full grid place-items-center text-xs text-ink"
            style={{
              background: node.status === "active" ? "#d63b2c" : "#f4ebd9",
              boxShadow: node.status === "active"
                ? "0 8px 24px -6px rgba(214,59,44,0.5)"
                : "0 4px 16px -6px rgba(244,235,217,0.3)"
            }}
          >
            →
          </div>
        </div>
      </motion.div>

      <div
        className="absolute left-1/2 -translate-x-1/2 -bottom-3 w-3 h-3 rounded-full"
        style={{
          background: node.status === "active" ? "#d63b2c" : accent.hex,
          boxShadow:
            node.status === "active"
              ? "0 0 24px rgba(214,59,44,0.7), 0 0 4px #d63b2c"
              : `0 0 24px ${accent.glow}, 0 0 4px ${accent.hex}`
        }}
      />
    </motion.button>
  );
}

function labelDay(day: number) {
  if (day < 0) return `D${day}`;
  if (day === 0) return "D-DAY";
  return `D+${day}`;
}

function StatusPill({ status }: { status: JourneyNode["status"] }) {
  const styles = {
    done:     "text-emerald-300 ring-emerald-400/30",
    active:   "text-cinnabar ring-cinnabar/50",
    upcoming: "text-cream/45 ring-cream/15"
  }[status];
  const label = { done: "complete", active: "in progress", upcoming: "upcoming" }[status];
  return (
    <span className={`small-caps text-[9px] px-2 py-0.5 rounded-full ring-1 ${styles}`}>
      {label}
    </span>
  );
}

function NodeDetail({ node, onClose }: { node: JourneyNode; onClose: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-40 grid place-items-center p-4 sm:p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="absolute inset-0 bg-ink/80 backdrop-blur-md"
        onClick={onClose}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      />
      <motion.div
        layoutId={`card-${node.id}`}
        className="relative w-full max-w-2xl rounded-3xl p-8 overflow-hidden bg-cream text-ink border border-ink/15 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)]"
        transition={{ type: "spring", stiffness: 280, damping: 30 }}
      >
        <div className="absolute inset-0 paper-grain opacity-30 pointer-events-none" />

        <div className="relative flex items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[11px] text-cinnabar tracking-[0.22em]">
                {labelDay(node.day)}
              </span>
              <span className="h-px w-12 bg-ink/30" />
              <span className="small-caps text-[10px] text-ink/55">{node.phase}</span>
            </div>
            <h2 className="mt-3 display-grotesk text-ink text-3xl sm:text-5xl">
              {node.title}.
            </h2>
            <p className="mt-3 font-serif italic text-ink/65 text-base">{node.subtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-ink/5 border border-ink/15 grid place-items-center text-ink/55 hover:bg-ink hover:text-cream transition"
          >✕</button>
        </div>

        <div className="relative mt-8">
          <div className="small-caps text-[10px] text-ink/45 mb-3">checklist</div>
          <div className="grid gap-2">
            {node.checklist.map((item, i) => (
              <motion.label
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.08 + i * 0.05 }}
                className="group flex items-center gap-3 p-3 rounded-xl bg-ink/[0.03] hover:bg-ink/[0.06] border border-ink/10 cursor-pointer"
              >
                <input type="checkbox" className="peer sr-only" />
                <span className="w-5 h-5 rounded-md border-2 border-ink/25 grid place-items-center peer-checked:border-cinnabar peer-checked:bg-cinnabar/15 transition">
                  <span className="opacity-0 peer-checked:opacity-100 text-cinnabar text-xs">✓</span>
                </span>
                <span className="font-serif text-ink/85 peer-checked:line-through peer-checked:text-ink/40">
                  {item}
                </span>
              </motion.label>
            ))}
          </div>
        </div>

        <div className="relative mt-7 flex flex-wrap gap-3">
          <button className="px-5 py-2.5 rounded-full bg-cinnabar text-cream text-sm font-display font-semibold tracking-wide hover:brightness-110 transition">
            Ask Alice →
          </button>
          <button className="px-5 py-2.5 rounded-full bg-ink text-cream text-sm font-display font-semibold tracking-wide hover:brightness-110 transition">
            Open on map
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
