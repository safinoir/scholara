// @vitest-environment jsdom

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { CareerView } from "@/components/career/CareerView";
import { ProfileProvider } from "@/hooks/useProfile";
import { CAREER_PREFERENCES_KEY } from "@/lib/careerPreferences";
import "./dom";

function cardFor(title: string): HTMLElement {
  const heading = screen.getByRole("heading", { name: title });
  const card = heading.closest("li");
  if (!card) throw new Error(`No path card found for ${title}`);
  return card;
}

describe("CareerView", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it(
    "connects the degree path to current courses and prioritizes by stage",
    async () => {
      const user = userEvent.setup();

      render(
        <ProfileProvider>
          <CareerView />
        </ProfileProvider>,
      );

      expect(
        await screen.findByRole("heading", {
          level: 1,
          name: "Connect this semester to what comes next",
        }),
      ).toBeTruthy();
      expect(screen.getByText("Use your current courses")).toBeTruthy();
      expect(screen.queryByText("Focus now")).toBeNull();

      await user.selectOptions(
        screen.getByRole("combobox", { name: "Area you are exploring" }),
        "stem",
      );
      await user.selectOptions(
        screen.getByRole("combobox", { name: "Current stage" }),
        "freshman",
      );

      expect(
        screen.getByRole("heading", { name: "A path for STEM & engineering" }),
      ).toBeTruthy();
      expect(screen.getByText("4 actions to review")).toBeTruthy();
      expect(screen.getByText("Keep on your radar")).toBeTruthy();

      const degreeMapCard = cardFor(
        "Map this semester to your degree requirements",
      );
      const reviewButton = within(degreeMapCard).getByRole("button", {
        name: "Mark reviewed: Map this semester to your degree requirements",
      });
      await user.click(reviewButton);
      expect(reviewButton.getAttribute("aria-pressed")).toBe("true");
      expect(within(degreeMapCard).getByText("Reviewed")).toBeTruthy();

      expect(JSON.parse(window.localStorage.getItem(CAREER_PREFERENCES_KEY)!)).toEqual({
        version: 1,
        field: "stem",
        year: "freshman",
      });
    },
    10_000,
  );
});
