import { describe, expect, it } from "vitest";
import {
  buildWeeklyPlan,
  generateProfile,
  matchArchetype,
  rankTechniques,
  scoreAxes,
} from "@/lib/engine";
import { AXIS_QUESTIONS } from "@/lib/data/questions";
import { ARCHETYPE_BY_ID } from "@/lib/data/archetypes";
import { TECHNIQUE_BY_ID } from "@/lib/data/techniques";
import { profileSchema } from "@/lib/schema";
import { AXES, type AxisScores, type LearnerContext, type QuizAnswers } from "@/lib/types";

const CONTEXT: LearnerContext = {
  year: "sophomore",
  field: "stem",
  courseLoad: 4,
  hoursPerWeek: 12,
  hasOutsideObligations: false,
};

const ZERO: AxisScores = {
  rhythm: 0,
  structure: 0,
  social: 0,
  input: 0,
  drive: 0,
  clock: 0,
};

/** Picks the option index whose weight on `axis` is most extreme in `direction`. */
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
  return { axisAnswers, frictions: [], context: CONTEXT };
}

describe("scoreAxes", () => {
  it("returns all zeros when nothing is answered", () => {
    const scores = scoreAxes({
      axisAnswers: {},
      frictions: [],
      context: CONTEXT,
    });
    for (const axis of AXES) expect(scores[axis]).toBe(0);
  });

  it("keeps every axis within -100..100", () => {
    for (const axis of AXES) {
      for (const direction of [1, -1] as const) {
        const scores = scoreAxes(answersLeaning(axis, direction));
        for (const a of AXES) {
          expect(scores[a]).toBeGreaterThanOrEqual(-100);
          expect(scores[a]).toBeLessThanOrEqual(100);
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
      context: CONTEXT,
    });
    for (const axis of AXES) expect(scores[axis]).toBe(0);
  });
});

describe("matchArchetype", () => {
  it("matches each archetype to its own vector", () => {
    for (const id of Object.keys(ARCHETYPE_BY_ID) as (keyof typeof ARCHETYPE_BY_ID)[]) {
      const match = matchArchetype(ARCHETYPE_BY_ID[id].vector);
      expect(match.primary).toBe(id);
    }
  });

  it("never returns the same archetype twice", () => {
    const match = matchArchetype({ ...ZERO, structure: 80, rhythm: 60 });
    expect(match.primary).not.toBe(match.secondary);
  });

  it("keeps confidence within 0..1 even for an all-neutral profile", () => {
    const match = matchArchetype(ZERO);
    expect(match.confidence).toBeGreaterThanOrEqual(0);
    expect(match.confidence).toBeLessThanOrEqual(1);
  });
});

describe("rankTechniques", () => {
  const base: Parameters<typeof rankTechniques>[0] = {
    axes: ZERO,
    frictions: [],
    context: CONTEXT,
    primary: "anchor",
  };

  it("returns exactly five techniques", () => {
    expect(rankTechniques(base)).toHaveLength(5);
  });

  it("never repeats a technique", () => {
    const ids = rankTechniques(base).map((t) => t.technique.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("caps each category at two so results stay varied", () => {
    const counts: Record<string, number> = {};
    for (const scored of rankTechniques({ ...base, frictions: ["retention"] })) {
      const category = scored.technique.category;
      counts[category] = (counts[category] ?? 0) + 1;
    }
    for (const count of Object.values(counts)) {
      expect(count).toBeLessThanOrEqual(2);
    }
  });

  it("surfaces a technique that targets the reported obstacle", () => {
    const ids = rankTechniques({ ...base, frictions: ["test-anxiety"] }).map(
      (t) => t.technique.id,
    );
    const anyTargets = ids.some((id) =>
      TECHNIQUE_BY_ID[id].fixes.includes("test-anxiety"),
    );
    expect(anyTargets).toBe(true);
  });

  it("explains its top pick", () => {
    const top = rankTechniques({ ...base, frictions: ["procrastination"] })[0];
    expect(top.reasons.length).toBeGreaterThan(0);
  });
});

describe("buildWeeklyPlan", () => {
  const techniques = rankTechniques({
    axes: ZERO,
    frictions: [],
    context: CONTEXT,
    primary: "anchor",
  });

  it("never schedules more than the stated budget", () => {
    for (const hours of [2, 5, 10, 20, 40]) {
      const context = { ...CONTEXT, hoursPerWeek: hours };
      const plan = buildWeeklyPlan({
        axes: ZERO,
        frictions: [],
        context,
        techniques,
      });
      expect(plan.totalMinutes).toBeLessThanOrEqual(plan.budgetMinutes);
      expect(plan.totalMinutes).toBeLessThanOrEqual(hours * 60 * 0.85 + 1);
    }
  });

  it("uses short blocks for sprinters and long ones for marathoners", () => {
    const sprinter = buildWeeklyPlan({
      axes: { ...ZERO, rhythm: -90 },
      frictions: [],
      context: { ...CONTEXT, hoursPerWeek: 20 },
      techniques,
    });
    const marathoner = buildWeeklyPlan({
      axes: { ...ZERO, rhythm: 90 },
      frictions: [],
      context: { ...CONTEXT, hoursPerWeek: 20 },
      techniques,
    });

    const deepest = (plan: typeof sprinter) =>
      Math.max(...plan.blocks.filter((b) => b.intensity === "deep").map((b) => b.minutes));

    expect(deepest(sprinter)).toBeLessThan(deepest(marathoner));
  });

  it("switches to flexible anchors when structure is low", () => {
    const plan = buildWeeklyPlan({
      axes: { ...ZERO, structure: -70 },
      frictions: [],
      context: CONTEXT,
      techniques,
    });
    expect(plan.flexible).toBe(true);
  });

  it("strips down to a minimum effective dose under time scarcity", () => {
    const scarce = buildWeeklyPlan({
      axes: ZERO,
      frictions: ["time-scarcity"],
      context: { ...CONTEXT, hoursPerWeek: 20 },
      techniques,
    });
    const normal = buildWeeklyPlan({
      axes: ZERO,
      frictions: [],
      context: { ...CONTEXT, hoursPerWeek: 20 },
      techniques,
    });

    expect(scarce.minimumEffectiveDose).toBe(true);
    expect(scarce.blocks.length).toBeLessThan(normal.blocks.length);
  });

  it("always keeps a weekly review block", () => {
    for (const hours of [3, 8, 25]) {
      const plan = buildWeeklyPlan({
        axes: ZERO,
        frictions: [],
        context: { ...CONTEXT, hoursPerWeek: hours },
        techniques,
      });
      expect(plan.blocks.some((b) => b.intensity === "admin")).toBe(true);
    }
  });

  it("puts hard work in the morning for early birds and at night for owls", () => {
    const early = buildWeeklyPlan({
      axes: { ...ZERO, clock: -80 },
      frictions: [],
      context: CONTEXT,
      techniques,
    });
    const owl = buildWeeklyPlan({
      axes: { ...ZERO, clock: 80 },
      frictions: [],
      context: CONTEXT,
      techniques,
    });

    const firstDeep = (plan: typeof early) =>
      plan.blocks.find((b) => b.intensity === "deep")!.start;

    expect(firstDeep(early)).toBeLessThan(12);
    expect(firstDeep(owl)).toBeGreaterThanOrEqual(17);
  });

  it("produces valid blocks at every hour setting", () => {
    for (let hours = 2; hours <= 40; hours++) {
      const plan = buildWeeklyPlan({
        axes: ZERO,
        frictions: [],
        context: { ...CONTEXT, hoursPerWeek: hours },
        techniques,
      });
      for (const block of plan.blocks) {
        expect(block.minutes).toBeGreaterThan(0);
        expect(block.start).toBeGreaterThanOrEqual(0);
        expect(block.start).toBeLessThan(24);
        expect(TECHNIQUE_BY_ID[block.techniqueId]).toBeDefined();
      }
    }
  });
});

describe("generateProfile", () => {
  it("produces a profile that passes its own schema", () => {
    const profile = generateProfile({
      axes: { ...ZERO, structure: 60, rhythm: 40 },
      frictions: ["procrastination", "retention"],
      context: CONTEXT,
    });
    expect(profileSchema.safeParse(profile).success).toBe(true);
  });

  it("recommends resources and explains every technique", () => {
    const profile = generateProfile({
      axes: ZERO,
      frictions: ["distraction"],
      context: CONTEXT,
    });
    expect(profile.resourceIds.length).toBeGreaterThan(0);
    for (const id of profile.techniqueIds) {
      expect(profile.reasons[id]).toBeDefined();
    }
  });

  it("survives every archetype vector without throwing", () => {
    for (const archetype of Object.values(ARCHETYPE_BY_ID)) {
      const profile = generateProfile({
        axes: archetype.vector,
        frictions: ["overwhelm", "time-scarcity"],
        context: { ...CONTEXT, hoursPerWeek: 4 },
      });
      expect(profile.plan.blocks.length).toBeGreaterThan(0);
    }
  });
});
