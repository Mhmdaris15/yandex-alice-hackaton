import { motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useRef, type ReactNode } from "react";

/** Editorial section index — a thin rule + small caps label */
export function SectionIndex({ n, label }: { n: string; label: string }) {
  return (
    <div className="flex items-center gap-4 text-white/40">
      <span className="font-mono text-xs tracking-[0.3em]">{n}</span>
      <span className="h-px flex-1 bg-white/15 max-w-[80px]" />
      <span className="small-caps text-[11px] text-white/55">{label}</span>
    </div>
  );
}

/** A faux passport stamp that slowly rotates. Imperfect on purpose. */
export function Stamp({
  text = "VERIFIED",
  rotate = -8,
  color = "#d63b2c",
  className = ""
}: { text?: string; rotate?: number; color?: string; className?: string }) {
  return (
    <motion.div
      className={`relative w-40 h-40 select-none ${className}`}
      initial={{ rotate: rotate - 6, scale: 0.9, opacity: 0 }}
      whileInView={{ rotate, scale: 1, opacity: 0.92 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ type: "spring", stiffness: 70, damping: 14 }}
      style={{ color }}
    >
      <svg viewBox="0 0 160 160" className="w-full h-full">
        <defs>
          <path id="stampCirc" d="M 80,80 m -56,0 a 56,56 0 1,1 112,0 a 56,56 0 1,1 -112,0" />
        </defs>
        <circle cx="80" cy="80" r="68" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="2 4" />
        <circle cx="80" cy="80" r="56" fill="none" stroke="currentColor" strokeWidth="3" />
        <circle cx="80" cy="80" r="40" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <text fill="currentColor" fontFamily="Space Grotesk, sans-serif" fontSize="11" letterSpacing="3" fontWeight="700">
          <textPath xlinkHref="#stampCirc" startOffset="2%">
            FIXER · PROTOCOL · ALICE · YANDEX · {text} ·
          </textPath>
        </text>
        <text x="80" y="76" textAnchor="middle" fill="currentColor" fontFamily="Space Grotesk" fontWeight="800" fontSize="20" letterSpacing="2">
          {text}
        </text>
        <text x="80" y="94" textAnchor="middle" fill="currentColor" fontFamily="JetBrains Mono" fontSize="7" letterSpacing="1.5">
          САНКТ-ПЕТЕРБУРГ · 2025
        </text>
      </svg>
      <span
        className="absolute inset-0 mix-blend-overlay opacity-40 pointer-events-none rounded-full"
        style={{
          background:
            "radial-gradient(circle at 30% 20%, transparent 0, rgba(0,0,0,0.4) 60%, transparent 70%)"
        }}
      />
    </motion.div>
  );
}

/** Marquee strip — horizontally scrolling kinetic type */
export function Marquee({
  items, speed = 30
}: { items: ReactNode[]; speed?: number }) {
  // Duplicate so the loop is seamless
  const seq = [...items, ...items];
  return (
    <div className="relative overflow-hidden py-6 border-y border-white/10">
      <motion.div
        className="flex gap-12 whitespace-nowrap will-change-transform"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ ease: "linear", duration: speed, repeat: Infinity }}
      >
        {seq.map((it, i) => (
          <div key={i} className="flex items-center gap-12">
            <span className="font-serif italic text-3xl sm:text-5xl text-white/85">{it}</span>
            <span className="text-cinnabar text-3xl">✦</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

/** Annotation — a margin note with a hand-drawn arrow, magazine-style */
export function Annotation({
  children,
  align = "right",
  className = ""
}: { children: ReactNode; align?: "left" | "right"; className?: string }) {
  return (
    <div className={`relative font-serif italic text-cream/70 text-sm leading-snug ${className}`}>
      <div className="relative">
        {align === "left" && <span aria-hidden className="absolute -right-5 top-2 text-cinnabar">↖</span>}
        {align === "right" && <span aria-hidden className="absolute -left-5 top-2 text-cinnabar">↗</span>}
        {children}
      </div>
    </div>
  );
}

/** Cyrillic decorative caption (small caps) */
export function CyrillicTag({ children }: { children: ReactNode }) {
  return (
    <span className="font-mono text-[10px] tracking-[0.32em] uppercase text-cream/40">
      {children}
    </span>
  );
}

/** Magnetic button — the cursor pulls the button slightly */
export function MagneticLink({
  href, children, className = "", strength = 0.3
}: { href: string; children: ReactNode; className?: string; strength?: number }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const tx = useTransform(x, (v) => v * strength);
  const ty = useTransform(y, (v) => v * strength);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      x.set(e.clientX - (r.left + r.width / 2));
      y.set(e.clientY - (r.top + r.height / 2));
    };
    const leave = () => { x.set(0); y.set(0); };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, [x, y]);

  return (
    <motion.a
      ref={ref}
      href={href}
      style={{ x: tx, y: ty }}
      transition={{ type: "spring", stiffness: 250, damping: 20 }}
      className={className}
    >
      {children}
    </motion.a>
  );
}
