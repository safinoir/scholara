"use client";

import { useState } from "react";
import {
  ArrowRight,
  CalendarCheck2,
  Check,
  Flame,
  Plus,
  Sparkles,
  Target,
  X,
} from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { recentDays, todayISO, useTracker } from "@/hooks/useTracker";
import { HABIT_BY_ID } from "@/lib/data/habits";
import { TECHNIQUE_BY_ID } from "@/lib/data/techniques";
import {
  habitFitForProfile,
  rankHabitSuggestions,
  type HabitFit,
} from "@/lib/habits";
import { canAccessToolkit, hasCompletedSchedule } from "@/lib/onboarding";
import { LoadingShell, NoProfile } from "@/components/NoProfile";
import {
  Badge,
  Button,
  ButtonLink,
  Card,
  SectionHeading,
  cn,
} from "@/components/ui";

function trackerDate(iso: string): Date {
  return new Date(`${iso}T12:00:00`);
}

function shortWeekday(iso: string): string {
  return new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(
    trackerDate(iso),
  );
}

function dateNumber(iso: string): string {
  return new Intl.DateTimeFormat(undefined, { day: "numeric" }).format(
    trackerDate(iso),
  );
}

function fullDate(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(trackerDate(iso));
}

function rangeLabel(days: string[]): string {
  const first = trackerDate(days[0]);
  const last = trackerDate(days[days.length - 1]);
  const sameMonth = first.getMonth() === last.getMonth();
  const firstLabel = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(first);
  const lastLabel = new Intl.DateTimeFormat(undefined, {
    month: sameMonth ? undefined : "short",
    day: "numeric",
  }).format(last);
  return `${firstLabel}–${lastLabel}`;
}

function fitBadge(fit: HabitFit) {
  const technique = fit.habit.techniqueId
    ? TECHNIQUE_BY_ID[fit.habit.techniqueId]
    : undefined;

  if (fit.supportsPlanMethod && technique) {
    return {
      label: `Used in your plan · ${technique.name}`,
      tone: "brand" as const,
    };
  }
  if (fit.supportsSelectedMethod && technique) {
    return {
      label: `Supports ${technique.name}`,
      tone: "brand" as const,
    };
  }
  if (fit.obstacleMatches.length > 0) {
    return {
      label:
        fit.obstacleMatches.length === 1
          ? "Fits one of your obstacles"
          : `Fits ${fit.obstacleMatches.length} of your obstacles`,
      tone: "neutral" as const,
    };
  }
  return null;
}

export function TrackerView() {
  const { profile, ready } = useProfile();
  const tracker = useTracker();
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [pendingRemovalId, setPendingRemovalId] = useState<string | null>(null);
  const today = tracker.today || todayISO();
  const days = recentDays(7, trackerDate(today));

  if (!ready || !tracker.ready) return <LoadingShell />;
  if (!profile) return <NoProfile />;

  const activeIds = tracker.logs.map((log) => log.habitId);
  const suggested = rankHabitSuggestions(profile, activeIds);
  const todayCompleted = tracker.logs.filter((log) =>
    log.completedDates.includes(today),
  ).length;
  const recentDateSet = new Set(days);
  const recentCheckIns = tracker.logs.reduce(
    (total, log) =>
      total + log.completedDates.filter((date) => recentDateSet.has(date)).length,
    0,
  );
  const bestActiveStreak = Math.max(
    0,
    ...tracker.logs.map((log) => tracker.stats[log.habitId]?.longest ?? 0),
  );
  const planReady = hasCompletedSchedule(profile);

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:py-14">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <SectionHeading
          as="h1"
          eyebrow="Weekly habits"
          title="Make your study approach stick"
          lead="Track up to three small habits that support your Methods and obstacles. A streak stays current when your last check-in was today or yesterday, so progress is not all-or-nothing."
        />
        {planReady && (
          <ButtonLink
            href="/plan"
            variant="secondary"
            className="shrink-0 self-start"
          >
            View weekly plan
            <ArrowRight className="size-4" aria-hidden />
          </ButtonLink>
        )}
      </div>

      {tracker.logs.length === 0 ? (
        <Card className="mt-8 border-brand-100 bg-brand-50">
          <div className="flex gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-brand-600 shadow-sm">
              <Sparkles className="size-5" aria-hidden />
            </span>
            <div>
              <h2 className="font-semibold">Start with one small win</h2>
              <p className="mt-1 text-sm text-ink-soft">
                Choose one habit below that feels realistic on a busy day. You can
                add up to three once the first one feels natural.
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <dl className="mt-8 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-line bg-surface p-5">
            <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-ink-faint">
              <Target className="size-4 text-brand-600" aria-hidden />
              Today
            </dt>
            <dd className="mt-2 text-2xl font-semibold">
              {todayCompleted}/{tracker.logs.length}
            </dd>
            <p className="mt-1 text-sm text-ink-soft">habits complete</p>
          </div>
          <div className="rounded-2xl border border-line bg-surface p-5">
            <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-ink-faint">
              <CalendarCheck2 className="size-4 text-brand-600" aria-hidden />
              Last 7 days
            </dt>
            <dd className="mt-2 text-2xl font-semibold">{recentCheckIns}</dd>
            <p className="mt-1 text-sm text-ink-soft">
              check-ins · {rangeLabel(days)}
            </p>
          </div>
          <div className="rounded-2xl border border-line bg-surface p-5">
            <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-ink-faint">
              <Flame className="size-4 text-brand-600" aria-hidden />
              Best active streak
            </dt>
            <dd className="mt-2 text-2xl font-semibold">{bestActiveStreak}</dd>
            <p className="mt-1 text-sm text-ink-soft">
              {bestActiveStreak === 1 ? "day" : "days"}
            </p>
          </div>
        </dl>
      )}

      {tracker.logs.length > 0 && (
        <section className="mt-10" aria-labelledby="active-habits-heading">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="active-habits-heading" className="text-xl font-semibold">
                Your habits
              </h2>
              <p className="mt-1 text-sm text-ink-soft">
                {todayCompleted} of {tracker.logs.length} complete today. You can
                also correct an earlier check-in.
              </p>
            </div>
            <p className="text-sm text-ink-faint">Showing {rangeLabel(days)}</p>
          </div>

          <ul className="mt-5 space-y-4">
            {tracker.logs.map((log) => {
              const habit = HABIT_BY_ID[log.habitId];
              if (!habit) return null;
              const stat = tracker.stats[log.habitId] ?? {
                current: 0,
                longest: 0,
              };
              const badge = fitBadge(habitFitForProfile(habit, profile));
              const streakLabel =
                stat.current > 0
                  ? `${stat.current} day streak`
                  : stat.longest > 0
                    ? "Streak paused"
                    : "No streak yet";

              return (
                <li key={log.habitId}>
                  <Card className="overflow-hidden">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold">{habit.label}</h3>
                        <p className="mt-1 text-sm text-ink-soft">{habit.why}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPendingRemovalId(log.habitId)}
                        aria-label={`Stop tracking: ${habit.label}`}
                        className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl text-ink-faint transition-colors hover:bg-line-soft hover:text-ink"
                      >
                        <X className="size-4" aria-hidden />
                      </button>
                    </div>

                    {pendingRemovalId === log.habitId && (
                      <div
                        className="mt-4 rounded-xl border border-line bg-line-soft p-4"
                        role="group"
                        aria-label={`Confirm stopping ${habit.label}`}
                      >
                        <p className="text-sm font-medium">
                          Stop tracking this habit?
                        </p>
                        <p className="mt-1 text-sm text-ink-soft">
                          Its check-in history will be removed from this device.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setPendingRemovalId(null)}
                          >
                            Keep habit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              tracker.removeHabit(log.habitId);
                              setPendingRemovalId(null);
                            }}
                          >
                            Stop tracking
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <Badge tone={stat.current > 0 ? "brand" : "neutral"}>
                        <Flame className="size-3.5" aria-hidden />
                        {streakLabel}
                      </Badge>
                      {stat.longest > 0 && (
                        <Badge>Best: {stat.longest} days</Badge>
                      )}
                      {badge && <Badge tone={badge.tone}>{badge.label}</Badge>}
                    </div>

                    <div className="-mx-1 mt-5 overflow-x-auto px-1 pb-1">
                      <div className="grid min-w-[27rem] grid-cols-7 gap-2">
                        {days.map((date) => {
                          const done = log.completedDates.includes(date);
                          const isToday = date === today;
                          const isFuture = date > today;
                          const dateLabel = fullDate(date);
                          return (
                            <button
                              key={date}
                              type="button"
                              disabled={isFuture}
                              onClick={() => tracker.toggleDay(log.habitId, date)}
                              aria-current={isToday ? "date" : undefined}
                              aria-pressed={done}
                              aria-label={`${habit.label}, ${dateLabel}: ${done ? "completed" : "not completed"}`}
                              className={cn(
                                "flex min-h-14 min-w-14 flex-col items-center justify-center rounded-xl border px-1 text-xs transition-colors disabled:opacity-40",
                                done
                                  ? "border-brand-500 bg-brand-500 text-white"
                                  : "border-line bg-surface text-ink-soft hover:border-brand-300 hover:bg-brand-50",
                                isToday &&
                                  !done &&
                                  "border-brand-300 bg-brand-50 ring-1 ring-brand-200",
                              )}
                            >
                              <span className="font-medium" aria-hidden>
                                {isToday ? "Today" : shortWeekday(date)}
                              </span>
                              <span
                                className={cn("mt-0.5", done && "font-semibold")}
                                aria-hidden
                              >
                                {done ? (
                                  <Check className="size-4" />
                                ) : (
                                  dateNumber(date)
                                )}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {tracker.daysTracked >= 14 && (
        <Card className="mt-8 border-brand-100 bg-brand-50">
          <h2 className="text-lg font-semibold">Your two-week check-in</h2>
          <p className="mt-1.5 max-w-2xl text-sm text-ink-soft">
            Look at what was realistic, then keep, swap, or simplify a habit.
            Review your Methods if your routine no longer fits how you are
            learning this term.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <ButtonLink
              href={canAccessToolkit(profile) ? "/toolkit" : "/persona"}
              size="sm"
            >
              {canAccessToolkit(profile)
                ? "Review Methods"
                : "Review your persona"}
            </ButtonLink>
            {planReady && (
              <ButtonLink href="/plan" variant="secondary" size="sm">
                Adjust weekly plan
              </ButtonLink>
            )}
          </div>
        </Card>
      )}

      <section className="mt-14" aria-labelledby="add-habit-heading">
        <h2 id="add-habit-heading" className="text-xl font-semibold">
          {tracker.logs.length === 0
            ? "Choose a habit for this week"
            : "Add another habit"}
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-ink-soft">
          {tracker.atCapacity
            ? "Three is the maximum, on purpose. Stop tracking one before adding another."
            : "Suggestions prioritize the Methods in your plan, the Methods you chose, and the obstacles you reported."}
        </p>

        {!tracker.atCapacity && (
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {suggested.map((fit) => {
              const badge = fitBadge(fit);
              return (
                <li key={fit.habit.id}>
                  <button
                    type="button"
                    onClick={() => tracker.addHabit(fit.habit.id)}
                    aria-label={`Add habit: ${fit.habit.label}`}
                    className="group flex min-h-24 w-full items-start gap-4 rounded-2xl border border-line bg-surface p-5 text-left transition-colors hover:border-brand-200 hover:bg-brand-50/40"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-100">
                      <Plus className="size-4" aria-hidden />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">
                        {fit.habit.label}
                      </span>
                      <span className="mt-1 block text-sm text-ink-soft">
                        {fit.habit.why}
                      </span>
                      {badge && (
                        <span className="mt-3 inline-flex">
                          <Badge tone={badge.tone}>{badge.label}</Badge>
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {tracker.logs.length > 0 && (
        <section
          className="mt-12 border-t border-line pt-8"
          aria-labelledby="tracker-data-heading"
        >
          <h2 id="tracker-data-heading" className="text-base font-semibold">
            Tracker data
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-ink-soft">
            Clearing removes only your tracked habits and check-ins. Your
            persona, Methods, recurring schedule, and weekly plan stay saved.
          </p>
          {confirmingClear ? (
            <div
              className="mt-4 rounded-xl border border-line bg-surface p-4"
              role="group"
              aria-label="Confirm clearing tracker data"
            >
              <p className="text-sm font-medium">
                Clear every habit and check-in?
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setConfirmingClear(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    tracker.clearAll();
                    setConfirmingClear(false);
                  }}
                >
                  Confirm clear
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="mt-3"
              onClick={() => setConfirmingClear(true)}
            >
              Clear tracking history
            </Button>
          )}
        </section>
      )}
    </div>
  );
}
