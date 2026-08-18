"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CalendarClock,
  Check,
  Copy,
  MoreHorizontal,
  Pencil,
  SlidersHorizontal,
  Sparkles,
  Undo2,
} from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { FRICTION_BY_ID } from "@/lib/data/axes";
import { TECHNIQUE_BY_ID } from "@/lib/data/techniques";
import { calculateScheduleCapacity } from "@/lib/engine";
import {
  hasCompletedSchedule,
  hasConfirmedToolkit,
  resumeDestination,
} from "@/lib/onboarding";
import { buildPlanForProfile } from "@/lib/plan";
import type {
  Day,
  LearnerProfile,
  PlanBlock,
  ScheduledLearnerProfile,
  WeekContext,
  WeekPlan,
} from "@/lib/types";
import {
  diffWeekPlans,
  formatWeekRange,
  isCurrentWeek,
  startCurrentWeek,
  weekDateForDay,
} from "@/lib/week";
import { LoadingShell, NoProfile } from "@/components/NoProfile";
import { OnboardingGate } from "@/components/OnboardingGate";
import { WeekAdjuster } from "@/components/plan/WeekAdjuster";
import {
  blockCourseName,
  WeekCalendar,
} from "@/components/plan/WeekCalendar";
import { Badge, Button, Card, Progress } from "@/components/ui";
import { Sheet } from "@/components/ui/Sheet";

const DAY_INDEX: Record<Day, number> = {
  Monday: 0,
  Tuesday: 1,
  Wednesday: 2,
  Thursday: 3,
  Friday: 4,
  Saturday: 5,
  Sunday: 6,
};

function formatDuration(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} hr`;
  return `${hours} hr ${minutes} min`;
}

function formatMinute(value: number) {
  const hour24 = Math.floor(value / 60);
  const minute = value % 60;
  const hour12 = hour24 % 12 || 12;
  return `${hour12}:${String(minute).padStart(2, "0")} ${hour24 >= 12 ? "PM" : "AM"}`;
}

function blockStart(block: PlanBlock) {
  return block.startMinute ?? Math.round(block.start * 60);
}

function planChangeSummary(before: WeekPlan, after: WeekPlan) {
  const diff = diffWeekPlans(before, after);
  const timeChange =
    diff.deltaMinutes === 0
      ? "planned time unchanged"
      : `${formatDuration(Math.abs(diff.deltaMinutes))} ${diff.deltaMinutes > 0 ? "added" : "removed"}`;
  const movement =
    diff.moved.length > 0
      ? `${diff.moved.length} block${diff.moved.length === 1 ? "" : "s"} moved`
      : "times preserved where possible";
  return `Week updated: ${movement} · ${timeChange}.`;
}

function nextBlockForCurrentWeek(
  profile: ScheduledLearnerProfile,
  now: Date,
) {
  if (!isCurrentWeek(profile.weekContext?.weekStart, now)) return null;
  const todayIndex = (now.getDay() + 6) % 7;
  const minuteNow = now.getHours() * 60 + now.getMinutes();

  return [...profile.plan.blocks]
    .sort(
      (left, right) =>
        DAY_INDEX[left.day] - DAY_INDEX[right.day] ||
        blockStart(left) - blockStart(right),
    )
    .find((block) => {
      const dayIndex = DAY_INDEX[block.day];
      return (
        dayIndex > todayIndex ||
        (dayIndex === todayIndex && blockStart(block) + block.minutes > minuteNow)
      );
    });
}

function FrictionResponses({
  profile,
}: {
  profile: ScheduledLearnerProfile;
}) {
  if (profile.plan.frictionResponses.length === 0) return null;

  return (
    <section className="mt-6" aria-labelledby="friction-responses-title">
      <div className="rounded-2xl border border-line bg-surface">
        <div className="border-b border-line px-4 py-4 sm:px-5">
          <h2 id="friction-responses-title" className="font-semibold">
            How this week addresses your obstacles
          </h2>
        </div>
        <ul className="divide-y divide-line">
          {profile.plan.frictionResponses.map((response) => (
            <li
              key={response.frictionId}
              className="grid gap-1 px-4 py-3 text-sm sm:grid-cols-[11rem_1fr] sm:gap-4 sm:px-5"
            >
              <p className="font-medium">
                {FRICTION_BY_ID[response.frictionId].label}
                {(response.source === "week" || response.source === "both") && (
                  <Badge tone="brand" className="ml-2 align-middle">
                    This week
                  </Badge>
                )}
              </p>
              <p className="leading-relaxed text-ink-soft">{response.strategy}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function PlanRationale({
  profile,
}: {
  profile: ScheduledLearnerProfile;
}) {
  return (
    <details className="mt-5 rounded-2xl border border-line bg-surface">
      <summary className="flex min-h-14 cursor-pointer list-none items-center gap-2 px-5 font-semibold [&::-webkit-details-marker]:hidden">
        <Sparkles className="size-5 text-brand-600" aria-hidden />
        How Scholara built this week
      </summary>
      <div className="border-t border-line px-5 py-5">
        <ul className="space-y-3 text-sm leading-relaxed text-ink-soft">
          {profile.plan.rationale.map((line) => (
            <li key={line}>• {line}</li>
          ))}
        </ul>
        <div className="mt-5 flex flex-wrap gap-2">
          {profile.plan.minimumEffectiveDose && (
            <Badge tone="tier">Minimum effective dose</Badge>
          )}
          <Badge tone="brand">Deterministic schedule</Badge>
          <Badge>{profile.selectedTechniqueIds.length} selected methods</Badge>
        </div>
      </div>
    </details>
  );
}

export function PlanView() {
  const { profile, ready, setProfile } = useProfile();

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
  if (!hasCompletedSchedule(profile)) {
    return (
      <OnboardingGate
        title="Set up your recurring week"
        body="Add courses, class times, and confirmed study availability before opening the planner."
        href="/plan/setup"
        action="Continue to weekly setup"
      />
    );
  }

  return <CompletedPlan profile={profile} onSave={setProfile} />;
}

function CompletedPlan({
  profile,
  onSave,
}: {
  profile: ScheduledLearnerProfile;
  onSave: (profile: LearnerProfile) => void;
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [adjusting, setAdjusting] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<PlanBlock | null>(null);
  const [undoSnapshot, setUndoSnapshot] = useState<{
    plan: WeekPlan;
    week?: WeekContext;
  } | null>(null);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);
  const [clock, setClock] = useState(() => new Date());

  const savedWeekStart = profile.weekContext?.weekStart;
  const current = isCurrentWeek(savedWeekStart, clock);
  const week = profile.weekContext ?? startCurrentWeek(profile.schedule);
  const capacity = useMemo(
    () => calculateScheduleCapacity(profile.schedule, week),
    [profile.schedule, week],
  );
  const nextBlock = nextBlockForCurrentWeek(profile, clock);
  const actionableWarnings = (profile.plan.warnings ?? []).filter(
    (warning) => warning.code !== "method-not-used",
  );
  const methodNotices = (profile.plan.warnings ?? []).filter(
    (warning) => warning.code === "method-not-used",
  );

  useEffect(() => {
    let rolloverTimer: number | undefined;

    const scheduleRollover = () => {
      if (rolloverTimer !== undefined) window.clearTimeout(rolloverTimer);
      const now = new Date();
      const nextMidnight = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
      );
      rolloverTimer = window.setTimeout(() => {
        setClock(new Date());
        scheduleRollover();
      }, nextMidnight.getTime() - now.getTime() + 100);
    };
    const syncWhenVisible = () => {
      if (document.visibilityState !== "visible") return;
      setClock(new Date());
      scheduleRollover();
    };

    scheduleRollover();
    document.addEventListener("visibilitychange", syncWhenVisible);
    return () => {
      if (rolloverTimer !== undefined) window.clearTimeout(rolloverTimer);
      document.removeEventListener("visibilitychange", syncWhenVisible);
    };
  }, []);

  const saveCurrentWeek = () => {
    const nextWeek = startCurrentWeek(profile.schedule);
    const nextPlan = buildPlanForProfile(profile, profile.schedule, nextWeek);
    if (nextPlan.blocks.length === 0) {
      setUpdateMessage(
        "Your recurring schedule has no usable 30-minute study block. The saved week was kept.",
      );
      return;
    }
    setUndoSnapshot({ plan: profile.plan, week: profile.weekContext });
    onSave({ ...profile, weekContext: nextWeek, plan: nextPlan });
    setClock(new Date());
    setUpdateMessage("Started a clean current week. Temporary exceptions were reset.");
  };

  const applyWeek = (nextWeek: WeekContext, nextPlan: WeekPlan) => {
    const liveNow = new Date();
    if (
      !isCurrentWeek(savedWeekStart, liveNow) ||
      !isCurrentWeek(nextWeek.weekStart, liveNow)
    ) {
      setAdjusting(false);
      setClock(liveNow);
      setUpdateMessage(
        "The calendar week changed while this review was open. Start this week before making adjustments.",
      );
      return;
    }
    if (nextPlan.blocks.length === 0) {
      setUpdateMessage("That update created no usable blocks. Your current plan was kept.");
      return;
    }
    setUndoSnapshot({ plan: profile.plan, week: profile.weekContext });
    setUpdateMessage(planChangeSummary(profile.plan, nextPlan));
    onSave({ ...profile, plan: nextPlan, weekContext: nextWeek });
  };

  const openAdjustments = () => {
    const liveNow = new Date();
    setClock(liveNow);
    if (!isCurrentWeek(savedWeekStart, liveNow)) {
      setAdjusting(false);
      setUpdateMessage(
        "This saved plan is from an earlier week. Start this week before making adjustments.",
      );
      return;
    }
    setAdjusting(true);
  };

  const undo = () => {
    if (!undoSnapshot) return;
    onSave({
      ...profile,
      plan: undoSnapshot.plan,
      weekContext: undoSnapshot.week,
    });
    setUndoSnapshot(null);
    setUpdateMessage("Previous weekly settings restored.");
  };

  const asText = () => {
    const lines = [
      `My Scholara week · ${formatWeekRange(savedWeekStart)}`,
      "",
    ];
    const days: Day[] = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];
    for (const day of days) {
      const date = savedWeekStart
        ? weekDateForDay(savedWeekStart, day)
        : null;
      const label = date
        ? new Intl.DateTimeFormat(undefined, {
            weekday: "long",
            month: "short",
            day: "numeric",
          }).format(date)
        : day;
      const classes = profile.schedule.classMeetings
        .filter((meeting) => meeting.days.includes(day))
        .map((meeting) => ({
          start: meeting.startMinute,
          text: `${formatMinute(meeting.startMinute)} · ${meeting.label} (class)`,
        }));
      const blocks = profile.plan.blocks
        .filter((block) => block.day === day)
        .map((block) => ({
          start: blockStart(block),
          text: `${formatMinute(blockStart(block))} · ${block.minutes} min · ${block.label}`,
        }));
      const items = [...classes, ...blocks].sort(
        (left, right) => left.start - right.start,
      );
      if (items.length === 0) continue;
      lines.push(label.toUpperCase(), ...items.map((item) => `  ${item.text}`), "");
    }
    lines.push(`Study total: ${formatDuration(profile.plan.totalMinutes)}`);
    return lines.join("\n");
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(asText());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2_000);
    } catch {
      setCopied(false);
    }
  };

  const selectedTechnique = selectedBlock
    ? TECHNIQUE_BY_ID[selectedBlock.techniqueId]
    : null;

  return (
    <div className="mx-auto max-w-screen-2xl px-4 pb-16 sm:px-5">
      <header className="-mx-4 border-b border-line bg-paper/95 px-4 py-4 backdrop-blur sm:-mx-5 sm:px-5 lg:sticky lg:top-[4.3125rem] lg:z-30 print:static">
        <div className="mx-auto flex max-w-screen-2xl flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold">Weekly plan</h1>
              <Badge tone={current ? "brand" : "neutral"}>
                {current ? "Current week" : "Saved week"}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-ink-soft">
              {savedWeekStart
                ? formatWeekRange(savedWeekStart)
                : "Dates unavailable · start this week to refresh"}
            </p>
          </div>

          <div className="no-print flex flex-wrap items-center justify-end gap-2">
            {current ? (
              <Button size="sm" onClick={openAdjustments}>
                <SlidersHorizontal className="size-4" aria-hidden />
                Adjust this week
              </Button>
            ) : (
              <Button size="sm" onClick={saveCurrentWeek}>
                <CalendarClock className="size-4" aria-hidden />
                Start this week
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => router.push("/plan/setup")}
            >
              <Pencil className="size-4" aria-hidden />
              <span className="hidden sm:inline">Edit recurring schedule</span>
              <span className="sm:hidden">Edit schedule</span>
            </Button>
            <details className="relative">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-center rounded-xl border border-line bg-white px-3 hover:bg-line-soft [&::-webkit-details-marker]:hidden">
                <MoreHorizontal className="size-5" aria-hidden />
                <span className="sr-only">More plan actions</span>
              </summary>
              <div className="absolute right-0 top-full z-40 mt-2 min-w-44 rounded-xl border border-line bg-surface p-1.5 shadow-lg">
                <button
                  type="button"
                  onClick={copy}
                  className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left text-sm hover:bg-line-soft"
                >
                  {copied ? (
                    <Check className="size-4" aria-hidden />
                  ) : (
                    <Copy className="size-4" aria-hidden />
                  )}
                  {copied ? "Copied" : "Copy plan"}
                </button>
              </div>
            </details>
          </div>
        </div>
      </header>

      {!current && (
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-950" role="status">
          <p className="font-semibold">This is a saved week.</p>
          <p className="mt-1 leading-relaxed">
            You can review it, but weekly adjustments are locked so temporary
            deadlines and availability never carry forward silently. Start this
            week to reset those exceptions.
          </p>
        </div>
      )}

      {updateMessage && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-100 bg-brand-50 px-4 py-3 text-sm text-brand-700" role="status">
          <p>{updateMessage}</p>
          {undoSnapshot && (
            <Button type="button" variant="quiet" size="sm" onClick={undo}>
              <Undo2 className="size-4" aria-hidden /> Undo
            </Button>
          )}
        </div>
      )}

      <section className="mt-6 grid gap-3 lg:grid-cols-[1.4fr_1fr_1fr]" aria-label="Plan summary">
        <Card className="p-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.08em] text-ink-faint">Goal versus planned</p>
              <p className="mt-2 text-2xl font-semibold tabular-nums">
                {formatDuration(profile.plan.totalMinutes)}
                <span className="text-base font-normal text-ink-faint"> / {formatDuration(profile.plan.budgetMinutes)}</span>
              </p>
            </div>
            <p className="text-sm font-medium text-brand-700">
              {Math.round((profile.plan.totalMinutes / Math.max(1, profile.plan.budgetMinutes)) * 100)}%
            </p>
          </div>
          <div className="mt-4">
            <Progress
              value={Math.min(profile.plan.totalMinutes, profile.plan.budgetMinutes)}
              max={Math.max(1, profile.plan.budgetMinutes)}
              label="Weekly study goal planned"
            />
          </div>
        </Card>

        <Card className="p-5">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-ink-faint">Schedulable capacity</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">
            {formatDuration(capacity.availableMinutes)}
          </p>
          <p className="mt-1 text-sm text-ink-soft">
            {capacity.shortfallMinutes > 0
              ? `${formatDuration(capacity.shortfallMinutes)} short of your target`
              : `${formatDuration(capacity.bufferMinutes)} buffer after your target`}
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-ink-faint">Next study block</p>
          {nextBlock ? (
            <button
              type="button"
              onClick={() => setSelectedBlock(nextBlock)}
              className="mt-2 min-h-11 w-full rounded-lg text-left focus-visible:outline-offset-4"
            >
              <p className="font-semibold">{blockCourseName(nextBlock, profile.schedule)}</p>
              <p className="mt-1 text-sm text-ink-soft">
                {nextBlock.day} at {formatMinute(blockStart(nextBlock))} · {nextBlock.minutes} min
              </p>
            </button>
          ) : (
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              {current ? "No later study blocks remain this week." : "Start the current week to see what is next."}
            </p>
          )}
        </Card>
      </section>

      <PlanRationale profile={profile} />

      {actionableWarnings.length > 0 && (
        <Card className="mt-5 border-amber-200 bg-amber-50/70 p-5">
          <h2 className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="size-5 text-amber-700" aria-hidden />
            Capacity and deadline constraints
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-ink-soft">
            {actionableWarnings.map((warning, index) => (
              <li key={`${warning.code}-${warning.courseId ?? index}`}>• {warning.message}</li>
            ))}
          </ul>
        </Card>
      )}

      {methodNotices.length > 0 && (
        <div className="mt-4 rounded-xl border border-line bg-line-soft/60 px-4 py-3 text-sm text-ink-soft">
          <p className="font-medium text-ink">Saved for another week</p>
          <ul className="mt-1 space-y-1">
            {methodNotices.map((warning, index) => (
              <li key={`${warning.code}-${warning.courseId ?? index}`}>{warning.message}</li>
            ))}
          </ul>
        </div>
      )}

      <FrictionResponses profile={profile} />

      <WeekCalendar
        schedule={profile.schedule}
        plan={profile.plan}
        week={week}
        weekStart={savedWeekStart}
        onSelectBlock={setSelectedBlock}
      />

      {adjusting && current && (
        <WeekAdjuster
          open
          onClose={() => setAdjusting(false)}
          schedule={profile.schedule}
          week={week}
          plan={profile.plan}
          onBuildPreview={(candidate) =>
            buildPlanForProfile(profile, profile.schedule, candidate)
          }
          onApply={applyWeek}
        />
      )}

      <Sheet
        open={selectedBlock !== null}
        onClose={() => setSelectedBlock(null)}
        eyebrow="Study block"
        title={selectedBlock ? blockCourseName(selectedBlock, profile.schedule) : "Study block"}
        description={
          selectedBlock
            ? `${selectedBlock.day}, ${formatMinute(blockStart(selectedBlock))}–${formatMinute(blockStart(selectedBlock) + selectedBlock.minutes)}`
            : undefined
        }
      >
        {selectedBlock && (
          <div className="space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-faint">Method</p>
              <h3 className="mt-2 text-xl font-semibold">
                {selectedTechnique?.name ?? selectedBlock.label}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                {selectedTechnique?.blurb ?? selectedBlock.note}
              </p>
              <Badge tone={selectedBlock.techniqueSource === "selected" ? "brand" : "neutral"} className="mt-3">
                {selectedBlock.techniqueSource === "selected" ? "Method you chose" : "Compatible foundation"}
              </Badge>
            </div>

            <div className="rounded-2xl border border-line bg-surface p-5">
              <h3 className="font-semibold">What to do</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{selectedBlock.note}</p>
            </div>

            {selectedBlock.addressedFrictionIds.length > 0 && (
              <div>
                <h3 className="font-semibold">Obstacles addressed</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedBlock.addressedFrictionIds.map((friction) => (
                    <Badge key={friction}>{FRICTION_BY_ID[friction].label}</Badge>
                  ))}
                </div>
              </div>
            )}

            {selectedBlock.supportingTechniqueIds.length > 0 && (
              <div>
                <h3 className="font-semibold">Supporting methods</h3>
                <ul className="mt-2 space-y-2 text-sm text-ink-soft">
                  {selectedBlock.supportingTechniqueIds.map((id) => (
                    <li key={id}>• {TECHNIQUE_BY_ID[id]?.name ?? "Study support"}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Sheet>
    </div>
  );
}
