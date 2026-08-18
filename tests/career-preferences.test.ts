import { describe, expect, it } from "vitest";
import {
  careerPreferencesSchema,
  parseCareerPreferences,
} from "@/lib/careerPreferences";

describe("career preferences", () => {
  it("accepts a field and learner stage without changing the profile schema", () => {
    expect(
      careerPreferencesSchema.parse({
        version: 1,
        field: "stem",
        year: "junior",
      }),
    ).toEqual({ version: 1, field: "stem", year: "junior" });
  });

  it("falls back to empty preferences when persisted data is invalid", () => {
    expect(
      parseCareerPreferences({
        version: 1,
        field: "not-a-field",
        year: "freshman",
      }),
    ).toEqual({ version: 1 });
  });
});
