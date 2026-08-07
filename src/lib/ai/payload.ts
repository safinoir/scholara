import type { LearnerProfile } from "@/lib/types";

/**
 * Builds the exact request body the AI routes accept. Client-safe: this module
 * never imports the AI client, so no key or provider detail reaches the bundle.
 */
export function coachingPayload(profile: LearnerProfile) {
  return {
    axes: profile.axes,
    frictions: profile.frictions,
    context: profile.context,
    primary: profile.match.primary,
    secondary: profile.match.secondary,
    techniqueIds: profile.techniqueIds,
    plan: profile.plan,
    week: profile.weekContext,
  };
}
