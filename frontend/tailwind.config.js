/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["'Space Grotesk'", "Inter", "sans-serif"],
        serif: ["Fraunces", "Georgia", "serif"],
        mono: ["'JetBrains Mono'", "monospace"]
      },
      // ─── USER CONTRIBUTION POINT #2 ────────────────────────────────
      // The brand palette. Currently a cobalt → aurora vibe. Override
      // freely to make this YOUR project's identity. Each token below
      // is referenced by glass panels, the AI orb, and the timeline.
      colors: {
        bg: {
          deep: "#06081a",
          base: "#0a0a23",
          rise: "#11122f"
        },
        aurora: {
          cyan: "#22d3ee",
          violet: "#a855f7",
          rose: "#fb7185"
        },
        cream:    "#f4ebd9",
        parchment:"#ece1c8",
        cinnabar: "#d63b2c",
        ink:      "#0c0a14",
        warn:     "#ff3b30",
        accent:   "#ffd60a"
      },
      boxShadow: {
        glow: "0 0 60px -10px rgb(168 85 247 / 0.5)",
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
        deep: "0 24px 64px -16px rgba(0, 0, 0, 0.6)"
      },
      backgroundImage: {
        aurora:
          "radial-gradient(ellipse at top, rgba(168,85,247,0.25), transparent 50%), radial-gradient(ellipse at bottom, rgba(34,211,238,0.18), transparent 50%)",
        glass:
          "linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))"
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "drift": "drift 14s ease-in-out infinite"
      },
      keyframes: {
        drift: {
          "0%, 100%": { transform: "translate3d(0,0,0)" },
          "50%": { transform: "translate3d(0,-12px,0)" }
        }
      }
    }
  },
  plugins: []
};
