"use client";

import { useState } from "react";
import { CalendarCog, Plus, RotateCcw, Sparkles, Trash2 } from "lucide-react";
import { FRICTION_META } from "@/lib/data/axes";
import { DAYS, type Day, type Friction, type ScheduleSetup, type TemporaryBusyWindow, type WeekContext, type WeekTuningProposal } from "@/lib/types";
import { currentWeekStart, normalizeWeekContext } from "@/lib/week";
import { Button, Card, cn, inputClass } from "@/components/ui";

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

function proposalIntoWeek(
  current: WeekContext,
  proposal: WeekTuningProposal,
): WeekContext {
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
    proposal.targetStudyMinutes ? `Weekly target: ${Math.round((proposal.targetStudyMinutes / 60) * 10) / 10} hours` : null,
    ...proposal.unavailableDays.map((day) => `${day}: unavailable`),
    ...proposal.busyWindows.map(
      (window) => `${window.day}: busy ${formatMinute(window.startMinute)}–${formatMinute(window.endMinute)}`,
    ),
    ...proposal.courseTargets.map(
      (target) =>
        `${courseName.get(target.courseId) ?? "Course"}: ${target.priority}${target.deadlineDay ? ` through ${target.deadlineDay}` : ""}`,
    ),
    ...proposal.focusFrictions.map((friction) =>
      `Extra friction: ${FRICTION_META.find((item) => item.id === friction)?.label ?? friction}`,
    ),
  ].filter((item): item is string => Boolean(item));
}

export function WeekAdjuster({
  schedule,
  week,
  onApply,
  onUndo,
  canUndo,
}: {
  schedule: ScheduleSetup;
  week?: WeekContext;
  onApply: (week: WeekContext) => void;
  onUndo: () => void;
  canUndo: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(() => normalizeWeekContext(schedule, week));
  const [busyDay, setBusyDay] = useState<Day>("Monday");
  const [busyStart, setBusyStart] = useState("17:00");
  const [busyEnd, setBusyEnd] = useState("19:00");
  const [busyError, setBusyError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [interpreting, setInterpreting] = useState(false);
  const [proposal, setProposal] = useState<WeekTuningProposal | null>(null);
  const [aiMessage, setAiMessage] = useState<string | null>(null);

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
                  current.courseTargets?.find((target) => target.courseId === courseId)
                    ?.deadlineDay ?? null,
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
      endMinute <= startMinute
    ) {
      setBusyError("Choose an end time later than the start time.");
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
      busyWindows: [...(current.busyWindows ?? []).filter((window) => window.id !== next.id), next],
    }));
    setBusyError(null);
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
            targetStudyMinutes:
              draft.targetStudyMinutes ?? schedule.targetStudyMinutes,
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

  const acceptProposal = (applyNow: boolean) => {
    if (!proposal) return;
    const next = proposalIntoWeek(draft, proposal);
    setDraft(next);
    setProposal(null);
    setNote("");
    if (applyNow) onApply(next);
  };

  return (
    <Card className="no-print mt-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <CalendarCog className="size-5 text-brand-600" aria-hidden />
            Adjust this week
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            Temporary changes leave your recurring schedule untouched.
          </p>
        </div>
        <div className="flex gap-2">
          {canUndo && (
            <Button type="button" variant="ghost" size="sm" onClick={onUndo}>
              <RotateCcw className="size-4" aria-hidden /> Undo
            </Button>
          )}
          <Button type="button" variant="secondary" size="sm" onClick={() => setOpen((value) => !value)}>
            {open ? "Close" : "Adjust week"}
          </Button>
        </div>
      </div>

      {open && (
        <div className="mt-6 border-t border-line pt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium">
                  Workload
                  <select
                    value={draft.load}
                    onChange={(event) => setDraft((current) => ({ ...current, load: event.target.value as WeekContext["load"] }))}
                    className={cn(inputClass, "mt-2")}
                  >
                    {LOAD_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
                <label className="text-sm font-medium">
                  Energy
                  <select
                    value={draft.energy}
                    onChange={(event) => setDraft((current) => ({ ...current, energy: event.target.value as WeekContext["energy"] }))}
                    className={cn(inputClass, "mt-2")}
                  >
                    {ENERGY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
              </div>

              <label className="block text-sm font-medium">
                Target study hours
                <input
                  type="number"
                  min={0.5}
                  max={40}
                  step={0.5}
                  value={(draft.targetStudyMinutes ?? schedule.targetStudyMinutes) / 60}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      targetStudyMinutes: Math.round(Number(event.target.value) * 60),
                    }))
                  }
                  className={cn(inputClass, "mt-2 max-w-40")}
                />
              </label>

              <fieldset>
                <legend className="text-sm font-medium">Unavailable all day</legend>
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
              </fieldset>

              <fieldset>
                <legend className="text-sm font-medium">Temporary busy time</legend>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <select value={busyDay} onChange={(event) => setBusyDay(event.target.value as Day)} className={inputClass} aria-label="Busy day">
                    {DAYS.map((day) => <option key={day}>{day}</option>)}
                  </select>
                  <input type="time" step={900} value={busyStart} onChange={(event) => setBusyStart(event.target.value)} className={inputClass} aria-label="Busy time starts" />
                  <input type="time" step={900} value={busyEnd} onChange={(event) => setBusyEnd(event.target.value)} className={inputClass} aria-label="Busy time ends" />
                </div>
                <Button type="button" variant="secondary" size="sm" onClick={addBusyWindow} className="mt-3">
                  <Plus className="size-4" aria-hidden /> Add busy time
                </Button>
                {busyError && <p className="mt-2 text-sm text-rose-700" role="alert">{busyError}</p>}
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
            </div>

            <div className="space-y-6">
              {schedule.mode === "by-course" && (
                <fieldset>
                  <legend className="text-sm font-medium">Course pressure this week</legend>
                  <div className="mt-3 space-y-3">
                    {schedule.courses.filter((course) => course.includedInPlan).map((course) => {
                      const target = draft.courseTargets?.find((item) => item.courseId === course.id);
                      const value = target?.priority ?? "none";
                      return (
                        <div key={course.id} className="grid gap-2 text-sm sm:grid-cols-[1fr_auto_auto] sm:items-center">
                          <span>{course.name}</span>
                          <label className="sr-only" htmlFor={`course-pressure-${course.id}`}>Pressure for {course.name}</label>
                          <select id={`course-pressure-${course.id}`} value={value} onChange={(event) => setCourseTarget(course.id, event.target.value as "none" | "focus" | "urgent")} className="min-h-11 rounded-xl border border-line bg-surface px-3">
                            <option value="none">Normal</option>
                            <option value="focus">Focus</option>
                            <option value="urgent">Urgent</option>
                          </select>
                          <label className="sr-only" htmlFor={`course-deadline-${course.id}`}>Deadline day for {course.name}</label>
                          <select
                            id={`course-deadline-${course.id}`}
                            value={target?.deadlineDay ?? ""}
                            disabled={!target}
                            onChange={(event) => setCourseDeadline(course.id, (event.target.value || null) as Day | null)}
                            className="min-h-11 rounded-xl border border-line bg-surface px-3 disabled:opacity-45"
                          >
                            <option value="">No deadline</option>
                            {DAYS.map((day) => <option key={day} value={day}>{DAY_SHORT[day]}</option>)}
                          </select>
                        </div>
                      );
                    })}
                  </div>
                </fieldset>
              )}

              <details>
                <summary className="min-h-11 cursor-pointer text-sm font-medium">Focus obstacles</summary>
                <div className="mt-2 flex flex-wrap gap-2">
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
              </details>

              <div className="rounded-2xl border border-brand-100 bg-brand-50/60 p-5">
                <h3 className="flex items-center gap-2 font-semibold">
                  <Sparkles className="size-4 text-brand-600" aria-hidden />
                  Tell Scholara what changed
                </h3>
                <p className="mt-2 text-sm text-ink-soft">
                  This note is sent to the configured AI provider. Don&rsquo;t include names or sensitive details. It is not saved by Scholara.
                </p>
                <textarea
                  value={note}
                  maxLength={500}
                  rows={4}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Chemistry exam Friday, working Tuesday 5–9, and low energy this week."
                  className={cn(inputClass, "mt-4 min-h-28 py-3")}
                />
                <div className="mt-2 flex items-center justify-between gap-3 text-xs text-ink-faint">
                  <span>{note.length}/500</span>
                  <Button type="button" size="sm" onClick={previewAi} disabled={interpreting || note.trim().length === 0}>
                    {interpreting ? "Reading changes…" : "Preview AI changes"}
                  </Button>
                </div>
                {aiMessage && <p className="mt-3 text-sm text-ink-soft" role="status">{aiMessage}</p>}
              </div>
            </div>
          </div>

          {proposal && (
            <div className="mt-6 rounded-2xl border border-brand-200 bg-surface p-5" aria-live="polite">
              <h3 className="font-semibold">Review the proposed changes</h3>
              <ul className="mt-3 space-y-2 text-sm text-ink-soft">
                {proposalSummary(proposal, schedule).map((line) => <li key={line}>• {line}</li>)}
                {proposalSummary(proposal, schedule).length === 0 && <li>No confident changes found.</li>}
              </ul>
              {proposal.assumptions.length > 0 && <p className="mt-4 text-sm text-ink-soft"><strong>Assumptions:</strong> {proposal.assumptions.join(" ")}</p>}
              {proposal.unresolved.length > 0 && <p className="mt-2 text-sm text-ink-soft"><strong>Needs your input:</strong> {proposal.unresolved.join(" ")}</p>}
              <div className="mt-5 flex flex-wrap gap-3">
                <Button type="button" onClick={() => acceptProposal(true)}>Apply changes</Button>
                <Button type="button" variant="secondary" onClick={() => acceptProposal(false)}>Edit before applying</Button>
                <Button type="button" variant="ghost" onClick={() => setProposal(null)}>Discard</Button>
              </div>
            </div>
          )}

          <div className="mt-7 flex flex-wrap gap-3 border-t border-line pt-5">
            <Button type="button" onClick={() => onApply(draft)}>Apply manual changes</Button>
            <Button type="button" variant="ghost" onClick={() => setDraft(normalizeWeekContext(schedule, week))}>
              Reset form
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
