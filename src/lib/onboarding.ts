import type { LearnerProfile } from "@/lib/types";

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
    return { href: "/toolkit", label: "Choose your Study Toolkit" };
  }

  if (profile.onboardingStage === "schedule") {
    return { href: "/plan", label: "Continue to weekly setup" };
  }

  return { href: "/plan", label: "Back to your plan" };
}
