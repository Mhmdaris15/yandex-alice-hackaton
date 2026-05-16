// Thin client for the Rust backend.
// In dev, Vite proxies `/api/*` and `/ws/*` to localhost:3000.

export interface ChatRequest { message: string; context?: string }
export interface ChatResponse { reply: string; tokens: number }

export async function chat(req: ChatRequest): Promise<ChatResponse> {
  const r = await fetch("/api/ai/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(req)
  });
  if (!r.ok) throw new Error(`chat failed: ${r.status}`);
  return r.json();
}

export interface OcrBox {
  ru: string;
  en: string;
  x: number; y: number; w: number; h: number; // normalized 0..1
  hint?: string;
}
export interface OcrResponse { boxes: OcrBox[]; latency_ms: number }

export async function ocr(imageDataUrl: string): Promise<OcrResponse> {
  const r = await fetch("/api/ocr", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ image: imageDataUrl })
  });
  if (!r.ok) throw new Error(`ocr failed: ${r.status}`);
  return r.json();
}

// Mock translate stream for the Walkie-Talkie when backend unavailable.
export function mockTranslate(input: string, toRu: boolean): Promise<string> {
  const dict: Record<string, string> = {
    "hello": "здравствуйте",
    "where is the metro": "где метро",
    "how much does it cost": "сколько это стоит",
    "i don't speak russian": "я не говорю по-русски",
    "please help me": "пожалуйста, помогите мне",
    "i need a doctor": "мне нужен врач"
  };
  const reverse = Object.fromEntries(
    Object.entries(dict).map(([k, v]) => [v, k])
  );
  const key = input.trim().toLowerCase();
  const found = toRu ? dict[key] : reverse[key];
  return new Promise((resolve) =>
    setTimeout(() => resolve(found ?? (toRu ? "(перевод недоступен)" : "(translation unavailable)")), 600)
  );
}
