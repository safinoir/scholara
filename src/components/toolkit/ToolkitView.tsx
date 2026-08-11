"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { TECHNIQUE_BY_ID, TECHNIQUES } from "@/lib/data/techniques";
import { buildSchedulePlan, rankTechniques } from "@/lib/engine";
import { canAccessToolkit } from "@/lib/onboarding";
import { effectiveArchetypeMatch } from "@/lib/persona";
import type {
  LearnerProfile,
  Technique,
  TechniqueCategory,
} from "@/lib/types";
import { LoadingShell, NoProfile } from "@/components/NoProfile";
import { OnboardingGate } from "@/components/OnboardingGate";
import { TechniqueCard } from "@/components/results/TechniqueCard";
import { Button, ButtonLink } from "@/components/ui";

const CATEGORY_ORDER: TechniqueCategory[] = [
  "encoding",
  "focus",
  "planning",
  "exam",
];

const CATEGORY_LABELS: Record<TechniqueCategory, string> = {
  encoding: "Learn and remember",
  focus: "Focus and start",
  planning: "Plan your workload",
  exam: "Prepare for exams",
};

function orderSelection(ids: string[], recommendedIds: string[]): string[] {
  const selected = new Set(ids);
  const catalogOrder = TECHNIQUES.map((technique) => technique.id);
  return [...recommendedIds, ...catalogOrder].filter(
    (id, index, all) => selected.has(id) && all.indexOf(id) === index,
  );
}

function sameSelection(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((id, index) => id === b[index]);
}

export function ToolkitView() {
  const { profile, ready, setProfile } = useProfile();

  if (!ready) return <LoadingShell />;
  if (!profile) return <NoProfile />;
  if (!canAccessToolkit(profile)) {
    return (
      <OnboardingGate
        title="See your persona first"
        body="Review your study preferences before choosing methods for your weekly plan."
        href="/persona"
        action="Continue to your persona"
      />
    );
  }

  return (
    <ToolkitContent
      key={`${profile.createdAt}:${profile.recommendedTechniqueIds.join(",")}`}
      profile={profile}
      onSave={setProfile}
    />
  );
}

function ToolkitContent({
  profile,
  onSave,
}: {
  profile: LearnerProfile;
  onSave: (profile: LearnerProfile) => void;
}) {
  const initialSelection = orderSelection(
    profile.selectedTechniqueIds,
    profile.recommendedTechniqueIds,
  );
  const [draft, setDraft] = useState(initialSelection);

  const recommended = profile.recommendedTechniqueIds
    .map((id) => TECHNIQUE_BY_ID[id])
    .filter(Boolean);
  const recommendedIds = new Set(recommended.map((technique) => technique.id));
  const remainingByCategory = Object.fromEntries(
    CATEGORY_ORDER.map((category) => [
      category,
      TECHNIQUES.filter(
        (technique) =>
          technique.category === category && !recommendedIds.has(technique.id),
      ),
    ]),
  ) as Record<TechniqueCategory, Technique[]>;

  const orderedDraft = orderSelection(draft, profile.recommendedTechniqueIds);
  const savedSelection = orderSelection(
    profile.selectedTechniqueIds,
    profile.recommendedTechniqueIds,
  );
  const hasChanges = !sameSelection(orderedDraft, savedSelection);
  const limitReached = draft.length >= 3;
  const canContinue = savedSelection.length > 0 && !hasChanges;

  const toggleSelection = (id: string) => {
    setDraft((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length >= 3) return current;
      return [...current, id];
    });
  };

  const saveToolkit = () => {
    if (orderedDraft.length < 1 || orderedDraft.length > 3) return;

    const onboardingStage =
      profile.onboardingStage === "persona" ||
      profile.onboardingStage === "toolkit"
        ? "schedule"
        : profile.onboardingStage;

    const plan = profile.schedule
      ? buildSchedulePlan({
          axes: profile.axes,
          frictions: profile.frictions,
          context: profile.context,
          schedule: profile.schedule,
          techniques: rankTechniques({
            axes: profile.axes,
            frictions: profile.frictions,
            context: profile.context,
            primary: effectiveArchetypeMatch(profile).primary,
          }),
          selectedTechniqueIds: orderedDraft,
          week: profile.weekContext,
        })
      : profile.plan;

    onSave({
      ...profile,
      selectedTechniqueIds: orderedDraft,
      onboardingStage,
      plan,
      coaching: undefined,
    });
    setDraft(orderedDraft);
  };

  const selectionMessage =
    draft.length === 0
      ? "Choose at least 1 method."
      : limitReached
        ? "All set. Remove one to switch."
        : `You can choose ${3 - draft.length} more.`;

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 sm:py-14">
      <header className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">
          Study methods
        </p>
        <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">
          Choose 1–3 methods for your week
        </h1>
        <p className="mt-4 text-ink-soft">
          Scholara will build your choices into the study blocks in your weekly
          schedule. Start with your best matches or browse by goal.
        </p>
        <p className="mt-2 text-sm text-ink-faint">
          These methods change what you do during study time. Your schedule
          setup decides when that study time happens.
        </p>
      </header>

      <div className="sticky top-[4.5rem] z-30 mt-7 rounded-xl border border-brand-100 bg-paper/95 p-3 shadow-sm backdrop-blur sm:px-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{draft.length} of 3 chosen</p>
            <p className="mt-0.5 truncate text-sm text-ink-soft">
              {orderedDraft.length > 0
                ? orderedDraft.map((id) => TECHNIQUE_BY_ID[id].name).join(", ")
                : selectionMessage}
            </p>
            <span className="sr-only" role="status" aria-live="polite">
              {canContinue
                ? "Methods saved for your weekly schedule."
                : selectionMessage}
            </span>
          </div>
          {canContinue ? (
            <ButtonLink
              href="/plan"
              size="sm"
              className="w-full shrink-0 sm:w-auto"
            >
              Continue to plan
              <ArrowRight className="size-4" aria-hidden />
            </ButtonLink>
          ) : (
            <Button
              size="sm"
              onClick={saveToolkit}
              disabled={draft.length === 0 || !hasChanges}
              className="w-full shrink-0 sm:w-auto"
            >
              <Check className="size-4" aria-hidden />
              Save methods
            </Button>
          )}
        </div>
      </div>

      <section className="mt-10" aria-labelledby="recommended-methods">
        <h2 id="recommended-methods" className="text-2xl font-semibold">
          Best matches for you
        </h2>
        <p className="mt-3 max-w-2xl text-ink-soft">
          Based on your profile, obstacles, available time, and the research.
        </p>
        <div className="mt-6 space-y-3">
          {recommended.map((technique, index) => {
            const selected = draft.includes(technique.id);
            return (
              <TechniqueCard
                key={technique.id}
                technique={technique}
                reasons={profile.reasons[technique.id] ?? []}
                rank={index + 1}
                selected={selected}
                selectionDisabled={limitReached && !selected}
                onToggleSelection={() => toggleSelection(technique.id)}
              />
            );
          })}
        </div>
      </section>

      <section className="mt-12" aria-labelledby="all-methods">
        <h2 id="all-methods" className="sr-only">
          Browse more study methods
        </h2>
        <details className="rounded-xl border border-line bg-surface">
          <summary className="min-h-12 cursor-pointer px-4 py-3.5 font-semibold">
            Browse {TECHNIQUES.length - recommended.length} more methods
            <span className="ml-2 text-sm font-normal text-ink-faint">
              by goal
            </span>
          </summary>
          <div className="space-y-8 border-t border-line-soft bg-paper p-3 sm:p-4">
            {CATEGORY_ORDER.map((category) => {
              const methods = remainingByCategory[category];
              if (methods.length === 0) return null;
              return (
                <section key={category} aria-labelledby={`category-${category}`}>
                  <h3
                    id={`category-${category}`}
                    className="mb-3 text-sm font-semibold text-ink"
                  >
                    {CATEGORY_LABELS[category]}
                  </h3>
                  <div className="space-y-3">
                    {methods.map((technique) => {
                      const selected = draft.includes(technique.id);
                      return (
                        <TechniqueCard
                          key={technique.id}
                          technique={technique}
                          reasons={[]}
                          selected={selected}
                          selectionDisabled={limitReached && !selected}
                          onToggleSelection={() => toggleSelection(technique.id)}
                        />
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        </details>
      </section>
    </div>
  );
}
