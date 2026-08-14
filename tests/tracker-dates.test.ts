import { describe, expect, it } from "vitest";
import { localDateISO, recentDays } from "@/hooks/useTracker";

describe("tracker local calendar dates", () => {
  it("formats the browser's local calendar date instead of a UTC date", () => {
    expect(localDateISO(new Date(2026, 7, 14, 23, 45))).toBe("2026-08-14");
  });

  it("builds recent dates across a local month boundary", () => {
    expect(recentDays(3, new Date(2026, 2, 1, 12))).toEqual([
      "2026-02-27",
      "2026-02-28",
      "2026-03-01",
    ]);
  });
});
