import type { ASK_TOPICS } from "./schema";

export type AskTopic = (typeof ASK_TOPICS)[number];

/**
 * A fixed menu instead of a text box. Every question is one the engine's own
 * data can answer, which keeps the model on-topic and keeps student free text
 * out of the request entirely. Client-safe: no server imports.
 */
export const ASK_PROMPTS: Record<AskTopic, { label: string; question: string }> = {
  "start-today": {
    label: "What do I do today?",
    question:
      "Tell me exactly what to do in my next study session, start to finish.",
  },
  "fell-behind": {
    label: "I already fell behind",
    question:
      "I missed blocks and I'm behind. How do I restart without redoing everything?",
  },
  "why-this-plan": {
    label: "Why this plan for me?",
    question:
      "Explain why this specific schedule and these techniques fit how I work.",
  },
  "exam-soon": {
    label: "I have an exam coming",
    question:
      "I have an exam soon. How should I adapt this plan for the next week?",
  },
  "cant-focus": {
    label: "I can't focus",
    question:
      "I sit down and can't focus. What should I change about how I start a session?",
  },
  "too-much": {
    label: "This feels like too much",
    question:
      "This plan feels like too much right now. What do I cut and what do I keep?",
  },
};
