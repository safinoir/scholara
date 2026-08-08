import type { PlannedLearnerProfile } from "@/lib/types";

/**
 * Builds the exact request body the AI routes accept. Client-safe: this module
 * never imports the AI client, so no key or provider detail reaches the bundle.
 */
export function coachingPayload(profile: PlannedLearnerProfile) {
  const techniqueIds = [
    ...profile.selectedTechniqueIds,
    ...profile.plan.blocks.flatMap((block) => [
      block.techniqueId,
      ...block.supportingTechniqueIds,
    ]),
  ].filter((id, index, ids) => ids.indexOf(id) === index);

  return {
    axes: profile.axes,
    frictions: profile.frictions,
    context: profile.context,
    primary: profile.match.primary,
    secondary: profile.match.secondary,
    techniqueIds: techniqueIds.slice(0, 8),
    plan: profile.plan,
    week: profile.weekContext,
  };
}
