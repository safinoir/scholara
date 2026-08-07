import { describe, expect, it } from "vitest";
import { buildWeeklyPlan, generateProfile, rankTechniques } from "@/lib/engine";
import { parseProfile, profileSchema } from "@/lib/schema";
import { PROFILE_VERSION, type AxisScores, type LearnerContext } from "@/lib/types";

const AXES: AxisScores = {
  rhythm: -30,
  structure: 70,
  social: 15,
  input: -20,
  drive: -10,
  clock: -40,
};

const CONTEXT: LearnerContext = {
  year: "sophomore",
  field: "stem",
  courseLoad: 4,
  hoursPerWeek: 10,
  hasOutsideObligations: false,
};

function makeProfile() {
  return generateProfile({
    axes: AXES,
    frictions: ["retention", "distraction"],
    context: CONTEXT,
  });
}

function makePlan(profile: ReturnType<typeof makeProfile>) {
  return buildWeeklyPlan({
    axes: profile.axes,
    frictions: profile.frictions,
    context: profile.context,
    techniques: rankTechniques({
      axes: profile.axes,
      frictions: profile.frictions,
      context: profile.context,
      primary: profile.match.primary,
    }),
  });
}

describe("profile version 2", () => {
  it("starts new profiles at the persona step with no claimed selections", () => {
    const profile = makeProfile();

    expect(profile.version).toBe(PROFILE_VERSION);
    expect(profile.onboardingStage).toBe("persona");
    expect(profile.recommendedTechniqueIds).toHaveLength(5);
    expect(profile.selectedTechniqueIds).toEqual([]);
    expect(profile.plan).toBeUndefined();
    expect(profileSchema.safeParse(profile).success).toBe(true);
  });

  it("migrates a version 1 profile without losing its generated plan", () => {
    const current = makeProfile();
    const legacyPlan = makePlan(current);
    const { recommendedTechniqueIds } = current;
    const legacy: Record<string, unknown> = {
      ...current,
      version: 1,
      plan: legacyPlan,
      techniqueIds: [
        recommendedTechniqueIds[0],
        recommendedTechniqueIds[0],
        ...recommendedTechniqueIds.slice(1),
        "removed-technique",
      ],
    };
    delete legacy.recommendedTechniqueIds;
    delete legacy.selectedTechniqueIds;
    delete legacy.onboardingStage;

    const migrated = parseProfile(legacy);

    expect(migrated).not.toBeNull();
    expect(migrated?.version).toBe(PROFILE_VERSION);
    expect(migrated?.onboardingStage).toBe("toolkit");
    expect(migrated?.selectedTechniqueIds).toEqual([]);
    expect(migrated?.recommendedTechniqueIds).toEqual(recommendedTechniqueIds);
    expect(migrated?.plan).toEqual(legacyPlan);
  });

  it("requires at least one method after the toolkit stage", () => {
    const profile = makeProfile();
    const withoutSelection = {
      ...profile,
      onboardingStage: "schedule" as const,
    };
    const withSelection = {
      ...withoutSelection,
      selectedTechniqueIds: [profile.recommendedTechniqueIds[0]],
    };

    expect(profileSchema.safeParse(withoutSelection).success).toBe(false);
    expect(profileSchema.safeParse(withSelection).success).toBe(true);
  });

  it("requires a generated plan only after onboarding is complete", () => {
    const profile = makeProfile();
    const selectedTechniqueIds = [profile.recommendedTechniqueIds[0]];

    expect(
      profileSchema.safeParse({
        ...profile,
        onboardingStage: "schedule",
        selectedTechniqueIds,
      }).success,
    ).toBe(true);
    expect(
      profileSchema.safeParse({
        ...profile,
        onboardingStage: "complete",
        selectedTechniqueIds,
      }).success,
    ).toBe(false);
    expect(
      profileSchema.safeParse({
        ...profile,
        onboardingStage: "complete",
        selectedTechniqueIds,
        plan: makePlan(profile),
      }).success,
    ).toBe(true);
  });

  it("rejects duplicate or unknown selected technique ids", () => {
    const profile = makeProfile();
    const id = profile.recommendedTechniqueIds[0];

    expect(
      profileSchema.safeParse({
        ...profile,
        selectedTechniqueIds: [id, id],
      }).success,
    ).toBe(false);
    expect(
      profileSchema.safeParse({
        ...profile,
        selectedTechniqueIds: ["unknown-technique"],
      }).success,
    ).toBe(false);
  });
});
