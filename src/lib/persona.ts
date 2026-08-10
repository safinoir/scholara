import type {
  ArchetypeMatch,
  LearnerProfile,
} from "@/lib/types";

export type EffectiveArchetypeMatch = ArchetypeMatch & {
  overridden: boolean;
};

/** Returns the persona the learner chose without rewriting measured axes. */
export function effectiveArchetypeMatch(
  profile: Pick<LearnerProfile, "match" | "personaOverride">,
): EffectiveArchetypeMatch {
  const override = profile.personaOverride;
  if (!override || override === profile.match.primary) {
    return { ...profile.match, overridden: false };
  }

  return {
    primary: override,
    secondary: profile.match.primary,
    confidence: 1,
    overridden: true,
  };
}
