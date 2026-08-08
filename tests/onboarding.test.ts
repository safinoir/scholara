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
  LearnerContext,
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

const CONTEXT: LearnerContext = {
  year: "sophomore",
  field: "stem",
  courseLoad: 4,
  hoursPerWeek: 10,
  hasOutsideObligations: false,
};

function profileAt(
  onboardingStage: OnboardingStage,
  hasSelection = onboardingStage === "schedule" || onboardingStage === "complete",
): LearnerProfile {
  const profile = generateProfile({
    axes: AXES,
    frictions: ["retention", "distraction"],
    context: CONTEXT,
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
      label: "Choose your Study Toolkit",
    });
  });

  it("resumes weekly setup after the toolkit is saved", () => {
    const profile = profileAt("schedule");

    expect(canAccessToolkit(profile)).toBe(true);
    expect(hasConfirmedToolkit(profile)).toBe(true);
    expect(resumeDestination(profile)).toEqual({
      href: "/plan",
      label: "Continue to weekly setup",
    });
  });

  it("returns completed learners to their plan", () => {
    const profile = profileAt("complete");

    expect(canAccessToolkit(profile)).toBe(true);
    expect(hasConfirmedToolkit(profile)).toBe(true);
    expect(resumeDestination(profile)).toEqual({
      href: "/plan",
      label: "Back to your plan",
    });
  });

  it("falls back to the toolkit when a later stage has no saved methods", () => {
    const inconsistentProfile = profileAt("schedule", false);

    expect(hasConfirmedToolkit(inconsistentProfile)).toBe(false);
    expect(resumeDestination(inconsistentProfile)).toEqual({
      href: "/toolkit",
      label: "Choose your Study Toolkit",
    });
  });

  it("recognizes a completed schedule only after its calendar is generated", () => {
    const profile = profileAt("schedule");
    const planned = {
      ...profile,
      plan: {
        blocks: [],
        flexible: false,
        totalMinutes: 0,
        budgetMinutes: 0,
        minimumEffectiveDose: false,
        rationale: [],
      },
      schedule: {
        mode: "general" as const,
        courses: [],
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
  });
});
