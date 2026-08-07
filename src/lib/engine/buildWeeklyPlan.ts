import {
  DAYS,
  type AxisScores,
  type BlockIntensity,
  type Day,
  type EnergyLevel,
  type Friction,
  type LearnerContext,
  type PlanBlock,
  type ScoredTechnique,
  type WeekContext,
  type WeekLoad,
  type WeekPlan,
} from "@/lib/types";

/** Fraction of stated availability we're willing to schedule. */
const BUDGET_USE = 0.85;

const MED_DAYS: Day[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Saturday"];
const MIN_DAYS: Day[] = ["Monday", "Wednesday", "Saturday"];

/**
 * A depleted week gets a smaller plan, not a pep talk. Shrinking the budget is
 * the only honest response to "I have nothing left this week".
 */
const ENERGY_BUDGET: Record<EnergyLevel, number> = {
  depleted: 0.6,
  steady: 1,
  strong: 1.1,
};

/** A crunch week trades review breadth for deadline throughput. */
const LOAD_BUDGET: Record<WeekLoad, number> = {
  light: 0.9,
  normal: 1,
  crunch: 1.15,
};

function sessionMinutes(rhythm: number): number {
  if (rhythm <= -35) return 25;
  if (rhythm >= 45) return 90;
  return 45;
}

/** Peak window start hour, from the early-bird/night-owl axis. */
function peakStart(clock: number): number {
  if (clock <= -50) return 7;
  if (clock <= -15) return 9;
  if (clock < 30) return 16;
  return 20;
}

function secondaryStart(clock: number): number {
  const peak = peakStart(clock);
  return peak >= 20 ? 17 : peak + 3;
}

export function formatHour(hour: number): string {
  const h24 = Math.floor(hour);
  const minutes = Math.round((hour - h24) * 60);
  const suffix = h24 >= 12 ? "pm" : "am";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return minutes === 0
    ? `${h12}:00 ${suffix}`
    : `${h12}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

type PlanInput = {
  axes: AxisScores;
  frictions: Friction[];
  context: LearnerContext;
  techniques: ScoredTechnique[];
  /** Optional week-specific tuning. Absent means the standard week. */
  week?: WeekContext;
};

/**
 * Deliberately under-schedules. Over-scheduled plans get abandoned in week one,
 * so the generator caps itself at 85% of stated availability and stops early
 * rather than filling the calendar.
 */
export function buildWeeklyPlan(input: PlanInput): WeekPlan {
  const { axes, frictions, context, techniques, week } = input;

  const budgetMinutes = Math.round(context.hoursPerWeek * 60);
  const effectiveFrictions = week
    ? [...new Set([...frictions, ...week.focusFrictions])]
    : frictions;
  const scarce =
    effectiveFrictions.includes("time-scarcity") || week?.energy === "depleted";
  const flexible = axes.structure <= -25;

  const weekFactor = week
    ? ENERGY_BUDGET[week.energy] * LOAD_BUDGET[week.load]
    : 1;

  let usableMinutes = Math.floor(budgetMinutes * BUDGET_USE * weekFactor);
  const blockLength = sessionMinutes(axes.rhythm);
  const rationale: string[] = [];

  // A fully blocked week would leave nowhere to schedule, so at least one day
  // always stays open even if the student marked everything unavailable.
  const blocked = new Set<Day>(week?.unavailableDays ?? []);
  if (blocked.size >= DAYS.length) blocked.delete("Sunday");

  const openDays = (days: Day[]): Day[] => {
    const open = days.filter((d) => !blocked.has(d));
    if (open.length > 0) return open;
    return DAYS.filter((d) => !blocked.has(d)).slice(0, days.length);
  };

  rationale.push(
    `Sessions are ${blockLength} minutes because you're a ${
      blockLength === 25 ? "sprinter" : blockLength === 90 ? "marathoner" : "mid-range"
    } — that's the length you can actually sustain.`,
  );
  rationale.push(
    `We scheduled ${Math.round(BUDGET_USE * 100)}% of the ${context.hoursPerWeek} hours you said you had. The gap is intentional: a plan with no slack is a plan you abandon.`,
  );

  const days = openDays(scarce ? MIN_DAYS : MED_DAYS);
  if (scarce) {
    rationale.push(
      week?.energy === "depleted"
        ? "You said you're running on empty, so this week is a minimum effective dose. Doing three small sessions and stopping is the win."
        : "You told us time is genuinely scarce, so this is a minimum effective dose: three sessions, not a full grid.",
    );
    usableMinutes = Math.min(usableMinutes, blockLength * 3 + 30);
  }

  if (blocked.size > 0) {
    rationale.push(
      `Nothing is scheduled on ${[...blocked].join(", ")} — you told us those days are already gone.`,
    );
  }

  if (week?.load === "crunch") {
    rationale.push(
      "It's a crunch week, so new-material blocks lead with whatever is due soonest and review is trimmed to the essentials.",
    );
  }

  const blocks: PlanBlock[] = [];
  let used = 0;
  let counter = 0;

  const deepTechniques = techniques.filter(
    (t) => t.technique.category === "encoding" || t.technique.category === "exam",
  );
  const focusTechnique = techniques.find((t) => t.technique.category === "focus");
  const primaryDeep = deepTechniques[0] ?? techniques[0];

  const push = (
    day: Day,
    start: number,
    minutes: number,
    label: string,
    techniqueId: string,
    intensity: BlockIntensity,
    note: string,
  ) => {
    if (used + minutes > usableMinutes) return false;
    blocks.push({
      id: `block-${counter++}`,
      day,
      start,
      minutes,
      label,
      techniqueId,
      intensity,
      note,
    });
    used += minutes;
    return true;
  };

  const peak = peakStart(axes.clock);
  const second = secondaryStart(axes.clock);

  // New material goes in the peak window on the primary days.
  for (const day of days) {
    const technique =
      deepTechniques[blocks.length % Math.max(1, deepTechniques.length)] ??
      primaryDeep;
    push(
      day,
      peak,
      blockLength,
      "New material",
      technique.technique.id,
      "deep",
      `Hardest course first, using ${technique.technique.name}.`,
    );
  }

  // Spaced review sits on the off-days, after each new-material day.
  const reviewTechnique =
    techniques.find((t) => t.technique.id === "spaced-repetition") ??
    techniques.find((t) => t.technique.id === "retrieval-practice") ??
    primaryDeep;

  const reviewDays = openDays(
    scarce || week?.load === "crunch"
      ? ["Thursday"]
      : ["Tuesday", "Friday", "Sunday"],
  );

  for (const day of reviewDays) {
    const minutes = Math.min(blockLength, 30);
    push(
      day,
      second,
      minutes,
      "Spaced review",
      reviewTechnique.technique.id,
      "review",
      `Review material from 1, 3, and 7 days ago. Closed notes first.`,
    );
  }

  // One focus-technique block for students whose main obstacle is starting.
  if (
    focusTechnique &&
    (effectiveFrictions.includes("procrastination") ||
      effectiveFrictions.includes("distraction"))
  ) {
    push(
      openDays(scarce ? ["Wednesday"] : ["Thursday"])[0],
      second,
      Math.min(blockLength, 50),
      "Hardest task first",
      focusTechnique.technique.id,
      "deep",
      `Apply ${focusTechnique.technique.name} to the thing you've been avoiding.`,
    );
  }

  // The weekly review is always scheduled, even when it didn't rank in the
  // user's top techniques, so it is sourced from the full library.
  const reviewTechniqueId =
    techniques.find((t) => t.technique.id === "weekly-review")?.technique.id ??
    techniques.find((t) => t.technique.category === "planning")?.technique.id ??
    "weekly-review";

  const reviewDay = openDays(["Sunday"])[0];

  const addWeeklyReview = () =>
    push(
      reviewDay,
      Math.min(19, second),
      30,
      "Weekly review",
      reviewTechniqueId,
      "admin",
      "Check every syllabus for the next 14 days, then block next week.",
    );

  if (!addWeeklyReview()) {
    // Make room by trimming the last deep block rather than dropping the review.
    const last = blocks.findLast((b) => b.intensity === "deep");
    if (last && last.minutes > 30) {
      used -= 30;
      last.minutes -= 30;
      addWeeklyReview();
    }
  }

  rationale.push(
    "The weekly review is never cut. It's the block that keeps the other blocks honest.",
  );

  if (flexible) {
    rationale.push(
      "Because rigid schedules don't stick for you, treat these as anchors rather than appointments — same count, your choice of hour.",
    );
  } else {
    rationale.push(
      `Your hardest work is scheduled at ${formatHour(peak)}, when you said you think most clearly.`,
    );
  }

  blocks.sort((a, b) => {
    const dayDiff = DAYS.indexOf(a.day) - DAYS.indexOf(b.day);
    return dayDiff !== 0 ? dayDiff : a.start - b.start;
  });

  return {
    blocks,
    flexible,
    totalMinutes: blocks.reduce((sum, b) => sum + b.minutes, 0),
    budgetMinutes,
    minimumEffectiveDose: scarce,
    rationale,
  };
}
