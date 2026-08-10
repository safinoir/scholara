"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, Copy, Pencil, Printer, Sparkles } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { coachingPayload } from "@/lib/ai/payload";
import {
  buildSchedulePlan,
  calculateScheduleCapacity,
  rankTechniques,
} from "@/lib/engine";
import {
  hasCompletedSchedule,
  hasConfirmedToolkit,
  resumeDestination,
} from "@/lib/onboarding";
import { effectiveArchetypeMatch } from "@/lib/persona";
import type {
  Day,
  LearnerProfile,
  PlanCoaching,
  ScheduleSetup,
  ScheduledLearnerProfile,
  WeekContext,
  WeekPlan,
} from "@/lib/types";
import { defaultWeekContext, normalizeWeekContext } from "@/lib/week";
import { LoadingShell, NoProfile } from "@/components/NoProfile";
import { OnboardingGate } from "@/components/OnboardingGate";
import { AskCoach } from "@/components/plan/AskCoach";
import { CoachPanel } from "@/components/plan/CoachPanel";
import { PlanSetupWizard } from "@/components/plan/PlanSetupWizard";
import { WeekAdjuster } from "@/components/plan/WeekAdjuster";
import { WeekCalendar } from "@/components/plan/WeekCalendar";
import { Badge, Button, Card, SectionHeading } from "@/components/ui";

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

function contextForSchedule(profile: LearnerProfile, schedule: ScheduleSetup) {
  return {
    ...profile.context,
    courseLoad:
      schedule.mode === "by-course"
        ? Math.max(1, schedule.courses.length)
        : profile.context.courseLoad,
    hoursPerWeek: schedule.targetStudyMinutes / 60,
  };
}

function safeWeekForSchedule(
  profile: LearnerProfile,
  schedule: ScheduleSetup,
): WeekContext {
  if (!profile.schedule || !profile.weekContext) {
    return defaultWeekContext(schedule);
  }

  const knownCourseIds = new Set(schedule.courses.map((course) => course.id));
  const normalized = normalizeWeekContext(schedule, profile.weekContext);
  return {
    ...normalized,
    targetStudyMinutes: Math.min(
      normalized.targetStudyMinutes ?? schedule.targetStudyMinutes,
      schedule.targetStudyMinutes,
    ),
    courseTargets: (normalized.courseTargets ?? []).filter((target) =>
      knownCourseIds.has(target.courseId),
    ),
  };
}

function generatePlan(
  profile: LearnerProfile,
  schedule: ScheduleSetup,
  week: WeekContext,
) {
  const context = contextForSchedule(profile, schedule);
  const frictions = [
    ...new Set([...profile.frictions, ...week.focusFrictions]),
  ];
  const techniques = rankTechniques({
    axes: profile.axes,
    frictions,
    context,
    primary: effectiveArchetypeMatch(profile).primary,
  });
  return buildSchedulePlan({
    axes: profile.axes,
    frictions,
    context,
    schedule,
    techniques,
    selectedTechniqueIds: profile.selectedTechniqueIds,
    week,
  });
}

function planChangeSummary(before: WeekPlan, after: WeekPlan) {
  const beforeById = new Map(before.blocks.map((block) => [block.id, block]));
  const moved = after.blocks.filter((block) => {
    const previous = beforeById.get(block.id);
    return (
      previous &&
      (previous.day !== block.day || previous.startMinute !== block.startMinute)
    );
  }).length;
  const delta = after.totalMinutes - before.totalMinutes;
  const parts = [
    moved ? `${moved} block${moved === 1 ? "" : "s"} moved` : "times preserved where possible",
    delta === 0
      ? "planned time unchanged"
      : `${formatDuration(Math.abs(delta))} ${delta > 0 ? "added" : "removed"}`,
  ];
  return `Week updated: ${parts.join(" · ")}.`;
}

export function PlanView({ setupOnly = false }: { setupOnly?: boolean }) {
  const { profile, ready, setProfile } = useProfile();
  const router = useRouter();

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

  const completeSchedule = (schedule: ScheduleSetup) => {
    const context = contextForSchedule(profile, schedule);
    let week = safeWeekForSchedule(profile, schedule);
    let plan = generatePlan({ ...profile, context }, schedule, week);
    if (plan.blocks.length === 0) {
      week = defaultWeekContext(schedule);
      plan = generatePlan({ ...profile, context }, schedule, week);
    }
    setProfile({
      ...profile,
      context,
      schedule,
      weekContext: week,
      plan,
      onboardingStage: "complete",
      coaching: undefined,
    });
    if (setupOnly) router.replace("/plan");
  };

  if (setupOnly || !hasCompletedSchedule(profile)) {
    return (
      <PlanSetupWizard
        profile={profile}
        onComplete={completeSchedule}
        onCancel={
          hasCompletedSchedule(profile)
            ? () => router.push("/plan")
            : undefined
        }
      />
    );
  }

  return (
    <CompletedPlan
      profile={profile}
      onSave={setProfile}
      onEditSchedule={() => router.push("/plan/setup")}
    />
  );
}

function CompletedPlan({
  profile,
  onSave,
  onEditSchedule,
}: {
  profile: ScheduledLearnerProfile;
  onSave: (profile: LearnerProfile) => void;
  onEditSchedule: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [coachBusy, setCoachBusy] = useState(false);
  const [undoSnapshot, setUndoSnapshot] = useState<{
    plan: WeekPlan;
    week?: WeekContext;
  } | null>(null);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);

  const capacity = useMemo(
    () => calculateScheduleCapacity(profile.schedule, profile.weekContext),
    [profile.schedule, profile.weekContext],
  );
  const bufferMinutes = Math.max(0, capacity.availableMinutes - profile.plan.totalMinutes);
  const classCount = profile.schedule.classMeetings.reduce(
    (total, meeting) => total + meeting.days.length,
    0,
  );

  const fetchCoaching = useCallback(async () => {
    setCoachBusy(true);
    try {
      const response = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(coachingPayload(profile)),
      });
      if (!response.ok) return;
      const coaching = (await response.json()) as PlanCoaching;
      if (typeof coaching?.brief === "string") onSave({ ...profile, coaching });
    } catch {
      // The deterministic calendar remains complete without coaching.
    } finally {
      setCoachBusy(false);
    }
  }, [onSave, profile]);

  const applyWeek = (week: WeekContext) => {
    const plan = generatePlan(profile, profile.schedule, week);
    if (plan.blocks.length === 0) {
      setUpdateMessage(
        "No usable study window remains with those changes. Your current plan was kept.",
      );
      return;
    }
    setUndoSnapshot({ plan: profile.plan, week: profile.weekContext });
    setUpdateMessage(planChangeSummary(profile.plan, plan));
    onSave({
      ...profile,
      plan,
      weekContext: week,
      coaching: undefined,
    });
  };

  const undoWeek = () => {
    if (!undoSnapshot) return;
    onSave({
      ...profile,
      plan: undoSnapshot.plan,
      weekContext: undoSnapshot.week,
      coaching: undefined,
    });
    setUndoSnapshot(null);
    setUpdateMessage("Previous weekly settings restored.");
  };

  const asText = () => {
    const lines = ["My Scholara week", ""];
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
      const classes = profile.schedule.classMeetings
        .filter((meeting) => meeting.days.includes(day))
        .map((meeting) => ({
          start: meeting.startMinute,
          text: `${formatMinute(meeting.startMinute)} · ${meeting.label} (class)`,
        }));
      const blocks = profile.plan.blocks
        .filter((block) => block.day === day)
        .map((block) => ({
          start: block.startMinute,
          text: `${formatMinute(block.startMinute)} · ${block.minutes} min · ${block.label}`,
        }));
      const items = [...classes, ...blocks].sort((left, right) => left.start - right.start);
      if (!items.length) continue;
      lines.push(day.toUpperCase(), ...items.map((item) => `  ${item.text}`), "");
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

  const warnings = profile.plan.warnings ?? [];

  return (
    <div className="mx-auto max-w-screen-2xl px-5 py-10 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SectionHeading
          eyebrow="Your week"
          title="A plan built inside your real availability"
          lead="Classes are fixed, study windows are protected, and every block uses a method from your toolkit or a compatible foundation."
        />
        <div className="no-print flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={onEditSchedule}>
            <Pencil className="size-4" aria-hidden /> Edit recurring schedule
          </Button>
          <Button variant="secondary" size="sm" onClick={copy}>
            {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => window.print()}>
            <Printer className="size-4" aria-hidden /> Print
          </Button>
        </div>
      </div>

      <dl className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Target", formatDuration(profile.plan.budgetMinutes)],
          ["Planned", formatDuration(profile.plan.totalMinutes)],
          ["Open buffer", formatDuration(bufferMinutes)],
          ["Class meetings", String(classCount)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-line bg-surface p-4">
            <dt className="text-xs font-medium uppercase tracking-[0.08em] text-ink-faint">{label}</dt>
            <dd className="mt-1 text-xl font-semibold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>

      {updateMessage && (
        <p className="mt-5 rounded-xl border border-brand-100 bg-brand-50 px-4 py-3 text-sm text-brand-700" role="status">
          {updateMessage}
        </p>
      )}

      {warnings.length > 0 && (
        <Card className="mt-6 border-amber-200 bg-amber-50/70">
          <h2 className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="size-5 text-amber-700" aria-hidden />
            What did not fit
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-ink-soft">
            {warnings.map((warning, index) => (
              <li key={`${warning.code}-${warning.courseId ?? index}`}>• {warning.message}</li>
            ))}
          </ul>
        </Card>
      )}

      <WeekCalendar schedule={profile.schedule} plan={profile.plan} />

      <WeekAdjuster
        key={JSON.stringify(profile.weekContext)}
        schedule={profile.schedule}
        week={profile.weekContext}
        onApply={applyWeek}
        onUndo={undoWeek}
        canUndo={undoSnapshot !== null}
      />

      <CoachPanel
        coaching={profile.coaching ?? null}
        busy={coachBusy}
        onRefresh={() => void fetchCoaching()}
      />

      <Card className="mt-8">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Sparkles className="size-5 text-brand-600" aria-hidden />
          Why this schedule looks like this
        </h2>
        <ul className="mt-4 space-y-3 text-sm leading-relaxed text-ink-soft">
          {profile.plan.rationale.map((line) => <li key={line}>• {line}</li>)}
        </ul>
        <div className="mt-5 flex flex-wrap gap-2">
          {profile.plan.minimumEffectiveDose && <Badge tone="tier">Minimum effective dose</Badge>}
          <Badge tone="brand">Deterministic schedule</Badge>
          <Badge>{profile.selectedTechniqueIds.length} toolkit methods</Badge>
        </div>
      </Card>

      <AskCoach profile={profile} />
    </div>
  );
}
