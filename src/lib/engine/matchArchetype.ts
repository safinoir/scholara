import { ARCHETYPES } from "@/lib/data/archetypes";
import { AXES, type ArchetypeMatch, type AxisScores } from "@/lib/types";

function dot(a: AxisScores, b: AxisScores): number {
  return AXES.reduce((sum, axis) => sum + a[axis] * b[axis], 0);
}

function magnitude(v: AxisScores): number {
  return Math.sqrt(AXES.reduce((sum, axis) => sum + v[axis] ** 2, 0));
}

/**
 * Cosine similarity compares the *shape* of the answer profile rather than its
 * intensity, so a student with mild preferences still matches the archetype
 * that leans the same way.
 */
function similarity(a: AxisScores, b: AxisScores): number {
  const magA = magnitude(a);
  const magB = magnitude(b);
  if (magA === 0 || magB === 0) return 0;
  return dot(a, b) / (magA * magB);
}

export function matchArchetype(axes: AxisScores): ArchetypeMatch {
  const ranked = ARCHETYPES.map((archetype) => ({
    id: archetype.id,
    score: similarity(axes, archetype.vector),
  })).sort((a, b) => b.score - a.score);

  const [first, second] = ranked;

  // Gap between the top two, scaled into 0..1. A small gap is a genuine blend,
  // which the UI surfaces rather than hides.
  const gap = first.score - second.score;
  const confidence = Math.max(0, Math.min(1, gap / 0.35));

  return {
    primary: first.id,
    secondary: second.id,
    confidence: Number(confidence.toFixed(2)),
  };
}

export function archetypeScores(axes: AxisScores) {
  return ARCHETYPES.map((archetype) => ({
    id: archetype.id,
    score: Number(similarity(axes, archetype.vector).toFixed(3)),
  })).sort((a, b) => b.score - a.score);
}
