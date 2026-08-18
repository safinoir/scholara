import { CAREER_PREFERENCES_KEY } from "@/lib/careerPreferences";
import { KEYS, removeRaw } from "@/lib/storage";

export const SCHOLARA_STORAGE_KEYS = [
  ...Object.values(KEYS),
  CAREER_PREFERENCES_KEY,
] as const;

export function hasStoredScholaraData(): boolean {
  if (typeof window === "undefined") return false;

  try {
    return SCHOLARA_STORAGE_KEYS.some(
      (key) => window.localStorage.getItem(key) !== null,
    );
  } catch {
    return false;
  }
}

export function clearAllStoredScholaraData(): void {
  SCHOLARA_STORAGE_KEYS.forEach((key) => removeRaw(key));
}
