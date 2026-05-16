import { motion } from "framer-motion";
import { SectionIndex, Annotation, Marquee } from "./atoms";

const SCENES = [
  {
    day: "Day 03",
    headline: "The Migration Card",
    body: "You arrive with a 10×6 cm slip of paper that, if lost, can cost ₽5,000 and a deportation review. Nobody at the airport told you that.",
    annotation: "in five years, no one has translated this clearly."
  },
  {
    day: "Day 07",
    headline: "The Clinic with No English",
    body: "A mandatory medical exam at a clinic that operates between 09:00 and 11:30 only. You bring the wrong photo size. You come back.",
    annotation: "queue 2h. lost half a day."
  },
  {
    day: "Day 14",
    headline: "The Form That Doesn't Exist Online",
    body: "Form №2-Г — printed in one office in Lyublino, two metro lines away. You don't know it exists. The deadline is tomorrow.",
    annotation: "this happens to ~40% of new arrivals."
  }
];

export function Problem() {
  return (
    <section id="problem" className="relative py-28 sm:py-40 px-6 sm:px-12 bg-ink overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <SectionIndex n="01" label="The problem" />

        <div className="mt-10 grid md:grid-cols-[1.1fr,1fr] gap-12 items-end">
          <h2 className="display-grotesk text-cream text-[clamp(2.5rem,7vw,6rem)]">
            Bureaucracy is a<br />
            <em className="display-italic text-cinnabar">second language</em>—<br />
            and Russia doesn't<br />
            offer a dictionary.
          </h2>
          <p className="font-serif text-cream/65 text-lg leading-relaxed">
            Every year, ~350,000 international students arrive in Russia.
            Most spend their first 30 days not on classes, not on culture —
            but on{" "}
            <span className="text-cinnabar">photocopies, queues, and signatures</span>{" "}
            for forms whose names they cannot pronounce.
          </p>
        </div>

        <div className="mt-20 grid md:grid-cols-3 gap-x-8 gap-y-12">
          {SCENES.map((s, i) => (
            <ProblemCard key={s.day} scene={s} index={i} />
          ))}
        </div>
      </div>

      <div className="mt-28">
        <Marquee
          items={[
            "Lost in translation",
            "Lost in queues",
            "Lost in stamps",
            "Found by Alice"
          ]}
          speed={36}
        />
      </div>
    </section>
  );
}

function ProblemCard({ scene, index }: { scene: typeof SCENES[number]; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ delay: index * 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="relative"
    >
      <div className="flex items-baseline gap-4">
        <span className="font-mono text-xs text-cinnabar tracking-[0.2em]">{scene.day}</span>
        <span className="h-px flex-1 bg-cream/15" />
      </div>
      <h3 className="mt-4 font-display text-2xl sm:text-3xl text-cream font-semibold leading-tight">
        {scene.headline}
      </h3>
      <p className="mt-4 font-serif text-cream/65 leading-relaxed">
        {scene.body}
      </p>
      <Annotation align="right" className="mt-4 pl-5">
        "{scene.annotation}"
      </Annotation>
    </motion.div>
  );
}
