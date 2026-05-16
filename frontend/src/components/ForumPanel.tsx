import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { forum, type ForumThread, type ForumReply } from "@/lib/api";

const FLAGS: Record<string, string> = {
  KZ: "🇰🇿", CN: "🇨🇳", EG: "🇪🇬", CO: "🇨🇴",
  ID: "🇮🇩", RU: "🇷🇺", NG: "🇳🇬", IN: "🇮🇳", VN: "🇻🇳", IR: "🇮🇷"
};

export function ForumPanel() {
  const [threads, setThreads] = useState<ForumThread[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);

  async function refresh() {
    try {
      const data = await forum.list();
      setThreads(data);
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? "fetch failed");
      // Fallback so the demo never looks empty
      setThreads(FALLBACK_THREADS);
    }
  }

  useEffect(() => { refresh(); }, []);

  return (
    <div className="grid lg:grid-cols-[1.4fr,1fr] gap-6">
      <div className="border border-cream/12 bg-cream/[0.02] rounded-3xl p-5 sm:p-7 flex flex-col min-h-[60vh]">
        <header className="flex items-center gap-3">
          <span className="font-mono text-[10px] text-cinnabar tracking-[0.22em]">LETTERS · WALL</span>
          <span className="h-px flex-1 bg-cream/15" />
          <button
            onClick={() => setComposing((s) => !s)}
            className="px-4 py-1.5 rounded-full bg-cinnabar text-cream text-xs font-display font-semibold tracking-wide hover:brightness-110 transition"
          >
            {composing ? "Cancel" : "Post →"}
          </button>
        </header>

        <AnimatePresence>
          {composing && (
            <NewThreadComposer
              onDone={(t) => {
                setThreads((prev) => prev ? [t, ...prev] : [t]);
                setComposing(false);
              }}
              onCancel={() => setComposing(false)}
            />
          )}
        </AnimatePresence>

        {error && (
          <div className="mt-4 font-serif italic text-cream/45 text-sm">
            backend offline — showing demo letters
          </div>
        )}

        <div className="mt-5 flex flex-col divide-y divide-cream/8">
          {(threads ?? []).map((t) => (
            <ThreadRow
              key={t.id}
              thread={t}
              selected={open === t.id}
              onClick={() => setOpen(t.id === open ? null : t.id)}
            />
          ))}
          {threads && threads.length === 0 && (
            <div className="py-12 text-center font-serif italic text-cream/45">
              No threads yet. Be the first to write.
            </div>
          )}
        </div>
      </div>

      <div className="border border-cream/12 bg-cream/[0.02] rounded-3xl p-5 sm:p-7 min-h-[60vh] flex flex-col">
        <AnimatePresence mode="wait">
          {open ? (
            <ThreadDetail key={open} id={open} onPosted={refresh} />
          ) : (
            <motion.div
              key="hint"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="m-auto text-center max-w-xs"
            >
              <div className="display-italic text-cinnabar text-4xl">¶</div>
              <p className="mt-4 font-serif italic text-cream/55 text-sm">
                Pick a letter on the left to read the replies — or tap "Post" to add yours.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Thread row ───────────────────────────────────────────────────

function ThreadRow({
  thread, selected, onClick
}: { thread: ForumThread; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`group text-left py-4 flex items-start gap-4 transition ${
        selected ? "" : "opacity-90 hover:opacity-100"
      }`}
    >
      <Avatar src={thread.avatar} name={thread.author} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <CountryTag code={thread.country} />
          <span className="font-mono text-[9px] text-cream/40 tracking-[0.18em]">
            {thread.university.toUpperCase()}
          </span>
          <span className="h-px w-6 bg-cream/15" />
          <span className="font-mono text-[9px] text-cream/35 tracking-[0.18em]">
            {timeAgo(thread.created_at)}
          </span>
        </div>

        <h3 className="mt-1.5 font-display font-semibold text-cream text-lg leading-snug">
          "{thread.title}"
        </h3>
        <p className="mt-1 font-serif italic text-cream/55 text-sm line-clamp-2">
          {thread.body}
        </p>

        <div className="mt-2 flex items-center gap-3 text-[10px] text-cream/45">
          <span className="font-mono uppercase tracking-[0.18em]">{thread.author}</span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <span className="opacity-65">⮑</span>
            {thread.reply_count} {thread.reply_count === 1 ? "reply" : "replies"}
          </span>
          <span className="flex items-center gap-1.5 ml-auto">
            <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-cream/35">{thread.lang}</span>
            {selected && <span className="w-1.5 h-1.5 rounded-full bg-cinnabar shadow-[0_0_10px_#d63b2c]" />}
          </span>
        </div>
      </div>
    </button>
  );
}

// ─── Thread detail (right pane) ───────────────────────────────────

function ThreadDetail({ id, onPosted }: { id: string; onPosted: () => void }) {
  const [data, setData] = useState<{ thread: ForumThread; replies: ForumReply[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setData(null); setError(null);
    forum.detail(id)
      .then(setData)
      .catch((e: any) => {
        setError(e?.message ?? "fetch failed");
        const t = FALLBACK_THREADS.find((x) => x.id === id);
        if (t) setData({ thread: t, replies: [] });
      });
  }, [id]);

  if (!data) {
    return (
      <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="m-auto text-center">
        <div className="font-serif italic text-cream/45">{error ? "demo letter" : "opening letter…"}</div>
      </motion.div>
    );
  }

  async function submit() {
    if (!reply.trim() || busy) return;
    setBusy(true);
    try {
      const r = await forum.reply(id, {
        author: "You · ITMO",
        body: reply,
        lang: /[А-Яа-яЁё]/.test(reply) ? "ru" : "en",
      });
      setData((d) => d ? { thread: { ...d.thread, reply_count: d.thread.reply_count + 1 },
                            replies: [...d.replies, r] } : d);
      setReply("");
      onPosted();
    } catch (e) {
      // Optimistic fallback so demo still works offline
      setData((d) => d ? { ...d, replies: [...d.replies, {
        id: `local-${Date.now()}`, author: "You · ITMO", body: reply,
        lang: /[А-Яа-яЁё]/.test(reply) ? "ru" : "en",
        created_at: new Date().toISOString(),
      }]} : d);
      setReply("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <motion.div
      key="detail"
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      className="flex flex-col h-full"
    >
      <div className="flex items-center gap-3">
        <span className="font-mono text-[10px] text-cinnabar tracking-[0.22em]">LETTER · OPEN</span>
        <span className="h-px flex-1 bg-cream/15" />
      </div>

      <div className="mt-4 flex items-start gap-3">
        <Avatar src={data.thread.avatar} name={data.thread.author} />
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <CountryTag code={data.thread.country} />
            <span className="font-mono text-[9px] text-cream/40 tracking-[0.18em]">
              {data.thread.university.toUpperCase()}
            </span>
            <span className="font-mono text-[9px] text-cream/30 tracking-[0.18em]">
              · {timeAgo(data.thread.created_at)}
            </span>
          </div>
          <h2 className="mt-1 display-grotesk text-cream text-2xl sm:text-3xl leading-tight">
            "{data.thread.title}"
          </h2>
          <PostBody body={data.thread.body} lang={data.thread.lang} />
          <div className="mt-1 font-mono text-[10px] text-cream/40 tracking-[0.18em] uppercase">
            — {data.thread.author}
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <span className="font-mono text-[10px] text-cream/45 tracking-[0.22em]">
          REPLIES · {data.replies.length}
        </span>
        <span className="h-px flex-1 bg-cream/10" />
      </div>

      <div className="mt-3 flex-1 overflow-y-auto flex flex-col gap-4 pr-1">
        {data.replies.map((r, i) => (
          <ReplyRow key={r.id} reply={r} index={i} />
        ))}
        {data.replies.length === 0 && (
          <div className="font-serif italic text-cream/40 text-sm py-6 text-center">
            No replies yet. Yours could be the first.
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-cream/10">
        <textarea
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          rows={2}
          placeholder="Write a reply (RU or EN — we'll detect)…"
          className="w-full bg-cream/5 border border-cream/15 rounded-2xl px-4 py-3 text-sm text-cream placeholder:text-cream/30 focus:outline-none focus:ring-2 focus:ring-cinnabar/50 focus:border-cinnabar/40 resize-none font-serif"
        />
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="font-mono text-[9px] text-cream/35 tracking-[0.18em] uppercase">
            posting as · you · itmo
          </span>
          <button
            onClick={submit}
            disabled={busy || !reply.trim()}
            className="px-5 py-2 rounded-full bg-cinnabar text-cream text-sm font-display font-semibold tracking-wide disabled:opacity-40 hover:brightness-110 transition"
          >
            {busy ? "Posting…" : "Reply →"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function ReplyRow({ reply, index }: { reply: ForumReply; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      className="flex items-start gap-3"
    >
      <Avatar size="sm" name={reply.author} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="font-display font-semibold text-cream text-sm">{reply.author}</span>
          <span className="font-mono text-[9px] text-cream/35 tracking-[0.18em]">
            {timeAgo(reply.created_at)}
          </span>
          <span className="font-mono text-[9px] text-cream/30 tracking-[0.18em] uppercase">
            · {reply.lang}
          </span>
        </div>
        <PostBody body={reply.body} lang={reply.lang} compact />
      </div>
    </motion.div>
  );
}

// ─── On-demand translation block ──────────────────────────────────

function PostBody({ body, lang, compact = false }: { body: string; lang: string; compact?: boolean }) {
  const [translated, setTranslated] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [provenance, setProvenance] = useState<"yandex" | "mock" | null>(null);
  const target: "ru" | "en" = lang === "ru" ? "en" : "ru";

  async function translate() {
    if (busy) return;
    setBusy(true);
    try {
      const r = await forum.translate(body, target, lang);
      setTranslated(r.translated);
      setProvenance(r.source);
    } catch {
      setTranslated(`[demo] ${body}`);
      setProvenance("mock");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={compact ? "mt-1" : "mt-3"}>
      <p className={`font-serif text-cream/85 leading-relaxed ${compact ? "text-sm" : ""}`}>
        {body}
      </p>
      {!translated ? (
        <button
          onClick={translate}
          disabled={busy}
          className="mt-1.5 font-mono text-[10px] tracking-[0.18em] text-cream/40 hover:text-cinnabar uppercase transition"
        >
          {busy
            ? "translating…"
            : target === "ru" ? "перевести → ru" : "translate → en"}
        </button>
      ) : (
        <div className="mt-2 pl-3 border-l-2 border-cinnabar/50">
          <p className="font-serif italic text-cream/65 text-sm leading-relaxed">
            {translated}
          </p>
          {provenance && (
            <span className="font-mono text-[9px] text-cream/30 tracking-[0.18em] uppercase">
              via {provenance}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ─── New thread composer ──────────────────────────────────────────

function NewThreadComposer({
  onDone, onCancel
}: { onDone: (t: ForumThread) => void; onCancel: () => void }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [country, setCountry] = useState("ID");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!title.trim() || !body.trim() || busy) return;
    setBusy(true);
    try {
      const t = await forum.create({
        country, university: "ITMO",
        author: "You · ITMO",
        avatar: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=120&q=80&auto=format&fit=crop",
        title, body,
        lang: /[А-Яа-яЁё]/.test(body) ? "ru" : "en",
      });
      onDone(t);
    } catch {
      // optimistic offline fallback
      onDone({
        id: `local-${Date.now()}`,
        country, university: "ITMO",
        author: "You · ITMO",
        avatar: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=120&q=80&auto=format&fit=crop",
        title, body,
        lang: /[А-Яа-яЁё]/.test(body) ? "ru" : "en",
        created_at: new Date().toISOString(),
        reply_count: 0,
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="mt-4 overflow-hidden"
    >
      <div className="border border-cinnabar/30 bg-cinnabar/[0.04] rounded-2xl p-4 space-y-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder='Title — e.g. "Halal food near Sportivnaya?"'
          className="w-full bg-transparent border-b border-cream/15 pb-2 text-cream placeholder:text-cream/30 focus:outline-none focus:border-cinnabar font-display font-semibold"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          placeholder="Tell the wall what you need. RU or EN."
          className="w-full bg-cream/5 border border-cream/10 rounded-xl px-3 py-2 text-sm font-serif text-cream placeholder:text-cream/30 focus:outline-none focus:ring-2 focus:ring-cinnabar/50 resize-none"
        />
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-cream/45 tracking-[0.18em] uppercase">flag</span>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="bg-cream/5 border border-cream/10 rounded-md px-2 py-1 text-sm text-cream"
          >
            {["ID","KZ","CN","EG","CO","RU","NG","IN","VN","IR"].map((c) =>
              <option key={c} value={c} className="bg-ink">{c}</option>
            )}
          </select>
          <button
            onClick={onCancel}
            className="ml-auto px-4 py-1.5 rounded-full border border-cream/15 text-cream/70 text-xs font-display tracking-wide hover:bg-cream/5 transition"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={busy || !title.trim() || !body.trim()}
            className="px-4 py-1.5 rounded-full bg-cinnabar text-cream text-xs font-display font-semibold tracking-wide disabled:opacity-40 hover:brightness-110 transition"
          >
            {busy ? "Posting…" : "Post →"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── helpers ──────────────────────────────────────────────────────

function Avatar({ src, name, size = "md" }: { src?: string; name: string; size?: "sm" | "md" }) {
  const px = size === "sm" ? "w-8 h-8 text-[10px]" : "w-11 h-11 text-xs";
  const initials = name.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  return (
    <div className={`relative ${px} rounded-xl bg-cream text-ink grid place-items-center font-display font-bold overflow-hidden shrink-0`}>
      {src ? (
        <img
          src={src}
          alt={name}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
        />
      ) : null}
      <span className="relative">{initials}</span>
    </div>
  );
}

function CountryTag({ code }: { code: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cream/5 border border-cream/10 font-mono text-[10px] tracking-[0.18em] text-cream/75 uppercase">
      <span className="text-base leading-none">{FLAGS[code] ?? "🌐"}</span>
      {code}
    </span>
  );
}

function timeAgo(iso: string): string {
  const dt = new Date(iso).getTime();
  if (isNaN(dt)) return "—";
  const mins = Math.max(1, Math.round((Date.now() - dt) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}

// ─── Offline fallback content ─────────────────────────────────────

const FALLBACK_THREADS: ForumThread[] = [
  {
    id: "demo-1",
    country: "KZ", university: "HSE", author: "Aigerim K.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120",
    title: "Where do I find a notary who won't make me cry?",
    body: "Need a sworn translation of my diploma. Tried 3 places near Sennaya and none speak English. Anyone in SPb with a recommendation?",
    lang: "en", created_at: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    reply_count: 2,
  },
  {
    id: "demo-2",
    country: "ID", university: "ITMO", author: "Riza P.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120",
    title: "Halal food near Vyazemsky dormitory?",
    body: "Hi everyone, just moved into общежитие №3. Any halal places within walking distance?",
    lang: "en", created_at: new Date(Date.now() - 92 * 60 * 1000).toISOString(),
    reply_count: 3,
  },
];
