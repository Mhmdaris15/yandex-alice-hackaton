import { motion } from "framer-motion";
import { SectionIndex } from "./atoms";

const FEATURES = [
  {
    n: "01",
    title: "The Fixer Engine",
    body: "Tracks every legal deadline on a graph. Proactive — not reactive.",
    spec: "Rust · Axum · SurrealDB · Tokio worker",
    span: "md:col-span-2 md:row-span-2"
  },
  {
    n: "02",
    title: "AR Document Overlay",
    body: "Live OCR translates and annotates Russian forms in real time.",
    spec: "WebRTC · Yandex Vision · Framer Motion",
    span: ""
  },
  {
    n: "03",
    title: "Walkie-Talkie Translator",
    body: "Push to talk. Phone splits. Hold it between two people.",
    spec: "WebSocket · Speechkit · Haptics",
    span: ""
  },
  {
    n: "04",
    title: "Offline Survival Mode",
    body: "Day-1 essentials cached: phrases, maps, contacts — no signal needed.",
    spec: "PWA · Service Worker · Workbox",
    span: "md:col-span-2"
  },
  {
    n: "05",
    title: "Geo-Aware Pulse",
    body: "Real-time tips and warnings dropped by students on the ground.",
    spec: "Yandex Maps · Vector graph",
    span: ""
  },
  {
    n: "06",
    title: "Buddy Match",
    body: "Graph-based pairing with verified senior students from your country.",
    spec: "SurrealDB graph · 1-click chat",
    span: "md:col-span-2"
  }
];

export function Features() {
  return (
    <section id="features" className="relative py-28 sm:py-40 px-6 sm:px-12 bg-ink overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <SectionIndex n="04" label="The arsenal" />

        <div className="mt-10 grid md:grid-cols-[1.1fr,1fr] gap-12 items-end">
          <h2 className="display-grotesk text-cream text-[clamp(2.5rem,7vw,6rem)]">
            Six tools<br />
            <em className="display-italic text-cinnabar">in one pocket.</em>
          </h2>
          <p className="font-serif text-cream/70 text-lg leading-relaxed">
            Each one solves a real, painful moment. None of them feel like
            features. They feel like a friend who has done this before.
          </p>
        </div>

        {/* Asymmetric editorial bento */}
        <div className="mt-14 grid md:grid-cols-3 md:auto-rows-[200px] gap-3 sm:gap-4">
          {FEATURES.map((f, i) => (
            <FeatureCell key={f.n} feature={f} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCell({
  feature, index
}: { feature: typeof FEATURES[number]; index: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ delay: index * 0.06, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`group relative p-6 rounded-3xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition overflow-hidden ${feature.span}`}
    >
      {/* Hover glow */}
      <div className="absolute -inset-px rounded-3xl opacity-0 group-hover:opacity-100 transition pointer-events-none"
           style={{ background: "radial-gradient(400px circle at var(--mx,50%) var(--my,50%), rgba(214,59,44,0.18), transparent 50%)" }} />

      <div className="flex items-baseline justify-between">
        <span className="font-mono text-[10px] tracking-[0.3em] text-cinnabar">{feature.n}</span>
        <span className="font-mono text-[10px] tracking-[0.18em] text-cream/35 opacity-0 group-hover:opacity-100 transition">
          {feature.spec}
        </span>
      </div>

      <h3 className="mt-3 font-display text-cream text-2xl sm:text-3xl font-semibold leading-tight">
        {feature.title}
      </h3>

      <p className="mt-3 font-serif text-cream/60 leading-relaxed max-w-md text-sm sm:text-base">
        {feature.body}
      </p>

      <div className="absolute bottom-5 right-5 w-9 h-9 rounded-full grid place-items-center border border-cream/15 text-cream/40 group-hover:text-cream group-hover:border-cream/40 transition">
        →
      </div>
    </motion.article>
  );
}
