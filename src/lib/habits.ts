import { HABITS } from "@/lib/data/habits";
import type { Friction, Habit, LearnerProfile } from "@/lib/types";

export type HabitFit = {
  habit: Habit;
  supportsPlanMethod: boolean;
  supportsSelectedMethod: boolean;
  obstacleMatches: Friction[];
};

/** Explains how a micro-habit connects to the learner's saved Scholara setup. */
export function habitFitForProfile(
  habit: Habit,
  profile: LearnerProfile,
): HabitFit {
  const planTechniqueIds = new Set(
    (profile.plan?.blocks ?? []).flatMap((block) => [
      block.techniqueId,
      ...block.supportingTechniqueIds,
    ]),
  );

  return {
    habit,
    supportsPlanMethod:
      habit.techniqueId !== undefined &&
      planTechniqueIds.has(habit.techniqueId),
    supportsSelectedMethod:
      habit.techniqueId !== undefined &&
      profile.selectedTechniqueIds.includes(habit.techniqueId),
    obstacleMatches: habit.frictions.filter((friction) =>
      profile.frictions.includes(friction),
    ),
  };
}

/**
 * Prefer habits already reinforced by the plan, then confirmed Methods, then
 * reported obstacles. Stable sorting preserves the deliberate catalog order.
 */
export function rankHabitSuggestions(
  profile: LearnerProfile,
  activeHabitIds: readonly string[],
): HabitFit[] {
  const activeIds = new Set(activeHabitIds);

  return HABITS.map((habit) => habitFitForProfile(habit, profile))
    .filter(({ habit }) => !activeIds.has(habit.id))
    .sort(
      (a, b) =>
        Number(b.supportsPlanMethod) - Number(a.supportsPlanMethod) ||
        Number(b.supportsSelectedMethod) -
          Number(a.supportsSelectedMethod) ||
        b.obstacleMatches.length - a.obstacleMatches.length,
    );
}
