import { describe, expect, it } from "vitest";
import {
  diffWeekPlans,
  formatWeekRange,
  isCurrentWeek,
  localDateKey,
  parseLocalDateKey,
  startCurrentWeek,
  weekDateForDay,
  weekDates,
} from "@/lib/week";
import type { PlanBlock, ScheduleSetup, WeekPlan } from "@/lib/types";

const SCHEDULE: ScheduleSetup = {
  mode: "by-course",
  courses: [
    {
      id: "history",
      name: "History",
      colorKey: "indigo",
      includedInPlan: true,
      priority: "standard",
    },
  ],
  classMeetings: [],
  studyWindows: [
    {
      id: "evening",
      days: ["Monday"],
      startMinute: 18 * 60,
      endMinute: 20 * 60,
    },
  ],
  targetStudyMinutes: 120,
};

function block(
  id: string,
  overrides: Partial<PlanBlock> = {},
): PlanBlock {
  return {
    id,
    day: "Monday",
    start: 9,
    startMinute: 9 * 60,
    minutes: 60,
    courseId: "history",
    label: "History",
    techniqueId: "retrieval-practice",
    supportingTechniqueIds: [],
    techniqueSource: "selected",
    addressedFrictionIds: [],
    intensity: "deep",
    note: "Practice retrieval.",
    ...overrides,
  };
}

function plan(blocks: PlanBlock[]): WeekPlan {
  return {
    algorithmVersion: 2,
    blocks,
    flexible: false,
    totalMinutes: blocks.reduce((total, item) => total + item.minutes, 0),
    budgetMinutes: 180,
    minimumEffectiveDose: false,
    rationale: [],
    frictionResponses: [],
  };
}

describe("local week identity", () => {
  it("maps a represented Monday through Sunday without UTC conversion", () => {
    const dates = weekDates("2026-08-10");

    expect(localDateKey(dates!.Monday)).toBe("2026-08-10");
    expect(localDateKey(dates!.Sunday)).toBe("2026-08-16");
    expect(localDateKey(weekDateForDay("2026-08-10", "Friday")!)).toBe(
      "2026-08-14",
    );
    expect(formatWeekRange("2026-08-10")).toBe("Aug 10–16, 2026");
  });

  it("rejects impossible dates and distinguishes current from stale weeks", () => {
    const friday = new Date(2026, 7, 14, 23, 30);

    expect(parseLocalDateKey("2026-02-30")).toBeNull();
    expect(isCurrentWeek("2026-08-10", friday)).toBe(true);
    expect(isCurrentWeek("2026-08-03", friday)).toBe(false);
    expect(isCurrentWeek(undefined, friday)).toBe(false);
  });

  it("starts the current week with recurring settings and no overrides", () => {
    const week = startCurrentWeek(SCHEDULE, new Date(2026, 7, 14));

    expect(week).toEqual({
      weekStart: "2026-08-10",
      unavailableDays: [],
      busyWindows: [],
      courseTargets: [],
      targetStudyMinutes: 120,
      load: "normal",
      energy: "steady",
      focusFrictions: [],
    });
  });
});

describe("semantic plan diffs", () => {
  it("pairs moved blocks by meaning while reporting true additions and removals", () => {
    const movedBefore = block("old-history");
    const removed = block("old-chemistry", {
      courseId: "chemistry",
      label: "Chemistry",
      techniqueId: "feynman",
    });
    const movedAfter = block("new-history", {
      day: "Wednesday",
      start: 14,
      startMinute: 14 * 60,
    });
    const added = block("new-review", {
      day: "Friday",
      start: 16,
      startMinute: 16 * 60,
      minutes: 30,
      intensity: "review",
      label: "History: review",
    });

    const diff = diffWeekPlans(
      plan([movedBefore, removed]),
      plan([movedAfter, added]),
    );

    expect(diff.deltaMinutes).toBe(-30);
    expect(diff.moved).toEqual([{ before: movedBefore, after: movedAfter }]);
    expect(diff.added).toEqual([added]);
    expect(diff.removed).toEqual([removed]);
  });

  it("does not depend on deterministic ids for unchanged blocks", () => {
    const before = block("block-01");
    const after = block("block-04");

    expect(diffWeekPlans(plan([before]), plan([after]))).toMatchObject({
      moved: [],
      added: [],
      removed: [],
    });
  });
});
