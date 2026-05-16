import { motion } from "framer-motion";
import { SectionIndex } from "./atoms";

const PILLARS = [
  {
    n: "I.",
    title: "Track",
    russian: "Слежу",
    body:
      "Alice opens a file on the day you land. Every document, every deadline, every queue. She reminds you 14 days before things expire — not 14 hours after.",
    accent: "from-aurora-violet to-aurora-cyan"
  },
  {
    n: "II.",
    title: "Translate",
    russian: "Перевожу",
    body:
      "Press to speak. Show the phone. Walkie-talkie translation that you can hold between yourself and a clinician, a guard, a babushka.",
    accent: "from-cinnabar to-amber-400"
  },
  {
    n: "III.",
    title: "Connect",
    russian: "Соединяю",
    body:
      "Senior students from your country, verified by their universities, already know which window at MFTs is faster. The buddy system is one tap away.",
    accent: "from-emerald-400 to-aurora-cyan"
  }
];

export function Solution() {
  return (
    <section id="solution" className="relative py-28 sm:py-40 px-6 sm:px-12 bg-cream text-ink overflow-hidden">
      {/* Section frame — switch to warm paper background */}
      <div className="absolute inset-0 paper-grain opacity-30 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto">
        <SectionIndexDark n="02" label="How we fix it" />

        <div className="mt-10 grid md:grid-cols-[1.1fr,1fr] gap-12 items-end">
          <h2 className="display-grotesk text-ink text-[clamp(2.5rem,7vw,6rem)]">
            Three protocols.<br />
            <em className="display-italic text-cinnabar">One fixer.</em>
          </h2>
          <p className="font-serif text-ink/65 text-lg leading-relaxed">
            We don't replace bureaucracy. We give you an operator who has
            already walked through every corridor, made every mistake, and
            now writes things down so you don't have to.
          </p>
        </div>

        <div className="mt-20 grid md:grid-cols-3 gap-8">
          {PILLARS.map((p, i) => <PillarCard key={p.n} pillar={p} index={i} />)}
        </div>

        {/* Editorial caption */}
        <div className="mt-20 flex items-end justify-between border-t border-ink/15 pt-6">
          <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-ink/45">
            file no. 02 · solution protocol
          </span>
          <span className="font-serif italic text-ink/60 text-sm">
            — drafted in Saint Petersburg, refined on the ground.
          </span>
        </div>
      </div>
    </section>
  );
}

function SectionIndexDark({ n, label }: { n: string; label: string }) {
  return (
    <div className="flex items-center gap-4 text-ink/55">
      <span className="font-mono text-xs tracking-[0.3em]">{n}</span>
      <span className="h-px flex-1 bg-ink/30 max-w-[80px]" />
      <span className="small-caps text-[11px] text-ink/65">{label}</span>
    </div>
  );
}

function PillarCard({ pillar, index }: { pillar: typeof PILLARS[number]; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ delay: index * 0.12, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="relative group"
    >
      {/* Number marker */}
      <div className="flex items-baseline gap-3">
        <span className="display-italic text-cinnabar text-3xl">{pillar.n}</span>
        <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-ink/45">
          {pillar.russian}
        </span>
      </div>

      <h3 className="mt-3 display-grotesk text-ink text-5xl sm:text-6xl">
        {pillar.title}.
      </h3>

      <div className={`mt-5 h-1 w-16 bg-gradient-to-r ${pillar.accent} rounded-full`} />

      <p className="mt-5 font-serif text-ink/70 text-base leading-relaxed max-w-md">
        {pillar.body}
      </p>

      <div className="mt-6 flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-ink/40 group-hover:text-ink/80 transition">
        <span>see in app</span>
        <span className="transition-transform group-hover:translate-x-1">→</span>
      </div>
    </motion.div>
  );
}
