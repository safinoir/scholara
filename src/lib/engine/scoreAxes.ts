import { AXES, type AxisScores, type QuizAnswers } from "@/lib/types";
import { AXIS_QUESTIONS } from "@/lib/data/questions";

const clamp = (n: number, min = -100, max = 100) =>
  Math.max(min, Math.min(max, n));

/**
 * Sums the weights of every selected option, then normalizes each axis by the
 * strongest response it could have received. Averaging by the number of
 * contributing questions (rather than the raw sum) keeps one strongly-weighted
 * answer from pinning an axis to an extreme on its own.
 */
export function scoreAxes(answers: QuizAnswers): AxisScores {
  const totals: Record<string, number> = {};
  const counts: Record<string, number> = {};

  for (const axis of AXES) {
    totals[axis] = 0;
    counts[axis] = 0;
  }

  for (const question of AXIS_QUESTIONS) {
    const choice = answers.axisAnswers[question.id];
    if (choice === undefined) continue;

    const option = question.options[choice];
    if (!option) continue;

    for (const [axis, weight] of Object.entries(option.weights)) {
      if (weight === undefined) continue;
      totals[axis] += weight;
      counts[axis] += 1;
    }
  }

  const scores = {} as AxisScores;
  for (const axis of AXES) {
    // Scale up slightly so a consistent answerer can reach the poles,
    // while a mixed answerer lands honestly in the middle.
    const average = counts[axis] > 0 ? totals[axis] / counts[axis] : 0;
    scores[axis] = Math.round(clamp(average * 1.35));
  }

  return scores;
}

/** Used by the express-intake form, which sets axes directly. */
export function axesFromDirectInput(partial: Partial<AxisScores>): AxisScores {
  const scores = {} as AxisScores;
  for (const axis of AXES) {
    scores[axis] = Math.round(clamp(partial[axis] ?? 0));
  }
  return scores;
}
