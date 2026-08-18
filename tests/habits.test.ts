import { describe, expect, it } from "vitest";
import { generateProfile } from "@/lib/engine";
import { rankHabitSuggestions } from "@/lib/habits";
import type { LearnerProfile, PlanBlock, WeekPlan } from "@/lib/types";

const AXES = {
  rhythm: 0,
  structure: 0,
  social: 0,
  input: 0,
  drive: 0,
  clock: 0,
};

function planBlock(techniqueId: string): PlanBlock {
  return {
    id: "test-block",
    day: "Monday",
    start: 9,
    startMinute: 9 * 60,
    minutes: 30,
    label: "Test block",
    techniqueId,
    supportingTechniqueIds: [],
    techniqueSource: "selected",
    addressedFrictionIds: [],
    intensity: "deep",
    note: "Test note",
  };
}

function weekPlan(techniqueId: string): WeekPlan {
  return {
    algorithmVersion: 2,
    blocks: [planBlock(techniqueId)],
    flexible: false,
    totalMinutes: 30,
    budgetMinutes: 30,
    minimumEffectiveDose: false,
    rationale: [],
    frictionResponses: [],
  };
}

describe("personalized habit ranking", () => {
  it("prioritizes saved-plan techniques, then selected Methods, then obstacles", () => {
    const generated = generateProfile({
      axes: AXES,
      frictions: ["distraction"],
    });
    const profile: LearnerProfile = {
      ...generated,
      selectedTechniqueIds: ["five-minute-rule"],
      plan: weekPlan("retrieval-practice"),
    };

    const ranked = rankHabitSuggestions(profile, []);

    expect(ranked.slice(0, 3).map(({ habit }) => habit.id)).toEqual([
      "closed-book-recall",
      "start-five",
      "phone-away",
    ]);
    expect(ranked[0]).toMatchObject({
      supportsPlanMethod: true,
      supportsSelectedMethod: false,
    });
    expect(ranked[1]).toMatchObject({
      supportsPlanMethod: false,
      supportsSelectedMethod: true,
    });
    expect(ranked[2].obstacleMatches).toEqual(["distraction"]);
  });

  it("excludes active habits without disturbing the remaining order", () => {
    const profile = generateProfile({
      axes: AXES,
      frictions: ["retention"],
    });

    const ranked = rankHabitSuggestions(profile, ["closed-book-recall"]);

    expect(ranked.some(({ habit }) => habit.id === "closed-book-recall")).toBe(
      false,
    );
    expect(ranked[0].habit.id).toBe("review-queue");
  });
});
