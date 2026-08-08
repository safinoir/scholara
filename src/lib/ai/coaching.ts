import { ARCHETYPE_BY_ID } from "@/lib/data/archetypes";
import { AXIS_BY_ID, FRICTION_BY_ID } from "@/lib/data/axes";
import { TECHNIQUE_BY_ID } from "@/lib/data/techniques";
import {
  AXES,
  type ArchetypeId,
  type AxisScores,
  type Friction,
  type LearnerContext,
  type PlanCoaching,
  type WeekContext,
  type WeekPlan,
} from "@/lib/types";
import { formatHour } from "@/lib/engine/buildWeeklyPlan";
import { chatJson, isAiConfigured } from "./client";

export type CoachingInput = {
  axes: AxisScores;
  frictions: Friction[];
  context: LearnerContext;
  primary: ArchetypeId;
  secondary: ArchetypeId;
  techniqueIds: string[];
  plan: WeekPlan;
  week?: WeekContext;
};

/**
 * The model gets facts, never prose the student typed. Field of study, year, and
 * numbers are categorical; there is no free-text channel into the prompt at all.
 */
function describeLearner(input: CoachingInput): string {
  const primary = ARCHETYPE_BY_ID[input.primary];
  const secondary = ARCHETYPE_BY_ID[input.secondary];

  const axisLines = AXES.map((axis) => {
    const meta = AXIS_BY_ID[axis];
    const score = input.axes[axis];
    const pole = score >= 0 ? meta.highLabel : meta.lowLabel;
    return `- ${meta.label}: ${pole} (${score > 0 ? "+" : ""}${score}) — decides ${meta.drives.toLowerCase()}`;
  }).join("\n");

  const frictions = input.frictions.length
    ? input.frictions.map((f) => FRICTION_BY_ID[f].label).join(", ")
    : "none reported";

  const techniques = input.techniqueIds
    .map((id) => TECHNIQUE_BY_ID[id])
    .filter(Boolean)
    .map((t) => `- ${t.name}: ${t.blurb}`)
    .join("\n");

  return [
    `PERSONA: ${primary.name} — ${primary.tagline}. Secondary lean: ${secondary.name}.`,
    `AXES:\n${axisLines}`,
    `STATED OBSTACLES: ${frictions}`,
    `CONTEXT: ${input.context.year} in ${input.context.field}, ${input.context.courseLoad} courses, ${input.context.hoursPerWeek} study hours available per week, outside job or caregiving: ${input.context.hasOutsideObligations ? "yes" : "no"}.`,
    `METHODS USED IN THIS PLAN (student-selected or a labeled foundation fallback — do not introduce others):\n${techniques || "- none"}`,
  ].join("\n\n");
}

function describePlan(input: CoachingInput): string {
  const { plan } = input;

  const blocks = plan.blocks
    .map((block) => {
      const technique = TECHNIQUE_BY_ID[block.techniqueId];
      const time = plan.flexible ? "flexible time" : formatHour(block.start);
      return `- id=${block.id} | ${block.day} ${time} | ${block.minutes} min | ${block.label} | technique: ${technique?.name ?? block.techniqueId}`;
    })
    .join("\n");

  const week = input.week
    ? [
        `THIS WEEK: workload is ${input.week.load}, energy is ${input.week.energy}.`,
        input.week.unavailableDays.length
          ? `Unavailable days: ${input.week.unavailableDays.join(", ")}.`
          : "No days are fully blocked.",
        input.week.focusFrictions.length
          ? `Extra pressure this week: ${input.week.focusFrictions.map((f) => FRICTION_BY_ID[f].label).join(", ")}.`
          : "",
      ]
        .filter(Boolean)
        .join(" ")
    : "THIS WEEK: no week-specific details given.";

  return [
    week,
    `PLAN SHAPE: ${plan.flexible ? "flexible anchors, student picks the hour" : "fixed times"}${plan.minimumEffectiveDose ? ", minimum effective dose" : ""}. ${Math.round(plan.totalMinutes / 60 * 10) / 10} of ${Math.round(plan.budgetMinutes / 60 * 10) / 10} available hours are scheduled.`,
    `BLOCKS:\n${blocks}`,
  ].join("\n\n");
}

const SYSTEM_PROMPT = `You are the coaching voice of Scholara, a study-habit tool for college students.

A rule-based engine has ALREADY placed the student's chosen methods and any required foundation method into a schedule. Your job is to explain and personalize that schedule in the student's own terms. You never invent techniques, never change times or durations, and never add or remove blocks.

Voice rules, all mandatory:
- Second person, direct, warm, specific. Short sentences.
- No shame language. Never write "just", "simply", "you should have", or "be disciplined".
- No emojis, no headings, no bullet points, no markdown inside the strings.
- Reference concrete details from the data you were given (a day, an hour, a technique name, a stated obstacle). Generic encouragement is a failure.
- Never claim to know anything you were not told. No medical, diagnostic, or mental-health advice.

Respond with a single JSON object and nothing else, matching exactly this shape:
{
  "brief": "2-3 sentences on how to approach this specific week.",
  "focus": "One sentence naming the single highest-leverage action.",
  "watchOut": "One sentence naming the most likely way this week goes wrong for this student, phrased without blame.",
  "blockNotes": { "<blockId>": "One sentence of instruction for that block, max 18 words." }
}

Include every block id you were given in blockNotes, using the exact ids. Do not add ids that were not given.`;

type RawCoaching = {
  brief: string;
  focus: string;
  watchOut: string;
  blockNotes: Record<string, string>;
};

/** Strips markdown artifacts a small model may add despite instructions. */
function clean(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const text = value
    .replace(/[*_`#]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length === 0) return null;
  return text.slice(0, maxLength);
}

function validate(validIds: Set<string>) {
  return (value: unknown): RawCoaching | null => {
    if (typeof value !== "object" || value === null) return null;
    const raw = value as Record<string, unknown>;

    const brief = clean(raw.brief, 600);
    const focus = clean(raw.focus, 300);
    const watchOut = clean(raw.watchOut, 300);
    if (!brief || !focus || !watchOut) return null;

    // Only ids the engine created are accepted, so a hallucinated block can
    // never appear in the UI.
    const blockNotes: Record<string, string> = {};
    if (typeof raw.blockNotes === "object" && raw.blockNotes !== null) {
      for (const [id, note] of Object.entries(
        raw.blockNotes as Record<string, unknown>,
      )) {
        if (!validIds.has(id)) continue;
        const text = clean(note, 200);
        if (text) blockNotes[id] = text;
      }
    }

    return { brief, focus, watchOut, blockNotes };
  };
}

// ---------------------------------------------------------------------------
// Deterministic fallback — what the app shows with no key, or on any failure.
// ---------------------------------------------------------------------------

export function fallbackCoaching(input: CoachingInput): PlanCoaching {
  const archetype = ARCHETYPE_BY_ID[input.primary];
  const obstacle = input.frictions[0]
    ? FRICTION_BY_ID[input.frictions[0]].label.toLowerCase()
    : null;
  const firstBlock = input.plan.blocks[0];
  const first = firstBlock ? TECHNIQUE_BY_ID[firstBlock.techniqueId] : undefined;

  const brief = [
    `You're starting from ${archetype.name.replace("The ", "")} territory: ${archetype.tagline.toLowerCase()}.`,
    input.plan.minimumEffectiveDose
      ? "This week is stripped to the essentials on purpose — finishing a small plan beats abandoning a big one."
      : `We scheduled ${Math.round(input.plan.totalMinutes / 60)} of your ${Math.round(input.plan.budgetMinutes / 60)} available hours, and the gap is deliberate.`,
    firstBlock
      ? `Your first commitment is ${firstBlock.label.toLowerCase()} on ${firstBlock.day}.`
      : "Pick one block and treat it as the only thing that has to happen.",
  ].join(" ");

  const focus = first
    ? `Run ${first.name} in your first block and add nothing else this week — one new technique at a time is how they stick.`
    : "Protect your first block and let everything else be optional.";

  const watchOut = obstacle
    ? `Watch for ${obstacle} showing up mid-week; when it does, shorten the block instead of skipping it.`
    : "The usual failure mode is a missed block turning into a missed week. One miss is just one miss.";

  return {
    brief,
    focus,
    watchOut,
    blockNotes: {},
    source: "fallback",
    generatedAt: new Date().toISOString(),
  };
}

/** AI coaching over an engine-built plan, with a guaranteed fallback. */
export async function generateCoaching(
  input: CoachingInput,
): Promise<PlanCoaching> {
  if (!isAiConfigured() || input.plan.blocks.length === 0) {
    return fallbackCoaching(input);
  }

  const validIds = new Set(input.plan.blocks.map((b) => b.id));

  const result = await chatJson(
    {
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `${describeLearner(input)}\n\n${describePlan(input)}`,
        },
      ],
      temperature: 0.65,
      maxTokens: 900,
    },
    validate(validIds),
  );

  if (!result) return fallbackCoaching(input);

  return {
    ...result,
    source: "ai",
    generatedAt: new Date().toISOString(),
  };
}
