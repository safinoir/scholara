const PROFILE_REPLACEMENT_WARNING =
  "Finishing this retake will replace your current persona, selected methods, recurring schedule, and weekly plan. Continue?";

export function confirmProfileReplacement(hasExistingProfile: boolean): boolean {
  return !hasExistingProfile || window.confirm(PROFILE_REPLACEMENT_WARNING);
}
