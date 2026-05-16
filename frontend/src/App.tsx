import { Routes, Route } from "react-router-dom";
import { Landing } from "@/pages/Landing";
import { AppShell } from "@/pages/AppShell";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/app/*" element={<AppShell />} />
    </Routes>
  );
}
