import { buildSchedulePlan, rankTechniques } from "@/lib/engine";
import { effectiveArchetypeMatch } from "@/lib/persona";
import type {
  LearnerProfile,
  ScheduleSetup,
  WeekContext,
  WeekPlan,
} from "@/lib/types";

/**
 * Builds a weekly plan from validated profile state. This is the single UI
 * orchestration boundary around Scholara's deterministic recommendation and
 * scheduling engines.
 */
export function buildPlanForProfile(
  profile: LearnerProfile,
  schedule: ScheduleSetup,
  week: WeekContext,
): WeekPlan {
  const activeFrictions = [
    ...new Set([...profile.frictions, ...week.focusFrictions]),
  ];
  const techniques = rankTechniques({
    axes: profile.axes,
    frictions: activeFrictions,
    primary: effectiveArchetypeMatch(profile).primary,
  });

  return buildSchedulePlan({
    axes: profile.axes,
    frictions: profile.frictions,
    schedule,
    techniques,
    selectedTechniqueIds: profile.selectedTechniqueIds,
    week,
  });
}
