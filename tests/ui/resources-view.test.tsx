// @vitest-environment jsdom

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { ResourcesView } from "@/components/resources/ResourcesView";
import { ProfileProvider } from "@/hooks/useProfile";
import { generateProfile } from "@/lib/engine";
import { KEYS } from "@/lib/storage";
import type { LearnerProfile, PlanBlock, WeekPlan } from "@/lib/types";
import "./dom";

const AXES = {
  rhythm: 0,
  structure: 0,
  social: 0,
  input: 0,
  drive: 0,
  clock: 0,
};

function planBlock(techniqueId: string): PlanBlock {
  return {
    id: `block-${techniqueId}`,
    day: "Monday",
    start: 9,
    startMinute: 9 * 60,
    minutes: 30,
    label: "Biology study",
    techniqueId,
    supportingTechniqueIds: [],
    techniqueSource: "selected",
    addressedFrictionIds: ["math-heavy"],
    intensity: "deep",
    note: "Test note",
  };
}

function weekPlan(...blocks: PlanBlock[]): WeekPlan {
  return {
    algorithmVersion: 2,
    blocks,
    flexible: false,
    totalMinutes: blocks.reduce((total, block) => total + block.minutes, 0),
    budgetMinutes: 60,
    minimumEffectiveDose: false,
    rationale: [],
    frictionResponses: [],
  };
}

function seedPersonalizedProfile() {
  const generated = generateProfile({
    axes: AXES,
    frictions: ["math-heavy"],
  });
  const profile: LearnerProfile = {
    ...generated,
    educationContext: { year: "sophomore", field: "stem" },
    selectedTechniqueIds: ["pomodoro"],
    plan: weekPlan(planBlock("retrieval-practice")),
  };

  window.localStorage.setItem(KEYS.profile, JSON.stringify(profile));
}

function cardFor(resourceName: string): HTMLElement {
  const heading = screen.getByRole("heading", { name: resourceName });
  const card = heading.closest("li");
  if (!card) throw new Error(`No resource card found for ${resourceName}`);
  return card;
}

describe("ResourcesView", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it(
    "offers a stable public catalog with clear filters and external-link names",
    async () => {
      const user = userEvent.setup();

      render(
        <ProfileProvider>
          <ResourcesView />
        </ProfileProvider>,
      );

      expect(
        await screen.findByRole("heading", {
          level: 1,
          name: "Study support that fits your situation",
        }),
      ).toBeTruthy();
      expect(
        await screen.findByText(/Take the quiz and choose your Methods/),
      ).toBeTruthy();
      expect(
        screen
          .getByRole("link", { name: "Personalize the library" })
          .getAttribute("href"),
      ).toBe("/quiz");
      expect(screen.queryByLabelText("Include paid tools")).toBeNull();
      const resultCount = screen.getByText(/^Showing \d+ resources\.$/);
      expect(resultCount.getAttribute("aria-live")).toBe("polite");
      expect(resultCount.getAttribute("aria-atomic")).toBe("true");

      const ankiLink = within(cardFor("Anki")).getByRole("link", {
        name: "Open Anki (opens in a new tab)",
      });
      expect(ankiLink.getAttribute("target")).toBe("_blank");
      expect(ankiLink.getAttribute("rel")).toBe("noopener noreferrer");

      const recallFilter = screen.getByRole("button", {
        name: "Flashcards & recall",
      });
      await user.click(recallFilter);

      expect(recallFilter.getAttribute("aria-pressed")).toBe("true");
      expect(
        screen.getByText(
          /^Showing \d+ resources in Flashcards & recall\.$/,
        ),
      ).toBeTruthy();
      expect(screen.queryByRole("heading", { name: "Obsidian" })).toBeNull();
    },
    10_000,
  );

  it("explains live matches from the saved plan, selected Methods, and profile", async () => {
    seedPersonalizedProfile();

    render(
      <ProfileProvider>
        <ResourcesView />
      </ProfileProvider>,
    );

    expect(
      await screen.findByText(/ordered using Methods in your saved plan/),
    ).toBeTruthy();
    expect(
      within(cardFor("Anki")).getByText(
        "In your plan · Retrieval Practice",
      ),
    ).toBeTruthy();
    expect(
      within(cardFor("Pomofocus")).getByText("Supports Pomodoro (25/5)"),
    ).toBeTruthy();
    expect(
      within(cardFor("Khan Academy")).getByText(
        "Helps with my hardest courses are problem-based",
      ),
    ).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Personalize the library" })).toBeNull();
  });
});
