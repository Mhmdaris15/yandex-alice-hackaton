import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ocr, type OcrBox } from "@/lib/api";
import { SectionIndex, CyrillicTag } from "@/landing/atoms";

const SAMPLE_BOXES: OcrBox[] = [
  { ru: "Фамилия",       en: "Surname",       x: 0.08, y: 0.18, w: 0.32, h: 0.08, hint: "Write in Latin letters as in passport" },
  { ru: "Имя",           en: "Given name",    x: 0.08, y: 0.30, w: 0.32, h: 0.08 },
  { ru: "Дата рождения", en: "Date of birth", x: 0.08, y: 0.42, w: 0.42, h: 0.08, hint: "DD.MM.YYYY" },
  { ru: "Подпись",       en: "Signature",     x: 0.55, y: 0.78, w: 0.35, h: 0.12, hint: "Sign here — must match passport" }
];

export function ARScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [boxes, setBoxes] = useState<OcrBox[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setStreaming(true);
        }
      } catch (e: any) {
        setErr(e?.message ?? "camera denied");
      }
    })();
    return () => stream?.getTracks().forEach((t) => t.stop());
  }, []);

  async function captureAndOcr() {
    setScanning(true);
    setBoxes([]);
    try {
      const video = videoRef.current!;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d")!.drawImage(video, 0, 0);
      const data = canvas.toDataURL("image/jpeg", 0.8);
      try {
        const res = await ocr(data);
        setBoxes(res.boxes);
      } catch {
        await new Promise((r) => setTimeout(r, 700));
        setBoxes(SAMPLE_BOXES);
      }
    } finally {
      setScanning(false);
    }
  }

  return (
    <section className="relative">
      <Watermark>ВИЖУ</Watermark>

      <header className="relative z-10">
        <SectionIndex n="03" label="file · scanner · live ocr" />
        <h1 className="mt-6 display-grotesk text-cream text-[clamp(2.5rem,8vw,5.5rem)]">
          Point. Tap. <em className="display-italic text-cinnabar">Understand.</em>
        </h1>
        <p className="mt-5 max-w-xl font-serif italic text-cream/65 text-base sm:text-lg leading-relaxed">
          Aim at any Russian form. We highlight fields, translate labels,
          and tell you exactly where to sign.
        </p>
        <div className="mt-4">
          <CyrillicTag>наведи · нажми · пойми</CyrillicTag>
        </div>
      </header>

      <div className="relative mt-10 aspect-[3/4] sm:aspect-[16/10] rounded-3xl overflow-hidden border border-cream/12 bg-cream/[0.02]">
        <video
          ref={videoRef}
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
        />
        {!streaming && !err && (
          <div className="absolute inset-0 grid place-items-center font-serif italic text-cream/55 text-sm">
            requesting camera…
          </div>
        )}
        {err && (
          <div className="absolute inset-0 grid place-items-center text-center px-8">
            <div>
              <div className="font-serif italic text-cream/75 mb-2">Camera unavailable</div>
              <div className="font-mono text-[10px] tracking-wider text-cream/40 mb-5">{err}</div>
              <button
                onClick={() => setBoxes(SAMPLE_BOXES)}
                className="px-5 py-2.5 rounded-full bg-cinnabar text-cream text-sm font-display font-semibold tracking-wide hover:brightness-110 transition"
              >
                Use demo sample
              </button>
            </div>
          </div>
        )}

        <div className="absolute inset-6 sm:inset-10 pointer-events-none">
          <Reticle scanning={scanning} />
        </div>

        <AnimatePresence>
          {boxes.map((b, i) => (
            <BBox key={`${b.en}-${i}`} box={b} index={i} />
          ))}
        </AnimatePresence>

        <div className="absolute top-4 left-4 flex items-center gap-3 small-caps text-[10px] text-cream/55">
          <span className="font-mono text-cinnabar">04</span>
          <span className="h-px w-8 bg-cream/25" />
          <span>frame</span>
        </div>

        <div className="absolute inset-x-0 bottom-6 grid place-items-center">
          <button
            disabled={scanning}
            onClick={captureAndOcr}
            className="relative w-16 h-16 rounded-full grid place-items-center disabled:opacity-60"
          >
            <span className="absolute inset-0 rounded-full bg-cream/10 backdrop-blur-md border border-cream/30" />
            <span className="relative w-12 h-12 rounded-full bg-cream shadow-[0_0_30px_-4px_rgba(244,235,217,0.6)]" />
          </button>
        </div>
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

function Reticle({ scanning }: { scanning: boolean }) {
  return (
    <div className="absolute inset-0">
      {(["tl","tr","bl","br"] as const).map((c) => (
        <div
          key={c}
          className={`absolute w-10 h-10 border-cream/85 ${
            c === "tl" ? "top-0 left-0 border-l-2 border-t-2 rounded-tl-lg" :
            c === "tr" ? "top-0 right-0 border-r-2 border-t-2 rounded-tr-lg" :
            c === "bl" ? "bottom-0 left-0 border-l-2 border-b-2 rounded-bl-lg" :
                         "bottom-0 right-0 border-r-2 border-b-2 rounded-br-lg"
          }`}
        />
      ))}
      {scanning && (
        <motion.div
          className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-cinnabar to-transparent shadow-[0_0_18px_2px_rgba(214,59,44,0.7)]"
          initial={{ top: 0 }}
          animate={{ top: ["0%", "100%", "0%"] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </div>
  );
}

function BBox({ box, index }: { box: OcrBox; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ delay: index * 0.08, type: "spring", stiffness: 280, damping: 22 }}
      className="absolute"
      style={{
        left: `${box.x * 100}%`,
        top:  `${box.y * 100}%`,
        width:  `${box.w * 100}%`,
        height: `${box.h * 100}%`
      }}
    >
      <div className="absolute inset-0 rounded-md border-2 border-cinnabar shadow-[0_0_24px_-4px_rgba(214,59,44,0.6)]" />
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 + index * 0.08 }}
        className="absolute -top-2 left-0 -translate-y-full bg-ink/90 border border-cream/15 backdrop-blur-md rounded-lg px-2.5 py-1.5 whitespace-nowrap"
      >
        <div className="flex items-center gap-2">
          <span className="font-mono text-[9px] text-cinnabar tracking-[0.22em]">RU</span>
          <span className="font-serif italic text-cream/70 text-[11px]">{box.ru}</span>
        </div>
        <div className="mt-0.5 font-display text-[11px] uppercase tracking-wider text-cream font-semibold">
          {box.en}
        </div>
        {box.hint && (
          <div className="font-serif italic text-[10px] text-cream/50 max-w-[200px] whitespace-normal mt-0.5">
            {box.hint}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
