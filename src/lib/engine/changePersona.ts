import { effectiveArchetypeMatch } from "@/lib/persona";
import type { ArchetypeId, LearnerProfile } from "@/lib/types";
import { buildSchedulePlan } from "./buildSchedulePlan";
import { matchArchetype } from "./matchArchetype";
import { pickResources } from "./pickResources";
import { rankTechniques } from "./rankTechniques";

/** Applies or clears a persona override and refreshes dependent profile data. */
export function changePersona(
  profile: LearnerProfile,
  persona: ArchetypeId | null,
): LearnerProfile {
  const match = matchArchetype(profile.axes);
  const personaOverride = persona && persona !== match.primary ? persona : undefined;
  const matchedProfile: LearnerProfile = {
    ...profile,
    match,
    personaOverride,
  };
  const effectiveMatch = effectiveArchetypeMatch(matchedProfile);
  const recommendations = rankTechniques({
    axes: profile.axes,
    frictions: profile.frictions,
    primary: effectiveMatch.primary,
  });
  const reasons = Object.fromEntries(
    recommendations.map(({ technique, reasons: techniqueReasons }) => [
      technique.id,
      techniqueReasons,
    ]),
  );
  const resources = pickResources({
    axes: profile.axes,
    frictions: profile.frictions,
    field: profile.educationContext?.field,
    toolIds: recommendations.flatMap(({ technique }) => technique.toolIds),
  });

  let plan = profile.plan;
  if (profile.plan && profile.schedule) {
    const frictions = [
      ...new Set([
        ...profile.frictions,
        ...(profile.weekContext?.focusFrictions ?? []),
      ]),
    ];
    const planTechniques = rankTechniques({
      axes: profile.axes,
      frictions,
      primary: effectiveMatch.primary,
    });
    plan = buildSchedulePlan({
      axes: profile.axes,
      frictions: profile.frictions,
      schedule: profile.schedule,
      techniques: planTechniques,
      selectedTechniqueIds: profile.selectedTechniqueIds,
      week: profile.weekContext,
    });
  }

  return {
    ...matchedProfile,
    recommendedTechniqueIds: recommendations.map(
      ({ technique }) => technique.id,
    ),
    reasons,
    resourceIds: resources.map((resource) => resource.id),
    plan,
  };
}
