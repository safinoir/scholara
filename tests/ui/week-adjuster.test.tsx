// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { WeekAdjuster } from "@/components/plan/WeekAdjuster";
import type { ScheduleSetup, WeekContext, WeekPlan } from "@/lib/types";
import { currentWeekStart } from "@/lib/week";
import "./dom";

const schedule: ScheduleSetup = {
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
      id: "study-window",
      days: ["Monday", "Wednesday"],
      startMinute: 18 * 60,
      endMinute: 20 * 60,
    },
  ],
  targetStudyMinutes: 60,
};

const week: WeekContext = {
  weekStart: currentWeekStart(),
  unavailableDays: [],
  busyWindows: [],
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
      id: "history-block",
      day: "Monday",
      start: 18,
      startMinute: 18 * 60,
      minutes: 60,
      courseId: "history",
      label: "History retrieval",
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
  rationale: [],
  frictionResponses: [],
};

describe("WeekAdjuster review safety", () => {
  it("keeps the current plan when a draft would generate zero blocks", async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    render(
      <WeekAdjuster
        open
        onClose={vi.fn()}
        schedule={schedule}
        week={week}
        plan={plan}
        onBuildPreview={() => ({ ...plan, blocks: [], totalMinutes: 0 })}
        onApply={onApply}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Review changes" }));

    expect(
      screen.getByText(
        "Those changes leave no usable study block. Your current plan will stay unchanged.",
      ),
    ).toBeDefined();
    expect(onApply).not.toHaveBeenCalled();
  });

  it("shows setting and semantic block details before applying", async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    const onClose = vi.fn();
    const movedPlan: WeekPlan = {
      ...plan,
      blocks: [{ ...plan.blocks[0], id: "history-block-moved", day: "Wednesday" }],
    };
    render(
      <WeekAdjuster
        open
        onClose={onClose}
        schedule={schedule}
        week={week}
        plan={plan}
        onBuildPreview={() => movedPlan}
        onApply={onApply}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Tue" }));
    await user.click(screen.getByRole("button", { name: "Review changes" }));

    expect(screen.getByText(/Tuesday: marked unavailable/)).toBeDefined();
    expect(
      screen.getByRole("heading", { name: "Moved (1)" }),
    ).toBeDefined();
    const movedDetail = screen
      .getAllByRole("listitem")
      .find(
        (item) =>
          item.textContent?.includes("History · Monday") &&
          item.textContent?.includes("History · Wednesday"),
      );
    expect(movedDetail).toBeDefined();

    await user.click(
      screen.getByRole("button", { name: "Apply reviewed changes" }),
    );
    expect(onApply).toHaveBeenCalledTimes(1);
    expect(onApply.mock.calls[0][0].unavailableDays).toContain("Tuesday");
    expect(onApply.mock.calls[0][1]).toEqual(movedPlan);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
