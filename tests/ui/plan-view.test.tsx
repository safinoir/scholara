// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PlanView } from "@/components/plan/PlanView";
import { generateProfile } from "@/lib/engine";
import { ProfileProvider } from "@/hooks/useProfile";
import { buildPlanForProfile } from "@/lib/plan";
import { KEYS } from "@/lib/storage";
import type { LearnerProfile, ScheduleSetup } from "@/lib/types";
import { startCurrentWeek } from "@/lib/week";
import "./dom";

const navigation = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => navigation,
}));

const SCHEDULE: ScheduleSetup = {
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
  classMeetings: [],
  studyWindows: [
    {
      id: "monday-study",
      days: ["Monday"],
      startMinute: 10 * 60,
      endMinute: 12 * 60,
    },
  ],
  targetStudyMinutes: 60,
};

function completedProfile(): LearnerProfile {
  const generated = generateProfile({
    axes: {
      rhythm: 20,
      structure: 35,
      social: -15,
      input: 10,
      drive: 25,
      clock: -20,
    },
    frictions: [],
  });
  const weekContext = startCurrentWeek(SCHEDULE);
  const planningProfile: LearnerProfile = {
    ...generated,
    selectedTechniqueIds: [generated.recommendedTechniqueIds[0]],
    onboardingStage: "complete",
    schedule: SCHEDULE,
    weekContext,
  };

  return {
    ...planningProfile,
    plan: buildPlanForProfile(planningProfile, SCHEDULE, weekContext),
  };
}

describe("PlanView hierarchy", () => {
  beforeEach(() => {
    window.localStorage.clear();
    navigation.push.mockClear();
  });

  it("shows the build rationale before the schedule and keeps the toolbar inline on small screens", async () => {
    window.localStorage.setItem(
      KEYS.profile,
      JSON.stringify(completedProfile()),
    );

    render(
      <ProfileProvider>
        <PlanView />
      </ProfileProvider>,
    );

    const planHeading = await screen.findByRole("heading", {
      level: 1,
      name: "Weekly plan",
    });
    const rationale = screen.getByText("How Scholara built this week");
    const workspace = screen.getByRole("heading", {
      name: "Schedule workspace",
    });

    expect(
      rationale.compareDocumentPosition(workspace) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).not.toBe(0);

    const toolbar = planHeading.closest("header");
    expect(toolbar).not.toBeNull();
    expect(toolbar?.className).toContain("lg:sticky");
    expect(toolbar?.className.split(/\s+/)).not.toContain("sticky");
  });
});
