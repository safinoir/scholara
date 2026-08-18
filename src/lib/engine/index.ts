import {
  PROFILE_VERSION,
  type AxisScores,
  type Friction,
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
export {
  buildSchedulePlan,
  calculateScheduleCapacity,
  type BuildSchedulePlanInput,
  type ScheduleCapacity,
  type UsableStudyWindow,
} from "./buildSchedulePlan";
export {
  pickResources,
  sortResourcesByFit,
  scoreResource,
  type PickResourcesInput,
} from "./pickResources";
export { changePersona } from "./changePersona";

type GenerateInput = {
  axes: AxisScores;
  frictions: Friction[];
};

/** Builds the learner profile. Weekly planning begins after schedule setup. */
export function generateProfile(input: GenerateInput): LearnerProfile {
  const { axes, frictions } = input;

  const match = matchArchetype(axes);
  const techniques = rankTechniques({
    axes,
    frictions,
    primary: match.primary,
  });

  const toolIds = techniques.flatMap((t) => t.technique.toolIds);
  const resources = pickResources({ axes, frictions, toolIds });

  const reasons: Record<string, string[]> = {};
  for (const scored of techniques) {
    reasons[scored.technique.id] = scored.reasons;
  }

  return {
    version: PROFILE_VERSION,
    createdAt: new Date().toISOString(),
    axes,
    frictions,
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
  });
}
