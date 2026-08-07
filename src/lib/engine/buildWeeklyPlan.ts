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

/** Normal weeks use 75% of stated capacity and never exceed 85%. */
const BASE_BUDGET_USE = 0.75;
const MAX_BUDGET_USE = 0.85;
const MAX_DAILY_MINUTES = 300;
const TARGET_DAILY_MINUTES = 270;
const MAX_DEEP_WINDOWS_PER_DAY = 3;
const MIN_DAYS: Day[] = ["Monday", "Wednesday", "Saturday"];

const ENERGY_BUDGET: Record<EnergyLevel, number> = {
  depleted: 0.65,
  steady: 1,
  strong: 1.1,
};

const LOAD_BUDGET: Record<WeekLoad, number> = {
  light: 0.85,
  normal: 1,
  crunch: 1.1,
};

function sessionMinutes(rhythm: number): number {
  if (rhythm <= -35) return 25;
  if (rhythm >= 45) return 90;
  return 45;
}

function maxWindowMinutes(cadence: number): number {
  if (cadence <= 25) return 100;
  if (cadence >= 90) return 180;
  return 135;
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

function deepStarts(clock: number): number[] {
  const peak = peakStart(clock);
  if (peak <= 9) return [peak, peak + 4, peak + 8];
  if (peak >= 20) return [20, 11, 16];
  return [16, 10, 20];
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

function formatDuration(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} minutes`;
  if (minutes === 0) return `${hours} hour${hours === 1 ? "" : "s"}`;
  return `${hours}h ${minutes}m`;
}

function evenlySpacedDays(days: Day[], count: number): Day[] {
  if (count >= days.length) return [...days];
  if (count <= 1) return days.slice(0, 1);

  const picked: Day[] = [];
  for (let index = 0; index < count; index++) {
    const dayIndex = Math.round((index * (days.length - 1)) / (count - 1));
    const day = days[dayIndex];
    if (!picked.includes(day)) picked.push(day);
  }
  return picked;
}

function distributeMinutes(total: number, count: number): number[] {
  const units = Math.floor(total / 5);
  const base = Math.floor(units / count);
  const extra = units % count;
  return Array.from(
    { length: count },
    (_, index) => (base + (index < extra ? 1 : 0)) * 5,
  );
}

type PlanInput = {
  axes: AxisScores;
  frictions: Friction[];
  context: LearnerContext;
  techniques: ScoredTechnique[];
  /** Optional week-specific tuning. Absent means the standard week. */
  week?: WeekContext;
};

/** Builds a capacity-driven plan while preserving deliberate weekly slack. */
export function buildWeeklyPlan(input: PlanInput): WeekPlan {
  const { axes, frictions, context, techniques, week } = input;
  const budgetMinutes = Math.round(context.hoursPerWeek * 60);
  const cadence = sessionMinutes(axes.rhythm);
  const effectiveFrictions = week
    ? [...new Set([...frictions, ...week.focusFrictions])]
    : frictions;
  const reportsTimeScarcity = effectiveFrictions.includes("time-scarcity");
  const scarce =
    week?.energy === "depleted" ||
    (reportsTimeScarcity && context.hoursPerWeek <= 8);
  const flexible = axes.structure <= -25;

  const blocked = new Set<Day>(week?.unavailableDays ?? []);
  if (blocked.size >= DAYS.length) blocked.delete("Sunday");
  const availableDays = DAYS.filter((day) => !blocked.has(day));

  const utilization = week
    ? Math.min(
        MAX_BUDGET_USE,
        BASE_BUDGET_USE * ENERGY_BUDGET[week.energy] * LOAD_BUDGET[week.load],
      )
    : BASE_BUDGET_USE;

  const unconstrainedTarget = Math.floor(budgetMinutes * utilization);
  const dayCapacity = availableDays.length * MAX_DAILY_MINUTES;
  let targetMinutes = Math.min(unconstrainedTarget, dayCapacity);

  if (scarce) {
    // One deep window, one short review, and the weekly review.
    targetMinutes = Math.min(targetMinutes, cadence * 2 + 30);
  }
  const minimumDays =
    targetMinutes < 180 ? 2 : targetMinutes < 360 ? 3 : 4;
  const desiredDayCount = scarce
    ? Math.min(MIN_DAYS.length, availableDays.length)
    : Math.min(
        availableDays.length,
        Math.max(minimumDays, Math.ceil(targetMinutes / TARGET_DAILY_MINUTES)),
      );

  const scarceDays = [
    ...MIN_DAYS.filter((day) => availableDays.includes(day)),
    ...availableDays.filter((day) => !MIN_DAYS.includes(day)),
  ].slice(0, desiredDayCount);
  const activeDays = scarce
    ? scarceDays
    : evenlySpacedDays(availableDays, desiredDayCount);

  const reviewMinutes = Math.min(cadence, 30);
  let reviewCount = targetMinutes >= 80
    ? Math.min(5, Math.max(1, Math.ceil(targetMinutes / 300)))
    : 0;
  if (week?.load === "crunch" && reviewCount > 1) reviewCount--;
  while (
    reviewCount > 0 &&
    targetMinutes - 30 - reviewCount * reviewMinutes < 25
  ) {
    reviewCount--;
  }

  const deepBudget = Math.max(
    0,
    targetMinutes - 30 - reviewCount * reviewMinutes,
  );
  const allocatableDeep = Math.floor(deepBudget / 5) * 5;
  const maxWindow = maxWindowMinutes(cadence);
  const slotCapacity = activeDays.length * MAX_DEEP_WINDOWS_PER_DAY;
  const maxWindowCount = Math.min(
    slotCapacity,
    Math.floor(allocatableDeep / 25),
  );
  const courseWindows = scarce
    ? 1
    : Math.min(activeDays.length, context.courseLoad);
  const windowCount = maxWindowCount > 0
    ? Math.min(
        maxWindowCount,
        Math.max(courseWindows, Math.ceil(allocatableDeep / maxWindow)),
      )
    : 0;
  const windowLengths = windowCount > 0
    ? distributeMinutes(allocatableDeep, windowCount)
    : [];

  const blocks: PlanBlock[] = [];
  let used = 0;
  let counter = 0;

  const overlaps = (day: Day, start: number, minutes: number) => {
    const end = start + minutes / 60;
    return blocks.some((block) => {
      if (block.day !== day) return false;
      const blockEnd = block.start + block.minutes / 60;
      return start < blockEnd && end > block.start;
    });
  };

  const findOpenStart = (day: Day, preferred: number, minutes: number) => {
    const candidates = [preferred, 7, 9, 11, 13, 15, 17, 19, 21];
    for (const start of [...new Set(candidates)]) {
      if (start + minutes / 60 > 24) continue;
      if (!overlaps(day, start, minutes)) return start;
    }
    return null;
  };

  const push = (
    day: Day,
    preferredStart: number,
    minutes: number,
    label: string,
    techniqueId: string,
    intensity: BlockIntensity,
    note: string,
  ) => {
    if (minutes <= 0 || used + minutes > targetMinutes) return false;
    const start = findOpenStart(day, preferredStart, minutes);
    if (start === null) return false;
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

  const deepTechniques = techniques.filter(
    (item) =>
      item.technique.category === "encoding" || item.technique.category === "exam",
  );
  const primaryDeep = deepTechniques[0] ?? techniques[0];
  const focusTechnique = techniques.find(
    (item) => item.technique.category === "focus",
  );
  const needsStartingSupport =
    effectiveFrictions.includes("procrastination") ||
    effectiveFrictions.includes("distraction");
  const starts = deepStarts(axes.clock);

  windowLengths.forEach((minutes, index) => {
    const day = activeDays[index % activeDays.length];
    const slot = Math.floor(index / activeDays.length);
    const technique = deepTechniques[index % Math.max(1, deepTechniques.length)] ??
      primaryDeep;
    const useFocusTechnique = index === 0 && needsStartingSupport && focusTechnique;
    const selected = useFocusTechnique || technique;
    if (!selected) return;

    const usesRounds = minutes > cadence;
    push(
      day,
      starts[slot] ?? starts[starts.length - 1],
      minutes,
      useFocusTechnique ? "Hardest task first" : "New material",
      selected.technique.id,
      "deep",
      useFocusTechnique
        ? `Apply ${selected.technique.name} to the task you've been avoiding. Work in ${cadence}-minute focus rounds.`
        : `${usesRounds ? `Use ${cadence}-minute focus rounds with short breaks` : `Use one ${cadence}-minute focus round`}. Apply ${selected.technique.name}.`,
    );
  });

  const reviewTechnique =
    techniques.find((item) => item.technique.id === "spaced-repetition") ??
    techniques.find((item) => item.technique.id === "retrieval-practice") ??
    primaryDeep;
  const reviewOrder: Day[] = [
    "Tuesday",
    "Thursday",
    "Saturday",
    "Sunday",
    "Friday",
    "Wednesday",
    "Monday",
  ];
  const reviewDays = reviewOrder.filter((day) => availableDays.includes(day));

  if (reviewTechnique) {
    for (let index = 0; index < reviewCount; index++) {
      const day = reviewDays[index % reviewDays.length];
      push(
        day,
        secondaryStart(axes.clock),
        reviewMinutes,
        "Spaced review",
        reviewTechnique.technique.id,
        "review",
        "Review recent material with notes closed first, then correct what you missed.",
      );
    }
  }

  const weeklyReviewTechnique =
    techniques.find((item) => item.technique.id === "weekly-review")?.technique.id ??
    techniques.find((item) => item.technique.category === "planning")?.technique.id ??
    "weekly-review";
  const weeklyReviewDay = availableDays.includes("Sunday")
    ? "Sunday"
    : availableDays[availableDays.length - 1];

  push(
    weeklyReviewDay,
    19,
    30,
    "Weekly review",
    weeklyReviewTechnique,
    "admin",
    "Check every syllabus for the next 14 days, then block next week.",
  );

  blocks.sort((a, b) => {
    const dayDiff = DAYS.indexOf(a.day) - DAYS.indexOf(b.day);
    return dayDiff !== 0 ? dayDiff : a.start - b.start;
  });

  const totalMinutes = blocks.reduce((sum, block) => sum + block.minutes, 0);
  const rationale: string[] = [
    `You have ${context.hoursPerWeek} hours available. This plan schedules ${formatDuration(totalMinutes)} and protects ${formatDuration(budgetMinutes - totalMinutes)} as buffer.`,
    `Your focus cadence is ${cadence} minutes. Longer study windows repeat that cadence with short breaks instead of turning into one long sit.`,
    `More available time creates more study windows across the week; it doesn't stretch the same fixed template.`,
  ];

  if (unconstrainedTarget > dayCapacity) {
    rationale.push(
      `The open days can hold about ${formatDuration(dayCapacity)} without exceeding five planned hours in one day, so the rest stays unscheduled.`,
    );
  }
  if (blocked.size > 0) {
    rationale.push(
      `Nothing is scheduled on ${[...blocked].join(", ")} — you marked those days unavailable.`,
    );
  }
  if (scarce) {
    rationale.push(
      week?.energy === "depleted"
        ? "You said you're running on empty, so this week keeps only three essentials."
        : "Time-scarce mode keeps only three essentials, even when more hours are technically open.",
    );
  }
  if (reportsTimeScarcity && !scarce) {
    rationale.push(
      "Your updated capacity is above minimum-dose range, so the plan uses the hours you entered instead of preserving the old time-scarcity cap.",
    );
  }
  if (week?.load === "crunch") {
    rationale.push(
      "Crunch mode trades one review window for deadline-focused work while keeping the weekly review.",
    );
  }
  rationale.push(
    "The weekly review is never cut. It's the block that keeps the other blocks honest.",
  );
  rationale.push(
    flexible
      ? "Treat these as flexible weekly windows rather than appointments — keep the day if you can, but choose the hour."
      : `Your first deep-work window starts near ${formatHour(peakStart(axes.clock))}, when you said you think most clearly.`,
  );

  return {
    blocks,
    flexible,
    totalMinutes,
    budgetMinutes,
    minimumEffectiveDose: scarce,
    rationale,
  };
}
