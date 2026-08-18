import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const VIEWPORTS = [
  { name: "mobile", width: 375, height: 812 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "compact-desktop", width: 1024, height: 900 },
  { name: "desktop", width: 1440, height: 1000 },
] as const;

const COMPLETE_PROFILE = {
  version: 3,
  createdAt: "2026-08-01T12:00:00.000Z",
  axes: {
    rhythm: 20,
    structure: 35,
    social: -15,
    input: 10,
    drive: 25,
    clock: -20,
  },
  frictions: [],
  match: {
    primary: "architect",
    secondary: "anchor",
    confidence: 0.6,
  },
  recommendedTechniqueIds: ["retrieval-practice"],
  selectedTechniqueIds: ["retrieval-practice"],
  onboardingStage: "complete",
  reasons: {
    "retrieval-practice": ["A strong evidence base for durable memory."],
  },
  resourceIds: [],
  schedule: {
    mode: "by-course",
    courses: [
      {
        id: "biology",
        name: "Biology",
        colorKey: "teal",
        includedInPlan: true,
        priority: "standard",
      },
    ],
    classMeetings: [
      {
        id: "biology-class",
        courseId: "biology",
        label: "Biology",
        days: ["Monday"],
        startMinute: 540,
        endMinute: 600,
      },
    ],
    studyWindows: [
      {
        id: "monday-study",
        days: ["Monday"],
        startMinute: 600,
        endMinute: 720,
      },
    ],
    targetStudyMinutes: 60,
  },
  plan: {
    algorithmVersion: 2,
    blocks: [
      {
        id: "biology-retrieval",
        day: "Monday",
        start: 10,
        startMinute: 600,
        minutes: 60,
        courseId: "biology",
        label: "Biology retrieval",
        techniqueId: "retrieval-practice",
        supportingTechniqueIds: [],
        techniqueSource: "selected",
        addressedFrictionIds: [],
        intensity: "deep",
        note: "Answer practice questions without notes.",
      },
    ],
    flexible: false,
    totalMinutes: 60,
    budgetMinutes: 60,
    minimumEffectiveDose: false,
    rationale: ["Built inside confirmed study availability."],
    frictionResponses: [],
  },
} as const;

for (const viewport of VIEWPORTS) {
  test.describe(`${viewport.name} (${viewport.width}px)`, () => {
    test.use({ viewport });

    test("home and guided intake have no automated WCAG A/AA violations", async ({
      page,
    }) => {
      for (const path of ["/", "/quiz"]) {
        await page.goto(path);
        await expect(page.locator("main h1").first()).toBeVisible();

        const results = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
          .analyze();

        expect(
          results.violations,
          `${path} at ${viewport.width}px has accessibility violations`,
        ).toEqual([]);
      }
    });

    test("weekly planner has a responsive semantic workspace", async ({
      page,
    }) => {
      await page.addInitScript((profile) => {
        window.localStorage.setItem(
          "scholara:profile:v3",
          JSON.stringify(profile),
        );
      }, COMPLETE_PROFILE);
      await page.goto("/plan");

      await expect(
        page.getByRole("heading", { level: 1, name: "Weekly plan" }),
      ).toBeVisible();
      await expect(page.getByText("Saved week", { exact: true })).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Schedule workspace" }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: /Biology study/i }).first(),
      ).toBeVisible();

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      expect(
        results.violations,
        `/plan at ${viewport.width}px has accessibility violations`,
      ).toEqual([]);
    });

    test("resources are accessible before and after personalization", async ({
      page,
    }) => {
      await page.goto("/resources");
      await expect(
        page.getByRole("heading", {
          level: 1,
          name: "Study support that fits your situation",
        }),
      ).toBeVisible();
      await expect(
        page.getByRole("link", {
          name: "Open Anki (opens in a new tab)",
        }),
      ).toBeVisible();

      let results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      expect(
        results.violations,
        `/resources public view at ${viewport.width}px has accessibility violations`,
      ).toEqual([]);

      await page.evaluate((profile) => {
        window.localStorage.setItem(
          "scholara:profile:v3",
          JSON.stringify(profile),
        );
      }, COMPLETE_PROFILE);
      await page.reload();

      await expect(
        page.getByText(/ordered using Methods in your saved plan/),
      ).toBeVisible();
      await expect(
        page.getByText(/In your plan.*Retrieval Practice/).first(),
      ).toBeVisible();

      results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      expect(
        results.violations,
        `/resources personalized view at ${viewport.width}px has accessibility violations`,
      ).toEqual([]);
    });
  });
}

test("an incomplete schedule is gated to the dedicated setup route", async ({
  page,
}) => {
  await page.addInitScript((completeProfile) => {
    const profile = {
      ...completeProfile,
      onboardingStage: "schedule",
    };
    delete (profile as { plan?: unknown }).plan;
    delete (profile as { schedule?: unknown }).schedule;
    window.localStorage.setItem(
      "scholara:profile:v3",
      JSON.stringify(profile),
    );
  }, COMPLETE_PROFILE);

  await page.goto("/plan");
  await page
    .getByRole("link", { name: "Continue to weekly setup" })
    .click();
  await expect(page).toHaveURL(/\/plan\/setup$/);
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Build around the week you actually have",
    }),
  ).toBeVisible();
});
