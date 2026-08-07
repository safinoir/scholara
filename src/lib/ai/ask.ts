import { ARCHETYPE_BY_ID } from "@/lib/data/archetypes";
import { FRICTION_BY_ID } from "@/lib/data/axes";
import { TECHNIQUE_BY_ID } from "@/lib/data/techniques";
import { formatHour } from "@/lib/engine/buildWeeklyPlan";
import type { ArchetypeId, Friction, LearnerContext, WeekContext, WeekPlan } from "@/lib/types";
import { chat, isAiConfigured } from "./client";
import { ASK_PROMPTS, type AskTopic } from "./topics";

export type AskInput = {
  topic: AskTopic;
  frictions: Friction[];
  context: LearnerContext;
  primary: ArchetypeId;
  techniqueIds: string[];
  plan: WeekPlan;
  week?: WeekContext;
};

const SYSTEM_PROMPT = `You are the coaching voice of Scholara, a study-habit tool for college students.

The student's persona, techniques, and weekly schedule were already set by a rule-based engine. Answer their question using ONLY that plan and those techniques. You may reorder, shorten, or reprioritize what already exists; you must not invent new study techniques, tools, apps, or claims about research.

Rules:
- 70-130 words. Plain prose, no headings, no bullet points, no markdown, no emojis.
- Second person, direct, warm, concrete. Reference real days, hours, and technique names from the plan.
- Never use shame language. Never write "just" or "simply". A missed session is never a moral failure.
- Never give medical, diagnostic, or mental-health advice. If the student's situation sounds like it needs more than a study tool, point them to campus counseling or the disability/accessibility office in one clause and move on.
- If cutting is the right answer, say exactly what to cut.`;

function planSummary(input: AskInput): string {
  const blocks = input.plan.blocks
    .map((b) => {
      const technique = TECHNIQUE_BY_ID[b.techniqueId];
      const time = input.plan.flexible ? "flexible" : formatHour(b.start);
      return `- ${b.day} ${time}, ${b.minutes} min: ${b.label} via ${technique?.name ?? b.techniqueId}`;
    })
    .join("\n");

  const techniques = input.techniqueIds
    .map((id) => TECHNIQUE_BY_ID[id]?.name)
    .filter(Boolean)
    .join(", ");

  const archetype = ARCHETYPE_BY_ID[input.primary];
  const obstacles = input.frictions
    .map((f) => FRICTION_BY_ID[f].label)
    .join(", ");

  const week = input.week
    ? `This week: ${input.week.load} workload, ${input.week.energy} energy${
        input.week.unavailableDays.length
          ? `, unavailable on ${input.week.unavailableDays.join(", ")}`
          : ""
      }.`
    : "";

  return [
    `Persona: ${archetype.name} — ${archetype.tagline}`,
    `Obstacles they reported: ${obstacles || "none"}`,
    `Time: ${input.context.hoursPerWeek} hours per week across ${input.context.courseLoad} courses. Outside job or caregiving: ${input.context.hasOutsideObligations ? "yes" : "no"}.`,
    `Their techniques: ${techniques || "none"}`,
    week,
    `Their schedule${input.plan.minimumEffectiveDose ? " (minimum effective dose)" : ""}:\n${blocks || "- empty"}`,
  ]
    .filter(Boolean)
    .join("\n");
}

function fallbackAnswer(input: AskInput): string {
  const first = input.plan.blocks[0];
  const technique = first ? TECHNIQUE_BY_ID[first.techniqueId] : undefined;
  const name = technique?.name ?? "your first technique";
  const firstStep = technique?.steps[0];

  switch (input.topic) {
    case "start-today":
      return first
        ? `Open your ${first.label.toLowerCase()} block: ${first.minutes} minutes, using ${name}. ${firstStep ?? "Start with the smallest piece you can finish."} Put your phone in another room before you begin, and stop when the timer ends even if you're mid-flow — finishing on time is what makes you willing to come back tomorrow.`
        : "Rebuild your plan first, then start with the first block it gives you.";
    case "fell-behind":
      return "Don't rebuild the week you missed. Take today's block, cut it in half, and do that. Falling behind compounds through guilt, not through lost hours, so the only move that matters is doing one short session now. Your spaced-review blocks will absorb what you skipped without any extra catch-up work.";
    case "why-this-plan":
      return `Your session length, your peak hour, and your technique list all came from your answers: ${input.plan.rationale[0] ?? "the plan is built around the hours you said you had."} Everything is scheduled below your stated capacity on purpose, because plans with no slack get abandoned in week one.`;
    case "exam-soon":
      return `Convert your next two review blocks into practice testing under real conditions: no notes, timed, in one sitting. Keep ${name} for new material only. The day before the exam, do a single closed-book brain dump of the whole unit rather than re-reading anything.`;
    case "cant-focus":
      return "Change the start, not the willpower. Decide the exact first action before you sit down, set a timer for five minutes, and give yourself permission to stop when it rings. Starting is the part that fails, so shrink it until it's too small to avoid, then let momentum do the rest.";
    case "too-much":
      return "Keep the first deep block and the weekly review. Cut everything else this week. That's the minimum that still moves you forward, and a plan you finish is worth more than one you resent. Add blocks back one at a time once the small version has held for a full week.";
  }
}

export async function generateAnswer(
  input: AskInput,
): Promise<{ message: string; source: "ai" | "fallback" }> {
  const fallback = fallbackAnswer(input);

  if (!isAiConfigured()) return { message: fallback, source: "fallback" };

  const message = await chat({
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `${planSummary(input)}\n\nQuestion: ${ASK_PROMPTS[input.topic].question}`,
      },
    ],
    temperature: 0.6,
    maxTokens: 320,
  });

  if (!message) return { message: fallback, source: "fallback" };

  // Strip markdown a smaller model may add despite the instructions.
  const cleaned = message.replace(/[*_`#]/g, "").replace(/\n{3,}/g, "\n\n").trim();
  return cleaned.length > 0
    ? { message: cleaned, source: "ai" }
    : { message: fallback, source: "fallback" };
}
