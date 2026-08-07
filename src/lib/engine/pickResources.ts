import { RESOURCES } from "@/lib/data/resources";
import {
  AXES,
  type AxisScores,
  type Friction,
  type LearnerContext,
  type Resource,
} from "@/lib/types";

const COST_BONUS: Record<Resource["cost"], number> = {
  free: 12,
  "free-tier": 4,
  paid: -30,
};

type PickInput = {
  axes: AxisScores;
  frictions: Friction[];
  context: LearnerContext;
  /** Tool ids referenced by the recommended techniques. */
  toolIds: string[];
};

export function scoreResource(resource: Resource, input: PickInput): number {
  let score = COST_BONUS[resource.cost];

  if (input.toolIds.includes(resource.id)) score += 40;
  if (resource.campus) score += 14;

  for (const axis of AXES) {
    const weight = resource.axisFit?.[axis];
    if (weight === undefined) continue;
    score += (weight * input.axes[axis]) / 100;
  }

  for (const friction of resource.frictionFit ?? []) {
    if (input.frictions.includes(friction)) score += 22;
  }

  if (resource.fieldFit?.includes(input.context.field)) score += 16;

  // Crisis and basic-needs resources should never be buried.
  if (resource.category === "wellbeing" || resource.category === "basic-needs") {
    score += 6;
  }

  return Number(score.toFixed(2));
}

export function pickResources(input: PickInput, limit = 12): Resource[] {
  return [...RESOURCES]
    .map((resource) => ({ resource, score: scoreResource(resource, input) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.resource);
}

/** Full library sorted by fit, used by the resources page. */
export function sortResourcesByFit(input: PickInput): Resource[] {
  return [...RESOURCES]
    .map((resource) => ({ resource, score: scoreResource(resource, input) }))
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.resource);
}
