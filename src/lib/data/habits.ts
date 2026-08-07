import type { Habit } from "@/lib/types";

/**
 * Micro-habits, not goals. Each is small enough to do on a bad day, which is
 * the only reason habit tracking works at all.
 */
export const HABITS: Habit[] = [
  {
    id: "closed-book-recall",
    label: "One closed-book recall before bed",
    why: "Five minutes of pulling material out of memory beats an hour of re-reading.",
    frictions: ["retention", "test-anxiety"],
    techniqueId: "retrieval-practice",
  },
  {
    id: "review-queue",
    label: "Clear my review queue",
    why: "Spaced repetition only works if the reviews actually happen.",
    frictions: ["retention", "time-scarcity"],
    techniqueId: "spaced-repetition",
  },
  {
    id: "start-five",
    label: "Start the worst task for five minutes",
    why: "Starting is the hard part. Five minutes removes the excuse.",
    frictions: ["procrastination", "motivation"],
    techniqueId: "five-minute-rule",
  },
  {
    id: "phone-away",
    label: "Phone in another room during study time",
    why: "Not face down. Another room. Proximity alone costs you attention.",
    frictions: ["distraction"],
    techniqueId: "deep-block",
  },
  {
    id: "tomorrow-three",
    label: "Write tomorrow's three tasks tonight",
    why: "Deciding in advance means you don't negotiate with yourself in the morning.",
    frictions: ["overwhelm", "procrastination"],
    techniqueId: "implementation-intentions",
  },
  {
    id: "one-error-log",
    label: "Log every mistake I made today",
    why: "Patterns show up within two weeks, and they become your study plan.",
    frictions: ["math-heavy", "test-anxiety"],
    techniqueId: "error-log",
  },
  {
    id: "office-hours",
    label: "Ask one question in class or office hours",
    why: "It's free, it's already paid for, and it's the fastest way to close a gap.",
    frictions: ["motivation", "retention"],
  },
  {
    id: "sleep-window",
    label: "In bed by my target time",
    why: "Memory consolidates during sleep. An all-nighter undoes the studying.",
    frictions: ["retention", "motivation"],
  },
];

export const HABIT_BY_ID = Object.fromEntries(
  HABITS.map((h) => [h.id, h]),
) as Record<string, Habit>;
