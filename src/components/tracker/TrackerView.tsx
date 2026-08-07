"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Check, Flame, Plus, X } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { recentDays, todayISO, useTracker } from "@/hooks/useTracker";
import { HABITS, HABIT_BY_ID } from "@/lib/data/habits";
import { LoadingShell, NoProfile } from "@/components/NoProfile";
import { Badge, Button, Card, SectionHeading, cn } from "@/components/ui";

const DAY_INITIALS = ["S", "M", "T", "W", "T", "F", "S"];

function dayLabel(iso: string) {
  return DAY_INITIALS[new Date(`${iso}T12:00:00`).getDay()];
}

export function TrackerView() {
  const { profile, ready } = useProfile();
  const tracker = useTracker();
  const days = useMemo(() => recentDays(7), []);
  const today = todayISO();

  if (!ready || !tracker.ready) return <LoadingShell />;
  if (!profile) return <NoProfile />;

  // Habits that address obstacles the student actually reported come first.
  const suggested = [...HABITS]
    .sort((a, b) => {
      const relevance = (h: typeof a) =>
        h.frictions.filter((f) => profile.frictions.includes(f)).length;
      return relevance(b) - relevance(a);
    })
    .filter((h) => !tracker.logs.some((l) => l.habitId === h.id));

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 sm:py-14">
      <SectionHeading
        eyebrow="Tracker"
        title="One or two habits. That's the whole trick."
        lead="Pick up to three small things and check them off for two weeks. Miss a day and the streak pauses — it doesn't die."
      />

      {tracker.logs.length === 0 && (
        <Card className="mt-8 border-brand-100 bg-brand-50">
          <p className="text-sm text-ink-soft">
            Nothing tracked yet. Choose one habit below &mdash; genuinely one, not
            five. The students who keep this up start smaller than feels
            worthwhile.
          </p>
        </Card>
      )}

      {/* Active habits */}
      {tracker.logs.length > 0 && (
        <ul className="mt-8 space-y-4">
          {tracker.logs.map((log) => {
            const habit = HABIT_BY_ID[log.habitId];
            if (!habit) return null;
            const stat = tracker.stats[log.habitId] ?? { current: 0, longest: 0 };

            return (
              <li key={log.habitId}>
                <Card>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold">{habit.label}</h3>
                      <p className="mt-1 text-sm text-ink-soft">{habit.why}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => tracker.removeHabit(log.habitId)}
                      aria-label={`Stop tracking: ${habit.label}`}
                      className="rounded-lg p-2 text-ink-faint hover:bg-line-soft hover:text-ink"
                    >
                      <X className="size-4" aria-hidden />
                    </button>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <Badge tone={stat.current > 0 ? "brand" : "neutral"}>
                      <Flame className="size-3.5" aria-hidden />
                      {stat.current > 0
                        ? `${stat.current} day streak`
                        : "Streak paused"}
                    </Badge>
                    {stat.longest > 0 && <Badge>Best: {stat.longest} days</Badge>}
                  </div>

                  <div className="mt-5 flex gap-2">
                    {days.map((date) => {
                      const done = log.completedDates.includes(date);
                      const isToday = date === today;
                      const isFuture = date > today;
                      return (
                        <button
                          key={date}
                          type="button"
                          disabled={isFuture}
                          onClick={() => tracker.toggleDay(log.habitId, date)}
                          aria-pressed={done}
                          aria-label={`${habit.label} on ${date}`}
                          className={cn(
                            "flex h-12 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl border text-xs transition-colors disabled:opacity-40",
                            done
                              ? "border-brand-500 bg-brand-500 text-white"
                              : "border-line bg-surface text-ink-faint hover:border-brand-200",
                            isToday && !done && "border-brand-300 ring-1 ring-brand-200",
                          )}
                        >
                          <span aria-hidden>{dayLabel(date)}</span>
                          {done && <Check className="size-3.5" aria-hidden />}
                        </button>
                      );
                    })}
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      {/* Re-assessment prompt */}
      {tracker.daysTracked >= 14 && (
        <Card className="mt-8 border-brand-100 bg-brand-50">
          <h2 className="text-lg font-semibold">
            You&rsquo;ve been at this two weeks
          </h2>
          <p className="mt-1.5 text-sm text-ink-soft">
            Good time to re-assess. Your obstacles may have changed, and the plan
            should change with them.
          </p>
          <Link
            href="/quiz"
            className="mt-4 inline-block text-sm font-medium text-brand-700 underline hover:text-brand-600"
          >
            Retake the quiz
          </Link>
        </Card>
      )}

      {/* Add habits */}
      <section className="mt-14">
        <h2 className="text-xl font-semibold">
          {tracker.logs.length === 0 ? "Pick one to start" : "Add another"}
        </h2>
        {tracker.atCapacity ? (
          <p className="mt-2 text-sm text-ink-soft">
            Three is the maximum, on purpose. Drop one before adding another.
          </p>
        ) : (
          <p className="mt-2 text-sm text-ink-soft">
            Sorted by how closely they match the obstacles you told us about.
          </p>
        )}

        {!tracker.atCapacity && (
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {suggested.map((habit) => {
              const matches = habit.frictions.filter((f) =>
                profile.frictions.includes(f),
              ).length;
              return (
                <li key={habit.id}>
                  <button
                    type="button"
                    onClick={() => tracker.addHabit(habit.id)}
                    className="flex h-full w-full items-start gap-3 rounded-2xl border border-line bg-surface p-5 text-left transition-colors hover:border-brand-200 hover:bg-brand-50/40"
                  >
                    <Plus className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden />
                    <span>
                      <span className="block text-sm font-medium">
                        {habit.label}
                      </span>
                      <span className="mt-1 block text-sm text-ink-faint">
                        {habit.why}
                      </span>
                      {matches > 0 && (
                        <span className="mt-2.5 inline-flex">
                          <Badge tone="brand">Targets your obstacles</Badge>
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

      <div className="mt-12">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            for (const log of tracker.logs) tracker.removeHabit(log.habitId);
          }}
          disabled={tracker.logs.length === 0}
        >
          Clear all tracking
        </Button>
      </div>
    </div>
  );
}
