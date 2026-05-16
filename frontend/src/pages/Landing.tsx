import { useEffect } from "react";
import { Hero } from "@/landing/Hero";
import { Problem } from "@/landing/Problem";
import { Solution } from "@/landing/Solution";
import { Demo } from "@/landing/Demo";
import { Features } from "@/landing/Features";
import { Developer } from "@/landing/Developer";
import { Footer } from "@/landing/Footer";

export function Landing() {
  // Mouse-tracked CSS vars for feature cell hover glows.
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const root = document.documentElement;
      root.style.setProperty("--mx", `${e.clientX}px`);
      root.style.setProperty("--my", `${e.clientY}px`);
      const targets = document.querySelectorAll<HTMLElement>("[data-mxy]");
      targets.forEach((t) => {
        const r = t.getBoundingClientRect();
        t.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
        t.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
      });
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  return (
    <div className="bg-ink text-cream">
      <Hero />
      <Problem />
      <Solution />
      <Demo />
      <Features />
      <Developer />
      <Footer />
    </div>
  );
}
