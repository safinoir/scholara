// @vitest-environment jsdom

import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import AboutPage, { metadata } from "@/app/about/page";
import { ResetProfileButton } from "@/components/ResetProfileButton";
import { ProfileProvider } from "@/hooks/useProfile";
import { CAREER_PREFERENCES_KEY } from "@/lib/careerPreferences";
import { SCHOLARA_STORAGE_KEYS } from "@/lib/privacy";
import { KEYS } from "@/lib/storage";
import "./dom";

function renderWithProfileProvider(children: React.ReactNode) {
  return render(<ProfileProvider>{children}</ProfileProvider>);
}

async function expectDeleteControl() {
  return screen.findByRole("button", { name: "Delete everything" });
}

describe("About page", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("explains Scholara's current mission, guided flow, and guardrails", async () => {
    renderWithProfileProvider(<AboutPage />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Make the work behind your degree manageable",
      }),
    ).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Nobody ever taught you how to study.",
      }),
    ).toBeTruthy();

    expect(
      screen.getByRole("heading", {
        name: "From self-discovery to weekly action",
      }),
    ).toBeTruthy();
    expect(screen.getByText(/Canonical flow:/).textContent).toContain(
      "Quiz or Express → Persona → Methods → Weekly Setup → Weekly Plan",
    );
    expect(
      screen.getByRole("heading", {
        name: "Evidence guides what to do. Your preferences shape how.",
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", {
        name: "The deterministic scheduler remains in charge",
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", {
        name: "AI is optional and tuning-only",
      }),
    ).toBeTruthy();
    expect(
      screen.getByText(/It is not a degree audit, registration system, LMS/),
    ).toBeTruthy();

    const sectionNav = screen.getByRole("navigation", {
      name: "About Scholara sections",
    });
    expect(
      within(sectionNav).getByRole("link", { name: "Privacy" }).getAttribute(
        "href",
      ),
    ).toBe("#privacy");
    expect(
      screen.getByRole("link", { name: "Start the quiz" }).getAttribute(
        "href",
      ),
    ).toBe("/quiz");
    expect(
      screen.getByRole("link", { name: "Use Express setup" }).getAttribute(
        "href",
      ),
    ).toBe("/express");
    expect(
      screen.getByRole("link", { name: "Browse resources" }).getAttribute(
        "href",
      ),
    ).toBe("/resources");

    expect(screen.queryByText(/Overcoming Obstacles/i)).toBeNull();
    expect(metadata).toMatchObject({
      title: "About Scholara — how the study planner works",
      description: expect.stringMatching(/degree progress/i),
    });
  });
});

describe("ResetProfileButton", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("keeps every Scholara record when deletion is cancelled", async () => {
    const user = userEvent.setup();
    for (const key of SCHOLARA_STORAGE_KEYS) {
      window.localStorage.setItem(key, `saved:${key}`);
    }

    renderWithProfileProvider(<ResetProfileButton />);

    const deleteButton = await expectDeleteControl();
    expect(deleteButton.className).toContain("bg-red-600");
    await user.click(deleteButton);
    expect(
      screen.getByRole("group", { name: "Confirm deletion" }),
    ).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    await expectDeleteControl();
    for (const key of SCHOLARA_STORAGE_KEYS) {
      expect(window.localStorage.getItem(key)).toBe(`saved:${key}`);
    }
  });

  it("finds auxiliary-only data without a profile and clears every Scholara key", async () => {
    const user = userEvent.setup();

    // Tracker and After can exist independently of onboarding. Their presence
    // must keep the deletion control available even without a learner profile.
    window.localStorage.setItem(
      KEYS.tracker,
      JSON.stringify({ version: 1, logs: [] }),
    );
    window.localStorage.setItem(
      CAREER_PREFERENCES_KEY,
      JSON.stringify({ version: 1, field: "stem", year: "freshman" }),
    );

    renderWithProfileProvider(<ResetProfileButton />);

    const deleteButton = await expectDeleteControl();
    expect(deleteButton.className).toContain("bg-red-600");
    await user.click(deleteButton);

    // Add sentinels after hydration so the confirmation action proves that it
    // clears the complete authoritative key list, not only the detected keys.
    for (const key of SCHOLARA_STORAGE_KEYS) {
      if (window.localStorage.getItem(key) === null) {
        window.localStorage.setItem(key, `sentinel:${key}`);
      }
    }

    const confirmButton = screen.getByRole("button", { name: "Yes, delete it" });
    expect(confirmButton.className).toContain("bg-red-600");
    await user.click(confirmButton);

    expect((await screen.findByRole("status")).textContent).toBe(
      "Everything Scholara stored in this browser has been deleted.",
    );
    await waitFor(() => {
      for (const key of SCHOLARA_STORAGE_KEYS) {
        expect(window.localStorage.getItem(key)).toBeNull();
      }
    });
  });
});
