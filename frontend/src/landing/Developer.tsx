import { motion } from "framer-motion";
import { SectionIndex, Stamp } from "./atoms";

// ─── USER CONTRIBUTION: replace these with YOUR bio. ────────────────
const DEV = {
  name:        "Muhammad Aris",
  handle:      "@Mhmdaris15",
  role:        "Solo developer · designer · operator",
  location:    "Built between Jakarta & Moscow",
  bio:         "Builds things at the seam between AI and real human friction. Believes the best products feel like a friend you've been missing.",
  pillars: [
    { k: "Rust",         v: "axum · tokio · surrealdb" },
    { k: "React",        v: "tsx · gsap · framer · pwa" },
    { k: "AI",           v: "rag · ocr · speech · agents" }
  ],
  links: [
    { label: "GitHub",   href: "https://github.com/Mhmdaris15" },
    { label: "Telegram", href: "#" },
    { label: "Email",    href: "mailto:analytics@demandlane.com" }
  ]
};

export function Developer() {
  return (
    <section id="maker" className="relative py-28 sm:py-40 px-6 sm:px-12 bg-cream text-ink overflow-hidden">
      <div className="absolute inset-0 paper-grain opacity-30 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto">
        <SectionIndexLight n="05" label="The Maker" />

        <div className="mt-10 grid md:grid-cols-[1.1fr,1fr] gap-12 items-end">
          <h2 className="display-grotesk text-ink text-[clamp(2.5rem,7vw,6rem)]">
            Built solo,<br />
            with <em className="display-italic text-cinnabar">obsession.</em>
          </h2>
          <p className="font-serif text-ink/60 text-lg leading-relaxed">
            One person, one weekend, one belief: international students deserve
            better than a PDF and a queue. This is the prototype of that belief.
          </p>
        </div>

        <div className="mt-16 grid lg:grid-cols-[1.5fr,1fr] gap-8 lg:gap-12">
          <PassportCard />
          <StatsPanel />
        </div>

        <SignatureFooter />
      </div>
    </section>
  );
}

function PassportCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="relative bg-parchment border border-ink/15 rounded-[28px] p-8 sm:p-10 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.4)]"
    >
      {/* Passport top stripe */}
      <div className="flex items-baseline justify-between border-b border-ink/15 pb-4">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-ink/55">
            International Maker Pass
          </span>
        </div>
        <span className="font-mono text-[10px] tracking-[0.2em] text-ink/40">
          № WTR-2025-01
        </span>
      </div>

      <div className="mt-8 grid sm:grid-cols-[140px,1fr] gap-8 items-start">
        {/* Avatar / mug shot */}
        <div className="relative">
          <div className="aspect-[3/4] rounded-md bg-gradient-to-br from-ink to-bg-rise grid place-items-center overflow-hidden border border-ink/15">
            <span className="display-grotesk text-cream text-6xl">М</span>
          </div>
          <div className="mt-2 font-mono text-[9px] tracking-[0.18em] text-ink/45 uppercase text-center">
            Photo · 35×45mm
          </div>
        </div>

        {/* Identity */}
        <div>
          <Field label="Full name" value={DEV.name} />
          <Field label="Handle"    value={DEV.handle} mono />
          <Field label="Role"      value={DEV.role} />
          <Field label="Origin"    value={DEV.location} />

          <div className="mt-5 font-serif italic text-ink/75 text-base leading-relaxed">
            "{DEV.bio}"
          </div>
        </div>
      </div>

      {/* Bottom MRZ-style line */}
      <div className="mt-8 border-t border-ink/15 pt-4 font-mono text-[10px] text-ink/45 tracking-[0.18em] uppercase break-all">
        P&lt;MHMDARIS15&lt;&lt;ARIS&lt;&lt;&lt;BUILDS&lt;FIXERS&lt;FOR&lt;HUMANS&lt;&lt;&lt;&lt;&lt;&lt;&lt;
      </div>
      <div className="mt-1 font-mono text-[10px] text-ink/45 tracking-[0.18em] uppercase">
        WTR250516MAKER&lt;&lt;&lt;HACKATHON&lt;ALICE&lt;YANDEX&lt;&lt;
      </div>

      {/* Stamp overlap */}
      <div className="absolute -top-6 -right-4 sm:-right-8 pointer-events-none">
        <Stamp text="MAKER" rotate={8} color="#d63b2c" />
      </div>
    </motion.div>
  );
}

function Field({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="mt-3 first:mt-0">
      <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-ink/40">
        {label}
      </div>
      <div className={`mt-1 text-ink ${mono ? "font-mono text-base" : "font-display text-lg font-semibold"}`}>
        {value}
      </div>
    </div>
  );
}

function StatsPanel() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ delay: 0.15, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col gap-4"
    >
      <div className="bg-ink text-cream rounded-3xl p-8">
        <div className="font-mono text-[10px] tracking-[0.3em] text-cream/45 uppercase">
          Working with
        </div>
        <ul className="mt-4 space-y-3">
          {DEV.pillars.map((p) => (
            <li key={p.k} className="flex items-baseline justify-between gap-4 border-b border-cream/10 pb-2">
              <span className="font-display font-semibold">{p.k}</span>
              <span className="font-mono text-[11px] tracking-[0.18em] text-cream/55 uppercase text-right">
                {p.v}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-parchment rounded-3xl p-8 border border-ink/15">
        <div className="font-mono text-[10px] tracking-[0.3em] text-ink/50 uppercase">
          Talk to the maker
        </div>
        <ul className="mt-4 space-y-1">
          {DEV.links.map((l) => (
            <li key={l.label}>
              <a
                href={l.href}
                target={l.href.startsWith("http") ? "_blank" : undefined}
                rel="noreferrer"
                className="group flex items-baseline justify-between py-2 border-b border-ink/10 last:border-b-0"
              >
                <span className="font-display font-semibold text-ink group-hover:text-cinnabar transition">
                  {l.label}
                </span>
                <span className="font-mono text-[11px] text-ink/40 group-hover:text-cinnabar transition">
                  →
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}

function SectionIndexLight({ n, label }: { n: string; label: string }) {
  return (
    <div className="flex items-center gap-4 text-ink/55">
      <span className="font-mono text-xs tracking-[0.3em]">{n}</span>
      <span className="h-px flex-1 bg-ink/30 max-w-[80px]" />
      <span className="small-caps text-[11px] text-ink/65">{label}</span>
    </div>
  );
}

function SignatureFooter() {
  return (
    <div className="mt-24 flex items-end justify-between border-t border-ink/15 pt-6">
      <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-ink/45">
        End of file · signed by the maker
      </span>
      <span className="font-serif italic text-ink/65 text-sm">
        — М. Aris, fixer at large.
      </span>
    </div>
  );
}
