import { z } from "zod";
import {
  ARCHETYPE_IDS,
  AXES,
  DAYS,
  ENERGY_LEVELS,
  FRICTIONS,
  PROFILE_VERSION,
  WEEK_LOADS,
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

export const profileSchema = z.object({
  version: z.number(),
  createdAt: z.string(),
  axes: axisScoresSchema,
  frictions: z.array(z.enum(FRICTIONS)),
  context: contextSchema,
  match: z.object({
    primary: z.enum(ARCHETYPE_IDS),
    secondary: z.enum(ARCHETYPE_IDS),
    confidence: z.number().min(0).max(1),
  }),
  techniqueIds: z.array(z.string()),
  reasons: z.record(z.string(), z.array(z.string())),
  plan: weekPlanSchema,
  resourceIds: z.array(z.string()),
  weekContext: weekContextSchema.optional(),
  coaching: coachingSchema.optional(),
});

export const habitLogSchema = z.object({
  habitId: z.string(),
  completedDates: z.array(z.string()),
});

export const trackerSchema = z.object({
  version: z.number(),
  logs: z.array(habitLogSchema),
});

/**
 * Anything that fails validation or predates the current version is discarded
 * rather than migrated — v1 has no shipped predecessors to preserve.
 */
export function parseProfile(raw: unknown) {
  const result = profileSchema.safeParse(raw);
  if (!result.success) return null;
  if (result.data.version !== PROFILE_VERSION) return null;
  return result.data;
}
