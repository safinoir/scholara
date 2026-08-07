"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { Check, Copy, Printer, Sparkles } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { coachingPayload } from "@/lib/ai/payload";
import { TECHNIQUE_BY_ID } from "@/lib/data/techniques";
import { buildWeeklyPlan, formatHour, rankTechniques } from "@/lib/engine";
import {
  DAYS,
  type BlockIntensity,
  type Day,
  type LearnerProfile,
  type PlanBlock,
  type PlanCoaching,
  type WeekContext,
} from "@/lib/types";
import { LoadingShell, NoProfile } from "@/components/NoProfile";
import { AskCoach } from "@/components/plan/AskCoach";
import { CoachPanel } from "@/components/plan/CoachPanel";
import { WeekTuner } from "@/components/plan/WeekTuner";
import { Badge, Button, ButtonLink, Card, SectionHeading, cn } from "@/components/ui";

const INTENSITY_STYLE: Record<BlockIntensity, string> = {
  deep: "border-brand-200 bg-brand-50",
  review: "border-teal-200 bg-teal-50",
  admin: "border-slate-200 bg-slate-50",
};

const INTENSITY_LABEL: Record<BlockIntensity, string> = {
  deep: "Deep work",
  review: "Review",
  admin: "Planning",
};

function formatMinutes(total: number) {
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} hr`;
  return `${hours} hr ${minutes} min`;
}

export function PlanView() {
  const { profile, ready, setProfile } = useProfile();
  const [copied, setCopied] = useState(false);
  const [hoursDraft, setHoursDraft] = useState<number | null>(null);
  const [coachBusy, setCoachBusy] = useState(false);

  const plan = profile?.plan;

  /**
   * Coaching is fetched on demand, never on page load. The plan is already
   * complete without it, and an unprompted network call on every visit would
   * break the "works offline after load" promise.
   */
  const fetchCoaching = useCallback(
    async (target: LearnerProfile) => {
      setCoachBusy(true);
      try {
        const response = await fetch("/api/plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(coachingPayload(target)),
        });
        if (!response.ok) return;
        const coaching = (await response.json()) as PlanCoaching;
        if (typeof coaching?.brief === "string") {
          setProfile({ ...target, coaching });
        }
      } catch {
        // The plan stands on its own; a failed call simply shows no coaching.
      } finally {
        setCoachBusy(false);
      }
    },
    [setProfile],
  );

  const byDay = useMemo(() => {
    const map = new Map<Day, PlanBlock[]>();
    if (!plan) return map;
    for (const day of DAYS) {
      const blocks = plan.blocks.filter((b) => b.day === day);
      if (blocks.length > 0) map.set(day, blocks);
    }
    return map;
  }, [plan]);

  if (!ready) return <LoadingShell />;
  if (!profile || !plan) return <NoProfile />;

  const hours = hoursDraft ?? profile.context.hoursPerWeek;

  /** Rebuilds the plan deterministically, then asks the coach to narrate it. */
  const rebuild = (options: {
    hoursPerWeek?: number;
    week?: WeekContext;
    coach: boolean;
  }) => {
    const context = {
      ...profile.context,
      hoursPerWeek: options.hoursPerWeek ?? profile.context.hoursPerWeek,
    };
    const week = "week" in options ? options.week : profile.weekContext;

    const techniques = rankTechniques({
      axes: profile.axes,
      frictions: profile.frictions,
      context,
      primary: profile.match.primary,
    });
    const nextPlan = buildWeeklyPlan({
      axes: profile.axes,
      frictions: profile.frictions,
      context,
      techniques,
      week,
    });

    // Old coaching describes a plan that no longer exists, so it's dropped.
    const next: LearnerProfile = {
      ...profile,
      context,
      plan: nextPlan,
      weekContext: week,
      coaching: undefined,
    };

    setProfile(next);
    setHoursDraft(null);
    if (options.coach) void fetchCoaching(next);
  };

  const coaching = profile.coaching ?? null;
  const blockNotes = coaching?.blockNotes ?? {};

  const asText = () => {
    const lines = ["My Scholara week", ""];
    for (const [day, blocks] of byDay) {
      lines.push(day.toUpperCase());
      for (const block of blocks) {
        const time = plan.flexible ? "anytime" : formatHour(block.start);
        lines.push(
          `  ${time} · ${block.minutes} min · ${block.label} — ${block.note}`,
        );
      }
      lines.push("");
    }
    lines.push(`Total: ${formatMinutes(plan.totalMinutes)} per week`);
    return lines.join("\n");
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(asText());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SectionHeading
          eyebrow="Your week"
          title={
            plan.minimumEffectiveDose
              ? "Minimum effective dose"
              : "The week we'd build for you"
          }
          lead={
            plan.minimumEffectiveDose
              ? "You told us time is genuinely scarce, so this is stripped to what matters most. Three real sessions beat a schedule you ignore."
              : "Built from your available hours and your peak focus window. Deliberately not full."
          }
        />
        <div className="no-print flex gap-2">
          <Button variant="secondary" size="sm" onClick={copy}>
            {copied ? (
              <>
                <Check className="size-4" aria-hidden />
                Copied
              </>
            ) : (
              <>
                <Copy className="size-4" aria-hidden />
                Copy as text
              </>
            )}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => window.print()}>
            <Printer className="size-4" aria-hidden />
            Print
          </Button>
        </div>
      </div>

      <div className="mt-7 flex flex-wrap gap-2">
        <Badge tone="brand">
          {formatMinutes(plan.totalMinutes)} scheduled
        </Badge>
        <Badge>of {formatMinutes(plan.budgetMinutes)} available</Badge>
        {plan.flexible && <Badge tone="tier">Flexible anchors</Badge>}
        {plan.minimumEffectiveDose && <Badge tone="tier">Time-scarce mode</Badge>}
      </div>

      {/* Grid */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...byDay].map(([day, blocks]) => (
          <div
            key={day}
            className="print-break-avoid rounded-2xl border border-line bg-surface p-5"
          >
            <h3 className="text-sm font-semibold uppercase tracking-[0.1em] text-ink-faint">
              {day}
            </h3>
            <ul className="mt-4 space-y-3">
              {blocks.map((block) => {
                const technique = TECHNIQUE_BY_ID[block.techniqueId];
                return (
                  <li
                    key={block.id}
                    className={cn(
                      "rounded-xl border p-4",
                      INTENSITY_STYLE[block.intensity],
                    )}
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-sm font-semibold">{block.label}</span>
                      <span className="shrink-0 text-xs text-ink-soft">
                        {block.minutes} min
                      </span>
                    </div>
                    <p className="mt-1 text-xs font-medium text-ink-faint">
                      {plan.flexible
                        ? INTENSITY_LABEL[block.intensity]
                        : `${formatHour(block.start)} · ${INTENSITY_LABEL[block.intensity]}`}
                    </p>
                    <p className="mt-2.5 text-sm leading-relaxed text-ink-soft">
                      {block.note}
                    </p>
                    {technique && (
                      <Link
                        href="/results"
                        className="mt-2.5 inline-block text-xs text-brand-700 underline hover:text-brand-600"
                      >
                        {technique.name}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* Why */}
      <Card className="mt-10">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Sparkles className="size-4.5 text-brand-600" aria-hidden />
          Why this week looks like this
        </h2>
        <ul className="mt-4 space-y-3">
          {plan.rationale.map((line) => (
            <li key={line} className="flex gap-3 text-sm leading-relaxed text-ink-soft">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-500" aria-hidden />
              {line}
            </li>
          ))}
        </ul>
      </Card>

      {/* Regenerate */}
      <Card className="no-print mt-6">
        <h2 className="text-lg font-semibold">Your hours changed?</h2>
        <p className="mt-1.5 text-sm text-ink-soft">
          Slide to the number you actually have this week and we&rsquo;ll rebuild
          the plan around it.
        </p>
        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center">
          <label htmlFor="hours" className="sr-only">
            Study hours available per week
          </label>
          <input
            id="hours"
            type="range"
            min={2}
            max={40}
            value={hours}
            onChange={(e) => setHoursDraft(Number(e.target.value))}
            className="w-full accent-brand-600 sm:max-w-sm"
          />
          <span className="text-sm font-medium tabular-nums">{hours} hrs/week</span>
          <Button
            onClick={regenerate}
            disabled={hours === profile.context.hoursPerWeek}
            className="sm:ml-auto"
          >
            Rebuild plan
          </Button>
        </div>
      </Card>

      <div className="no-print mt-10 flex flex-wrap gap-3">
        <ButtonLink href="/tracker" size="lg">
          Track a habit from this plan
        </ButtonLink>
        <ButtonLink href="/resources" variant="secondary" size="lg">
          Free tools for these techniques
        </ButtonLink>
      </div>
    </div>
  );
}
