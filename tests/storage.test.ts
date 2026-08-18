import { afterEach, describe, expect, it, vi } from "vitest";
import { generateProfile } from "@/lib/engine";
import { KEYS, loadProfile, saveProfile } from "@/lib/storage";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("profile persistence", () => {
  it("does not replace valid storage with a malformed profile update", () => {
    const values = new Map<string, string>();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
        removeItem: (key: string) => values.delete(key),
      },
    });
    const profile = generateProfile({
      axes: {
        rhythm: 0,
        structure: 0,
        social: 0,
        input: 0,
        drive: 0,
        clock: 0,
      },
      frictions: [],
    });

    expect(saveProfile(profile)).toEqual(profile);
    const saved = values.get(KEYS.profile);
    expect(saved).toBeDefined();

    expect(
      saveProfile({
        ...profile,
        weekContext: {
          weekStart: "2026-08-10",
          unavailableDays: ["Monday", "Monday"],
          load: "normal",
          energy: "steady",
          focusFrictions: [],
        },
      }),
    ).toBeNull();
    expect(values.get(KEYS.profile)).toBe(saved);
    expect(loadProfile()).toEqual(profile);
  });
});
