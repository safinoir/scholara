// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PlanSetupWizard } from "@/components/plan/PlanSetupWizard";
import { generateProfile } from "@/lib/engine";
import { KEYS } from "@/lib/storage";
import type { LearnerProfile, ScheduleSetup } from "@/lib/types";
import "./dom";

function learnerProfile(): LearnerProfile {
  const generated = generateProfile({
    axes: {
      rhythm: 20,
      structure: 40,
      social: -20,
      input: 10,
      drive: 30,
      clock: -10,
    },
    frictions: ["time-scarcity"],
  });

  return {
    ...generated,
    onboardingStage: "schedule",
    selectedTechniqueIds: [generated.recommendedTechniqueIds[0]],
  };
}

const VALID_SCHEDULE: ScheduleSetup = {
  mode: "by-course",
  courses: [
    {
      id: "history",
      name: "History",
      colorKey: "indigo",
      includedInPlan: true,
      priority: "standard",
    },
  ],
  classMeetings: [],
  studyWindows: [
    {
      id: "monday-evening",
      days: ["Monday"],
      startMinute: 18 * 60,
      endMinute: 20 * 60,
    },
  ],
  targetStudyMinutes: 60,
};

describe("PlanSetupWizard safety", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("announces an invalid course step and focuses the first error", async () => {
    const user = userEvent.setup();
    render(
      <PlanSetupWizard
        profile={learnerProfile()}
        onComplete={() => ({ success: true })}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Continue to availability" }),
    );

    const error = screen.getByText(
      "Add at least one course to build a weekly plan.",
    );
    const alert = error.closest("[role='alert']");
    expect(alert).not.toBeNull();
    await waitFor(() =>
      expect(document.activeElement).toBe(alert?.parentElement),
    );
  });

  it("retains an autosaved draft when final generation is rejected", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn(() => ({
      success: false as const,
      message: "The generated plan was empty. Keep editing your schedule.",
    }));
    window.localStorage.setItem(
      KEYS.scheduleDraft,
      JSON.stringify({ version: 2, step: 2, schedule: VALID_SCHEDULE }),
    );

    render(
      <PlanSetupWizard
        profile={learnerProfile()}
        onComplete={onComplete}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Generate weekly plan" }),
    );

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(
      screen.getByText("The generated plan was empty. Keep editing your schedule."),
    ).toBeDefined();
    expect(window.localStorage.getItem(KEYS.scheduleDraft)).not.toBeNull();
  });

  it("places the weekly target after availability controls and focuses it when invalid", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn(() => ({ success: true as const }));
    window.localStorage.setItem(
      KEYS.scheduleDraft,
      JSON.stringify({
        version: 2,
        step: 2,
        schedule: { ...VALID_SCHEDULE, targetStudyMinutes: 0 },
      }),
    );

    render(
      <PlanSetupWizard
        profile={learnerProfile()}
        onComplete={onComplete}
      />,
    );

    const targetHeading = screen.getByRole("heading", {
      name: "Weekly study target",
    });
    const quickPresets = screen.getByRole("heading", {
      name: "Quick presets",
    });
    expect(
      quickPresets.compareDocumentPosition(targetHeading) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).not.toBe(0);

    const target = screen.getByRole<HTMLInputElement>("spinbutton", {
      name: "Hours per week",
    });
    await user.click(
      screen.getByRole("button", { name: "Generate weekly plan" }),
    );

    expect(onComplete).not.toHaveBeenCalled();
    await waitFor(() => expect(document.activeElement).toBe(target));
  });

  it("flushes the newest draft edit when navigation unmounts immediately", async () => {
    const user = userEvent.setup();
    const profile = {
      ...learnerProfile(),
      schedule: VALID_SCHEDULE,
    };
    const { unmount } = render(
      <PlanSetupWizard
        profile={profile}
        onComplete={() => ({ success: true })}
      />,
    );

    const newCourse = document.getElementById("new-course-name");
    expect(newCourse).not.toBeNull();
    await user.type(newCourse!, "Physics");
    await user.click(screen.getByRole("button", { name: "Add course" }));
    unmount();

    const stored = JSON.parse(
      window.localStorage.getItem(KEYS.scheduleDraft) ?? "null",
    );
    expect(
      stored.schedule.courses.map((course: { name: string }) => course.name),
    ).toContain("Physics");
  });
});
