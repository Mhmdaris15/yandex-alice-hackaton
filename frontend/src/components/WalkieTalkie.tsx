import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { mockTranslate } from "@/lib/api";
import { useHaptics } from "@/hooks/useHaptics";

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
    setTurns((prev) => [
      ...prev,
      { id: ++idRef.current, speaker, src: input, dst }
    ]);
  }

  return (
    <section className="relative">
      <header className="flex items-center justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.25em] text-white/40">Walkie-Talkie</div>
          <h1 className="mt-1 font-display text-3xl sm:text-5xl font-bold text-gradient">Hold. Speak. Show.</h1>
          <p className="mt-2 text-white/55 max-w-xl text-sm">
            Push and hold to speak. The phone is meant to be flipped — the other
            person reads upside-down at the top.
          </p>
        </div>
      </header>

      <div className="mt-8 grid grid-rows-[1fr_auto_1fr] glass-strong rounded-3xl overflow-hidden min-h-[60vh]">
        {/* Russian side — rotated for the listener */}
        <ConvoSide
          turns={turns}
          show="dst"
          rotated
          label="Русский"
          empty="Скажите 'привет' собеседнику"
        />

        {/* Divider with the PTT cluster */}
        <div className="relative border-y border-white/10 bg-white/[0.02] py-6 px-4 grid place-items-center">
          <div className="flex items-center gap-6">
            <PTTButton
              side="them"
              active={recording === "them"}
              onDown={() => { setRecording("them"); buzz([8, 24, 8]); }}
              onUp={() => { setRecording(null); commitTurn("them", "здравствуйте"); buzz(4); }}
            />
            <div className="text-center px-4">
              <div className="text-[10px] uppercase tracking-[0.25em] text-white/40">live</div>
              <div className="font-mono text-xs text-white/70 mt-1">
                {recording ? "listening…" : "tap & hold"}
              </div>
            </div>
            <PTTButton
              side="you"
              active={recording === "you"}
              onDown={() => { setRecording("you"); buzz([8, 24, 8]); }}
              onUp={() => { setRecording(null); commitTurn("you", draft || "hello"); setDraft(""); buzz(4); }}
            />
          </div>

          {/* Type-to-translate fallback (also useful in noisy areas) */}
          <div className="mt-5 w-full max-w-md flex gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { commitTurn("you", draft); setDraft(""); }
              }}
              placeholder="…or type what to translate"
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-aurora-violet/50"
            />
            <button
              onClick={() => { commitTurn("you", draft); setDraft(""); }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-aurora-violet to-aurora-cyan text-sm font-medium"
            >
              Send
            </button>
          </div>
        </div>

        {/* English side — student */}
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

function ConvoSide({
  turns,
  show,
  label,
  empty,
  rotated = false
}: {
  turns: Turn[];
  show: "src" | "dst";
  label: string;
  empty: string;
  rotated?: boolean;
}) {
  const filter = show === "src" ? "you" : "them";
  return (
    <div
      className="relative p-6 sm:p-8 overflow-hidden"
      style={rotated ? { transform: "rotate(180deg)" } : undefined}
    >
      <div className="text-[10px] uppercase tracking-[0.25em] text-white/30 mb-3">{label}</div>
      <div className="flex flex-col gap-3 max-h-[28vh] overflow-y-auto pr-2">
        <AnimatePresence initial={false}>
          {turns.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-white/35 text-sm italic"
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
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-snug ${
                t.speaker === filter
                  ? "self-start bg-white/8 border border-white/10"
                  : "self-end bg-gradient-to-br from-aurora-violet/30 to-aurora-cyan/30 border border-white/10"
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
  active,
  side,
  onDown,
  onUp
}: {
  active: boolean;
  side: "you" | "them";
  onDown: () => void;
  onUp: () => void;
}) {
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
              ? "radial-gradient(circle at 30% 30%, #a855f7, #5b21b6)"
              : "radial-gradient(circle at 30% 30%, #22d3ee, #0369a1)",
          boxShadow: active
            ? "0 0 0 6px rgba(255,255,255,0.06), 0 0 60px rgba(168,85,247,0.6)"
            : "0 12px 36px -8px rgba(0,0,0,0.6)"
        }}
      />
      {active && (
        <motion.span
          className="absolute inset-0 rounded-full border border-white/30"
          animate={{ scale: [1, 1.6], opacity: [0.7, 0] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
      )}
      <span className="relative grid place-items-center w-full h-full text-white font-display text-xs uppercase tracking-[0.2em]">
        {side === "you" ? "EN→" : "←RU"}
      </span>
    </motion.button>
  );
}
