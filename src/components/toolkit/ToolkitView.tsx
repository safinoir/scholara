"use client";

import { ArrowRight } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { TECHNIQUE_BY_ID } from "@/lib/data/techniques";
import { LoadingShell, NoProfile } from "@/components/NoProfile";
import { TechniqueCard } from "@/components/results/TechniqueCard";
import { ButtonLink, Card } from "@/components/ui";

export function ToolkitView() {
  const { profile, ready } = useProfile();

  if (!ready) return <LoadingShell />;
  if (!profile) return <NoProfile />;

  const techniques = profile.recommendedTechniqueIds
    .map((id) => TECHNIQUE_BY_ID[id])
    .filter(Boolean);

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 sm:py-14">
      <header className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">
          Your Study Toolkit
        </p>
        <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">
          Five methods, ranked for you
        </h1>
        <p className="mt-4 text-ink-soft">
          Research decides what works. Your persona determines which methods are
          most likely to fit the way you actually study.
        </p>
      </header>

      <div className="mt-10 space-y-4">
        {techniques.map((technique, index) => (
          <TechniqueCard
            key={technique.id}
            technique={technique}
            reasons={profile.reasons[technique.id] ?? []}
            rank={index + 1}
          />
        ))}
      </div>

      <Card className="mt-16 border-brand-100 bg-brand-50">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex-1">
            <h2 className="text-xl font-semibold">
              Turn these methods into a real week
            </h2>
            <p className="mt-1.5 text-sm text-ink-soft">
              Your current weekly plan uses your available hours, focus rhythm,
              and strongest method matches.
            </p>
          </div>
          <ButtonLink href="/plan" size="lg" className="shrink-0">
            Continue to Plan
            <ArrowRight className="size-4" aria-hidden />
          </ButtonLink>
        </div>
      </Card>
    </div>
  );
}
