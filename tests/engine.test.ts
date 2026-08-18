import { describe, expect, it } from "vitest";
import {
  generateProfile,
  matchArchetype,
  rankTechniques,
  scoreAxes,
} from "@/lib/engine";
import { ARCHETYPE_BY_ID } from "@/lib/data/archetypes";
import { AXIS_QUESTIONS } from "@/lib/data/questions";
import { TECHNIQUE_BY_ID } from "@/lib/data/techniques";
import { profileSchema } from "@/lib/schema";
import { AXES, type AxisScores, type QuizAnswers } from "@/lib/types";

const ZERO: AxisScores = {
  rhythm: 0,
  structure: 0,
  social: 0,
  input: 0,
  drive: 0,
  clock: 0,
};

function answersLeaning(axis: keyof AxisScores, direction: 1 | -1): QuizAnswers {
  const axisAnswers: Record<string, number> = {};
  for (const question of AXIS_QUESTIONS) {
    let best = 0;
    let bestValue = -Infinity;
    question.options.forEach((option, index) => {
      const value = (option.weights[axis] ?? 0) * direction;
      if (value > bestValue) {
        bestValue = value;
        best = index;
      }
    });
    axisAnswers[question.id] = best;
  }
  return { axisAnswers, frictions: [] };
}

describe("scoreAxes", () => {
  it("returns all zeros when nothing is answered", () => {
    const scores = scoreAxes({ axisAnswers: {}, frictions: [] });
    for (const axis of AXES) expect(scores[axis]).toBe(0);
  });

  it("keeps every axis within -100..100", () => {
    for (const axis of AXES) {
      for (const direction of [1, -1] as const) {
        const scores = scoreAxes(answersLeaning(axis, direction));
        for (const candidate of AXES) {
          expect(scores[candidate]).toBeGreaterThanOrEqual(-100);
          expect(scores[candidate]).toBeLessThanOrEqual(100);
        }
      }
    }
  });

  it("moves an axis in the direction of consistent answers", () => {
    for (const axis of AXES) {
      const high = scoreAxes(answersLeaning(axis, 1))[axis];
      const low = scoreAxes(answersLeaning(axis, -1))[axis];
      expect(high).toBeGreaterThan(low);
      expect(high).toBeGreaterThan(0);
      expect(low).toBeLessThan(0);
    }
  });

  it("ignores answers referencing unknown questions", () => {
    const scores = scoreAxes({
      axisAnswers: { "does-not-exist": 3 },
      frictions: [],
    });
    for (const axis of AXES) expect(scores[axis]).toBe(0);
  });
});

describe("matchArchetype", () => {
  it("matches each archetype to its own vector", () => {
    for (const id of Object.keys(
      ARCHETYPE_BY_ID,
    ) as (keyof typeof ARCHETYPE_BY_ID)[]) {
      expect(matchArchetype(ARCHETYPE_BY_ID[id].vector).primary).toBe(id);
    }
  });

  it("never returns the same archetype twice", () => {
    const match = matchArchetype({ ...ZERO, structure: 80, rhythm: 60 });
    expect(match.primary).not.toBe(match.secondary);
  });

  it("keeps confidence within 0..1", () => {
    const match = matchArchetype(ZERO);
    expect(match.confidence).toBeGreaterThanOrEqual(0);
    expect(match.confidence).toBeLessThanOrEqual(1);
  });
});

describe("rankTechniques", () => {
  const base: Parameters<typeof rankTechniques>[0] = {
    axes: ZERO,
    frictions: [],
    primary: "anchor",
  };

  it("returns five varied, unique techniques", () => {
    const ranked = rankTechniques(base);
    expect(ranked).toHaveLength(5);
    expect(new Set(ranked.map((item) => item.technique.id)).size).toBe(5);

    const categories = new Map<string, number>();
    for (const item of ranked) {
      const category = item.technique.category;
      categories.set(category, (categories.get(category) ?? 0) + 1);
    }
    for (const count of categories.values()) expect(count).toBeLessThanOrEqual(2);
  });

  it("surfaces and explains a method for a reported obstacle", () => {
    const ranked = rankTechniques({ ...base, frictions: ["test-anxiety"] });
    expect(
      ranked.some((item) => item.technique.fixes.includes("test-anxiety")),
    ).toBe(true);
    expect(
      rankTechniques({ ...base, frictions: ["procrastination"] })[0].reasons
        .length,
    ).toBeGreaterThan(0);
  });
});

describe("generateProfile", () => {
  it("produces a context-free profile that passes its schema", () => {
    const profile = generateProfile({
      axes: { ...ZERO, structure: 60, rhythm: 40 },
      frictions: ["procrastination", "retention"],
    });
    expect(profile).not.toHaveProperty("context");
    expect(profileSchema.safeParse(profile).success).toBe(true);
  });

  it("recommends resources and explains every technique", () => {
    const profile = generateProfile({ axes: ZERO, frictions: ["distraction"] });
    expect(profile.resourceIds.length).toBeGreaterThan(0);
    for (const id of profile.recommendedTechniqueIds) {
      expect(profile.reasons[id]).toBeDefined();
      expect(TECHNIQUE_BY_ID[id]).toBeDefined();
    }
  });

  it("survives every archetype vector without context", () => {
    for (const archetype of Object.values(ARCHETYPE_BY_ID)) {
      const profile = generateProfile({
        axes: archetype.vector,
        frictions: ["overwhelm", "time-scarcity"],
      });
      expect(profile.plan).toBeUndefined();
      expect(profile.recommendedTechniqueIds).toHaveLength(5);
    }
  });
});
