import { describe, expect, it } from "vitest";
import { buildSchedulePlan, generateProfile, rankTechniques } from "@/lib/engine";
import { parseProfile, profileSchema } from "@/lib/schema";
import {
  PROFILE_VERSION,
  type AxisScores,
  type LearnerContext,
  type ScheduleSetup,
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

function makeProfile() {
  return generateProfile({
    axes: AXES,
    frictions: ["retention", "distraction"],
  });
}

function makePlan(profile: ReturnType<typeof makeProfile>) {
  return buildSchedulePlan({
    axes: profile.axes,
    frictions: profile.frictions,
    schedule: makeSchedule(),
    techniques: rankTechniques({
      axes: profile.axes,
      frictions: profile.frictions,
      primary: profile.match.primary,
    }),
    selectedTechniqueIds: [profile.recommendedTechniqueIds[0]],
  });
}

function makeSchedule() {
  return {
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
    classMeetings: [
      {
        id: "history-class",
        courseId: "history",
        label: "History class",
        days: ["Monday" as const],
        startMinute: 10 * 60,
        endMinute: 11 * 60,
      },
    ],
    studyWindows: [
      {
        id: "weeknights",
        days: ["Monday" as const, "Wednesday" as const],
        startMinute: 18 * 60,
        endMinute: 21 * 60,
      },
    ],
    targetStudyMinutes: 360,
  };
}

function makeVersion2Profile(schedule: ScheduleSetup = makeSchedule()) {
  const current = makeProfile();
  const selectedTechniqueIds = [current.recommendedTechniqueIds[0]];
  const stalePlan = makePlan(current);

  return {
    ...current,
    version: 2 as const,
    context: CONTEXT,
    onboardingStage: "complete" as const,
    selectedTechniqueIds,
    schedule,
    plan: {
      ...stalePlan,
      totalMinutes: 999,
      blocks: stalePlan.blocks.map((block, index) =>
        index === 0 ? { ...block, label: "Stale version 2 block" } : block,
      ),
    },
  };
}

describe("profile version 3", () => {
  it("starts new profiles at the persona step with no claimed selections", () => {
    const profile = makeProfile();

    expect(profile.version).toBe(PROFILE_VERSION);
    expect(profile.onboardingStage).toBe("persona");
    expect(profile.recommendedTechniqueIds).toHaveLength(5);
    expect(profile.selectedTechniqueIds).toEqual([]);
    expect("context" in profile).toBe(false);
    expect(profile.educationContext).toBeUndefined();
    expect(profile.plan).toBeUndefined();
    expect(profileSchema.safeParse(profile).success).toBe(true);
  });

  it("migrates a version 1 profile and discards its stale generated plan", () => {
    const current = makeProfile();
    const legacyPlan = makePlan(current);
    const { recommendedTechniqueIds } = current;
    const legacy: Record<string, unknown> = {
      ...current,
      version: 1,
      context: CONTEXT,
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
    expect(migrated?.educationContext).toEqual({
      year: CONTEXT.year,
      field: CONTEXT.field,
    });
    expect(migrated?.plan).toBeUndefined();
  });

  it("rebuilds a complete course-based version 2 profile with the current scheduler", () => {
    const migrated = parseProfile(makeVersion2Profile());

    expect(migrated).not.toBeNull();
    expect(migrated?.version).toBe(PROFILE_VERSION);
    expect(migrated?.onboardingStage).toBe("complete");
    expect(migrated?.educationContext).toEqual({
      year: CONTEXT.year,
      field: CONTEXT.field,
    });
    expect(migrated?.plan?.algorithmVersion).toBe(2);
    expect(migrated?.plan?.totalMinutes).not.toBe(999);
    expect(
      migrated?.plan?.blocks.some(
        (block) => block.label === "Stale version 2 block",
      ),
    ).toBe(false);
    expect(migrated?.plan?.blocks.every((block) =>
      block.intensity === "admin" ? true : block.courseId === "history",
    )).toBe(true);
    expect(profileSchema.safeParse(migrated).success).toBe(true);
  });

  it.each([
    {
      name: "a legacy general schedule",
      schedule: {
        ...makeSchedule(),
        mode: "general" as const,
        courses: [],
        classMeetings: makeSchedule().classMeetings.map((meeting) => ({
          id: meeting.id,
          label: meeting.label,
          days: meeting.days,
          startMinute: meeting.startMinute,
          endMinute: meeting.endMinute,
        })),
      },
    },
    {
      name: "an unlinked class meeting",
      schedule: {
        ...makeSchedule(),
        classMeetings: makeSchedule().classMeetings.map((meeting) => ({
          id: meeting.id,
          label: meeting.label,
          days: meeting.days,
          startMinute: meeting.startMinute,
          endMinute: meeting.endMinute,
        })),
      },
    },
  ])("returns $name to schedule setup without its stale plan", ({ schedule }) => {
    const migrated = parseProfile(makeVersion2Profile(schedule));

    expect(migrated).not.toBeNull();
    expect(migrated?.version).toBe(PROFILE_VERSION);
    expect(migrated?.onboardingStage).toBe("schedule");
    expect(migrated?.plan).toBeUndefined();
    expect(migrated?.educationContext).toEqual({
      year: CONTEXT.year,
      field: CONTEXT.field,
    });
    expect(migrated?.schedule).toEqual(schedule);
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
        schedule: makeSchedule(),
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
