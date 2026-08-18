import { describe, expect, it } from "vitest";
import { ARCHETYPE_BY_ID } from "@/lib/data/archetypes";
import {
  buildSchedulePlan,
  changePersona,
  generateProfile,
  pickResources,
  rankTechniques,
} from "@/lib/engine";
import { effectiveArchetypeMatch } from "@/lib/persona";
import { parseProfile, profileSchema } from "@/lib/schema";
import type {
  EducationContext,
  LearnerProfile,
  ScheduleSetup,
  WeekContext,
} from "@/lib/types";

const EDUCATION_CONTEXT: EducationContext = {
  year: "sophomore",
  field: "stem",
};

function makeProfile() {
  return {
    ...generateProfile({
      axes: { ...ARCHETYPE_BY_ID.anchor.vector },
      frictions: ["retention", "distraction"],
    }),
    educationContext: EDUCATION_CONTEXT,
  };
}

const SCHEDULE: ScheduleSetup = {
  mode: "by-course",
  courses: [
    {
      id: "calculus",
      name: "Calculus",
      colorKey: "indigo",
      includedInPlan: true,
      priority: "focus",
    },
    {
      id: "history",
      name: "History",
      colorKey: "teal",
      includedInPlan: true,
      priority: "standard",
    },
  ],
  classMeetings: [
    {
      id: "calculus-class",
      courseId: "calculus",
      label: "Calculus class",
      days: ["Monday", "Wednesday"],
      startMinute: 10 * 60,
      endMinute: 11 * 60,
    },
  ],
  studyWindows: [
    {
      id: "weeknights",
      days: ["Monday", "Wednesday", "Friday"],
      startMinute: 17 * 60,
      endMinute: 20 * 60,
    },
  ],
  targetStudyMinutes: 360,
};

const WEEK: WeekContext = {
  unavailableDays: [],
  load: "normal",
  energy: "steady",
  focusFrictions: ["procrastination"],
  courseTargets: [
    {
      courseId: "calculus",
      priority: "urgent",
      deadlineDay: "Friday",
    },
  ],
};

describe("persona overrides", () => {
  it("preserves measured axes while exposing the learner's effective persona", () => {
    const profile = makeProfile();
    const changed = changePersona(profile, "explorer");

    expect(profile.match.primary).toBe("anchor");
    expect(changed.axes).toEqual(profile.axes);
    expect(changed.personaOverride).toBe("explorer");
    expect(effectiveArchetypeMatch(changed)).toEqual({
      primary: "explorer",
      secondary: "anchor",
      confidence: 1,
      overridden: true,
    });
  });

  it("reranks recommendations, reasons, and resources for the override", () => {
    const profile = makeProfile();
    const changed = changePersona(profile, "explorer");
    const expectedTechniques = rankTechniques({
      axes: profile.axes,
      frictions: profile.frictions,
      primary: "explorer",
    });
    const expectedResources = pickResources({
      axes: profile.axes,
      frictions: profile.frictions,
      field: profile.educationContext?.field,
      toolIds: expectedTechniques.flatMap(({ technique }) => technique.toolIds),
    });

    expect(changed.recommendedTechniqueIds).toEqual(
      expectedTechniques.map(({ technique }) => technique.id),
    );
    expect(changed.reasons).toEqual(
      Object.fromEntries(
        expectedTechniques.map(({ technique, reasons }) => [
          technique.id,
          reasons,
        ]),
      ),
    );
    expect(changed.resourceIds).toEqual(
      expectedResources.map((resource) => resource.id),
    );
  });

  it("round-trips an override through the profile schema", () => {
    const changed = changePersona(makeProfile(), "explorer");
    const parsed = parseProfile(JSON.parse(JSON.stringify(changed)));

    expect(profileSchema.safeParse(changed).success).toBe(true);
    expect(parsed?.personaOverride).toBe("explorer");
  });

  it("preserves schedule choices and rebuilds an existing plan", () => {
    const profile = makeProfile();
    const selectedTechniqueIds = ["retrieval-practice"];
    const frictions = [...new Set([...profile.frictions, ...WEEK.focusFrictions])];
    const initialTechniques = rankTechniques({
      axes: profile.axes,
      frictions,
      primary: profile.match.primary,
    });
    const initialPlan = buildSchedulePlan({
      axes: profile.axes,
      frictions: profile.frictions,
      schedule: SCHEDULE,
      techniques: initialTechniques,
      selectedTechniqueIds,
      week: WEEK,
    });
    const planned: LearnerProfile = {
      ...profile,
      selectedTechniqueIds,
      onboardingStage: "complete",
      schedule: SCHEDULE,
      weekContext: WEEK,
      plan: { ...initialPlan, rationale: ["Stale plan"] },
    };

    const changed = changePersona(planned, "explorer");
    const expectedPlan = buildSchedulePlan({
      axes: profile.axes,
      frictions: profile.frictions,
      schedule: SCHEDULE,
      techniques: rankTechniques({
        axes: profile.axes,
        frictions,
        primary: "explorer",
      }),
      selectedTechniqueIds,
      week: WEEK,
    });

    expect(changed.axes).toEqual(planned.axes);
    expect(changed.selectedTechniqueIds).toEqual(selectedTechniqueIds);
    expect(changed.schedule).toEqual(SCHEDULE);
    expect(changed.weekContext).toEqual(WEEK);
    expect(changed.onboardingStage).toBe("complete");
    expect(changed.plan).toEqual(expectedPlan);
    expect(profileSchema.safeParse(changed).success).toBe(true);
  });

  it("clears the override when the natural match is restored", () => {
    const changed = changePersona(makeProfile(), "explorer");
    const restored = changePersona(changed, "anchor");

    expect(restored.personaOverride).toBeUndefined();
    expect(effectiveArchetypeMatch(restored)).toMatchObject({
      primary: "anchor",
      overridden: false,
    });

    expect(changePersona(changed, null).personaOverride).toBeUndefined();
  });
});
