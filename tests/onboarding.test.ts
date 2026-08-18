import { describe, expect, it } from "vitest";
import { generateProfile } from "@/lib/engine";
import {
  canAccessToolkit,
  hasCompletedSchedule,
  hasConfirmedToolkit,
  hasGeneratedPlan,
  resumeDestination,
} from "@/lib/onboarding";
import type {
  AxisScores,
  LearnerProfile,
  OnboardingStage,
} from "@/lib/types";

const AXES: AxisScores = {
  rhythm: -30,
  structure: 70,
  social: 15,
  input: -20,
  drive: -10,
  clock: -40,
};

function profileAt(
  onboardingStage: OnboardingStage,
  hasSelection = onboardingStage === "schedule" || onboardingStage === "complete",
): LearnerProfile {
  const profile = generateProfile({
    axes: AXES,
    frictions: ["retention", "distraction"],
  });

  return {
    ...profile,
    onboardingStage,
    selectedTechniqueIds: hasSelection
      ? [profile.recommendedTechniqueIds[0]]
      : [],
  };
}

describe("onboarding access", () => {
  it("keeps a new learner on the persona step", () => {
    const profile = profileAt("persona");

    expect(canAccessToolkit(profile)).toBe(false);
    expect(hasConfirmedToolkit(profile)).toBe(false);
    expect(hasGeneratedPlan(profile)).toBe(false);
    expect(hasCompletedSchedule(profile)).toBe(false);
    expect(resumeDestination(profile)).toEqual({
      href: "/persona",
      label: "Continue to your persona",
    });
  });

  it("opens the toolkit after the persona is confirmed", () => {
    const profile = profileAt("toolkit");

    expect(canAccessToolkit(profile)).toBe(true);
    expect(hasConfirmedToolkit(profile)).toBe(false);
    expect(resumeDestination(profile)).toEqual({
      href: "/toolkit",
      label: "Choose your study methods",
    });
  });

  it("resumes weekly setup after the toolkit is saved", () => {
    const profile = profileAt("schedule");

    expect(canAccessToolkit(profile)).toBe(true);
    expect(hasConfirmedToolkit(profile)).toBe(true);
    expect(resumeDestination(profile)).toEqual({
      href: "/plan/setup",
      label: "Continue to weekly setup",
    });
  });

  it("does not unlock Plan from a stage flag without a valid schedule", () => {
    const profile = profileAt("complete");

    expect(canAccessToolkit(profile)).toBe(true);
    expect(hasConfirmedToolkit(profile)).toBe(true);
    expect(resumeDestination(profile)).toEqual({
      href: "/plan/setup",
      label: "Continue to weekly setup",
    });
  });

  it("falls back to the toolkit when a later stage has no saved methods", () => {
    const inconsistentProfile = profileAt("schedule", false);

    expect(hasConfirmedToolkit(inconsistentProfile)).toBe(false);
    expect(resumeDestination(inconsistentProfile)).toEqual({
      href: "/toolkit",
      label: "Choose your study methods",
    });
  });

  it("recognizes a completed schedule only after its calendar is generated", () => {
    const profile = profileAt("schedule");
    const planned = {
      ...profile,
      plan: {
        algorithmVersion: 2 as const,
        blocks: [
          {
            id: "block-01",
            day: "Monday" as const,
            start: 18,
            startMinute: 18 * 60,
            minutes: 60,
            courseId: "history",
            label: "History",
            techniqueId: profile.selectedTechniqueIds[0],
            supportingTechniqueIds: [],
            techniqueSource: "selected" as const,
            addressedFrictionIds: [],
            intensity: "deep" as const,
            note: "Use retrieval practice.",
          },
        ],
        flexible: false,
        totalMinutes: 60,
        budgetMinutes: 120,
        minimumEffectiveDose: false,
        rationale: [],
        frictionResponses: [],
      },
      schedule: {
        mode: "by-course" as const,
        courses: [
          {
            id: "history",
            name: "History",
            colorKey: "indigo" as const,
            includedInPlan: true,
            priority: "standard" as const,
          },
        ],
        classMeetings: [],
        studyWindows: [
          {
            id: "monday",
            days: ["Monday" as const],
            startMinute: 18 * 60,
            endMinute: 20 * 60,
          },
        ],
        targetStudyMinutes: 120,
      },
    };

    expect(hasGeneratedPlan(profile)).toBe(false);
    expect(hasGeneratedPlan(planned)).toBe(true);
    expect(hasCompletedSchedule(planned)).toBe(false);
    expect(
      hasCompletedSchedule({ ...planned, onboardingStage: "complete" }),
    ).toBe(true);
    expect(
      resumeDestination({ ...planned, onboardingStage: "complete" }),
    ).toEqual({ href: "/plan", label: "Back to your plan" });
  });
});
