import { describe, expect, it } from "vitest";
import {
  getCareerTrack,
  isStepDue,
  YEAR_ORDER,
} from "@/lib/data/careerTracks";
import type { Field } from "@/lib/types";

const FIELDS: Field[] = [
  "stem",
  "health",
  "business",
  "humanities",
  "arts",
  "undecided",
];

describe("career path guides", () => {
  it.each(FIELDS)("keeps the %s guide chronological with unique steps", (field) => {
    const track = getCareerTrack(field);
    const positions = track.steps.map((step) => YEAR_ORDER.indexOf(step.from));
    const ids = new Set(track.steps.map((step) => step.id));

    expect(positions).toEqual([...positions].sort((left, right) => left - right));
    expect(ids.size).toBe(track.steps.length);
    expect(track.steps[0]?.id).toBe("degree-map");
  });

  it("separates current-stage actions from later preparation", () => {
    const track = getCareerTrack("stem");
    const firstYearSteps = track.steps.filter((step) =>
      isStepDue(step, "freshman"),
    );
    const laterSteps = track.steps.filter(
      (step) => !isStepDue(step, "freshman"),
    );

    expect(firstYearSteps.map((step) => step.id)).toEqual([
      "degree-map",
      "stem-portfolio",
      "course-evidence",
      "office-hours-relationship",
    ]);
    expect(laterSteps.map((step) => step.id)).toEqual([
      "stem-research",
      "opportunity-test",
      "tell-your-story",
      "compare-options",
    ]);
  });
});
