import { describe, expect, it } from "vitest";
import {
  parseWeekContext,
  weekContextForScheduleSchema,
  weekContextSchema,
} from "@/lib/schema";
import type { ScheduleSetup, WeekContext } from "@/lib/types";

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
      id: "monday",
      days: ["Monday"],
      startMinute: 18 * 60,
      endMinute: 20 * 60,
    },
  ],
  targetStudyMinutes: 120,
};

const WEEK: WeekContext = {
  weekStart: "2026-08-10",
  unavailableDays: [],
  busyWindows: [],
  courseTargets: [
    {
      courseId: "history",
      priority: "focus",
      deadlineDay: "Friday",
    },
  ],
  targetStudyMinutes: 120,
  load: "normal",
  energy: "steady",
  focusFrictions: [],
};

describe("week context validation", () => {
  it("accepts a complete context whose course targets belong to the schedule", () => {
    expect(weekContextForScheduleSchema(SCHEDULE).safeParse(WEEK).success).toBe(
      true,
    );
    expect(parseWeekContext(WEEK, SCHEDULE)).toEqual(WEEK);
  });

  it("rejects unknown courses and duplicate bounded values", () => {
    expect(
      weekContextForScheduleSchema(SCHEDULE).safeParse({
        ...WEEK,
        unavailableDays: ["Monday", "Monday"],
        courseTargets: [
          {
            courseId: "unknown",
            priority: "urgent",
            deadlineDay: null,
          },
        ],
      }).success,
    ).toBe(false);
  });

  it("requires a real Monday when a represented week is supplied", () => {
    expect(
      weekContextSchema.safeParse({ ...WEEK, weekStart: "2026-02-30" }).success,
    ).toBe(false);
    expect(
      weekContextSchema.safeParse({ ...WEEK, weekStart: "2026-08-11" }).success,
    ).toBe(false);
  });
});
