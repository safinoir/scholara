import type {
  LearnerProfile,
  PlannedLearnerProfile,
  ScheduledLearnerProfile,
} from "@/lib/types";

export type OnboardingDestination = {
  href: "/persona" | "/toolkit" | "/plan";
  label: string;
};

/** The toolkit becomes available after the learner confirms their persona. */
export function canAccessToolkit(profile: LearnerProfile): boolean {
  return profile.onboardingStage !== "persona";
}

/** A saved toolkit is required before weekly planning can begin. */
export function hasConfirmedToolkit(profile: LearnerProfile): boolean {
  const pastToolkit =
    profile.onboardingStage === "schedule" ||
    profile.onboardingStage === "complete";

  return pastToolkit && profile.selectedTechniqueIds.length > 0;
}

/** Narrows profile consumers that require a generated calendar. */
export function hasGeneratedPlan(
  profile: LearnerProfile,
): profile is PlannedLearnerProfile {
  return profile.plan !== undefined;
}

/** Legacy plans remain stored, but only a completed schedule unlocks Plan. */
export function hasCompletedSchedule(
  profile: LearnerProfile,
): profile is ScheduledLearnerProfile {
  const schedule = profile.schedule;
  return (
    profile.onboardingStage === "complete" &&
    schedule !== undefined &&
    schedule.mode === "by-course" &&
    schedule.courses.some((course) => course.includedInPlan) &&
    schedule.classMeetings.every((meeting) => Boolean(meeting.courseId)) &&
    hasGeneratedPlan(profile) &&
    profile.plan.algorithmVersion === 2
  );
}

/** Returns the next useful destination for a returning learner. */
export function resumeDestination(
  profile: LearnerProfile,
): OnboardingDestination {
  if (profile.onboardingStage === "persona") {
    return { href: "/persona", label: "Continue to your persona" };
  }

  if (
    profile.onboardingStage === "toolkit" ||
    !hasConfirmedToolkit(profile)
  ) {
    return { href: "/toolkit", label: "Choose your study methods" };
  }

  if (profile.onboardingStage === "schedule") {
    return { href: "/plan", label: "Continue to weekly setup" };
  }

  return { href: "/plan", label: "Back to your plan" };
}
