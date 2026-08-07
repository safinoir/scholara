import { parseProfile } from "@/lib/schema";
import type { LearnerProfile, QuizAnswers } from "@/lib/types";

export const KEYS = {
  profile: "scholara:profile:v1",
  quizDraft: "scholara:quiz-draft:v1",
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
  return parseProfile(read(KEYS.profile));
}

export function saveProfile(profile: LearnerProfile): void {
  write(KEYS.profile, profile);
}

export function clearProfile(): void {
  remove(KEYS.profile);
  remove(KEYS.quizDraft);
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

export { read as readRaw, write as writeRaw, remove as removeRaw };
