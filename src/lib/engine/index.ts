import {
  PROFILE_VERSION,
  type AxisScores,
  type Friction,
  type LearnerContext,
  type LearnerProfile,
  type QuizAnswers,
} from "@/lib/types";
import { scoreAxes } from "./scoreAxes";
import { matchArchetype } from "./matchArchetype";
import { rankTechniques } from "./rankTechniques";
import { pickResources } from "./pickResources";

export { scoreAxes, axesFromDirectInput } from "./scoreAxes";
export { matchArchetype, archetypeScores } from "./matchArchetype";
export { rankTechniques } from "./rankTechniques";
export { buildWeeklyPlan, formatHour } from "./buildWeeklyPlan";
export { pickResources, sortResourcesByFit, scoreResource } from "./pickResources";

type GenerateInput = {
  axes: AxisScores;
  frictions: Friction[];
  context: LearnerContext;
};

/** Builds the learner profile. Weekly planning begins after schedule setup. */
export function generateProfile(input: GenerateInput): LearnerProfile {
  const { axes, frictions, context } = input;

  const match = matchArchetype(axes);
  const techniques = rankTechniques({
    axes,
    frictions,
    context,
    primary: match.primary,
  });

  const toolIds = techniques.flatMap((t) => t.technique.toolIds);
  const resources = pickResources({ axes, frictions, context, toolIds });

  const reasons: Record<string, string[]> = {};
  for (const scored of techniques) {
    reasons[scored.technique.id] = scored.reasons;
  }

  return {
    version: PROFILE_VERSION,
    createdAt: new Date().toISOString(),
    axes,
    frictions,
    context,
    match,
    recommendedTechniqueIds: techniques.map((t) => t.technique.id),
    selectedTechniqueIds: [],
    onboardingStage: "persona",
    reasons,
    resourceIds: resources.map((r) => r.id),
  };
}

export function generateProfileFromQuiz(answers: QuizAnswers): LearnerProfile {
  return generateProfile({
    axes: scoreAxes(answers),
    frictions: answers.frictions,
    context: answers.context,
  });
}
