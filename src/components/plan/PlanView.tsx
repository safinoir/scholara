"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, Copy, Pencil, Sparkles } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { FRICTION_BY_ID } from "@/lib/data/axes";
import { TECHNIQUE_BY_ID } from "@/lib/data/techniques";
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
  ScheduleSetup,
  ScheduledLearnerProfile,
  WeekContext,
  WeekPlan,
} from "@/lib/types";
import { defaultWeekContext, normalizeWeekContext } from "@/lib/week";
import { LoadingShell, NoProfile } from "@/components/NoProfile";
import { OnboardingGate } from "@/components/OnboardingGate";
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
  const activeFrictions = [
    ...new Set([...profile.frictions, ...week.focusFrictions]),
  ];
  const techniques = rankTechniques({
    axes: profile.axes,
    frictions: activeFrictions,
    primary: effectiveArchetypeMatch(profile).primary,
  });
  return buildSchedulePlan({
    axes: profile.axes,
    frictions: profile.frictions,
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

function FrictionResponses({
  profile,
}: {
  profile: ScheduledLearnerProfile;
}) {
  if (profile.plan.frictionResponses.length === 0) return null;

  const blocksById = new Map(
    profile.plan.blocks.map((block) => [block.id, block]),
  );
  const courseById = new Map(
    profile.schedule.courses.map((course) => [course.id, course]),
  );

  return (
    <section className="mt-8" aria-labelledby="friction-responses-title">
      <div className="max-w-3xl">
        <h2 id="friction-responses-title" className="text-2xl font-semibold">
          What this plan is helping you overcome
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          These are the obstacles you reported and the concrete choices this
          week makes in response.
        </p>
      </div>
      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {profile.plan.frictionResponses.map((response) => {
          const courseNames = [
            ...new Set(
              response.blockIds
                .map((blockId) => blocksById.get(blockId)?.courseId)
                .filter((courseId): courseId is string => Boolean(courseId))
                .map((courseId) => courseById.get(courseId)?.name)
                .filter((name): name is string => Boolean(name)),
            ),
          ];
          const methodNames = response.techniqueIds
            .map((id) => TECHNIQUE_BY_ID[id]?.name)
            .filter((name): name is string => Boolean(name));

          return (
            <Card key={response.frictionId} className="p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h3 className="font-semibold">
                  {FRICTION_BY_ID[response.frictionId].label}
                </h3>
                {(response.source === "week" || response.source === "both") && (
                  <Badge tone="brand">This week</Badge>
                )}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                {response.strategy}
              </p>
              <p className="mt-3 text-xs text-ink-faint">
                {courseNames.length > 0
                  ? `Applied in ${courseNames.join(", ")}`
                  : "Applied across the plan"}
                {methodNames.length > 0
                  ? ` · ${methodNames.join(", ")}`
                  : ""}
              </p>
            </Card>
          );
        })}
      </div>
    </section>
  );
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
    let week = safeWeekForSchedule(profile, schedule);
    let plan = generatePlan(profile, schedule, week);
    if (plan.blocks.length === 0) {
      week = defaultWeekContext(schedule);
      plan = generatePlan(profile, schedule, week);
    }
    setProfile({
      ...profile,
      schedule,
      weekContext: week,
      plan,
      onboardingStage: "complete",
    });
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    });
    if (setupOnly) router.replace("/plan", { scroll: true });
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
    });
  };

  const undoWeek = () => {
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
          lead="Classes are fixed, study windows are protected, and every block uses a method you chose or a compatible foundation."
        />
        <div className="no-print flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={onEditSchedule}>
            <Pencil className="size-4" aria-hidden /> Edit recurring schedule
          </Button>
          <Button variant="secondary" size="sm" onClick={copy}>
            {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
            {copied ? "Copied" : "Copy"}
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

      <FrictionResponses profile={profile} />

      <WeekCalendar schedule={profile.schedule} plan={profile.plan} />

      <WeekAdjuster
        key={JSON.stringify(profile.weekContext)}
        schedule={profile.schedule}
        week={profile.weekContext}
        onApply={applyWeek}
        onUndo={undoWeek}
        canUndo={undoSnapshot !== null}
      />

      <Card className="mt-8">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Sparkles className="size-5 text-brand-600" aria-hidden />
          How Scholara built this week
        </h2>
        <ul className="mt-4 space-y-3 text-sm leading-relaxed text-ink-soft">
          {profile.plan.rationale.map((line) => <li key={line}>• {line}</li>)}
        </ul>
        <div className="mt-5 flex flex-wrap gap-2">
          {profile.plan.minimumEffectiveDose && <Badge tone="tier">Minimum effective dose</Badge>}
          <Badge tone="brand">Deterministic schedule</Badge>
          <Badge>{profile.selectedTechniqueIds.length} selected methods</Badge>
        </div>
      </Card>
    </div>
  );
}
