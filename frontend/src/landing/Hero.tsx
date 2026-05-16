import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import { useRef } from "react";
import { Stamp, CyrillicTag, MagneticLink } from "./atoms";

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0.3]);

  return (
    <section ref={ref} className="relative min-h-[100svh] overflow-hidden">
      <BackgroundLayer />
      <TopBar />

      {/* Side rails — magazine markers */}
      <div className="hidden md:flex flex-col gap-3 absolute left-6 top-1/2 -translate-y-1/2 z-10 text-cream/40 small-caps text-[10px]">
        <span>N 55°45'</span>
        <span className="w-px h-12 bg-cream/15 mx-auto" />
        <span>Moscow</span>
        <span className="w-px h-12 bg-cream/15 mx-auto" />
        <span>E 37°37'</span>
      </div>
      <div className="hidden md:flex flex-col gap-3 absolute right-6 top-1/2 -translate-y-1/2 z-10 text-cream/40 small-caps text-[10px]">
        <span>Vol. 01</span>
        <span className="w-px h-12 bg-cream/15 mx-auto" />
        <span>2025</span>
        <span className="w-px h-12 bg-cream/15 mx-auto" />
        <span>№ Alice</span>
      </div>

      <motion.div
        style={{ y, opacity }}
        className="relative z-10 max-w-7xl mx-auto px-6 sm:px-12 pt-28 sm:pt-32 pb-20"
      >
        <CyrillicTag>добро · пожаловать · в · Россию</CyrillicTag>

        <h1 className="mt-6 display-grotesk text-[clamp(3.5rem,11vw,11rem)] text-cream">
          Welcome
          <span className="inline-block w-3" />
          <CyrillicMorph />
          <br />
          <span className="text-cream/50">to the</span> <em className="display-italic text-cream">paperwork.</em>
        </h1>

        <div className="mt-10 grid md:grid-cols-[1.4fr,1fr] gap-10 items-end">
          <p className="font-serif text-cream/75 text-lg sm:text-xl leading-relaxed max-w-xl">
            Your first month in Russia is not lost in translation —
            <span className="text-cinnabar"> it's lost in queues, in forms, in stamps</span>.
            Alice is the fixer who has been there before.
          </p>

          <div className="flex flex-col sm:flex-row md:flex-col gap-3 md:items-end">
            <MagneticLink
              href="/app"
              className="group inline-flex items-center gap-3 px-6 py-3 rounded-full bg-cream text-ink font-display font-semibold tracking-wide hover:brightness-95 transition"
            >
              <span>Open the App</span>
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </MagneticLink>
            <Link
              to="#problem"
              className="inline-flex items-center gap-3 px-6 py-3 rounded-full border border-cream/30 text-cream/85 font-display text-sm tracking-wide hover:bg-cream/5 transition"
            >
              <span>Read the manifesto</span>
            </Link>
          </div>
        </div>

        <ScrollCue />
      </motion.div>

      <div className="absolute right-8 sm:right-20 top-28 z-10 pointer-events-none">
        <Stamp text="APPROVED" rotate={-12} />
      </div>
    </section>
  );
}

function CyrillicMorph() {
  const words = ["Россия", "Москва", "Алисе", "Сюда"];
  return (
    <span className="relative inline-block align-baseline overflow-hidden">
      <span className="invisible">Россия</span>
      <motion.span
        className="absolute inset-0 flex flex-col items-start"
        animate={{ y: words.map((_, i) => `-${i * 100}%`) }}
        transition={{
          duration: words.length * 2.6,
          times: words.map((_, i) => i / words.length),
          repeat: Infinity,
          ease: [0.83, 0, 0.17, 1]
        }}
      >
        {words.map((w, i) => (
          <span key={i} className="display-italic text-cinnabar leading-[0.92]">{w}</span>
        ))}
      </motion.span>
    </span>
  );
}

function BackgroundLayer() {
  return (
    <>
      <div className="absolute inset-0 bg-ink" />
      <div
        className="absolute inset-0 opacity-50 paper-grain"
        style={{ filter: "contrast(120%)" }}
      />
      {/* Big background cyrillic typography */}
      <div className="absolute inset-x-0 -bottom-8 sm:-bottom-16 flex justify-center pointer-events-none">
        <span className="display-grotesk text-cream/[0.04] text-[28vw] leading-none whitespace-nowrap">
          ФИКСЕР
        </span>
      </div>
      <div className="absolute -top-20 -left-32 w-[480px] h-[480px] rounded-full bg-aurora-violet/20 blur-[120px]" />
      <div className="absolute bottom-0 right-0 w-[420px] h-[420px] rounded-full bg-aurora-cyan/15 blur-[120px]" />
    </>
  );
}

function TopBar() {
  return (
    <header className="absolute top-0 inset-x-0 z-20 px-6 sm:px-12 py-6 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-md bg-cream text-ink grid place-items-center font-display font-bold text-sm">В</div>
        <span className="small-caps text-[11px] text-cream/70">Welcome / Russia</span>
      </Link>
      <nav className="hidden sm:flex items-center gap-1 text-[11px] text-cream/55">
        {[
          ["01", "Problem"],
          ["02", "Solution"],
          ["03", "Demo"],
          ["04", "Features"],
          ["05", "Maker"]
        ].map(([n, label]) => (
          <a key={n} href={`#${label.toLowerCase()}`} className="px-3 py-1.5 rounded-full hover:bg-cream/5 hover:text-cream transition">
            <span className="font-mono mr-2 text-cream/35">{n}</span>{label}
          </a>
        ))}
      </nav>
      <MagneticLink
        href="/app"
        className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cinnabar text-cream text-xs font-medium tracking-wide hover:brightness-110 transition"
      >
        Launch app <span>→</span>
      </MagneticLink>
    </header>
  );
}

function ScrollCue() {
  return (
    <motion.div
      className="mt-20 flex items-center gap-3 text-cream/40 small-caps text-[10px]"
      animate={{ y: [0, 6, 0] }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <span className="w-px h-10 bg-cream/30" />
      <span>scroll</span>
    </motion.div>
  );
}
