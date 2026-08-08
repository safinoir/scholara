import { describe, expect, it } from "vitest";
import { scheduleSetupSchema } from "@/lib/schema";
import type { ScheduleSetup } from "@/lib/types";

function validSchedule(): ScheduleSetup {
  return {
    mode: "by-course",
    courses: [
      {
        id: "chem",
        name: "Chemistry",
        colorKey: "teal",
        includedInPlan: true,
        priority: "focus",
      },
    ],
    classMeetings: [
      {
        id: "lecture",
        courseId: "chem",
        label: "Chemistry",
        days: ["Monday", "Wednesday"],
        startMinute: 9 * 60,
        endMinute: 10 * 60,
      },
    ],
    studyWindows: [
      {
        id: "evening",
        days: ["Monday", "Wednesday"],
        startMinute: 18 * 60,
        endMinute: 21 * 60,
      },
    ],
    targetStudyMinutes: 240,
  };
}

describe("schedule setup schema", () => {
  it("accepts a complete recurring schedule", () => {
    expect(scheduleSetupSchema.safeParse(validSchedule()).success).toBe(true);
  });

  it("rejects unknown course references and a course plan with nothing included", () => {
    const setup = validSchedule();
    setup.courses[0].includedInPlan = false;
    setup.classMeetings[0].courseId = "unknown";

    expect(scheduleSetupSchema.safeParse(setup).success).toBe(false);
  });

  it("rejects overlapping recurring classes", () => {
    const setup = validSchedule();
    setup.classMeetings.push({
      id: "lab",
      courseId: "chem",
      label: "Lab",
      days: ["Monday"],
      startMinute: 9 * 60 + 30,
      endMinute: 11 * 60,
    });

    expect(scheduleSetupSchema.safeParse(setup).success).toBe(false);
  });

  it("rejects off-grid or missing study availability", () => {
    const offGrid = validSchedule();
    offGrid.studyWindows[0].startMinute += 7;
    expect(scheduleSetupSchema.safeParse(offGrid).success).toBe(false);

    const empty = validSchedule();
    empty.studyWindows = [];
    expect(scheduleSetupSchema.safeParse(empty).success).toBe(false);
  });
});
