import { RESOURCES } from "@/lib/data/resources";
import {
  AXES,
  type AxisScores,
  type Field,
  type Friction,
  type Resource,
} from "@/lib/types";

const COST_BONUS: Record<Resource["cost"], number> = {
  free: 12,
  "free-tier": 4,
  paid: -30,
};

export type PickResourcesInput = {
  axes: AxisScores;
  frictions: Friction[];
  /** Optional education field retained for supporting-resource relevance. */
  field?: Field;
  /** Tool ids referenced by recommendations before Methods are selected. */
  toolIds: string[];
  /** Tool ids referenced by the learner's explicitly selected Methods. */
  selectedToolIds?: string[];
  /** Tool ids referenced by Methods actually used in the saved weekly plan. */
  planToolIds?: string[];
};

export function scoreResource(
  resource: Resource,
  input: PickResourcesInput,
): number {
  let score = COST_BONUS[resource.cost];

  if (input.planToolIds?.includes(resource.id)) score += 56;
  else if (input.selectedToolIds?.includes(resource.id)) score += 48;
  else if (input.toolIds.includes(resource.id)) score += 40;
  if (resource.campus) score += 14;

  for (const axis of AXES) {
    const weight = resource.axisFit?.[axis];
    if (weight === undefined) continue;
    score += (weight * input.axes[axis]) / 100;
  }

  for (const friction of resource.frictionFit ?? []) {
    if (input.frictions.includes(friction)) score += 22;
  }

  if (input.field && resource.fieldFit?.includes(input.field)) score += 16;

  // Give support resources a small discoverability floor without pretending
  // that the same resource is the right first recommendation for everyone.
  if (resource.category === "wellbeing" || resource.category === "basic-needs") {
    score += 6;
  }

  return Number(score.toFixed(2));
}

export function pickResources(
  input: PickResourcesInput,
  limit = 12,
): Resource[] {
  return [...RESOURCES]
    .map((resource) => ({ resource, score: scoreResource(resource, input) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.resource);
}

/** Full library sorted by fit, used by the resources page. */
export function sortResourcesByFit(input: PickResourcesInput): Resource[] {
  return [...RESOURCES]
    .map((resource) => ({ resource, score: scoreResource(resource, input) }))
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.resource);
}
