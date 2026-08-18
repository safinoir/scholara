// @vitest-environment jsdom

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { TrackerView } from "@/components/tracker/TrackerView";
import { ProfileProvider } from "@/hooks/useProfile";
import { todayISO } from "@/hooks/useTracker";
import { generateProfile } from "@/lib/engine";
import { KEYS } from "@/lib/storage";
import type { HabitLog, LearnerProfile } from "@/lib/types";
import "./dom";

const AXES = {
  rhythm: 0,
  structure: 0,
  social: 0,
  input: 0,
  drive: 0,
  clock: 0,
};

function learnerProfile(): LearnerProfile {
  return {
    ...generateProfile({ axes: AXES, frictions: ["distraction"] }),
    selectedTechniqueIds: ["retrieval-practice"],
  };
}

function seedTracker(logs: HabitLog[] = []) {
  window.localStorage.setItem(KEYS.profile, JSON.stringify(learnerProfile()));
  window.localStorage.setItem(
    KEYS.tracker,
    JSON.stringify({ version: 1, logs }),
  );
}

function storedLogs(): HabitLog[] {
  return JSON.parse(window.localStorage.getItem(KEYS.tracker) ?? "null").logs;
}

describe("TrackerView", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("explains the refreshed purpose and orders suggestions by profile fit", async () => {
    seedTracker();

    render(
      <ProfileProvider>
        <TrackerView />
      </ProfileProvider>,
    );

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Make your study approach stick",
      }),
    ).toBeTruthy();

    const suggestions = screen.getAllByRole("button", {
      name: /^Add habit:/,
    });
    expect(suggestions[0].getAttribute("aria-label")).toBe(
      "Add habit: One closed-book recall before bed",
    );
    expect(screen.getByText("Supports Retrieval Practice")).toBeTruthy();
    expect(screen.getByText("Fits one of your obstacles")).toBeTruthy();
  });

  it("records today's check-in and protects habit history before removal", async () => {
    const user = userEvent.setup();
    seedTracker([
      { habitId: "closed-book-recall", completedDates: [] },
    ]);

    render(
      <ProfileProvider>
        <TrackerView />
      </ProfileProvider>,
    );

    const habitHeading = await screen.findByRole("heading", {
      name: "One closed-book recall before bed",
    });
    const habitCard = habitHeading.closest("li");
    expect(habitCard).not.toBeNull();

    const todayButton = habitCard?.querySelector<HTMLButtonElement>(
      'button[aria-current="date"]',
    );
    expect(todayButton).not.toBeNull();
    expect(todayButton?.getAttribute("aria-pressed")).toBe("false");
    expect(todayButton?.getAttribute("aria-label")).toContain("not completed");

    await user.click(todayButton!);

    expect(todayButton?.getAttribute("aria-pressed")).toBe("true");
    expect(todayButton?.getAttribute("aria-label")).toContain("completed");
    expect(storedLogs()).toEqual([
      {
        habitId: "closed-book-recall",
        completedDates: [todayISO()],
      },
    ]);

    await user.click(
      within(habitCard!).getByRole("button", {
        name: "Stop tracking: One closed-book recall before bed",
      }),
    );
    const confirmation = within(habitCard!).getByRole("group", {
      name: "Confirm stopping One closed-book recall before bed",
    });
    expect(storedLogs()).toHaveLength(1);

    await user.click(within(confirmation).getByRole("button", { name: "Keep habit" }));
    expect(
      within(habitCard!).queryByRole("group", {
        name: "Confirm stopping One closed-book recall before bed",
      }),
    ).toBeNull();
    expect(storedLogs()).toHaveLength(1);

    await user.click(
      within(habitCard!).getByRole("button", {
        name: "Stop tracking: One closed-book recall before bed",
      }),
    );
    const finalConfirmation = within(habitCard!).getByRole("group", {
      name: "Confirm stopping One closed-book recall before bed",
    });
    await user.click(
      within(finalConfirmation).getByRole("button", { name: "Stop tracking" }),
    );

    expect(storedLogs()).toEqual([]);
    expect(screen.getByText("Start with one small win")).toBeTruthy();
  });

  it("requires confirmation before atomically clearing tracker data", async () => {
    const user = userEvent.setup();
    seedTracker([
      {
        habitId: "closed-book-recall",
        completedDates: [todayISO()],
      },
      { habitId: "phone-away", completedDates: [] },
    ]);

    render(
      <ProfileProvider>
        <TrackerView />
      </ProfileProvider>,
    );

    await screen.findByRole("heading", { name: "Your habits" });
    await user.click(
      screen.getByRole("button", { name: "Clear tracking history" }),
    );

    let confirmation = screen.getByRole("group", {
      name: "Confirm clearing tracker data",
    });
    expect(storedLogs()).toHaveLength(2);

    await user.click(within(confirmation).getByRole("button", { name: "Cancel" }));
    expect(storedLogs()).toHaveLength(2);

    await user.click(
      screen.getByRole("button", { name: "Clear tracking history" }),
    );
    confirmation = screen.getByRole("group", {
      name: "Confirm clearing tracker data",
    });
    await user.click(
      within(confirmation).getByRole("button", { name: "Confirm clear" }),
    );

    expect(storedLogs()).toEqual([]);
    expect(screen.getByText("Start with one small win")).toBeTruthy();
  });
});
