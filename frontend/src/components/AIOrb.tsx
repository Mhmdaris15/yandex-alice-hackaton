import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";
import { chat } from "@/lib/api";

const CONTEXT_HINTS: Record<string, string> = {
  "/":    "Ask about any milestone — Alice has your timeline open.",
  "/talk":"Need a specific Russian phrase? I can prep one for you.",
  "/scan":"Point at a document and tap. I'll explain every field."
};

interface Msg { id: number; role: "user" | "alice"; text: string }

export function AIOrb() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const idRef = useRef(0);
  const loc = useLocation();
  const hint = CONTEXT_HINTS[loc.pathname] ?? "Ask Alice anything.";

  async function send() {
    if (!draft.trim() || busy) return;
    const userMsg: Msg = { id: ++idRef.current, role: "user", text: draft };
    setMsgs((m) => [...m, userMsg]);
    setDraft("");
    setBusy(true);
    try {
      const r = await chat({ message: userMsg.text, context: loc.pathname }).catch(() => null);
      const text = r?.reply ??
        "I'm offline right now, but your migration card is still valid until next month. Try checking the timeline.";
      setMsgs((m) => [...m, { id: ++idRef.current, role: "alice", text }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <motion.button
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-24 right-6 z-40 w-14 h-14 rounded-full grid place-items-center select-none ring-2 ring-cinnabar/40 ring-offset-2 ring-offset-ink"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, rgba(168,85,247,0.9), rgba(34,211,238,0.7))",
          boxShadow: "0 0 32px -4px rgba(168,85,247,0.55), 0 0 64px -16px rgba(34,211,238,0.4), 0 0 0 1px rgba(214,59,44,0.25)"
        }}
      >
        <motion.span
          className="absolute inset-0 rounded-full border border-cream/45"
          animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 2.8, repeat: Infinity }}
        />
        <span className="relative font-display font-bold text-cream">A</span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-bg-deep/60 backdrop-blur-md"
              onClick={() => setOpen(false)}
            />
            <motion.div
              role="dialog"
              initial={{ y: 60, opacity: 0, scale: 0.96 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 40, opacity: 0, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
              className="relative w-full max-w-lg bg-ink/95 border border-cream/15 backdrop-blur-2xl rounded-3xl overflow-hidden shadow-deep"
            >
              <div className="p-5 border-b border-cream/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-aurora-violet to-aurora-cyan shadow-glow grid place-items-center font-bold text-cream ring-1 ring-cinnabar/40">A</div>
                  <div>
                    <div className="flex items-center gap-2 small-caps text-[10px] text-cream/45">
                      <span className="font-mono text-cinnabar">A.I.</span>
                      <span className="text-cream/25">/</span>
                      <span>Alice</span>
                    </div>
                    <div className="mt-0.5 font-serif italic text-cream/65 text-sm">{hint}</div>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-full bg-cream/5 border border-cream/15 grid place-items-center text-cream/55 hover:bg-cream hover:text-ink transition"
                >✕</button>
              </div>

              <ConversationView msgs={msgs} busy={busy} />

              <div className="p-3 border-t border-cream/10 flex gap-2">
                <input
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                  placeholder={hint}
                  className="flex-1 bg-cream/5 border border-cream/15 rounded-full px-5 py-2.5 text-sm text-cream placeholder:text-cream/30 focus:outline-none focus:ring-2 focus:ring-cinnabar/50 focus:border-cinnabar/40"
                />
                <button
                  onClick={send}
                  disabled={busy}
                  className="px-5 py-2.5 rounded-full bg-cinnabar text-cream text-sm font-display font-semibold tracking-wide disabled:opacity-50 hover:brightness-110 transition"
                >
                  Ask
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function ConversationView({ msgs, busy }: { msgs: Msg[]; busy: boolean }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, busy]);

  return (
    <div ref={scrollerRef} className="max-h-[50vh] min-h-[180px] overflow-y-auto p-5 flex flex-col gap-3">
      {msgs.length === 0 && (
        <div className="font-serif italic text-cream/45 text-sm">
          Try: <span className="text-cream/70">"When does my migration card expire?"</span> or <span className="text-cream/70">"Translate 'where is the metro'"</span>
        </div>
      )}
      {msgs.map((m) => (
        <motion.div
          key={m.id}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 26 }}
          className={`max-w-[85%] rounded-2xl px-4 py-2.5 font-serif text-[15px] leading-snug ${
            m.role === "user"
              ? "self-end bg-cream/10 border border-cream/15 text-cream"
              : "self-start bg-cinnabar/15 border border-cinnabar/25 text-cream"
          }`}
        >
          {m.text}
        </motion.div>
      ))}
      {busy && (
        <div className="self-start bg-cream/5 border border-cream/10 rounded-2xl px-4 py-2.5 text-sm flex gap-1.5">
          <Dot delay={0} /><Dot delay={0.15} /><Dot delay={0.3} />
        </div>
      )}
    </div>
  );
}

function Dot({ delay }: { delay: number }) {
  return (
    <motion.span
      className="w-1.5 h-1.5 rounded-full bg-cinnabar"
      animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
      transition={{ duration: 1, repeat: Infinity, delay }}
    />
  );
}
