"use client";

import Link from "next/link";
import { ArrowRight, RotateCcw } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { ARCHETYPE_BY_ID } from "@/lib/data/archetypes";
import { TECHNIQUE_BY_ID } from "@/lib/data/techniques";
import { ArchetypeIcon } from "@/components/ArchetypeIcon";
import { AxisBars } from "./AxisBars";
import { TechniqueCard } from "./TechniqueCard";
import { ShareButton } from "./ShareButton";
import { CoachNote } from "./CoachNote";
import { LoadingShell, NoProfile } from "@/components/NoProfile";
import { Badge, ButtonLink, Card, SectionHeading } from "@/components/ui";

export function ResultsView() {
  const { profile, ready } = useProfile();

  if (!ready) return <LoadingShell />;
  if (!profile) return <NoProfile />;

  const primary = ARCHETYPE_BY_ID[profile.match.primary];
  const secondary = ARCHETYPE_BY_ID[profile.match.secondary];
  const blended = profile.match.confidence < 0.35;

  const techniques = profile.techniqueIds
    .map((id) => TECHNIQUE_BY_ID[id])
    .filter(Boolean);

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 sm:py-14">
      {/* Archetype reveal */}
      <div className="animate-rise">
        <p className="text-sm text-ink-faint">Your starting point</p>
        <div
          className="mt-4 overflow-hidden rounded-3xl border p-7 sm:p-9"
          style={{
            borderColor: `${primary.accent}33`,
            backgroundColor: `${primary.accent}0a`,
          }}
        >
          <div className="flex items-start gap-5">
            <span
              className="flex size-14 shrink-0 items-center justify-center rounded-2xl text-white"
              style={{ backgroundColor: primary.accent }}
            >
              <ArchetypeIcon name={primary.icon} className="size-7" />
            </span>
            <div>
              <h1 className="text-3xl font-semibold sm:text-4xl">
                {primary.name}
              </h1>
              <p className="mt-1 text-lg text-ink-soft">{primary.tagline}</p>
            </div>
          </div>

          <p className="mt-6 max-w-2xl leading-relaxed">{primary.description}</p>

          {blended && (
            <p className="mt-5 rounded-xl border border-line bg-surface/70 p-4 text-sm text-ink-soft">
              You&rsquo;re a genuine blend &mdash; you also lean strongly toward{" "}
              <Link href="/about" className="font-medium text-ink underline">
                {secondary.name}
              </Link>
              . Read both, and take whichever advice sounds more like your week.
            </p>
          )}

          <div className="mt-7 grid gap-6 sm:grid-cols-2">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-faint">
                What works for you
              </h2>
              <ul className="mt-3 space-y-2">
                {primary.strengths.map((item) => (
                  <li key={item} className="flex gap-2.5 text-sm text-ink-soft">
                    <span
                      className="mt-1.5 size-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: primary.accent }}
                      aria-hidden
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-faint">
                Where you tend to slip
              </h2>
              <ul className="mt-3 space-y-2">
                {primary.watchOuts.map((item) => (
                  <li key={item} className="flex gap-2.5 text-sm text-ink-soft">
                    <span
                      className="mt-1.5 size-1.5 shrink-0 rounded-full bg-ink-faint"
                      aria-hidden
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <p className="mt-7 text-sm text-ink-faint">
            This is a starting point, not a label. Retake the quiz any time your
            term or workload changes.
          </p>
        </div>
      </div>

      <CoachNote profile={profile} />

      {/* Axes */}
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

      {/* Techniques */}
      <section className="mt-16">
        <SectionHeading
          eyebrow="Your techniques"
          title="Five methods, ranked for you"
          lead="Chosen by research on what works, then filtered by what fits how you operate. Every card shows how strong the evidence is."
        />
        <div className="mt-8 space-y-4">
          {techniques.map((technique, index) => (
            <TechniqueCard
              key={technique.id}
              technique={technique}
              reasons={profile.reasons[technique.id] ?? []}
              rank={index + 1}
            />
          ))}
        </div>
      </section>

      {/* Next */}
      <Card className="mt-16 border-brand-100 bg-brand-50">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex-1">
            <h2 className="text-xl font-semibold">
              Now turn it into an actual week
            </h2>
            <p className="mt-1.5 text-sm text-ink-soft">
              We&rsquo;ll build a schedule from the{" "}
              {profile.context.hoursPerWeek} hours you said you had, in your peak
              focus window.
            </p>
          </div>
          <ButtonLink href="/plan" size="lg" className="shrink-0">
            Build my week
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
    </div>
  );
}
