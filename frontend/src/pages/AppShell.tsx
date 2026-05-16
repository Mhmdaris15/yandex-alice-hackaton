import { Routes, Route, NavLink, useLocation, Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { SpatialTimeline } from "@/components/SpatialTimeline";
import { WalkieTalkie } from "@/components/WalkieTalkie";
import { ARScanner } from "@/components/ARScanner";
import { Community } from "@/components/Community";
import { AIOrb } from "@/components/AIOrb";

const NAV = [
  { to: "/app",          label: "Journey",   glyph: "◐" },
  { to: "/app/talk",     label: "Translate", glyph: "◉" },
  { to: "/app/scan",     label: "Scan",      glyph: "◇" },
  { to: "/app/community",label: "Pulse",     glyph: "◎" }
];

export function AppShell() {
  const loc = useLocation();
  return (
    <div className="relative min-h-screen flex flex-col">
      <Header />
      <main className="relative z-10 flex-1 pb-32 pt-6 px-4 sm:px-8 max-w-6xl mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={loc.pathname}
            initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -8, filter: "blur(6px)" }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <Routes location={loc}>
              <Route index element={<SpatialTimeline />} />
              <Route path="talk" element={<WalkieTalkie />} />
              <Route path="scan" element={<ARScanner />} />
              <Route path="community" element={<Community />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>

      <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 glass-strong rounded-full px-2 py-2 flex gap-1">
        {NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.to === "/app"}
            className={({ isActive }) =>
              `relative px-4 sm:px-5 py-2.5 rounded-full text-sm font-medium tracking-wide transition ${
                isActive ? "text-white" : "text-white/55 hover:text-white/90"
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-full bg-white/10 ring-aurora"
                    transition={{ type: "spring", stiffness: 360, damping: 30 }}
                  />
                )}
                <span className="relative flex items-center gap-2">
                  <span className="opacity-70">{n.glyph}</span>
                  <span className="hidden sm:inline">{n.label}</span>
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <AIOrb />
    </div>
  );
}

function Header() {
  return (
    <header className="relative z-10 pt-8 px-4 sm:px-8 max-w-6xl mx-auto w-full flex items-center justify-between">
      <Link to="/" className="flex items-center gap-3 group">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-aurora-violet to-aurora-cyan shadow-glow grid place-items-center font-display font-bold">
          В
        </div>
        <div className="leading-tight">
          <div className="font-display text-sm tracking-wide text-gradient">
            Welcome to Russia
          </div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/40 group-hover:text-white/70 transition">
            ← back to landing
          </div>
        </div>
      </Link>
      <div className="hidden sm:flex items-center gap-3 text-xs text-white/50">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        connected
      </div>
    </header>
  );
}
