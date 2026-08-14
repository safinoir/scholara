// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { QuizFlow } from "@/components/quiz/QuizFlow";
import { ProfileProvider } from "@/hooks/useProfile";
import { AXIS_QUESTIONS } from "@/lib/data/questions";
import "./dom";

const navigation = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => navigation,
}));

describe("QuizFlow navigation", () => {
  it("waits for an explicit Next action after an answer is selected", async () => {
    const user = userEvent.setup();

    render(
      <ProfileProvider>
        <QuizFlow />
      </ProfileProvider>,
    );

    const firstHeading = await screen.findByRole("heading", {
      name: AXIS_QUESTIONS[0].prompt,
    });
    const next = screen.getByRole<HTMLButtonElement>("button", {
      name: "Next",
    });
    expect(next.disabled).toBe(true);

    await user.click(
      screen.getByRole("button", {
        name: new RegExp(AXIS_QUESTIONS[0].options[0].label),
      }),
    );

    expect(next.disabled).toBe(false);
    expect(next.className).toContain("bg-brand-600");
    await new Promise((resolve) => window.setTimeout(resolve, 250));
    expect(screen.getByText("Question 1 of 13")).toBeTruthy();
    expect(firstHeading.isConnected).toBe(true);

    await user.click(next);

    await screen.findByRole("heading", {
      name: AXIS_QUESTIONS[1].prompt,
    });
    const back = screen.getByRole<HTMLButtonElement>("button", {
      name: "Back",
    });
    const followingNext = screen.getByRole<HTMLButtonElement>("button", {
      name: "Next",
    });
    expect(back.className).toBe(followingNext.className);
  });

  it("advances immediately when an answer is selected with a number key", async () => {
    const user = userEvent.setup();

    render(
      <ProfileProvider>
        <QuizFlow />
      </ProfileProvider>,
    );

    await screen.findByRole("heading", {
      name: AXIS_QUESTIONS[0].prompt,
    });
    await user.keyboard("1");

    await screen.findByRole("heading", {
      name: AXIS_QUESTIONS[1].prompt,
    });
    expect(screen.getByText("Question 2 of 13")).toBeTruthy();
  });
});
