// Thin client for the Rust backend.
// In dev, Vite proxies `/api/*` and `/ws/*` to localhost:3000.

async function jget<T>(url: string): Promise<T> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`GET ${url} → ${r.status}`);
  return r.json();
}

async function jpost<T>(url: string, body: unknown): Promise<T> {
  const r = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`POST ${url} → ${r.status}`);
  return r.json();
}

// ─── AI chat ──────────────────────────────────────────────────────

export interface ChatRequest { message: string; context?: string }
export interface ChatResponse { reply: string; tokens: number; source: "yandex" | "mock" }

export function chat(req: ChatRequest): Promise<ChatResponse> {
  return jpost("/api/ai/chat", req);
}

// ─── OCR ──────────────────────────────────────────────────────────

export interface OcrBox {
  ru: string;
  en: string;
  x: number; y: number; w: number; h: number; // normalized 0..1
  hint?: string;
}
export interface OcrResponse { boxes: OcrBox[]; latency_ms: number; source: "yandex" | "mock" }

export function ocr(imageDataUrl: string): Promise<OcrResponse> {
  return jpost("/api/ocr", { image: imageDataUrl });
}

// ─── Forum ────────────────────────────────────────────────────────

export interface ForumThread {
  id: string;
  country: string;
  university: string;
  author: string;
  avatar: string;
  title: string;
  body: string;
  lang: string;
  created_at: string;
  reply_count: number;
}

export interface ForumReply {
  id: string;
  author: string;
  body: string;
  lang: string;
  created_at: string;
}

export interface ForumThreadDetail {
  thread: ForumThread;
  replies: ForumReply[];
}

export const forum = {
  list: () => jget<ForumThread[]>("/api/forum/threads"),
  detail: (id: string) => jget<ForumThreadDetail>(`/api/forum/threads/${encodeURIComponent(id)}`),
  create: (body: {
    country: string; university: string; author: string;
    avatar?: string; title: string; body: string; lang: string;
  }) => jpost<ForumThread>("/api/forum/threads", body),
  reply: (id: string, body: { author: string; body: string; lang: string }) =>
    jpost<ForumReply>(`/api/forum/threads/${encodeURIComponent(id)}/reply`, body),
  translate: (text: string, target: "ru" | "en", source?: string) =>
    jpost<{ translated: string; source: "yandex" | "mock" }>("/api/forum/translate", { text, target, source }),
};

// ─── Buddy ────────────────────────────────────────────────────────

export interface Buddy {
  id: string;
  name: string;
  country: string;
  country_code: string;
  university: string;
  years_in_russia: number;
  langs: string[];
  interests: string[];
  neighborhood: string;
  bio: string;
  avatar: string;
  online: boolean;
  telegram: string;
  whatsapp?: string;
  match_score: number;
}

export const buddy = {
  list: () => jget<Buddy[]>("/api/buddy/list"),
  get: (id: string) => jget<Buddy>(`/api/buddy/${encodeURIComponent(id)}`),
  intro: (id: string, body: {
    topic: string; lang: "ru" | "en"; from_name?: string; from_country?: string;
  }) => jpost<{ draft: string; source: "yandex" | "mock" }>(
    `/api/buddy/${encodeURIComponent(id)}/intro`, body
  ),
};

// ─── Mock translate (fallback for Walkie-Talkie when backend unreachable) ──

export function mockTranslate(input: string, toRu: boolean): Promise<string> {
  const dict: Record<string, string> = {
    "hello": "здравствуйте",
    "where is the metro": "где метро",
    "how much does it cost": "сколько это стоит",
    "i don't speak russian": "я не говорю по-русски",
    "please help me": "пожалуйста, помогите мне",
    "i need a doctor": "мне нужен врач",
  };
  const reverse = Object.fromEntries(Object.entries(dict).map(([k, v]) => [v, k]));
  const key = input.trim().toLowerCase();
  const found = toRu ? dict[key] : reverse[key];
  return new Promise((resolve) =>
    setTimeout(() => resolve(found ?? (toRu ? "(перевод недоступен)" : "(translation unavailable)")), 600)
  );
}
