import { z } from "zod";
import { TECHNIQUE_BY_ID } from "@/lib/data/techniques";
import {
  ARCHETYPE_IDS,
  AXES,
  COURSE_COLOR_KEYS,
  COURSE_PRIORITIES,
  DAYS,
  ENERGY_LEVELS,
  FRICTIONS,
  ONBOARDING_STAGES,
  PROFILE_VERSION,
  WEEK_LOADS,
  type LearnerProfile,
} from "@/lib/types";

const axisScoresSchema = z.object(
  Object.fromEntries(
    AXES.map((axis) => [axis, z.number().min(-100).max(100)]),
  ) as Record<(typeof AXES)[number], z.ZodNumber>,
);

const contextSchema = z.object({
  year: z.enum([
    "hs-senior",
    "freshman",
    "sophomore",
    "junior",
    "senior",
    "grad",
    "returning",
  ]),
  field: z.enum(["stem", "health", "business", "humanities", "arts", "undecided"]),
  courseLoad: z.number().int().min(1).max(12),
  hoursPerWeek: z.number().min(0.5).max(80),
  hasOutsideObligations: z.boolean(),
});

const planBlockSchema = z.object({
  id: z.string(),
  day: z.enum(DAYS),
  start: z.number().min(0).max(24),
  startMinute: z.number().int().min(0).max(1439).optional(),
  minutes: z.number().min(5).max(240),
  courseId: z.string().optional(),
  label: z.string(),
  techniqueId: z.string(),
  supportingTechniqueIds: z.array(z.string()).max(2).optional(),
  intensity: z.enum(["deep", "review", "admin"]),
  note: z.string(),
}).transform((block) => ({
  ...block,
  startMinute: block.startMinute ?? Math.round(block.start * 60),
  supportingTechniqueIds: block.supportingTechniqueIds ?? [],
}));

const weekPlanSchema = z.object({
  blocks: z.array(planBlockSchema),
  flexible: z.boolean(),
  totalMinutes: z.number(),
  budgetMinutes: z.number(),
  minimumEffectiveDose: z.boolean(),
  rationale: z.array(z.string()),
  unallocatedMinutes: z.number().int().min(0).optional(),
  unassignedCourseIds: z.array(z.string()).optional(),
  unusedTechniqueIds: z.array(z.string()).optional(),
  warnings: z
    .array(
      z.object({
        code: z.enum([
          "insufficient-availability",
          "no-study-window",
          "course-unassigned",
          "deadline-after-slot",
          "method-not-used",
        ]),
        message: z.string(),
        courseId: z.string().optional(),
      }),
    )
    .optional(),
});

const minuteRangeShape = {
  startMinute: z.number().int().min(0).max(1425).refine((value) => value % 15 === 0),
  endMinute: z.number().int().min(15).max(1440).refine((value) => value % 15 === 0),
};

const courseSchema = z.object({
  id: z.string().min(1).max(80),
  name: z.string().trim().min(1).max(80),
  colorKey: z.enum(COURSE_COLOR_KEYS),
  includedInPlan: z.boolean(),
  priority: z.enum(COURSE_PRIORITIES),
});

const classMeetingSchema = z
  .object({
    id: z.string().min(1).max(80),
    courseId: z.string().min(1).max(80).optional(),
    label: z.string().trim().min(1).max(80),
    days: z.array(z.enum(DAYS)).min(1).max(7),
    ...minuteRangeShape,
  })
  .refine((meeting) => meeting.endMinute > meeting.startMinute, {
    path: ["endMinute"],
    message: "End time must be later than start time",
  });

const studyWindowSchema = z
  .object({
    id: z.string().min(1).max(80),
    days: z.array(z.enum(DAYS)).min(1).max(7),
    ...minuteRangeShape,
  })
  .refine((window) => window.endMinute > window.startMinute, {
    path: ["endMinute"],
    message: "End time must be later than start time",
  });

export const scheduleSetupSchema = z
  .object({
    mode: z.enum(["general", "by-course"]),
    courses: z.array(courseSchema).max(20),
    classMeetings: z.array(classMeetingSchema).max(80),
    studyWindows: z.array(studyWindowSchema).min(1).max(40),
    targetStudyMinutes: z.number().int().min(30).max(2400),
  })
  .superRefine((schedule, context) => {
    const courseIds = new Set(schedule.courses.map((course) => course.id));
    if (courseIds.size !== schedule.courses.length) {
      context.addIssue({
        code: "custom",
        path: ["courses"],
        message: "Course ids must be unique",
      });
    }

    if (
      schedule.mode === "by-course" &&
      !schedule.courses.some((course) => course.includedInPlan)
    ) {
      context.addIssue({
        code: "custom",
        path: ["courses"],
        message: "Choose at least one course to include in the plan",
      });
    }

    for (const [index, meeting] of schedule.classMeetings.entries()) {
      if (meeting.courseId && !courseIds.has(meeting.courseId)) {
        context.addIssue({
          code: "custom",
          path: ["classMeetings", index, "courseId"],
          message: "Class meeting references an unknown course",
        });
      }
    }

    const occurrences = schedule.classMeetings.flatMap((meeting, index) =>
      meeting.days.map((day) => ({ ...meeting, day, index })),
    );
    for (let left = 0; left < occurrences.length; left++) {
      for (let right = left + 1; right < occurrences.length; right++) {
        const a = occurrences[left];
        const b = occurrences[right];
        if (
          a.day === b.day &&
          a.id !== b.id &&
          a.startMinute < b.endMinute &&
          b.startMinute < a.endMinute
        ) {
          context.addIssue({
            code: "custom",
            path: ["classMeetings", b.index],
            message: `Class meetings overlap on ${b.day}`,
          });
        }
      }
    }
  });

const weekContextSchema = z.object({
  unavailableDays: z.array(z.enum(DAYS)).max(7),
  load: z.enum(WEEK_LOADS),
  energy: z.enum(ENERGY_LEVELS),
  focusFrictions: z.array(z.enum(FRICTIONS)).max(10),
  targetStudyMinutes: z.number().int().min(30).max(2400).optional(),
  busyWindows: z
    .array(
      z
        .object({
          id: z.string().min(1).max(80),
          day: z.enum(DAYS),
          ...minuteRangeShape,
        })
        .refine((window) => window.endMinute > window.startMinute),
    )
    .max(40)
    .optional(),
  courseTargets: z
    .array(
      z.object({
        courseId: z.string().min(1).max(80),
        priority: z.enum(["focus", "urgent"]),
        deadlineDay: z.enum(DAYS).nullable(),
      }),
    )
    .max(20)
    .optional(),
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

const coachingSchema = z.object({
  brief: z.string(),
  focus: z.string(),
  watchOut: z.string(),
  blockNotes: z.record(z.string(), z.string()),
  source: z.enum(["ai", "fallback"]),
  generatedAt: z.string(),
});

const matchSchema = z.object({
  primary: z.enum(ARCHETYPE_IDS),
  secondary: z.enum(ARCHETYPE_IDS),
  confidence: z.number().min(0).max(1),
});

const sharedProfileShape = {
  createdAt: z.string(),
  axes: axisScoresSchema,
  frictions: z.array(z.enum(FRICTIONS)),
  context: contextSchema,
  match: matchSchema,
  reasons: z.record(z.string(), z.array(z.string())),
  plan: weekPlanSchema.optional(),
  schedule: scheduleSetupSchema.optional(),
  resourceIds: z.array(z.string()),
  weekContext: weekContextSchema.optional(),
  coaching: coachingSchema.optional(),
};

const techniqueIdSchema = z
  .string()
  .refine((id) => id in TECHNIQUE_BY_ID, "Unknown technique id");

function uniqueTechniqueIds(max: number) {
  return z
    .array(techniqueIdSchema)
    .max(max)
    .refine((ids) => new Set(ids).size === ids.length, "Technique ids must be unique");
}

export const profileSchema = z
  .object({
    version: z.literal(PROFILE_VERSION),
    ...sharedProfileShape,
    personaOverride: z.enum(ARCHETYPE_IDS).optional(),
    recommendedTechniqueIds: uniqueTechniqueIds(5),
    selectedTechniqueIds: uniqueTechniqueIds(3),
    onboardingStage: z.enum(ONBOARDING_STAGES),
  })
  .superRefine((profile, context) => {
    const toolkitConfirmed =
      profile.onboardingStage === "schedule" ||
      profile.onboardingStage === "complete";

    if (toolkitConfirmed && profile.selectedTechniqueIds.length === 0) {
      context.addIssue({
        code: "custom",
        path: ["selectedTechniqueIds"],
        message: "A confirmed toolkit needs at least one selected technique",
      });
    }

    if (profile.onboardingStage === "complete" && !profile.plan) {
      context.addIssue({
        code: "custom",
        path: ["plan"],
        message: "Completed onboarding requires a generated weekly plan",
      });
    }

    if (profile.onboardingStage === "complete" && !profile.schedule) {
      context.addIssue({
        code: "custom",
        path: ["schedule"],
        message: "Completed onboarding requires recurring schedule setup",
      });
    }

    if (profile.coaching && !profile.plan) {
      context.addIssue({
        code: "custom",
        path: ["coaching"],
        message: "Plan coaching requires a generated weekly plan",
      });
    }

    if (profile.weekContext?.courseTargets?.length) {
      const knownCourseIds = new Set(
        profile.schedule?.courses.map((course) => course.id) ?? [],
      );
      profile.weekContext.courseTargets.forEach((target, index) => {
        if (!knownCourseIds.has(target.courseId)) {
          context.addIssue({
            code: "custom",
            path: ["weekContext", "courseTargets", index, "courseId"],
            message: "Week target references an unknown course",
          });
        }
      });
    }
  });

export const legacyProfileSchema = z.object({
  version: z.literal(1),
  ...sharedProfileShape,
  plan: weekPlanSchema,
  techniqueIds: z.array(z.string()),
});

export const habitLogSchema = z.object({
  habitId: z.string(),
  completedDates: z.array(z.string()),
});

export const trackerSchema = z.object({
  version: z.number(),
  logs: z.array(habitLogSchema),
});

function cleanTechniqueIds(ids: string[], max: number): string[] {
  return [...new Set(ids)]
    .filter((id) => id in TECHNIQUE_BY_ID)
    .slice(0, max);
}

export function migrateProfileV1(raw: unknown): LearnerProfile | null {
  const legacy = legacyProfileSchema.safeParse(raw);
  if (!legacy.success) return null;

  const { techniqueIds, ...rest } = legacy.data;
  const migrated = profileSchema.safeParse({
    ...rest,
    version: PROFILE_VERSION,
    recommendedTechniqueIds: cleanTechniqueIds(techniqueIds, 5),
    selectedTechniqueIds: [],
    onboardingStage: "toolkit",
  });

  return migrated.success ? migrated.data : null;
}

export function parseProfile(raw: unknown): LearnerProfile | null {
  const current = profileSchema.safeParse(raw);
  if (current.success) return current.data;
  return migrateProfileV1(raw);
}
