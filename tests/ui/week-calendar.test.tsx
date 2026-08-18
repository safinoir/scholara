// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { WeekCalendar } from "@/components/plan/WeekCalendar";
import type {
  ScheduleSetup,
  WeekContext,
  WeekPlan,
} from "@/lib/types";
import { currentWeekStart } from "@/lib/week";
import "./dom";

const schedule: ScheduleSetup = {
  mode: "by-course",
  courses: [
    {
      id: "calculus",
      name: "Calculus",
      colorKey: "indigo",
      includedInPlan: true,
      priority: "standard",
    },
  ],
  classMeetings: [
    {
      id: "calculus-class",
      courseId: "calculus",
      label: "Calculus class",
      days: ["Monday"],
      startMinute: 9 * 60,
      endMinute: 10 * 60,
    },
  ],
  studyWindows: [
    {
      id: "monday-window",
      days: ["Monday"],
      startMinute: 8 * 60,
      endMinute: 12 * 60,
    },
  ],
  targetStudyMinutes: 60,
};

const week: WeekContext = {
  weekStart: currentWeekStart(),
  unavailableDays: ["Tuesday"],
  busyWindows: [
    {
      id: "monday-appointment",
      day: "Monday",
      startMinute: 10 * 60,
      endMinute: 10 * 60 + 30,
    },
  ],
  courseTargets: [],
  targetStudyMinutes: 60,
  load: "normal",
  energy: "steady",
  focusFrictions: [],
};

const plan: WeekPlan = {
  algorithmVersion: 2,
  blocks: [
    {
      id: "calculus-retrieval",
      day: "Monday",
      start: 10.5,
      startMinute: 10 * 60 + 30,
      minutes: 60,
      courseId: "calculus",
      label: "Calculus retrieval",
      techniqueId: "retrieval-practice",
      supportingTechniqueIds: [],
      techniqueSource: "selected",
      addressedFrictionIds: [],
      intensity: "deep",
      note: "Answer practice questions without notes.",
    },
  ],
  flexible: false,
  totalMinutes: 60,
  budgetMinutes: 60,
  minimumEffectiveDose: false,
  rationale: ["Study time stays inside confirmed availability."],
  frictionResponses: [],
};

describe("WeekCalendar", () => {
  it("renders semantic dated agenda groups and weekly constraint overlays", async () => {
    const user = userEvent.setup();
    const onSelectBlock = vi.fn();
    render(
      <WeekCalendar
        schedule={schedule}
        plan={plan}
        week={week}
        weekStart={week.weekStart!}
        onSelectBlock={onSelectBlock}
      />,
    );

    expect(screen.getAllByText("Calculus class").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Unavailable this week").length).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("button", { name: /Calculus study/i }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByRole("navigation", { name: "Jump to an agenda day" }),
    ).toBeDefined();

    const agenda = screen.getByRole("button", { name: "Agenda" });
    await user.click(agenda);
    expect(agenda.getAttribute("aria-pressed")).toBe("true");

    await user.click(
      screen.getAllByRole("button", { name: /Calculus study/i })[0],
    );
    expect(onSelectBlock).toHaveBeenCalledWith(plan.blocks[0]);
  });
});
