import { parseProfile } from "@/lib/schema";
import type { LearnerProfile, QuizAnswers, ScheduleSetup } from "@/lib/types";

export const KEYS = {
  profile: "scholara:profile:v3",
  previousProfile: "scholara:profile:v2",
  legacyProfile: "scholara:profile:v1",
  quizDraft: "scholara:quiz-draft:v1",
  scheduleDraft: "scholara:schedule-draft:v1",
  tracker: "scholara:tracker:v1",
} as const;

function read(key: string): unknown {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be full or blocked in private mode; the app still works.
  }
}

function remove(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function loadProfile(): LearnerProfile | null {
  const current = parseProfile(read(KEYS.profile));
  if (current) return current;

  const migrated =
    parseProfile(read(KEYS.previousProfile)) ??
    parseProfile(read(KEYS.legacyProfile));
  if (!migrated) return null;

  write(KEYS.profile, migrated);
  return migrated;
}

/** Writes only profiles that survive the same validation used during loading. */
export function saveProfile(profile: unknown): LearnerProfile | null {
  const validated = parseProfile(profile);
  if (!validated) return null;
  write(KEYS.profile, validated);
  return validated;
}

export function clearProfile(): void {
  remove(KEYS.profile);
  remove(KEYS.previousProfile);
  remove(KEYS.legacyProfile);
  remove(KEYS.quizDraft);
  remove(KEYS.scheduleDraft);
}

export function loadQuizDraft(): Partial<QuizAnswers> | null {
  const raw = read(KEYS.quizDraft);
  return raw && typeof raw === "object" ? (raw as Partial<QuizAnswers>) : null;
}

export function saveQuizDraft(draft: Partial<QuizAnswers>): void {
  write(KEYS.quizDraft, draft);
}

export function clearQuizDraft(): void {
  remove(KEYS.quizDraft);
}

export type ScheduleDraft = {
  /** Added when the setup wizard moved from three steps to two. */
  version?: 2;
  step: 1 | 2 | 3;
  schedule: ScheduleSetup;
};

export function loadScheduleDraft(): ScheduleDraft | null {
  const raw = read(KEYS.scheduleDraft);
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as Partial<ScheduleDraft>;
  if (
    (candidate.step !== 1 && candidate.step !== 2 && candidate.step !== 3) ||
    !candidate.schedule ||
    typeof candidate.schedule !== "object"
  ) {
    return null;
  }
  return candidate as ScheduleDraft;
}

export function saveScheduleDraft(draft: ScheduleDraft): void {
  write(KEYS.scheduleDraft, draft);
}

export function clearScheduleDraft(): void {
  remove(KEYS.scheduleDraft);
}

export { read as readRaw, write as writeRaw, remove as removeRaw };
