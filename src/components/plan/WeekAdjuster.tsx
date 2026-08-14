"use client";

import { useState } from "react";
import { ArrowLeft, Plus, Sparkles, Trash2 } from "lucide-react";
import { FRICTION_META } from "@/lib/data/axes";
import { parseWeekContext } from "@/lib/schema";
import {
  DAYS,
  type Day,
  type Friction,
  type PlanBlock,
  type ScheduleSetup,
  type TemporaryBusyWindow,
  type WeekContext,
  type WeekPlan,
  type WeekTuningProposal,
} from "@/lib/types";
import { currentWeekStart, diffWeekPlans, normalizeWeekContext } from "@/lib/week";
import { Button, Card, cn, inputClass } from "@/components/ui";
import { Sheet } from "@/components/ui/Sheet";

const DAY_SHORT: Record<Day, string> = {
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
  Saturday: "Sat",
  Sunday: "Sun",
};

const LOAD_OPTIONS = [
  { value: "light", label: "Light" },
  { value: "normal", label: "Normal" },
  { value: "crunch", label: "Crunch" },
] as const;

const ENERGY_OPTIONS = [
  { value: "depleted", label: "Low" },
  { value: "steady", label: "Steady" },
  { value: "strong", label: "Strong" },
] as const;

function timeToMinute(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

function formatMinute(value: number) {
  const hour24 = Math.floor(value / 60);
  const minute = value % 60;
  const hour12 = hour24 % 12 || 12;
  return `${hour12}:${String(minute).padStart(2, "0")} ${hour24 >= 12 ? "PM" : "AM"}`;
}

function formatDuration(minutes: number) {
  const hours = Math.floor(Math.abs(minutes) / 60);
  const remainder = Math.abs(minutes) % 60;
  if (hours === 0) return `${remainder} min`;
  if (remainder === 0) return `${hours} hr`;
  return `${hours} hr ${remainder} min`;
}

function proposalIntoWeek(current: WeekContext, proposal: WeekTuningProposal): WeekContext {
  const busyWindows: TemporaryBusyWindow[] = proposal.busyWindows.map((window, index) => ({
    ...window,
    id: `ai-busy-${window.day}-${window.startMinute}-${index}`,
  }));
  return {
    ...current,
    load: proposal.load ?? current.load,
    energy: proposal.energy ?? current.energy,
    targetStudyMinutes: proposal.targetStudyMinutes ?? current.targetStudyMinutes,
    unavailableDays: proposal.unavailableDays,
    focusFrictions: proposal.focusFrictions,
    busyWindows,
    courseTargets: proposal.courseTargets,
  };
}

function proposalSummary(proposal: WeekTuningProposal, schedule: ScheduleSetup) {
  const courseName = new Map(schedule.courses.map((course) => [course.id, course.name]));
  return [
    proposal.load ? `Workload: ${proposal.load}` : null,
    proposal.energy ? `Energy: ${proposal.energy}` : null,
    proposal.targetStudyMinutes ? `Weekly target: ${formatDuration(proposal.targetStudyMinutes)}` : null,
    ...proposal.unavailableDays.map((day) => `${day}: unavailable`),
    ...proposal.busyWindows.map(
      (window) => `${window.day}: busy ${formatMinute(window.startMinute)}–${formatMinute(window.endMinute)}`,
    ),
    ...proposal.courseTargets.map(
      (target) =>
        `${courseName.get(target.courseId) ?? "Course"}: ${target.priority}${target.deadlineDay ? ` through ${target.deadlineDay}` : ""}`,
    ),
    ...proposal.focusFrictions.map(
      (friction) => `Extra friction: ${FRICTION_META.find((item) => item.id === friction)?.label ?? friction}`,
    ),
  ].filter((item): item is string => Boolean(item));
}

function busyWindowKey(window: TemporaryBusyWindow) {
  return `${window.day}|${window.startMinute}|${window.endMinute}`;
}

function weeklySettingChanges(
  before: WeekContext,
  after: WeekContext,
  schedule: ScheduleSetup,
): string[] {
  const changes: string[] = [];
  const courseNames = new Map(
    schedule.courses.map((course) => [course.id, course.name]),
  );

  if (before.load !== after.load) {
    changes.push(`Workload: ${before.load} → ${after.load}`);
  }
  if (before.energy !== after.energy) {
    changes.push(`Energy: ${before.energy} → ${after.energy}`);
  }
  const beforeTarget =
    before.targetStudyMinutes ?? schedule.targetStudyMinutes;
  const afterTarget = after.targetStudyMinutes ?? schedule.targetStudyMinutes;
  if (beforeTarget !== afterTarget) {
    changes.push(
      `Weekly target: ${formatDuration(beforeTarget)} → ${formatDuration(afterTarget)}`,
    );
  }

  for (const day of DAYS) {
    const wasUnavailable = before.unavailableDays.includes(day);
    const isUnavailable = after.unavailableDays.includes(day);
    if (wasUnavailable !== isUnavailable) {
      changes.push(
        isUnavailable
          ? `${day}: marked unavailable`
          : `${day}: recurring availability restored`,
      );
    }
  }

  const beforeBusy = new Set((before.busyWindows ?? []).map(busyWindowKey));
  const afterBusy = new Set((after.busyWindows ?? []).map(busyWindowKey));
  for (const window of after.busyWindows ?? []) {
    if (!beforeBusy.has(busyWindowKey(window))) {
      changes.push(
        `${window.day}: add busy time ${formatMinute(window.startMinute)}–${formatMinute(window.endMinute)}`,
      );
    }
  }
  for (const window of before.busyWindows ?? []) {
    if (!afterBusy.has(busyWindowKey(window))) {
      changes.push(
        `${window.day}: remove busy time ${formatMinute(window.startMinute)}–${formatMinute(window.endMinute)}`,
      );
    }
  }

  const beforeTargets = new Map(
    (before.courseTargets ?? []).map((target) => [target.courseId, target]),
  );
  const afterTargets = new Map(
    (after.courseTargets ?? []).map((target) => [target.courseId, target]),
  );
  for (const course of schedule.courses) {
    const previous = beforeTargets.get(course.id);
    const next = afterTargets.get(course.id);
    if (JSON.stringify(previous) === JSON.stringify(next)) continue;
    changes.push(
      next
        ? `${courseNames.get(course.id) ?? "Course"}: ${next.priority}${next.deadlineDay ? ` through ${next.deadlineDay}` : ""}`
        : `${courseNames.get(course.id) ?? "Course"}: weekly pressure returned to normal`,
    );
  }

  for (const friction of FRICTION_META) {
    const wasActive = before.focusFrictions.includes(friction.id);
    const isActive = after.focusFrictions.includes(friction.id);
    if (wasActive !== isActive) {
      changes.push(
        isActive
          ? `Add weekly obstacle: ${friction.label}`
          : `Remove weekly obstacle: ${friction.label}`,
      );
    }
  }

  return changes;
}

function planBlockSummary(block: PlanBlock, schedule: ScheduleSetup) {
  const course =
    schedule.courses.find((candidate) => candidate.id === block.courseId)
      ?.name ?? block.label;
  const start = block.startMinute ?? Math.round(block.start * 60);
  return `${course} · ${block.day} ${formatMinute(start)}–${formatMinute(start + block.minutes)}`;
}

type Preview = {
  week: WeekContext;
  plan: WeekPlan;
  diff: ReturnType<typeof diffWeekPlans>;
};

export function WeekAdjuster({
  open,
  onClose,
  schedule,
  week,
  plan,
  onBuildPreview,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  schedule: ScheduleSetup;
  week: WeekContext;
  plan: WeekPlan;
  onBuildPreview: (week: WeekContext) => WeekPlan;
  onApply: (week: WeekContext, plan: WeekPlan) => void;
}) {
  const [draft, setDraft] = useState(() => normalizeWeekContext(schedule, week));
  const [busyDay, setBusyDay] = useState<Day>("Monday");
  const [busyStart, setBusyStart] = useState("17:00");
  const [busyEnd, setBusyEnd] = useState("19:00");
  const [formError, setFormError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [interpreting, setInterpreting] = useState(false);
  const [proposal, setProposal] = useState<WeekTuningProposal | null>(null);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const previewSettingChanges = preview
    ? weeklySettingChanges(week, preview.week, schedule)
    : [];

  const toggleDay = (day: Day) =>
    setDraft((current) => ({
      ...current,
      unavailableDays: current.unavailableDays.includes(day)
        ? current.unavailableDays.filter((candidate) => candidate !== day)
        : [...current.unavailableDays, day],
    }));

  const toggleFriction = (friction: Friction) =>
    setDraft((current) => ({
      ...current,
      focusFrictions: current.focusFrictions.includes(friction)
        ? current.focusFrictions.filter((candidate) => candidate !== friction)
        : [...current.focusFrictions, friction],
    }));

  const setCourseTarget = (courseId: string, value: "none" | "focus" | "urgent") => {
    setDraft((current) => ({
      ...current,
      courseTargets:
        value === "none"
          ? (current.courseTargets ?? []).filter((target) => target.courseId !== courseId)
          : [
              ...(current.courseTargets ?? []).filter((target) => target.courseId !== courseId),
              {
                courseId,
                priority: value,
                deadlineDay:
                  current.courseTargets?.find((target) => target.courseId === courseId)?.deadlineDay ?? null,
              },
            ],
    }));
  };

  const setCourseDeadline = (courseId: string, deadlineDay: Day | null) => {
    setDraft((current) => ({
      ...current,
      courseTargets: (current.courseTargets ?? []).map((target) =>
        target.courseId === courseId ? { ...target, deadlineDay } : target,
      ),
    }));
  };

  const addBusyWindow = () => {
    const startMinute = timeToMinute(busyStart);
    const endMinute = timeToMinute(busyEnd);
    if (
      !Number.isFinite(startMinute) ||
      !Number.isFinite(endMinute) ||
      startMinute % 15 !== 0 ||
      endMinute % 15 !== 0 ||
      endMinute <= startMinute
    ) {
      setFormError("Busy times must use 15-minute increments with an end after the start.");
      return;
    }
    if ((draft.busyWindows ?? []).length >= 40) {
      setFormError("You can add up to 40 temporary busy windows.");
      return;
    }
    const next: TemporaryBusyWindow = {
      id: `busy-${busyDay}-${startMinute}-${endMinute}`,
      day: busyDay,
      startMinute,
      endMinute,
    };
    setDraft((current) => ({
      ...current,
      busyWindows: [
        ...(current.busyWindows ?? []).filter((window) => window.id !== next.id),
        next,
      ],
    }));
    setFormError(null);
  };

  const buildReview = (candidate: WeekContext) => {
    const validated = parseWeekContext(candidate, schedule);
    if (!validated) {
      setFormError("Review the target, course pressure, and 15-minute busy times before continuing.");
      return;
    }
    const nextPlan = onBuildPreview(validated);
    if (nextPlan.blocks.length === 0) {
      setFormError("Those changes leave no usable study block. Your current plan will stay unchanged.");
      return;
    }
    setFormError(null);
    setPreview({ week: validated, plan: nextPlan, diff: diffWeekPlans(plan, nextPlan) });
  };

  const reviewManual = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    buildReview(draft);
  };

  const previewAi = async () => {
    const trimmed = note.trim();
    if (!trimmed) return;
    setInterpreting(true);
    setProposal(null);
    setAiMessage(null);
    try {
      const response = await fetch("/api/plan/tune", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          note: trimmed,
          weekStart: draft.weekStart ?? currentWeekStart(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          courses: schedule.courses.map(({ id, name }) => ({ id, name })),
          current: {
            load: draft.load,
            energy: draft.energy,
            targetStudyMinutes: draft.targetStudyMinutes ?? schedule.targetStudyMinutes,
            focusFrictions: draft.focusFrictions,
            unavailableDays: draft.unavailableDays,
            busyWindows: draft.busyWindows ?? [],
            courseTargets: draft.courseTargets ?? [],
          },
        }),
      });
      const data = response.ok ? await response.json() : null;
      if (data?.source === "ai" && data.proposal) {
        setProposal(data.proposal as WeekTuningProposal);
      } else {
        setAiMessage("AI tuning is unavailable right now. The manual controls still work.");
      }
    } catch {
      setAiMessage("AI tuning is unavailable right now. The manual controls still work.");
    } finally {
      setInterpreting(false);
    }
  };

  const applyProposalDraft = (reviewNow: boolean) => {
    if (!proposal) return;
    const next = proposalIntoWeek(draft, proposal);
    setDraft(next);
    setProposal(null);
    setNote("");
    if (reviewNow) buildReview(next);
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      eyebrow="Temporary changes"
      title={preview ? "Review this week" : "Adjust this week"}
      description={
        preview
          ? "Nothing changes until you confirm this deterministic preview."
          : "These changes affect only the represented week. Your recurring schedule stays intact."
      }
      footer={
        preview ? (
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <Button type="button" variant="ghost" onClick={() => setPreview(null)}>
              <ArrowLeft className="size-4" aria-hidden /> Back to editing
            </Button>
            <Button
              type="button"
              onClick={() => {
                onApply(preview.week, preview.plan);
                onClose();
              }}
            >
              Apply reviewed changes
            </Button>
          </div>
        ) : (
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" form="week-adjustment-form">Review changes</Button>
          </div>
        )
      }
    >
      {preview ? (
        <div className="space-y-5">
          <Card className="border-brand-100 bg-brand-50/60 p-5">
            <p className="text-sm font-medium text-brand-700">Plan impact</p>
            <p className="mt-2 text-3xl font-semibold tabular-nums">
              {formatDuration(preview.plan.totalMinutes)}
            </p>
            <p className="mt-1 text-sm text-ink-soft">
              {preview.diff.deltaMinutes === 0
                ? "Planned time is unchanged."
                : `${formatDuration(preview.diff.deltaMinutes)} ${preview.diff.deltaMinutes > 0 ? "added" : "removed"}.`}
            </p>
          </Card>
          <dl className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl border border-line bg-surface p-3"><dt className="text-xs text-ink-faint">Moved</dt><dd className="mt-1 text-xl font-semibold">{preview.diff.moved.length}</dd></div>
            <div className="rounded-xl border border-line bg-surface p-3"><dt className="text-xs text-ink-faint">Added</dt><dd className="mt-1 text-xl font-semibold">{preview.diff.added.length}</dd></div>
            <div className="rounded-xl border border-line bg-surface p-3"><dt className="text-xs text-ink-faint">Removed</dt><dd className="mt-1 text-xl font-semibold">{preview.diff.removed.length}</dd></div>
          </dl>
          <section className="rounded-2xl border border-line bg-surface p-4">
            <h3 className="font-semibold">Weekly setting changes</h3>
            {previewSettingChanges.length > 0 ? (
              <ul className="mt-3 space-y-2 text-sm text-ink-soft">
                {previewSettingChanges.map((change) => (
                  <li key={change}>• {change}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-ink-soft">
                No structured weekly constraints changed.
              </p>
            )}
          </section>
          <section className="rounded-2xl border border-line bg-surface p-4">
            <h3 className="font-semibold">Study-block changes</h3>
            {preview.diff.moved.length === 0 &&
            preview.diff.added.length === 0 &&
            preview.diff.removed.length === 0 ? (
              <p className="mt-2 text-sm text-ink-soft">
                Every study block keeps the same day, time, and duration.
              </p>
            ) : (
              <div className="mt-3 space-y-4 text-sm">
                {preview.diff.moved.length > 0 && (
                  <div>
                    <h4 className="font-medium">
                      Moved ({preview.diff.moved.length})
                    </h4>
                    <ul className="mt-1 space-y-2 text-ink-soft">
                      {preview.diff.moved.map(({ before, after }, index) => (
                        <li key={`${before.id}-${after.id}-${index}`}>
                          {planBlockSummary(before, schedule)} →{" "}
                          {planBlockSummary(after, schedule)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {preview.diff.added.length > 0 && (
                  <div>
                    <h4 className="font-medium">
                      Added ({preview.diff.added.length})
                    </h4>
                    <ul className="mt-1 space-y-2 text-ink-soft">
                      {preview.diff.added.map((block, index) => (
                        <li key={`${block.id}-added-${index}`}>
                          {planBlockSummary(block, schedule)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {preview.diff.removed.length > 0 && (
                  <div>
                    <h4 className="font-medium">
                      Removed ({preview.diff.removed.length})
                    </h4>
                    <ul className="mt-1 space-y-2 text-ink-soft">
                      {preview.diff.removed.map((block, index) => (
                        <li key={`${block.id}-removed-${index}`}>
                          {planBlockSummary(block, schedule)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </section>
          {(preview.plan.warnings ?? []).length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <h3 className="font-semibold text-amber-950">Constraints in this preview</h3>
              <ul className="mt-2 space-y-2 text-sm text-amber-950">
                {(preview.plan.warnings ?? []).map((warning, index) => (
                  <li key={`${warning.code}-${warning.courseId ?? index}`}>• {warning.message}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <form id="week-adjustment-form" onSubmit={reviewManual} className="space-y-7">
          {formError && <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800" role="alert">{formError}</p>}

          <fieldset>
            <legend className="text-base font-semibold">Week capacity</legend>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium">Workload
                <select value={draft.load} onChange={(event) => setDraft((current) => ({ ...current, load: event.target.value as WeekContext["load"] }))} className={cn(inputClass, "mt-2")}>
                  {LOAD_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
              <label className="text-sm font-medium">Energy
                <select value={draft.energy} onChange={(event) => setDraft((current) => ({ ...current, energy: event.target.value as WeekContext["energy"] }))} className={cn(inputClass, "mt-2")}>
                  {ENERGY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
            </div>
            <label className="mt-4 block text-sm font-medium">Target study hours
              <input
                type="number"
                min={0.5}
                max={40}
                step={0.25}
                value={(draft.targetStudyMinutes ?? schedule.targetStudyMinutes) / 60}
                onChange={(event) => setDraft((current) => ({ ...current, targetStudyMinutes: Math.round(Number(event.target.value) * 4) * 15 }))}
                className={cn(inputClass, "mt-2 max-w-40")}
              />
            </label>
          </fieldset>

          <fieldset className="border-t border-line pt-6">
            <legend className="text-base font-semibold">Availability exceptions</legend>
            <p className="mt-1 text-sm text-ink-soft">Mark a whole day unavailable or add a one-off busy period.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {DAYS.map((day) => (
                <button
                  key={day}
                  type="button"
                  aria-pressed={draft.unavailableDays.includes(day)}
                  onClick={() => toggleDay(day)}
                  className={cn(
                    "min-h-11 rounded-xl border px-3 text-sm",
                    draft.unavailableDays.includes(day)
                      ? "border-brand-500 bg-brand-50 font-medium text-brand-700"
                      : "border-line bg-surface text-ink-soft",
                  )}
                >
                  {DAY_SHORT[day]}
                </button>
              ))}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <label className="text-sm font-medium">Busy day
                <select value={busyDay} onChange={(event) => setBusyDay(event.target.value as Day)} className={cn(inputClass, "mt-2")}>
                  {DAYS.map((day) => <option key={day}>{day}</option>)}
                </select>
              </label>
              <label className="text-sm font-medium">Starts
                <input type="time" step={900} value={busyStart} onChange={(event) => setBusyStart(event.target.value)} className={cn(inputClass, "mt-2")} />
              </label>
              <label className="text-sm font-medium">Ends
                <input type="time" step={900} value={busyEnd} onChange={(event) => setBusyEnd(event.target.value)} className={cn(inputClass, "mt-2")} />
              </label>
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={addBusyWindow} className="mt-3">
              <Plus className="size-4" aria-hidden /> Add busy time
            </Button>
            {(draft.busyWindows ?? []).length > 0 && (
              <ul className="mt-3 space-y-2">
                {(draft.busyWindows ?? []).map((window) => (
                  <li key={window.id} className="flex items-center justify-between gap-3 rounded-xl bg-line-soft px-3 py-2 text-sm">
                    <span>{window.day}, {formatMinute(window.startMinute)}–{formatMinute(window.endMinute)}</span>
                    <button
                      type="button"
                      aria-label={`Remove busy time on ${window.day}`}
                      onClick={() => setDraft((current) => ({ ...current, busyWindows: (current.busyWindows ?? []).filter((candidate) => candidate.id !== window.id) }))}
                      className="flex size-11 shrink-0 items-center justify-center rounded-lg text-ink-faint hover:bg-white hover:text-ink"
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </fieldset>

          {schedule.mode === "by-course" && (
            <fieldset className="border-t border-line pt-6">
              <legend className="text-base font-semibold">Course pressure</legend>
              <div className="mt-4 space-y-4">
                {schedule.courses.filter((course) => course.includedInPlan).map((course) => {
                  const target = draft.courseTargets?.find((item) => item.courseId === course.id);
                  return (
                    <div key={course.id} className="rounded-xl border border-line bg-surface p-3">
                      <p className="font-medium">{course.name}</p>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <label className="text-sm">Priority
                          <select value={target?.priority ?? "none"} onChange={(event) => setCourseTarget(course.id, event.target.value as "none" | "focus" | "urgent")} className={cn(inputClass, "mt-1")}>
                            <option value="none">Normal</option>
                            <option value="focus">Focus</option>
                            <option value="urgent">Urgent</option>
                          </select>
                        </label>
                        <label className="text-sm">Deadline day
                          <select value={target?.deadlineDay ?? ""} disabled={!target} onChange={(event) => setCourseDeadline(course.id, (event.target.value || null) as Day | null)} className={cn(inputClass, "mt-1 disabled:opacity-45")}>
                            <option value="">No deadline</option>
                            {DAYS.map((day) => <option key={day} value={day}>{day}</option>)}
                          </select>
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </fieldset>
          )}

          <fieldset className="border-t border-line pt-6">
            <legend className="text-base font-semibold">Obstacles this week</legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {FRICTION_META.map((friction) => (
                <button
                  key={friction.id}
                  type="button"
                  aria-pressed={draft.focusFrictions.includes(friction.id)}
                  onClick={() => toggleFriction(friction.id)}
                  className={cn(
                    "min-h-11 rounded-xl border px-3 text-sm",
                    draft.focusFrictions.includes(friction.id)
                      ? "border-brand-500 bg-brand-50 text-brand-700"
                      : "border-line text-ink-soft",
                  )}
                >
                  {friction.label}
                </button>
              ))}
            </div>
          </fieldset>

          <details className="border-t border-line pt-6">
            <summary className="flex min-h-11 cursor-pointer items-center gap-2 font-semibold">
              <Sparkles className="size-4 text-brand-600" aria-hidden /> Optional AI interpretation
            </summary>
            <div className="mt-3 rounded-2xl border border-brand-100 bg-brand-50/60 p-4">
              <label className="text-sm font-medium" htmlFor="weekly-ai-note">What changed?</label>
              <p className="mt-1 text-sm text-ink-soft">Sent only when you preview. Do not include names or sensitive details.</p>
              <textarea id="weekly-ai-note" value={note} maxLength={500} rows={4} onChange={(event) => setNote(event.target.value)} placeholder="Chemistry exam Friday, working Tuesday 5–9, and low energy this week." className={cn(inputClass, "mt-3 min-h-28 py-3")} />
              <div className="mt-2 flex items-center justify-between gap-3 text-xs text-ink-faint">
                <span>{note.length}/500</span>
                <Button type="button" size="sm" onClick={previewAi} disabled={interpreting || note.trim().length === 0}>
                  {interpreting ? "Reading changes…" : "Preview AI changes"}
                </Button>
              </div>
              {aiMessage && <p className="mt-3 text-sm text-ink-soft" role="status">{aiMessage}</p>}
              {proposal && (
                <div className="mt-4 rounded-xl border border-brand-200 bg-surface p-4" aria-live="polite">
                  <h3 className="font-semibold">Proposed structured changes</h3>
                  <ul className="mt-2 space-y-1 text-sm text-ink-soft">
                    {proposalSummary(proposal, schedule).map((line) => <li key={line}>• {line}</li>)}
                    {proposalSummary(proposal, schedule).length === 0 && <li>No confident changes found.</li>}
                  </ul>
                  {proposal.assumptions.length > 0 && <p className="mt-3 text-sm text-ink-soft"><strong>Assumptions:</strong> {proposal.assumptions.join(" ")}</p>}
                  {proposal.unresolved.length > 0 && <p className="mt-2 text-sm text-ink-soft"><strong>Needs your input:</strong> {proposal.unresolved.join(" ")}</p>}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button type="button" size="sm" onClick={() => applyProposalDraft(true)}>Use and review</Button>
                    <Button type="button" size="sm" variant="secondary" onClick={() => applyProposalDraft(false)}>Edit first</Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => setProposal(null)}>Discard</Button>
                  </div>
                </div>
              )}
            </div>
          </details>
        </form>
      )}
    </Sheet>
  );
}
