import { describe, expect, it } from "vitest";
import { summarizeCapacity } from "@/components/plan/scheduleSetupUtils";
import type { ScheduleSetup } from "@/lib/types";

describe("summarizeCapacity", () => {
  it("separates total recurring class time from overlap with study windows", () => {
    const schedule: ScheduleSetup = {
      mode: "by-course",
      courses: [],
      classMeetings: [
        {
          id: "monday-class",
          label: "Chemistry",
          days: ["Monday"],
          startMinute: 10 * 60,
          endMinute: 11 * 60,
        },
        {
          id: "wednesday-class",
          label: "History",
          days: ["Wednesday"],
          startMinute: 9 * 60,
          endMinute: 10 * 60 + 30,
        },
      ],
      studyWindows: [
        {
          id: "monday-window",
          days: ["Monday"],
          startMinute: 9 * 60,
          endMinute: 12 * 60,
        },
        {
          id: "tuesday-window",
          days: ["Tuesday"],
          startMinute: 18 * 60,
          endMinute: 20 * 60,
        },
      ],
      targetStudyMinutes: 300,
    };

    expect(summarizeCapacity(schedule)).toMatchObject({
      availableMinutes: 300,
      classMinutes: 150,
      classOverlapMinutes: 60,
      usableMinutes: 240,
      plannedMinutes: 240,
      shortfallMinutes: 60,
    });
  });

  it("uses scheduler capacity rules and drops post-class fragments under 30 minutes", () => {
    const schedule: ScheduleSetup = {
      mode: "by-course",
      courses: [],
      classMeetings: [
        {
          id: "middle-class",
          label: "Chemistry",
          days: ["Monday"],
          startMinute: 9 * 60 + 30,
          endMinute: 10 * 60,
        },
      ],
      studyWindows: [
        {
          id: "split-window",
          days: ["Monday"],
          startMinute: 9 * 60,
          endMinute: 10 * 60 + 15,
        },
      ],
      targetStudyMinutes: 60,
    };

    expect(summarizeCapacity(schedule)).toMatchObject({
      availableMinutes: 75,
      classOverlapMinutes: 30,
      usableMinutes: 30,
      plannedMinutes: 30,
      bufferMinutes: 0,
      shortfallMinutes: 30,
    });
  });
});
