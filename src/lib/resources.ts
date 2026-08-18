import { TECHNIQUE_BY_ID } from "@/lib/data/techniques";
import type {
  Friction,
  LearnerProfile,
  Resource,
} from "@/lib/types";

export type ResourceMethodSource =
  | "plan"
  | "selected"
  | "recommended"
  | null;

export type ResourcePersonalization = {
  planTechniqueIds: string[];
  selectedTechniqueIds: string[];
  recommendedTechniqueIds: string[];
  planToolIds: string[];
  selectedToolIds: string[];
  recommendedToolIds: string[];
};

export type ResourceFit = {
  methodSource: ResourceMethodSource;
  techniqueId?: string;
  obstacleMatches: Friction[];
  fieldMatch: boolean;
};

function uniqueKnownTechniqueIds(ids: readonly string[]): string[] {
  return [...new Set(ids)].filter((id) => TECHNIQUE_BY_ID[id] !== undefined);
}

function toolIdsForTechniques(techniqueIds: readonly string[]): string[] {
  return [
    ...new Set(
      techniqueIds.flatMap(
        (techniqueId) => TECHNIQUE_BY_ID[techniqueId]?.toolIds ?? [],
      ),
    ),
  ];
}

/**
 * Builds the live resource context from the learner's current plan and chosen
 * Methods. Intake-time recommendations are used only before either exists.
 */
export function resourcePersonalizationForProfile(
  profile: LearnerProfile,
): ResourcePersonalization {
  const planTechniqueIds = uniqueKnownTechniqueIds(
    (profile.plan?.blocks ?? []).flatMap((block) => [
      block.techniqueId,
      ...block.supportingTechniqueIds,
    ]),
  );
  const selectedTechniqueIds = uniqueKnownTechniqueIds(
    profile.selectedTechniqueIds,
  );
  const recommendedTechniqueIds =
    planTechniqueIds.length === 0 && selectedTechniqueIds.length === 0
      ? uniqueKnownTechniqueIds(profile.recommendedTechniqueIds)
      : [];

  return {
    planTechniqueIds,
    selectedTechniqueIds,
    recommendedTechniqueIds,
    planToolIds: toolIdsForTechniques(planTechniqueIds),
    selectedToolIds: toolIdsForTechniques(selectedTechniqueIds),
    recommendedToolIds: toolIdsForTechniques(recommendedTechniqueIds),
  };
}

function matchingTechniqueId(
  resourceId: string,
  techniqueIds: readonly string[],
): string | undefined {
  return techniqueIds.find((techniqueId) =>
    TECHNIQUE_BY_ID[techniqueId]?.toolIds.includes(resourceId),
  );
}

/** Returns the most concrete, explainable live fit for a resource card. */
export function resourceFitForProfile(
  resource: Resource,
  profile: LearnerProfile,
  personalization = resourcePersonalizationForProfile(profile),
): ResourceFit {
  const planTechniqueId = matchingTechniqueId(
    resource.id,
    personalization.planTechniqueIds,
  );
  const selectedTechniqueId = matchingTechniqueId(
    resource.id,
    personalization.selectedTechniqueIds,
  );
  const recommendedTechniqueId = matchingTechniqueId(
    resource.id,
    personalization.recommendedTechniqueIds,
  );

  const methodSource: ResourceMethodSource = planTechniqueId
    ? "plan"
    : selectedTechniqueId
      ? "selected"
      : recommendedTechniqueId
        ? "recommended"
        : null;

  return {
    methodSource,
    techniqueId:
      planTechniqueId ?? selectedTechniqueId ?? recommendedTechniqueId,
    obstacleMatches: (resource.frictionFit ?? []).filter((friction) =>
      profile.frictions.includes(friction),
    ),
    fieldMatch:
      profile.educationContext?.field !== undefined &&
      (resource.fieldFit ?? []).includes(profile.educationContext.field),
  };
}

export function resourceRankingInputForProfile(profile: LearnerProfile) {
  const personalization = resourcePersonalizationForProfile(profile);
  return {
    axes: profile.axes,
    frictions: profile.frictions,
    field: profile.educationContext?.field,
    toolIds: personalization.recommendedToolIds,
    selectedToolIds: personalization.selectedToolIds,
    planToolIds: personalization.planToolIds,
  };
}
