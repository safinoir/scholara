import { z } from "zod";
import {
  ARCHETYPE_IDS,
  AXES,
  DAYS,
  ENERGY_LEVELS,
  FRICTIONS,
  WEEK_LOADS,
} from "@/lib/types";

/**
 * Request validation for the AI routes. Deliberately narrow: only structured,
 * non-identifying values are accepted, so no free text from the client can ever
 * reach the model through these endpoints.
 */

export const axisScoresRequestSchema = z.object(
  Object.fromEntries(
    AXES.map((axis) => [axis, z.number().min(-100).max(100)]),
  ) as Record<(typeof AXES)[number], z.ZodNumber>,
);

export const contextRequestSchema = z.object({
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

export const weekContextSchema = z.object({
  unavailableDays: z.array(z.enum(DAYS)).max(7),
  load: z.enum(WEEK_LOADS),
  energy: z.enum(ENERGY_LEVELS),
  focusFrictions: z.array(z.enum(FRICTIONS)).max(10),
});

export const planBlockRequestSchema = z.object({
  id: z.string().max(40),
  day: z.enum(DAYS),
  start: z.number().min(0).max(24),
  minutes: z.number().min(5).max(240),
  label: z.string().max(80),
  techniqueId: z.string().max(60),
  intensity: z.enum(["deep", "review", "admin"]),
  note: z.string().max(300),
});

export const weekPlanRequestSchema = z.object({
  blocks: z.array(planBlockRequestSchema).max(30),
  flexible: z.boolean(),
  totalMinutes: z.number().min(0).max(5000),
  budgetMinutes: z.number().min(0).max(5000),
  minimumEffectiveDose: z.boolean(),
  rationale: z.array(z.string().max(400)).max(12),
});

export const coachingRequestSchema = z.object({
  axes: axisScoresRequestSchema,
  frictions: z.array(z.enum(FRICTIONS)).max(10),
  context: contextRequestSchema,
  primary: z.enum(ARCHETYPE_IDS),
  secondary: z.enum(ARCHETYPE_IDS),
  techniqueIds: z.array(z.string().max(60)).max(8),
  plan: weekPlanRequestSchema,
  week: weekContextSchema.optional(),
});

/** Bounded set of things the student can ask about, chosen from the UI. */
export const ASK_TOPICS = [
  "start-today",
  "fell-behind",
  "why-this-plan",
  "exam-soon",
  "cant-focus",
  "too-much",
] as const;

export const askRequestSchema = z.object({
  topic: z.enum(ASK_TOPICS),
  axes: axisScoresRequestSchema,
  frictions: z.array(z.enum(FRICTIONS)).max(10),
  context: contextRequestSchema,
  primary: z.enum(ARCHETYPE_IDS),
  secondary: z.enum(ARCHETYPE_IDS),
  techniqueIds: z.array(z.string().max(60)).max(8),
  plan: weekPlanRequestSchema,
  week: weekContextSchema.optional(),
});
