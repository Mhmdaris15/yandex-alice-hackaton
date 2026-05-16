import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import gsap from "gsap";
import { Draggable } from "gsap/Draggable";
import { JOURNEY, type JourneyNode, type JourneyAccent } from "@/data/journey";

gsap.registerPlugin(Draggable);

const ACCENT_MAP: Record<JourneyAccent, { from: string; to: string; glow: string }> = {
  violet: { from: "#a855f7", to: "#7c3aed", glow: "rgba(168,85,247,0.55)" },
  cyan:   { from: "#22d3ee", to: "#0ea5e9", glow: "rgba(34,211,238,0.55)" },
  rose:   { from: "#fb7185", to: "#f43f5e", glow: "rgba(251,113,133,0.55)" },
  amber:  { from: "#fbbf24", to: "#f59e0b", glow: "rgba(251,191,36,0.55)" }
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
      <Hero />
      <div
        ref={railRef}
        className="relative mt-10 overflow-hidden rounded-3xl glass p-6 sm:p-10"
        style={{ minHeight: 360 }}
      >
        <SpineDecor />
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
        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-bg-deep to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-bg-deep/60 to-transparent" />
      </div>

      <Hint />

      <AnimatePresence>
        {active && <NodeDetail node={active} onClose={() => setActive(null)} />}
      </AnimatePresence>
    </section>
  );
}

function Hero() {
  return (
    <div className="text-balance">
      <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.25em] text-white/40 font-medium">
        <span className="w-6 h-px bg-white/20" /> Your Journey · 30 Days
      </div>
      <h1 className="mt-3 font-display text-4xl sm:text-6xl leading-[1.05] font-bold text-gradient">
        Russia, but with a fixer<br />in your pocket.
      </h1>
      <p className="mt-4 max-w-xl text-white/55 text-base sm:text-lg">
        Drag the spine. Every node is a milestone Alice is already tracking for
        you — documents, deadlines, queues, taxis.
      </p>
    </div>
  );
}

function SpineDecor() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 h-px">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/15 to-transparent" />
    </div>
  );
}

function Hint() {
  return (
    <div className="mt-6 flex items-center gap-3 text-xs text-white/40">
      <kbd className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-white/60">drag</kbd>
      <span>the timeline · tap any node to expand</span>
    </div>
  );
}

function TimelineNode({
  node,
  index,
  onOpen
}: {
  node: JourneyNode;
  index: number;
  onOpen: () => void;
}) {
  const accent = ACCENT_MAP[node.accent];
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateX = useTransform(my, [-1, 1], [8, -8]);
  const rotateY = useTransform(mx, [-1, 1], [-8, 8]);

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
        className="relative rounded-2xl p-5 glass-strong overflow-hidden"
        whileHover={{ y: -4 }}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
      >
        <div
          className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
          style={{
            background: `radial-gradient(120px circle at var(--mx,50%) var(--my,50%), ${accent.glow}, transparent 70%)`
          }}
        />

        <div className="flex items-start justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-medium">
              {node.phase}
            </div>
            <div className="mt-1 font-display text-2xl font-semibold leading-tight">
              {node.title}
            </div>
          </div>
          <DayBadge day={node.day} />
        </div>

        <p className="mt-3 text-sm text-white/55 leading-snug">{node.subtitle}</p>

        <div className="mt-5 flex items-center justify-between">
          <StatusPill status={node.status} />
          <div
            className="w-8 h-8 rounded-full grid place-items-center text-xs"
            style={{
              background: `linear-gradient(135deg, ${accent.from}, ${accent.to})`,
              boxShadow: `0 8px 24px -8px ${accent.glow}`
            }}
          >
            →
          </div>
        </div>
      </motion.div>

      <div
        className="absolute left-1/2 -translate-x-1/2 -bottom-3 w-3 h-3 rounded-full"
        style={{
          background: accent.from,
          boxShadow: `0 0 24px ${accent.glow}, 0 0 4px ${accent.from}`
        }}
      />
    </motion.button>
  );
}

function DayBadge({ day }: { day: number }) {
  const label = day < 0 ? `D${day}` : day === 0 ? "D-Day" : `D+${day}`;
  return (
    <div className="font-mono text-[10px] tracking-wider px-2 py-1 rounded-md bg-white/5 border border-white/10 text-white/70">
      {label}
    </div>
  );
}

function StatusPill({ status }: { status: JourneyNode["status"] }) {
  const styles = {
    done: "bg-emerald-400/15 text-emerald-300 ring-emerald-400/30",
    active: "bg-amber-400/15 text-amber-200 ring-amber-400/40 animate-pulse",
    upcoming: "bg-white/5 text-white/50 ring-white/10"
  }[status];
  const label = { done: "complete", active: "in progress", upcoming: "upcoming" }[status];
  return (
    <span className={`text-[10px] uppercase tracking-[0.15em] px-2 py-0.5 rounded-full ring-1 ${styles}`}>
      {label}
    </span>
  );
}

function NodeDetail({ node, onClose }: { node: JourneyNode; onClose: () => void }) {
  const accent = ACCENT_MAP[node.accent];
  return (
    <motion.div
      className="fixed inset-0 z-40 grid place-items-center p-4 sm:p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="absolute inset-0 bg-bg-deep/70 backdrop-blur-md"
        onClick={onClose}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      />
      <motion.div
        layoutId={`card-${node.id}`}
        className="relative w-full max-w-2xl glass-strong rounded-3xl p-8 overflow-hidden"
        transition={{ type: "spring", stiffness: 280, damping: 30 }}
      >
        <div
          className="absolute -top-32 -right-32 w-80 h-80 rounded-full opacity-50 blur-3xl pointer-events-none"
          style={{ background: `radial-gradient(circle, ${accent.glow}, transparent 70%)` }}
        />
        <div className="flex items-start justify-between gap-6">
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-white/40">
              {node.phase} · Day {node.day}
            </div>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl font-bold text-gradient">
              {node.title}
            </h2>
            <p className="mt-2 text-white/60">{node.subtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full glass grid place-items-center text-white/70 hover:text-white transition"
          >
            ✕
          </button>
        </div>

        <div className="mt-6 grid gap-2">
          {node.checklist.map((item, i) => (
            <motion.label
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.08 + i * 0.05 }}
              className="group flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 cursor-pointer"
            >
              <input type="checkbox" className="peer sr-only" />
              <span className="w-5 h-5 rounded-md border-2 border-white/20 grid place-items-center peer-checked:border-emerald-400 peer-checked:bg-emerald-400/20 transition">
                <span className="opacity-0 peer-checked:opacity-100 text-emerald-300 text-xs">✓</span>
              </span>
              <span className="text-sm text-white/80 peer-checked:line-through peer-checked:text-white/40">
                {item}
              </span>
            </motion.label>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-aurora-violet to-aurora-cyan text-sm font-medium shadow-glow hover:brightness-110 transition">
            Ask Alice about this
          </button>
          <button className="px-4 py-2.5 rounded-xl glass text-sm font-medium hover:bg-white/10 transition">
            Open on map
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
