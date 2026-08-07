import { z } from "zod";
import { TECHNIQUE_BY_ID } from "@/lib/data/techniques";
import {
  ARCHETYPE_IDS,
  AXES,
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
  hoursPerWeek: z.number().min(1).max(80),
  hasOutsideObligations: z.boolean(),
});

const planBlockSchema = z.object({
  id: z.string(),
  day: z.enum(DAYS),
  start: z.number().min(0).max(24),
  minutes: z.number().min(5).max(240),
  label: z.string(),
  techniqueId: z.string(),
  intensity: z.enum(["deep", "review", "admin"]),
  note: z.string(),
});

const weekPlanSchema = z.object({
  blocks: z.array(planBlockSchema),
  flexible: z.boolean(),
  totalMinutes: z.number(),
  budgetMinutes: z.number(),
  minimumEffectiveDose: z.boolean(),
  rationale: z.array(z.string()),
});

const weekContextSchema = z.object({
  unavailableDays: z.array(z.enum(DAYS)).max(7),
  load: z.enum(WEEK_LOADS),
  energy: z.enum(ENERGY_LEVELS),
  focusFrictions: z.array(z.enum(FRICTIONS)).max(10),
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

    if (profile.coaching && !profile.plan) {
      context.addIssue({
        code: "custom",
        path: ["coaching"],
        message: "Plan coaching requires a generated weekly plan",
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
