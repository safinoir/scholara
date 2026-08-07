"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { TECHNIQUE_BY_ID, TECHNIQUES } from "@/lib/data/techniques";
import type {
  LearnerProfile,
  Technique,
  TechniqueCategory,
} from "@/lib/types";
import { LoadingShell, NoProfile } from "@/components/NoProfile";
import { TechniqueCard } from "@/components/results/TechniqueCard";
import { Button, ButtonLink, Card } from "@/components/ui";

const CATEGORY_ORDER: TechniqueCategory[] = [
  "encoding",
  "focus",
  "planning",
  "exam",
];

const CATEGORY_LABELS: Record<TechniqueCategory, string> = {
  encoding: "Memory and learning",
  focus: "Focus and starting",
  planning: "Planning and workload",
  exam: "Exams and confidence",
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

    onSave({
      ...profile,
      selectedTechniqueIds: orderedDraft,
      onboardingStage,
    });
    setDraft(orderedDraft);
  };

  const selectionMessage =
    draft.length === 0
      ? "Choose at least one method."
      : limitReached
        ? "Toolkit full. Remove one to choose another."
        : `You can choose ${3 - draft.length} more.`;

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 sm:py-14">
      <header className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">
          Your Study Toolkit
        </p>
        <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">
          Choose the methods you want to try
        </h1>
        <p className="mt-4 text-ink-soft">
          Start with the five strongest matches, then browse the full library.
          Pick one to three methods that feel realistic for you.
        </p>
      </header>

      <div className="sticky top-[4.5rem] z-30 mt-8 rounded-2xl border border-brand-100 bg-paper/95 p-4 shadow-sm backdrop-blur sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{draft.length} of 3 selected</p>
            <p className="mt-1 text-sm text-ink-soft" aria-live="polite">
              {canContinue ? "Toolkit saved." : selectionMessage}
            </p>
            {orderedDraft.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-2" aria-label="Selected methods">
                {orderedDraft.map((id) => (
                  <li
                    key={id}
                    className="rounded-full border border-brand-100 bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700"
                  >
                    {TECHNIQUE_BY_ID[id].name}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <Button
            onClick={saveToolkit}
            disabled={draft.length === 0 || !hasChanges}
            className="w-full shrink-0 sm:w-auto"
          >
            <Check className="size-4" aria-hidden />
            Save toolkit
          </Button>
        </div>
      </div>

      <section className="mt-14" aria-labelledby="recommended-methods">
        <h2 id="recommended-methods" className="text-2xl font-semibold sm:text-3xl">
          Your top five matches
        </h2>
        <p className="mt-3 max-w-2xl text-ink-soft">
          Ranked from your six-axis profile, stated obstacles, available time,
          and the strength of the evidence.
        </p>
        <div className="mt-8 space-y-4">
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

      <section className="mt-16" aria-labelledby="all-methods">
        <h2 id="all-methods" className="text-2xl font-semibold sm:text-3xl">
          Explore every other method
        </h2>
        <p className="mt-3 max-w-2xl text-ink-soft">
          A recommendation is a starting point. You can select any method that
          feels more practical for your courses or current week.
        </p>

        <div className="mt-8 space-y-4">
          {CATEGORY_ORDER.map((category) => {
            const methods = remainingByCategory[category];
            if (methods.length === 0) return null;
            return (
              <details
                key={category}
                className="rounded-2xl border border-line bg-surface"
              >
                <summary className="flex min-h-14 cursor-pointer items-center justify-between gap-4 px-5 py-4 font-semibold marker:content-none">
                  <span>{CATEGORY_LABELS[category]}</span>
                  <span className="text-sm font-normal text-ink-faint">
                    {methods.length} method{methods.length === 1 ? "" : "s"}
                  </span>
                </summary>
                <div className="space-y-4 border-t border-line-soft bg-paper p-4 sm:p-5">
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
              </details>
            );
          })}
        </div>
      </section>

      {canContinue && (
        <Card className="mt-16 border-brand-100 bg-brand-50">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex-1">
              <h2 className="text-xl font-semibold">Your toolkit is ready</h2>
              <p className="mt-1.5 text-sm text-ink-soft">
                These choices are saved in your browser and ready for weekly
                planning.
              </p>
            </div>
            <ButtonLink href="/plan" size="lg" className="shrink-0">
              Continue to Plan
              <ArrowRight className="size-4" aria-hidden />
            </ButtonLink>
          </div>
        </Card>
      )}
    </div>
  );
}
