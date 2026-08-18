import { describe, expect, it } from "vitest";
import { getCareerTrack } from "@/lib/data/careerTracks";
import { RESOURCES, RESOURCE_BY_ID } from "@/lib/data/resources";
import { TECHNIQUES } from "@/lib/data/techniques";
import { generateProfile, scoreResource } from "@/lib/engine";
import {
  resourceFitForProfile,
  resourcePersonalizationForProfile,
  resourceRankingInputForProfile,
} from "@/lib/resources";
import type {
  Field,
  LearnerProfile,
  PlanBlock,
  WeekPlan,
} from "@/lib/types";

const AXES = {
  rhythm: 0,
  structure: 0,
  social: 0,
  input: 0,
  drive: 0,
  clock: 0,
};

function planBlock(
  techniqueId: string,
  supportingTechniqueIds: string[] = [],
): PlanBlock {
  return {
    id: `block-${techniqueId}`,
    day: "Monday",
    start: 9,
    startMinute: 9 * 60,
    minutes: 30,
    label: "Test study block",
    techniqueId,
    supportingTechniqueIds,
    techniqueSource: "selected",
    addressedFrictionIds: [],
    intensity: "deep",
    note: "Test note",
  };
}

function weekPlan(...blocks: PlanBlock[]): WeekPlan {
  return {
    algorithmVersion: 2,
    blocks,
    flexible: false,
    totalMinutes: blocks.reduce((total, block) => total + block.minutes, 0),
    budgetMinutes: 60,
    minimumEffectiveDose: false,
    rationale: [],
    frictionResponses: [],
  };
}

function personalizedProfile(): LearnerProfile {
  return {
    ...generateProfile({ axes: AXES, frictions: ["math-heavy"] }),
    educationContext: { year: "sophomore", field: "stem" },
    recommendedTechniqueIds: ["dual-coding"],
    selectedTechniqueIds: ["pomodoro"],
    plan: weekPlan(
      planBlock("retrieval-practice", ["spaced-repetition"]),
    ),
  };
}

describe("resource personalization", () => {
  it("derives tools from the saved plan and selected Methods before intake recommendations", () => {
    const personalization = resourcePersonalizationForProfile(
      personalizedProfile(),
    );

    expect(personalization.planTechniqueIds).toEqual([
      "retrieval-practice",
      "spaced-repetition",
    ]);
    expect(personalization.planToolIds).toEqual([
      "anki",
      "quizlet",
      "learning-scientists",
    ]);
    expect(personalization.selectedTechniqueIds).toEqual(["pomodoro"]);
    expect(personalization.selectedToolIds).toEqual(["pomofocus", "forest"]);
    expect(personalization.recommendedTechniqueIds).toEqual([]);
    expect(personalization.recommendedToolIds).toEqual([]);
  });

  it("falls back to intake recommendations before Methods or a plan exist", () => {
    const generated = generateProfile({ axes: AXES, frictions: [] });
    const profile: LearnerProfile = {
      ...generated,
      recommendedTechniqueIds: ["dual-coding"],
      selectedTechniqueIds: [],
    };

    expect(resourcePersonalizationForProfile(profile)).toMatchObject({
      planTechniqueIds: [],
      selectedTechniqueIds: [],
      recommendedTechniqueIds: ["dual-coding"],
      recommendedToolIds: [
        "excalidraw",
        "obsidian",
        "learning-scientists",
      ],
    });
  });

  it("explains plan, selected-Method, obstacle, and field matches independently", () => {
    const profile = personalizedProfile();

    expect(resourceFitForProfile(RESOURCE_BY_ID.anki, profile)).toMatchObject({
      methodSource: "plan",
      techniqueId: "retrieval-practice",
      obstacleMatches: ["math-heavy"],
      fieldMatch: false,
    });
    expect(
      resourceFitForProfile(RESOURCE_BY_ID.pomofocus, profile),
    ).toMatchObject({
      methodSource: "selected",
      techniqueId: "pomodoro",
      obstacleMatches: [],
      fieldMatch: false,
    });
    expect(
      resourceFitForProfile(RESOURCE_BY_ID["khan-academy"], profile),
    ).toMatchObject({
      methodSource: null,
      obstacleMatches: ["math-heavy"],
      fieldMatch: true,
    });
  });

  it("keeps plan matches ahead of selected and recommended tool matches", () => {
    const anki = RESOURCE_BY_ID.anki;
    const base = {
      axes: AXES,
      frictions: [],
      toolIds: [] as string[],
    };

    const recommendedScore = scoreResource(anki, {
      ...base,
      toolIds: ["anki"],
    });
    const selectedScore = scoreResource(anki, {
      ...base,
      selectedToolIds: ["anki"],
    });
    const planScore = scoreResource(anki, {
      ...base,
      planToolIds: ["anki"],
    });

    expect(planScore).toBeGreaterThan(selectedScore);
    expect(selectedScore).toBeGreaterThan(recommendedScore);
    expect(resourceRankingInputForProfile(personalizedProfile())).toMatchObject({
      planToolIds: ["anki", "quizlet", "learning-scientists"],
      selectedToolIds: ["pomofocus", "forest"],
      toolIds: [],
    });
  });
});

describe("resource catalog integrity", () => {
  const resourceIds = new Set(RESOURCES.map((resource) => resource.id));

  it("keeps resource ids unique and external destinations on HTTPS", () => {
    expect(resourceIds.size).toBe(RESOURCES.length);
    expect(
      RESOURCES.filter(
        (resource) => resource.url && !resource.url.startsWith("https://"),
      ).map((resource) => ({ id: resource.id, url: resource.url })),
    ).toEqual([]);
  });

  it("resolves every resource referenced by a Method", () => {
    const missing = TECHNIQUES.flatMap((technique) =>
      technique.toolIds
        .filter((resourceId) => !resourceIds.has(resourceId))
        .map((resourceId) => ({ techniqueId: technique.id, resourceId })),
    );

    expect(missing).toEqual([]);
  });

  it("resolves every resource referenced by a Career step", () => {
    const fields: Field[] = [
      "stem",
      "health",
      "business",
      "humanities",
      "arts",
      "undecided",
    ];
    const missing = fields.flatMap((field) =>
      getCareerTrack(field).steps.flatMap((step) =>
        step.resourceIds
          .filter((resourceId) => !resourceIds.has(resourceId))
          .map((resourceId) => ({ field, stepId: step.id, resourceId })),
      ),
    );

    expect(missing).toEqual([]);
  });
});
