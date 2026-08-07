import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/plan/route";

const hasKey = Boolean(process.env.AI_API_KEY ?? process.env.COACH_API_KEY);
const liveIt = hasKey ? it : it.skip;

describe("AI plan coaching", () => {
  liveIt(
    "returns model-generated coaching through the route handler",
    async () => {
      const request = new Request("http://localhost/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          axes: {
            rhythm: 20,
            structure: 60,
            social: -20,
            input: 10,
            drive: 30,
            clock: -30,
          },
          frictions: ["procrastination"],
          context: {
            year: "junior",
            field: "stem",
            courseLoad: 4,
            hoursPerWeek: 10,
            hasOutsideObligations: true,
          },
          primary: "architect",
          secondary: "anchor",
          techniqueIds: ["retrieval-practice", "weekly-review"],
          plan: {
            blocks: [
              {
                id: "block-0",
                day: "Monday",
                start: 9,
                minutes: 45,
                label: "New material",
                techniqueId: "retrieval-practice",
                intensity: "deep",
                note: "Start with the hardest course.",
              },
            ],
            flexible: false,
            totalMinutes: 45,
            budgetMinutes: 600,
            minimumEffectiveDose: false,
            rationale: ["Morning work matches the learner's focus window."],
          },
        }),
      });

      const response = await POST(request);
      const coaching = await response.json();

      expect(response.status).toBe(200);
      expect(coaching.source).toBe("ai");
      expect(coaching.brief).toEqual(expect.any(String));
      expect(coaching.focus).toEqual(expect.any(String));
      expect(coaching.watchOut).toEqual(expect.any(String));
    },
    20_000,
  );
});
