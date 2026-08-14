import {
  DAYS,
  type Day,
  type PlanBlock,
  type ScheduleSetup,
  type WeekContext,
  type WeekPlan,
} from "@/lib/types";

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Formats a Date as a calendar key without converting it to UTC. */
export function localDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Parses a real YYYY-MM-DD value at local midnight. */
export function parseLocalDateKey(value: string | undefined): Date | null {
  if (!value) return null;
  const match = ISO_DATE_PATTERN.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(year, month - 1, day);
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }
  return parsed;
}

export function currentWeekStart(date = new Date()): string {
  const local = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const mondayOffset = (local.getDay() + 6) % 7;
  local.setDate(local.getDate() - mondayOffset);
  return localDateKey(local);
}

export function isCurrentWeek(
  weekStart: string | undefined,
  date = new Date(),
): boolean {
  return Boolean(parseLocalDateKey(weekStart)) && weekStart === currentWeekStart(date);
}

/** Maps a Monday-based plan day to its local calendar date. */
export function weekDateForDay(
  weekStart: string,
  day: Day,
): Date {
  const monday = parseLocalDateKey(weekStart);
  if (!monday) throw new RangeError("Expected a real local week-start date");
  const result = new Date(monday.getTime());
  result.setDate(monday.getDate() + DAYS.indexOf(day));
  return result;
}

export function weekDates(
  weekStart: string | undefined,
): Record<Day, Date> | null {
  const monday = parseLocalDateKey(weekStart);
  if (!monday) return null;
  const entries = DAYS.map((day) => {
    const date = new Date(monday.getTime());
    date.setDate(monday.getDate() + DAYS.indexOf(day));
    return [day, date] as const;
  });
  return Object.fromEntries(entries) as Record<Day, Date>;
}

/** Formats the represented Monday-Sunday range without UTC date drift. */
export function formatWeekRange(
  weekStart: string | undefined,
  locale = "en-US",
): string {
  const dates = weekDates(weekStart);
  if (!dates) return "Saved week";

  const start = dates.Monday;
  const end = dates.Sunday;
  const month = new Intl.DateTimeFormat(locale, { month: "short" });
  const startMonth = month.format(start);
  const endMonth = month.format(end);

  if (start.getFullYear() !== end.getFullYear()) {
    return `${startMonth} ${start.getDate()}, ${start.getFullYear()} – ${endMonth} ${end.getDate()}, ${end.getFullYear()}`;
  }
  if (start.getMonth() !== end.getMonth()) {
    return `${startMonth} ${start.getDate()} – ${endMonth} ${end.getDate()}, ${end.getFullYear()}`;
  }
  return `${startMonth} ${start.getDate()}–${end.getDate()}, ${end.getFullYear()}`;
}

export function defaultWeekContext(
  schedule: ScheduleSetup,
  date = new Date(),
): WeekContext {
  return {
    weekStart: currentWeekStart(date),
    unavailableDays: [],
    busyWindows: [],
    courseTargets: [],
    targetStudyMinutes: schedule.targetStudyMinutes,
    load: "normal",
    energy: "steady",
    focusFrictions: [],
  };
}

/** Starts a clean week while preserving only the recurring schedule target. */
export function startCurrentWeek(
  schedule: ScheduleSetup,
  date = new Date(),
): WeekContext {
  return defaultWeekContext(schedule, date);
}

export function normalizeWeekContext(
  schedule: ScheduleSetup,
  week?: WeekContext,
): WeekContext {
  const fallback = defaultWeekContext(schedule);
  return {
    ...fallback,
    ...week,
    weekStart: week?.weekStart ?? fallback.weekStart,
    targetStudyMinutes:
      week?.targetStudyMinutes ?? fallback.targetStudyMinutes,
    unavailableDays: [...new Set(week?.unavailableDays ?? [])],
    busyWindows: week?.busyWindows ?? [],
    courseTargets: week?.courseTargets ?? [],
    focusFrictions: [...new Set(week?.focusFrictions ?? [])],
  };
}

export type MovedPlanBlock = Readonly<{
  before: PlanBlock;
  after: PlanBlock;
}>;

export type WeekPlanDiff = Readonly<{
  beforeMinutes: number;
  afterMinutes: number;
  deltaMinutes: number;
  moved: readonly MovedPlanBlock[];
  added: readonly PlanBlock[];
  removed: readonly PlanBlock[];
}>;

function blockSemanticKey(block: PlanBlock): string {
  return [
    block.courseId ?? "admin",
    block.techniqueId,
    block.intensity,
    block.label,
  ].join("|");
}

function samePlacement(left: PlanBlock, right: PlanBlock): boolean {
  return (
    left.day === right.day &&
    left.startMinute === right.startMinute &&
    left.minutes === right.minutes
  );
}

function movementCost(left: PlanBlock, right: PlanBlock): number {
  return (
    Math.abs(DAYS.indexOf(left.day) - DAYS.indexOf(right.day)) * 1440 +
    Math.abs(left.startMinute - right.startMinute) +
    Math.abs(left.minutes - right.minutes)
  );
}

function sortBlocks(blocks: PlanBlock[]): PlanBlock[] {
  return blocks.sort(
    (left, right) =>
      DAYS.indexOf(left.day) - DAYS.indexOf(right.day) ||
      left.startMinute - right.startMinute ||
      left.label.localeCompare(right.label),
  );
}

/**
 * Compares deterministic plans by block meaning instead of generated ids.
 * Same-course, same-method blocks are paired as moves before leftovers become
 * additions or removals.
 */
export function diffWeekPlans(
  before: WeekPlan,
  after: WeekPlan,
): WeekPlanDiff {
  const remainingAfter = [...after.blocks];
  const unmatchedBefore: PlanBlock[] = [];

  for (const block of before.blocks) {
    const exactIndex = remainingAfter.findIndex(
      (candidate) =>
        blockSemanticKey(candidate) === blockSemanticKey(block) &&
        samePlacement(candidate, block),
    );
    if (exactIndex >= 0) {
      remainingAfter.splice(exactIndex, 1);
    } else {
      unmatchedBefore.push(block);
    }
  }

  const moved: MovedPlanBlock[] = [];
  const removed: PlanBlock[] = [];
  for (const block of unmatchedBefore) {
    const candidates = remainingAfter
      .map((candidate, index) => ({ candidate, index }))
      .filter(
        ({ candidate }) =>
          blockSemanticKey(candidate) === blockSemanticKey(block),
      )
      .sort(
        (left, right) =>
          movementCost(block, left.candidate) -
            movementCost(block, right.candidate) ||
          left.index - right.index,
      );
    const match = candidates[0];
    if (!match) {
      removed.push(block);
      continue;
    }
    moved.push({ before: block, after: match.candidate });
    remainingAfter.splice(match.index, 1);
  }

  return {
    beforeMinutes: before.totalMinutes,
    afterMinutes: after.totalMinutes,
    deltaMinutes: after.totalMinutes - before.totalMinutes,
    moved,
    added: sortBlocks(remainingAfter),
    removed: sortBlocks(removed),
  };
}
