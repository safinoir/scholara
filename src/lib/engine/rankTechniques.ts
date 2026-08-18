import { TECHNIQUES } from "@/lib/data/techniques";
import { AXIS_BY_ID, FRICTION_BY_ID } from "@/lib/data/axes";
import {
  type ArchetypeId,
  type AxisScores,
  type Friction,
  type ScoredTechnique,
  type Technique,
} from "@/lib/types";

const FRICTION_BONUS = 34;
const MAX_PER_CATEGORY = 2;
const RESULT_COUNT = 5;

const TIME_COST_PENALTY: Record<Technique["timeCost"], number> = {
  low: 0,
  medium: 10,
  high: 22,
};

const EVIDENCE_BONUS: Record<Technique["evidence"], number> = {
  strong: 10,
  moderate: 4,
  promising: 0,
};

/** 0 when the student has plenty of time, 1 when they're severely squeezed. */
function timeScarcityFactor(frictions: Friction[]): number {
  return frictions.includes("time-scarcity") ? 1 : 0;
}

type ScoreInput = {
  axes: AxisScores;
  frictions: Friction[];
  primary: ArchetypeId;
};

function scoreTechnique(
  technique: Technique,
  input: ScoreInput,
): { score: number; reasons: string[] } {
  const reasons: { text: string; weight: number }[] = [];
  let score = EVIDENCE_BONUS[technique.evidence];

  for (const [axis, weight] of Object.entries(technique.axisWeights)) {
    if (weight === undefined) continue;
    const axisKey = axis as keyof AxisScores;
    const contribution = (weight * input.axes[axisKey]) / 100;
    score += contribution;

    // Only surface a reason when the axis genuinely pulled this technique in.
    if (contribution > 12) {
      const meta = AXIS_BY_ID[axisKey];
      const pole = input.axes[axisKey] > 0 ? meta.highLabel : meta.lowLabel;
      reasons.push({
        text: `Fits your ${pole.toLowerCase()} tendency`,
        weight: contribution,
      });
    }
  }

  for (const friction of technique.fixes) {
    if (!input.frictions.includes(friction)) continue;
    score += FRICTION_BONUS;
    reasons.push({
      text: `Directly targets: ${FRICTION_BY_ID[friction].label.toLowerCase()}`,
      weight: FRICTION_BONUS,
    });
  }

  const boost = technique.archetypeBoost?.[input.primary];
  if (boost) {
    score += boost;
    reasons.push({ text: "Works well for your persona", weight: boost });
  }

  const scarcity = timeScarcityFactor(input.frictions);
  score -= TIME_COST_PENALTY[technique.timeCost] * scarcity;

  reasons.sort((a, b) => b.weight - a.weight);

  return {
    score: Number(score.toFixed(2)),
    reasons: [...new Set(reasons.map((r) => r.text))].slice(0, 3),
  };
}

/**
 * Ranks all techniques, then enforces category diversity so a student never
 * receives five variations of the same idea.
 */
export function rankTechniques(input: ScoreInput): ScoredTechnique[] {
  const scored = TECHNIQUES.map((technique) => {
    const { score, reasons } = scoreTechnique(technique, input);
    return { technique, score, reasons };
  }).sort((a, b) => b.score - a.score);

  const picked: ScoredTechnique[] = [];
  const categoryCount: Record<string, number> = {};

  for (const candidate of scored) {
    if (picked.length >= RESULT_COUNT) break;
    const category = candidate.technique.category;
    if ((categoryCount[category] ?? 0) >= MAX_PER_CATEGORY) continue;
    categoryCount[category] = (categoryCount[category] ?? 0) + 1;
    picked.push(candidate);
  }

  // Backfill if diversity limits left us short.
  if (picked.length < RESULT_COUNT) {
    for (const candidate of scored) {
      if (picked.length >= RESULT_COUNT) break;
      if (picked.some((p) => p.technique.id === candidate.technique.id)) continue;
      picked.push(candidate);
    }
  }

  return picked;
}

export { timeScarcityFactor };
