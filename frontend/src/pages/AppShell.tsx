import { Routes, Route, NavLink, useLocation, Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { SpatialTimeline } from "@/components/SpatialTimeline";
import { WalkieTalkie } from "@/components/WalkieTalkie";
import { ARScanner } from "@/components/ARScanner";
import { Community } from "@/components/Community";
import { AIOrb } from "@/components/AIOrb";

interface NavEntry { to: string; n: string; label: string; }

const NAV: NavEntry[] = [
  { to: "/app",           n: "01", label: "Journey"   },
  { to: "/app/talk",      n: "02", label: "Translate" },
  { to: "/app/scan",      n: "03", label: "Scan"      },
  { to: "/app/community", n: "04", label: "Pulse"     }
];

export function AppShell() {
  const loc = useLocation();
  return (
    <div className="relative min-h-screen bg-ink text-cream flex flex-col overflow-x-hidden">
      <BackgroundLayer />
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
              <Route index             element={<SpatialTimeline />} />
              <Route path="talk"       element={<WalkieTalkie />} />
              <Route path="scan"       element={<ARScanner />} />
              <Route path="community"  element={<Community />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>

      <BottomNav />
      <AIOrb />
    </div>
  );
}

function BackgroundLayer() {
  return (
    <>
      <div className="absolute inset-0 paper-grain opacity-50 pointer-events-none" />
      <div className="absolute -top-32 -left-40 w-[460px] h-[460px] rounded-full bg-aurora-violet/12 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[380px] h-[380px] rounded-full bg-aurora-cyan/10 blur-[140px] pointer-events-none" />
    </>
  );
}

function Header() {
  const loc = useLocation();
  const active =
    NAV.find((n) => n.to !== "/app" && loc.pathname.startsWith(n.to)) ??
    NAV[0];

  const today = new Date().toLocaleDateString("ru-RU", {
    day: "2-digit", month: "long"
  }).toUpperCase();

  return (
    <header className="relative z-10 pt-8 px-4 sm:px-8 max-w-6xl mx-auto w-full flex items-center justify-between">
      <Link to="/" className="group flex items-center gap-3 select-none">
        <span className="w-7 h-7 rounded-md bg-cream text-ink grid place-items-center font-display font-bold text-sm group-hover:bg-cinnabar group-hover:text-cream transition">
          В
        </span>
        <div className="flex items-baseline gap-2 small-caps text-[10px] text-cream/55">
          <span className="font-mono text-cinnabar">{active.n}</span>
          <span className="text-cream/25">/</span>
          <span className="group-hover:text-cream transition">{active.label}</span>
        </div>
      </Link>

      <div className="flex items-center gap-4 small-caps text-[10px] text-cream/45">
        <span className="hidden sm:inline font-mono">САНКТ-ПЕТЕРБУРГ · {today}</span>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          live
        </span>
      </div>
    </header>
  );
}

function BottomNav() {
  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 backdrop-blur-2xl bg-ink/70 border border-cream/15 rounded-full px-1.5 py-1.5 flex gap-0.5 shadow-deep">
      {NAV.map((n) => (
        <NavLink
          key={n.to}
          to={n.to}
          end={n.to === "/app"}
          className={({ isActive }) =>
            `relative px-4 sm:px-5 py-2.5 rounded-full transition ${
              isActive ? "text-cream" : "text-cream/45 hover:text-cream/85"
            }`
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-full bg-cinnabar"
                  transition={{ type: "spring", stiffness: 360, damping: 30 }}
                />
              )}
              <span className="relative flex items-center gap-2">
                <span className="font-mono text-[10px] opacity-65">{n.n}</span>
                <span className="small-caps text-[10px] hidden sm:inline">{n.label}</span>
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
