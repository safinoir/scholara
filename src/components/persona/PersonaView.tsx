"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, RefreshCw, RotateCcw } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { ARCHETYPE_BY_ID } from "@/lib/data/archetypes";
import { changePersona } from "@/lib/engine";
import { effectiveArchetypeMatch } from "@/lib/persona";
import { LoadingShell, NoProfile } from "@/components/NoProfile";
import { PersonaDetailsCard } from "@/components/persona/PersonaDetailsCard";
import { PersonaPickerDialog } from "@/components/persona/PersonaPickerDialog";
import { AxisBars } from "@/components/results/AxisBars";
import { ShareButton } from "@/components/results/ShareButton";
import { Badge, ButtonLink, Card, SectionHeading } from "@/components/ui";

export function PersonaView() {
  const { profile, ready, setProfile } = useProfile();
  const [pickerOpen, setPickerOpen] = useState(false);

  if (!ready) return <LoadingShell />;
  if (!profile) return <NoProfile />;

  const effectiveMatch = effectiveArchetypeMatch(profile);
  const primary = ARCHETYPE_BY_ID[effectiveMatch.primary];
  const secondary = ARCHETYPE_BY_ID[effectiveMatch.secondary];
  const blended = !effectiveMatch.overridden && effectiveMatch.confidence < 0.35;

  const continueToToolkit = () => {
    if (profile.onboardingStage !== "persona") return;
    setProfile({ ...profile, onboardingStage: "toolkit" });
  };

  const selectPersona = (personaId: typeof effectiveMatch.primary) => {
    setProfile(
      changePersona(
        profile,
        personaId === profile.match.primary ? null : personaId,
      ),
    );
    setPickerOpen(false);
  };

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 sm:py-14">
      <div className="animate-rise">
        <p className="text-sm text-ink-faint">Your starting point</p>
        <PersonaDetailsCard
          archetype={primary}
          headingLevel="h1"
          className="mt-4"
          notice={
            blended ? (
              <p className="mt-5 rounded-xl border border-line bg-surface/70 p-4 text-sm text-ink-soft">
                You&rsquo;re a genuine blend &mdash; you also lean strongly toward{" "}
                <Link href="/about#personas" className="font-medium text-ink underline">
                  {secondary.name}
                </Link>
                . Read both, and take whichever advice sounds more like your week.
              </p>
            ) : effectiveMatch.overridden ? (
              <p className="mt-5 rounded-xl border border-line bg-surface/70 p-4 text-sm text-ink-soft">
                You chose this persona yourself. Your six-axis profile still
                reflects the answers you gave, so the planning details remain
                intact.
              </p>
            ) : undefined
          }
          footer={
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-ink-faint">
                This is a starting point, not a label. Retake the quiz any time
                your term or workload changes.
              </p>
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="inline-flex min-h-11 shrink-0 items-center gap-2 self-start rounded-lg text-sm font-semibold text-brand-700 underline underline-offset-4 hover:text-brand-600 sm:self-auto"
              >
                <RefreshCw className="size-4" aria-hidden="true" />
                Change your persona
              </button>
            </div>
          }
        />
      </div>

      <section className="mt-16">
        <SectionHeading
          eyebrow="Your profile"
          title="The six things we measured"
          lead="These aren't learning styles. They're the conditions that predict whether a routine survives contact with your actual week."
        />
        <Card className="mt-8">
          <AxisBars axes={profile.axes} />
        </Card>
      </section>

      <Card className="mt-16 border-brand-100 bg-brand-50">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-700">
              Next step
            </p>
            <h2 className="mt-2 text-xl font-semibold">
              Build your Study Toolkit
            </h2>
            <p className="mt-1.5 text-sm text-ink-soft">
              See the five methods that best fit this profile, then explore how
              each one works.
            </p>
          </div>
          <ButtonLink
            href="/toolkit"
            size="lg"
            className="shrink-0"
            onClick={continueToToolkit}
          >
            Continue to Toolkit
            <ArrowRight className="size-4" aria-hidden />
          </ButtonLink>
        </div>
      </Card>

      <div className="mt-10 flex flex-wrap items-center gap-4 text-sm">
        <Badge>
          {profile.frictions.length} obstacle
          {profile.frictions.length === 1 ? "" : "s"} accounted for
        </Badge>
        <ShareButton profile={profile} />
        <Link
          href="/quiz"
          className="inline-flex items-center gap-1.5 text-ink-soft underline hover:text-ink"
        >
          <RotateCcw className="size-3.5" aria-hidden />
          Retake the quiz
        </Link>
      </div>

      {pickerOpen && (
        <PersonaPickerDialog
          currentId={effectiveMatch.primary}
          naturalId={profile.match.primary}
          onClose={() => setPickerOpen(false)}
          onConfirm={selectPersona}
        />
      )}
    </div>
  );
}
