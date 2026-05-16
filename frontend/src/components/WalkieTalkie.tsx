import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { mockTranslate } from "@/lib/api";
import { useHaptics } from "@/hooks/useHaptics";
import { SectionIndex, CyrillicTag } from "@/landing/atoms";

interface Turn {
  id: number;
  speaker: "you" | "them";
  src: string;
  dst: string;
}

export function WalkieTalkie() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [recording, setRecording] = useState<null | "you" | "them">(null);
  const [draft, setDraft] = useState("");
  const idRef = useRef(0);
  const { buzz } = useHaptics();

  async function commitTurn(speaker: "you" | "them", input: string) {
    if (!input.trim()) return;
    const toRu = speaker === "you";
    const dst = await mockTranslate(input, toRu);
    setTurns((prev) => [...prev, { id: ++idRef.current, speaker, src: input, dst }]);
  }

  return (
    <section className="relative">
      <Watermark>ГОЛОС</Watermark>

      <header className="relative z-10">
        <SectionIndex n="02" label="file · walkie-talkie · live translate" />
        <h1 className="mt-6 display-grotesk text-cream text-[clamp(2.5rem,8vw,5.5rem)]">
          Hold. Speak. <em className="display-italic text-cinnabar">Show.</em>
        </h1>
        <p className="mt-5 max-w-xl font-serif italic text-cream/65 text-base sm:text-lg leading-relaxed">
          Push and hold to speak. The phone is meant to be flipped — the
          other person reads upside-down at the top.
        </p>
        <div className="mt-4">
          <CyrillicTag>прижми · скажи · покажи</CyrillicTag>
        </div>
      </header>

      <div className="relative mt-10 grid grid-rows-[1fr_auto_1fr] border border-cream/12 bg-cream/[0.02] rounded-3xl overflow-hidden min-h-[60vh]">
        <ConvoSide
          turns={turns}
          show="dst"
          rotated
          label="Русский"
          empty="Скажите 'привет' собеседнику"
        />

        <div className="relative border-y border-cream/10 bg-cream/[0.01] py-6 px-4 grid place-items-center">
          <div className="flex items-center gap-6">
            <PTTButton
              side="them"
              active={recording === "them"}
              onDown={() => { setRecording("them"); buzz([8, 24, 8]); }}
              onUp={() => { setRecording(null); commitTurn("them", "здравствуйте"); buzz(4); }}
            />
            <div className="text-center px-4 min-w-[120px]">
              <div className="small-caps text-[10px] text-cream/40">live</div>
              <div className="mt-1 font-mono text-xs text-cream/65">
                {recording ? "listening…" : "hold a button"}
              </div>
            </div>
            <PTTButton
              side="you"
              active={recording === "you"}
              onDown={() => { setRecording("you"); buzz([8, 24, 8]); }}
              onUp={() => { setRecording(null); commitTurn("you", draft || "hello"); setDraft(""); buzz(4); }}
            />
          </div>

          <div className="mt-5 w-full max-w-md flex gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { commitTurn("you", draft); setDraft(""); }
              }}
              placeholder="…or type a phrase to translate"
              className="flex-1 bg-cream/5 border border-cream/15 rounded-full px-5 py-2.5 text-sm text-cream placeholder:text-cream/30 focus:outline-none focus:ring-2 focus:ring-cinnabar/50 focus:border-cinnabar/40"
            />
            <button
              onClick={() => { commitTurn("you", draft); setDraft(""); }}
              className="px-5 py-2.5 rounded-full bg-cinnabar text-cream text-sm font-display font-semibold tracking-wide hover:brightness-110 transition"
            >
              Send
            </button>
          </div>
        </div>

        <ConvoSide
          turns={turns}
          show="src"
          label="English"
          empty="Press the right pad and say something."
        />
      </div>
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

function ConvoSide({
  turns, show, label, empty, rotated = false
}: {
  turns: Turn[]; show: "src" | "dst"; label: string; empty: string; rotated?: boolean;
}) {
  const filter = show === "src" ? "you" : "them";
  return (
    <div
      className="relative p-6 sm:p-8 overflow-hidden"
      style={rotated ? { transform: "rotate(180deg)" } : undefined}
    >
      <div className="flex items-center gap-3">
        <span className="font-mono text-[10px] text-cinnabar tracking-[0.22em]">{label}</span>
        <span className="h-px flex-1 bg-cream/15" />
      </div>
      <div className="mt-4 flex flex-col gap-3 max-h-[28vh] overflow-y-auto pr-2">
        <AnimatePresence initial={false}>
          {turns.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="font-serif italic text-cream/40 text-base"
            >
              {empty}
            </motion.div>
          )}
          {turns.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 font-serif text-base leading-snug ${
                t.speaker === filter
                  ? "self-start bg-cream/8 border border-cream/15 text-cream/90"
                  : "self-end bg-cinnabar/15 border border-cinnabar/30 text-cream"
              }`}
            >
              {t[show]}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function PTTButton({
  active, side, onDown, onUp
}: {
  active: boolean; side: "you" | "them"; onDown: () => void; onUp: () => void;
}) {
  const ringColor = side === "you" ? "#d63b2c" : "#22d3ee";
  return (
    <motion.button
      onPointerDown={onDown}
      onPointerUp={onUp}
      onPointerLeave={() => active && onUp()}
      whileTap={{ scale: 0.94 }}
      animate={active ? { scale: 1.05 } : { scale: 1 }}
      transition={{ type: "spring", stiffness: 380, damping: 18 }}
      className="relative w-20 h-20 rounded-full select-none"
    >
      <span
        className="absolute inset-0 rounded-full"
        style={{
          background:
            side === "you"
              ? "radial-gradient(circle at 30% 30%, #f5e3d8, #d63b2c)"
              : "radial-gradient(circle at 30% 30%, #cfe9ff, #1e6788)",
          boxShadow: active
            ? `0 0 0 6px rgba(244,235,217,0.08), 0 0 60px ${ringColor}99`
            : "0 12px 36px -8px rgba(0,0,0,0.6)"
        }}
      />
      {active && (
        <motion.span
          className="absolute inset-0 rounded-full border"
          style={{ borderColor: ringColor }}
          animate={{ scale: [1, 1.6], opacity: [0.7, 0] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
      )}
      <span className="relative grid place-items-center w-full h-full font-display text-[10px] uppercase tracking-[0.25em] text-ink">
        {side === "you" ? "EN→" : "←RU"}
      </span>
    </motion.button>
  );
}
