"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { Check, Copy, Minus, Plus, Printer, Sparkles } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { coachingPayload } from "@/lib/ai/payload";
import { TECHNIQUE_BY_ID } from "@/lib/data/techniques";
import { buildWeeklyPlan, formatHour, rankTechniques } from "@/lib/engine";
import {
  hasConfirmedToolkit,
  hasCompletedSchedule,
  resumeDestination,
} from "@/lib/onboarding";
import {
  DAYS,
  type BlockIntensity,
  type Day,
  type PlanBlock,
  type PlanCoaching,
  type PlannedLearnerProfile,
  type WeekPlan,
  type WeekContext,
} from "@/lib/types";
import { LoadingShell, NoProfile } from "@/components/NoProfile";
import { OnboardingGate } from "@/components/OnboardingGate";
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

const HOUR_PRESETS = [4, 8, 12, 20, 40] as const;

function formatMinutes(total: number) {
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} hr`;
  return `${hours} hr ${minutes} min`;
}

function clampHours(hours: number) {
  return Math.min(40, Math.max(2, Math.round(hours)));
}

function minutesByIntensity(plan: WeekPlan, intensity: BlockIntensity) {
  return plan.blocks
    .filter((block) => block.intensity === intensity)
    .reduce((sum, block) => sum + block.minutes, 0);
}

function planSignature(plan: WeekPlan) {
  return plan.blocks
    .map((block) =>
      [
        block.day,
        block.start,
        block.minutes,
        block.label,
        block.techniqueId,
        block.intensity,
      ].join(":"),
    )
    .join("|");
}

function ScheduleSetupRequired() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16 sm:py-20">
      <Card>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">
          Weekly Plan
        </p>
        <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">
          Add your real week before we build it
        </h1>
        <p className="mt-4 max-w-2xl text-ink-soft">
          Your persona and Study Toolkit are saved. Next, you&rsquo;ll add your
          courses, recurring class times, and the windows when you can
          realistically study. Scholara will not create a schedule until you
          confirm those constraints.
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/toolkit" variant="secondary">
            Review your toolkit
          </ButtonLink>
          <ButtonLink href="/persona" variant="ghost">
            Review your persona
          </ButtonLink>
        </div>
      </Card>
    </div>
  );
}

export function PlanView() {
  const { profile, ready, setProfile } = useProfile();
  const [copied, setCopied] = useState(false);
  const [hoursDraft, setHoursDraft] = useState<number | null>(null);
  const [coachBusy, setCoachBusy] = useState(false);

  const storedPlan = profile?.plan;

  /**
   * Coaching is fetched on demand, never on page load. The plan is already
   * complete without it, and an unprompted network call on every visit would
   * break the "works offline after load" promise.
   */
  const fetchCoaching = useCallback(
    async (target: PlannedLearnerProfile) => {
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
    if (!storedPlan) return map;
    for (const day of DAYS) {
      const blocks = storedPlan.blocks.filter((b) => b.day === day);
      if (blocks.length > 0) map.set(day, blocks);
    }
    return map;
  }, [storedPlan]);

  if (!ready) return <LoadingShell />;
  if (!profile) return <NoProfile />;
  if (!hasConfirmedToolkit(profile)) {
    const destination = resumeDestination(profile);
    return (
      <OnboardingGate
        title="Finish your study setup first"
        body="Review your persona and save at least one study method before building your weekly plan."
        href={destination.href}
        action={destination.label}
      />
    );
  }
  if (!hasCompletedSchedule(profile)) return <ScheduleSetupRequired />;
  const plan = profile.plan;

  const hours = hoursDraft ?? profile.context.hoursPerWeek;
  const previewContext = { ...profile.context, hoursPerWeek: hours };
  const previewPlan = buildWeeklyPlan({
    axes: profile.axes,
    frictions: profile.frictions,
    context: previewContext,
    techniques: rankTechniques({
      axes: profile.axes,
      frictions: profile.frictions,
      context: previewContext,
      primary: profile.match.primary,
    }),
    week: profile.weekContext,
  });
  const hasPlanChanges =
    hours !== profile.context.hoursPerWeek ||
    planSignature(previewPlan) !== planSignature(plan);
  const previewBudget = hours * 60;
  const previewDeep = minutesByIntensity(previewPlan, "deep");
  const previewReview = minutesByIntensity(previewPlan, "review");
  const previewAdmin = minutesByIntensity(previewPlan, "admin");
  const previewBuffer = Math.max(0, previewBudget - previewPlan.totalMinutes);
  const previewDays = new Set(previewPlan.blocks.map((block) => block.day)).size;

  const setCapacity = (next: number) => setHoursDraft(clampHours(next));

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
    const next: PlannedLearnerProfile = {
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
          `  ${time} · ${block.minutes} min · ${block.label} — ${blockNotes[block.id] ?? block.note}`,
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

      <Card className="no-print mt-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Plan your weekly capacity</h2>
            <p id="capacity-help" className="mt-1.5 max-w-2xl text-sm text-ink-soft">
              Choose the time you can realistically protect. The preview updates
              immediately; nothing is saved until you apply it.
            </p>
          </div>
          <output
            htmlFor="weekly-hours weekly-hours-number"
            className="text-2xl font-semibold tabular-nums text-brand-700"
          >
            {hours} hours
          </output>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              aria-label="Remove one available hour"
              onClick={() => setCapacity(hours - 1)}
              disabled={coachBusy || hours <= 2}
              className="px-3"
            >
              <Minus className="size-4" aria-hidden />
            </Button>
            <label htmlFor="weekly-hours-number" className="sr-only">
              Available study hours per week
            </label>
            <input
              id="weekly-hours-number"
              type="number"
              min={2}
              max={40}
              step={1}
              value={hours}
              onChange={(event) => setCapacity(Number(event.target.value))}
              disabled={coachBusy}
              aria-describedby="capacity-help"
              className="min-h-11 w-20 rounded-xl border border-line bg-surface px-3 text-center font-medium tabular-nums outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              aria-label="Add one available hour"
              onClick={() => setCapacity(hours + 1)}
              disabled={coachBusy || hours >= 40}
              className="px-3"
            >
              <Plus className="size-4" aria-hidden />
            </Button>
          </div>

          <div>
            <label htmlFor="weekly-hours" className="sr-only">
              Available study hours per week
            </label>
            <input
              id="weekly-hours"
              type="range"
              min={2}
              max={40}
              step={1}
              value={hours}
              onChange={(event) => setCapacity(Number(event.target.value))}
              disabled={coachBusy}
              aria-describedby="capacity-help"
              aria-valuetext={`${hours} hours per week`}
              className="w-full accent-brand-600"
            />
            <div className="mt-1 flex justify-between text-xs text-ink-faint">
              <span>2 hours</span>
              <span>40 hours</span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2" aria-label="Hour presets">
          {HOUR_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setCapacity(preset)}
              disabled={coachBusy}
              aria-pressed={hours === preset}
              className={cn(
                "min-h-11 rounded-xl border px-3 text-sm transition-colors disabled:opacity-45",
                hours === preset
                  ? "border-brand-500 bg-brand-50 font-medium text-brand-700"
                  : "border-line bg-surface text-ink-soft hover:bg-line-soft",
              )}
            >
              {preset}h
            </button>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4" aria-live="polite">
          <div className="rounded-xl bg-line-soft p-3">
            <p className="text-xs text-ink-faint">Scheduled</p>
            <p className="mt-1 font-semibold tabular-nums">
              {formatMinutes(previewPlan.totalMinutes)}
            </p>
          </div>
          <div className="rounded-xl bg-line-soft p-3">
            <p className="text-xs text-ink-faint">Study windows</p>
            <p className="mt-1 font-semibold tabular-nums">
              {previewPlan.blocks.length}
            </p>
          </div>
          <div className="rounded-xl bg-line-soft p-3">
            <p className="text-xs text-ink-faint">Active days</p>
            <p className="mt-1 font-semibold tabular-nums">{previewDays}</p>
          </div>
          <div className="rounded-xl bg-line-soft p-3">
            <p className="text-xs text-ink-faint">Protected buffer</p>
            <p className="mt-1 font-semibold tabular-nums">
              {formatMinutes(previewBuffer)}
            </p>
          </div>
        </div>

        <div
          role="img"
          aria-label={`${formatMinutes(previewDeep)} deep work, ${formatMinutes(previewReview)} review, ${formatMinutes(previewAdmin)} planning, and ${formatMinutes(previewBuffer)} buffer`}
          className="mt-5 flex h-3 overflow-hidden rounded-full bg-line-soft"
        >
          <span
            className="bg-brand-500"
            style={{ width: `${(previewDeep / previewBudget) * 100}%` }}
          />
          <span
            className="bg-teal-500"
            style={{ width: `${(previewReview / previewBudget) * 100}%` }}
          />
          <span
            className="bg-slate-400"
            style={{ width: `${(previewAdmin / previewBudget) * 100}%` }}
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-ink-soft">
          <span><span className="mr-1.5 inline-block size-2 rounded-full bg-brand-500" />Deep {formatMinutes(previewDeep)}</span>
          <span><span className="mr-1.5 inline-block size-2 rounded-full bg-teal-500" />Review {formatMinutes(previewReview)}</span>
          <span><span className="mr-1.5 inline-block size-2 rounded-full bg-slate-400" />Planning {formatMinutes(previewAdmin)}</span>
          <span><span className="mr-1.5 inline-block size-2 rounded-full bg-line" />Buffer {formatMinutes(previewBuffer)}</span>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <p className="text-sm text-ink-soft">
            {hours !== profile.context.hoursPerWeek
              ? `Your saved plan will change from ${profile.context.hoursPerWeek} to ${hours} hours.`
              : hasPlanChanges
                ? "A capacity-based update is ready for your current hours."
                : "This is your current saved capacity."}
          </p>
          <Button
            onClick={() => rebuild({ hoursPerWeek: hours, coach: true })}
            disabled={coachBusy || !hasPlanChanges}
            className="w-full sm:ml-auto sm:w-auto"
          >
            {coachBusy ? "Applying…" : `Apply ${hours}-hour plan`}
          </Button>
        </div>
      </Card>

      <CoachPanel
        coaching={coaching}
        busy={coachBusy}
        onRefresh={() => void fetchCoaching(profile)}
      />

      {/* Grid */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DAYS.map((day) => {
          const blocks = byDay.get(day) ?? [];
          const dayMinutes = blocks.reduce((sum, block) => sum + block.minutes, 0);
          return (
            <div
              key={day}
              className="print-break-avoid rounded-2xl border border-line bg-surface p-5"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold uppercase tracking-[0.1em] text-ink-faint">
                  {day}
                </h3>
                {dayMinutes > 0 && (
                  <span className="text-xs tabular-nums text-ink-faint">
                    {formatMinutes(dayMinutes)}
                  </span>
                )}
              </div>
              {blocks.length === 0 ? (
                <p className="mt-4 text-sm text-ink-faint">Buffer day — no blocks.</p>
              ) : (
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
                          {blockNotes[block.id] ?? block.note}
                        </p>
                        {technique && (
                          <Link
                            href={`/toolkit#technique-${technique.id}`}
                            className="mt-2.5 inline-block text-xs text-brand-700 underline hover:text-brand-600"
                          >
                            {technique.name}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
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

      <WeekTuner
        week={profile.weekContext}
        onApply={(week) => rebuild({ week, coach: true })}
        onClear={() => rebuild({ week: undefined, coach: true })}
        busy={coachBusy}
      />

      <AskCoach profile={profile} />

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
