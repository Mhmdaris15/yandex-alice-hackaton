import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="relative bg-ink text-cream/65 px-6 sm:px-12 py-16 overflow-hidden">
      <div className="absolute inset-x-0 bottom-0 flex justify-center pointer-events-none">
        <span className="display-grotesk text-cream/[0.04] text-[26vw] leading-none whitespace-nowrap">
          АЛИСА
        </span>
      </div>

      <div className="relative max-w-7xl mx-auto">
        <div className="grid md:grid-cols-[2fr,1fr,1fr,1fr] gap-12">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-aurora-violet to-aurora-cyan shadow-glow grid place-items-center font-display font-bold text-white">
                В
              </div>
              <div className="leading-tight">
                <div className="font-display font-semibold text-cream">Welcome to Russia</div>
                <div className="small-caps text-[10px] text-cream/40">AI fixer · 2025</div>
              </div>
            </div>
            <p className="mt-6 font-serif italic text-cream/55 max-w-md">
              A project for the Yandex Alice Hackathon. Built in love with
              international students who deserved better paperwork.
            </p>
          </div>

          {[
            { h: "Product", items: [
              ["Journey", "/app"],
              ["Translate", "/app/talk"],
              ["Scan", "/app/scan"],
              ["Pulse", "/app/community"]
            ] as [string, string][] },
            { h: "Story", items: [
              ["Problem", "#problem"],
              ["Solution", "#solution"],
              ["Features", "#features"],
              ["Maker", "#maker"]
            ] as [string, string][] },
            { h: "Made with", items: [
              ["Alice + AI Studio", ""],
              ["Yandex Maps", ""],
              ["SurrealDB", ""],
              ["Axum · Rust", ""]
            ] as [string, string][] }
          ].map((col) => (
            <div key={col.h}>
              <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-cream/35">
                {col.h}
              </div>
              <ul className="mt-4 space-y-2">
                {col.items.map(([label, to]) => (
                  <li key={label}>
                    {to ? (
                      to.startsWith("/")
                        ? <Link to={to} className="font-display text-sm hover:text-cream transition">{label}</Link>
                        : <a href={to} className="font-display text-sm hover:text-cream transition">{label}</a>
                    ) : (
                      <span className="font-display text-sm">{label}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 pt-6 border-t border-cream/10 flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between">
          <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-cream/40">
            © 2025 · Welcome to Russia · Open the app any time you arrive somewhere new.
          </span>
          <span className="font-serif italic text-cream/55 text-sm">
            "Если ты потерялся — позови Алису."
          </span>
        </div>
      </div>
    </footer>
  );
}
