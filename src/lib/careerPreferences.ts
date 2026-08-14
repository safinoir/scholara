import { z } from "zod";

export const CAREER_PREFERENCES_KEY = "scholara:career-preferences:v1";

export const careerPreferencesSchema = z.object({
  version: z.literal(1),
  field: z
    .enum(["stem", "health", "business", "humanities", "arts", "undecided"])
    .optional(),
  year: z
    .enum([
      "hs-senior",
      "freshman",
      "sophomore",
      "junior",
      "senior",
      "grad",
      "returning",
    ])
    .optional(),
});

export type CareerPreferences = z.infer<typeof careerPreferencesSchema>;

const EMPTY_PREFERENCES: CareerPreferences = { version: 1 };

export function parseCareerPreferences(raw: unknown): CareerPreferences {
  const parsed = careerPreferencesSchema.safeParse(raw);
  return parsed.success ? parsed.data : { ...EMPTY_PREFERENCES };
}

export function loadCareerPreferences(): CareerPreferences {
  if (typeof window === "undefined") return { ...EMPTY_PREFERENCES };

  try {
    const raw = window.localStorage.getItem(CAREER_PREFERENCES_KEY);
    return parseCareerPreferences(raw ? JSON.parse(raw) : null);
  } catch {
    return { ...EMPTY_PREFERENCES };
  }
}

export function saveCareerPreferences(preferences: CareerPreferences): void {
  if (typeof window === "undefined") return;

  const parsed = careerPreferencesSchema.safeParse(preferences);
  if (!parsed.success) return;

  try {
    window.localStorage.setItem(
      CAREER_PREFERENCES_KEY,
      JSON.stringify(parsed.data),
    );
  } catch {
    // Storage can be unavailable; the page still works for the current visit.
  }
}
