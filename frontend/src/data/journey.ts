// ─── USER CONTRIBUTION POINT #1 ───────────────────────────────────────
// The Journey Timeline content. Each node is a milestone in a student's
// first 30 days in Russia. Edit these to tell YOUR story — the order,
// labels, descriptions, and accents drive the entire main view.
//
// `phase` groups nodes visually. `accent` picks the node's halo color.
// `status` is "done" | "active" | "upcoming" and affects styling.
// ─────────────────────────────────────────────────────────────────────

export type JourneyAccent = "violet" | "cyan" | "rose" | "amber";
export type JourneyStatus = "done" | "active" | "upcoming";

export interface JourneyNode {
  id: string;
  day: number;
  phase: "Pre-Arrival" | "Day 1" | "Bureaucracy" | "Settled";
  title: string;
  subtitle: string;
  accent: JourneyAccent;
  status: JourneyStatus;
  checklist: string[];
}

export const JOURNEY: JourneyNode[] = [
  {
    id: "visa",
    day: -14,
    phase: "Pre-Arrival",
    title: "Invitation & Visa",
    subtitle: "Verify your university invitation letter and visa stamp.",
    accent: "violet",
    status: "done",
    checklist: [
      "Confirm invitation reference number with university",
      "Visa stamp dates match flight",
      "Photocopy passport + visa (3 copies)"
    ]
  },
  {
    id: "airport",
    day: 0,
    phase: "Day 1",
    title: "Sheremetyevo Arrival",
    subtitle: "Customs, SIM card, Yandex Taxi to the dorm.",
    accent: "cyan",
    status: "done",
    checklist: [
      "Keep migration card (do not lose)",
      "Buy Yota or MTS SIM at terminal D",
      "Open Yandex Go and link card"
    ]
  },
  {
    id: "registration",
    day: 3,
    phase: "Bureaucracy",
    title: "Migration Registration",
    subtitle: "Submit migration card to university international office.",
    accent: "amber",
    status: "active",
    checklist: [
      "Hand migration card to int'l office",
      "Receive registration slip (отрывной талон)",
      "Photograph slip — you'll need it for everything"
    ]
  },
  {
    id: "medical",
    day: 7,
    phase: "Bureaucracy",
    title: "Medical Exam",
    subtitle: "Mandatory HIV + TB screening at approved clinic.",
    accent: "rose",
    status: "upcoming",
    checklist: [
      "Bring passport + 2 photos (3x4cm)",
      "Fasting not required",
      "Results in ~5 business days"
    ]
  },
  {
    id: "bank",
    day: 10,
    phase: "Bureaucracy",
    title: "Open Bank Account",
    subtitle: "T-Bank or Sber for stipend + Yandex Pay.",
    accent: "violet",
    status: "upcoming",
    checklist: [
      "Bring registration slip",
      "Request Mir card (works for Yandex services)",
      "Activate SMS banking immediately"
    ]
  },
  {
    id: "settled",
    day: 30,
    phase: "Settled",
    title: "You're Russian Now",
    subtitle: "Routine established. Buddy system unlocks senior contacts.",
    accent: "cyan",
    status: "upcoming",
    checklist: [
      "Join campus Telegram channels",
      "Get matched with a senior buddy",
      "First Yandex.Eda order: pelmeni"
    ]
  }
];
