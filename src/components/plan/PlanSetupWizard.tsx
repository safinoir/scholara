"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  Clock3,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import {
  clearScheduleDraft,
  loadScheduleDraft,
  saveScheduleDraft,
  type ScheduleDraft,
} from "@/lib/storage";
import {
  COURSE_COLOR_KEYS,
  DAYS,
  type Course,
  type CoursePriority,
  type Day,
  type LearnerProfile,
  type RecurringClassMeeting,
  type ScheduleSetup,
  type StudyWindow,
} from "@/lib/types";
import {
  Badge,
  Button,
  Card,
  Field,
  Progress,
  cn,
  inputClass,
} from "@/components/ui";
import {
  formatClock,
  formatDayList,
  formatDuration,
  meetingConflictDays,
  minutesToTimeInput,
  normalizeStudyWindows,
  sortMeetings,
  sortStudyWindows,
  summarizeCapacity,
  timeInputToMinutes,
} from "./scheduleSetupUtils";

type PlanSetupWizardProps = {
  profile: LearnerProfile;
  onComplete: (schedule: ScheduleSetup) => void;
  onCancel?: () => void;
};

type WizardDraft = Omit<ScheduleDraft, "step"> & {
  version: 2;
  step: 1 | 2;
};

const STEPS = [
  { number: 1 as const, label: "Classes", icon: BookOpen },
  { number: 2 as const, label: "Study availability", icon: Clock3 },
];

const DAY_SHORT: Record<Day, string> = {
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
  Saturday: "Sat",
  Sunday: "Sun",
};

const COLOR_DOT: Record<(typeof COURSE_COLOR_KEYS)[number], string> = {
  indigo: "bg-indigo-500",
  teal: "bg-teal-500",
  sky: "bg-sky-500",
  violet: "bg-violet-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
};

const PRIORITY_LABELS: Record<CoursePriority, string> = {
  maintenance: "Keep light",
  standard: "Standard",
  focus: "Extra focus",
};

const PRESETS: Array<{
  label: string;
  detail: string;
  days: Day[];
  startMinute: number;
  endMinute: number;
}> = [
  {
    label: "Weekday mornings",
    detail: "Mon-Fri, 7-9 AM",
    days: DAYS.slice(0, 5) as Day[],
    startMinute: 7 * 60,
    endMinute: 9 * 60,
  },
  {
    label: "Weeknights",
    detail: "Mon-Fri, 6-9 PM",
    days: DAYS.slice(0, 5) as Day[],
    startMinute: 18 * 60,
    endMinute: 21 * 60,
  },
  {
    label: "Weekends",
    detail: "Sat-Sun, 10 AM-2 PM",
    days: DAYS.slice(5) as Day[],
    startMinute: 10 * 60,
    endMinute: 14 * 60,
  },
];

let fallbackId = 0;

function makeId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  fallbackId += 1;
  return `${prefix}-${Date.now()}-${fallbackId}`;
}

function cloneSchedule(schedule: ScheduleSetup): ScheduleSetup {
  return {
    ...schedule,
    mode: "by-course",
    courses: schedule.courses.map((course) => ({ ...course })),
    classMeetings: schedule.classMeetings.map((meeting) => ({
      ...meeting,
      days: [...meeting.days],
    })),
    studyWindows: schedule.studyWindows.map((window) => ({
      ...window,
      days: [...window.days],
    })),
  };
}

function initialWizard(profile: LearnerProfile): WizardDraft {
  const savedDraft = loadScheduleDraft();
  if (savedDraft) {
    const currentDraft = savedDraft as ScheduleDraft & { version?: number };
    const schedule = cloneSchedule(savedDraft.schedule);
    const courseIds = new Set(schedule.courses.map((course) => course.id));
    const classesAreLinked = schedule.classMeetings.every(
      (meeting) => meeting.courseId && courseIds.has(meeting.courseId),
    );
    const coursesAreReady = courseValidationMessage(schedule) === null;
    return {
      version: 2,
      step:
        classesAreLinked &&
        coursesAreReady &&
        ((currentDraft.version === 2 && currentDraft.step === 2) ||
          (currentDraft.version !== 2 && currentDraft.step === 3))
          ? 2
          : 1,
      schedule,
    };
  }

  if (profile.schedule) {
    return {
      version: 2,
      step: 1,
      schedule: cloneSchedule(profile.schedule),
    };
  }

  return {
    version: 2,
    step: 1,
    schedule: {
      mode: "by-course",
      courses: [],
      classMeetings: [],
      studyWindows: [],
      targetStudyMinutes: 0,
    },
  };
}

function toggleDay(days: Day[], day: Day): Day[] {
  return days.includes(day)
    ? days.filter((candidate) => candidate !== day)
    : DAYS.filter((candidate) => candidate === day || days.includes(candidate));
}

function courseValidationMessage(schedule: ScheduleSetup): string | null {
  if (schedule.courses.length === 0) {
    return "Add at least one course to build a weekly plan.";
  }
  if (schedule.courses.length > 20) {
    return "Keep this plan to 20 courses or fewer.";
  }
  const names = schedule.courses.map((course) => course.name.trim());
  if (names.some((name) => name.length === 0)) {
    return "Every saved course needs a name.";
  }
  if (new Set(names.map((name) => name.toLowerCase())).size !== names.length) {
    return "Course names must be unique.";
  }
  if (!schedule.courses.some((course) => course.includedInPlan)) {
    return "Include at least one course in your study plan.";
  }
  return null;
}

function hasInvalidMeeting(
  meeting: RecurringClassMeeting,
  courseIds: Set<string>,
): boolean {
  return (
    !meeting.courseId ||
    !courseIds.has(meeting.courseId) ||
    meeting.label.trim().length === 0 ||
    meeting.days.length === 0 ||
    meeting.startMinute < 0 ||
    meeting.endMinute > 1440 ||
    meeting.endMinute <= meeting.startMinute ||
    meeting.startMinute % 15 !== 0 ||
    meeting.endMinute % 15 !== 0
  );
}

function hasInvalidWindow(window: StudyWindow): boolean {
  return (
    window.days.length === 0 ||
    window.startMinute < 0 ||
    window.endMinute > 1440 ||
    window.endMinute <= window.startMinute ||
    window.startMinute % 15 !== 0 ||
    window.endMinute % 15 !== 0
  );
}

function DayPicker({
  legend,
  days,
  onChange,
}: {
  legend: string;
  days: Day[];
  onChange: (days: Day[]) => void;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-medium text-ink">{legend}</legend>
      <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-7">
        {DAYS.map((day) => {
          const selected = days.includes(day);
          return (
            <button
              key={day}
              type="button"
              aria-pressed={selected}
              aria-label={day}
              onClick={() => onChange(toggleDay(days, day))}
              className={cn(
                "min-h-11 rounded-xl border px-2 text-sm font-medium transition-colors",
                selected
                  ? "border-brand-500 bg-brand-50 text-brand-700"
                  : "border-line bg-white text-ink-soft hover:border-brand-200",
              )}
            >
              {DAY_SHORT[day]}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function InlineError({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>{children}</span>
    </div>
  );
}

export function PlanSetupWizard({
  profile,
  onComplete,
  onCancel,
}: PlanSetupWizardProps) {
  const [wizard, setWizard] = useState<WizardDraft>(() =>
    initialWizard(profile),
  );
  const [courseName, setCourseName] = useState("");
  const [courseFormError, setCourseFormError] = useState<string | null>(null);

  const [meetingCourseId, setMeetingCourseId] = useState("");
  const [meetingDays, setMeetingDays] = useState<Day[]>([]);
  const [meetingStart, setMeetingStart] = useState(9 * 60);
  const [meetingEnd, setMeetingEnd] = useState(10 * 60);
  const [editingMeetingId, setEditingMeetingId] = useState<string | null>(null);
  const [meetingFormError, setMeetingFormError] = useState<string | null>(null);

  const [windowDays, setWindowDays] = useState<Day[]>([]);
  const [windowStart, setWindowStart] = useState(18 * 60);
  const [windowEnd, setWindowEnd] = useState(20 * 60);
  const [editingWindowId, setEditingWindowId] = useState<string | null>(null);
  const [windowFormError, setWindowFormError] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const schedule = wizard.schedule;
  const courseError = courseValidationMessage(schedule);
  const courseIds = new Set(schedule.courses.map((course) => course.id));
  const conflictDays = meetingConflictDays(schedule.classMeetings);
  const meetingsInvalid =
    schedule.classMeetings.length > 80 ||
    schedule.classMeetings.some((meeting) =>
      hasInvalidMeeting(meeting, courseIds),
    );
  const normalizedWindows = normalizeStudyWindows(schedule.studyWindows);
  const windowsInvalid =
    schedule.studyWindows.length > 40 ||
    normalizedWindows.length > 40 ||
    schedule.studyWindows.some(hasInvalidWindow);
  const hasUsableWindow = normalizedWindows.some(
    (window) => window.endMinute - window.startMinute >= 30,
  );
  const capacity = summarizeCapacity(schedule);
  const hasUsableCapacity = capacity.usableMinutes >= 30;
  const targetValid =
    Number.isInteger(schedule.targetStudyMinutes) &&
    schedule.targetStudyMinutes >= 30 &&
    schedule.targetStudyMinutes <= 2400;
  const canGenerate =
    !courseError &&
    !meetingsInvalid &&
    conflictDays.size === 0 &&
    !windowsInvalid &&
    hasUsableWindow &&
    hasUsableCapacity &&
    targetValid;

  useEffect(() => {
    const timeout = window.setTimeout(() => saveScheduleDraft(wizard), 150);
    return () => window.clearTimeout(timeout);
  }, [wizard]);

  useEffect(() => {
    headingRef.current?.focus();
  }, [wizard.step]);

  function updateSchedule(
    update: (current: ScheduleSetup) => ScheduleSetup,
  ): void {
    setWizard((current) => ({
      ...current,
      schedule: { ...update(current.schedule), mode: "by-course" },
    }));
  }

  function goToStep(step: 1 | 2): void {
    setWizard((current) => ({ ...current, step }));
  }

  function addCourse(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const name = courseName.trim();
    if (!name) {
      setCourseFormError("Enter a course name first.");
      return;
    }
    if (
      schedule.courses.some(
        (course) => course.name.trim().toLowerCase() === name.toLowerCase(),
      )
    ) {
      setCourseFormError("That course is already in your list.");
      return;
    }
    if (schedule.courses.length >= 20) {
      setCourseFormError("You can add up to 20 courses.");
      return;
    }

    const course: Course = {
      id: makeId("course"),
      name,
      colorKey:
        COURSE_COLOR_KEYS[schedule.courses.length % COURSE_COLOR_KEYS.length],
      includedInPlan: true,
      priority: "standard",
    };
    updateSchedule((current) => ({
      ...current,
      courses: [...current.courses, course],
    }));
    if (!meetingCourseId) setMeetingCourseId(course.id);
    setCourseName("");
    setCourseFormError(null);
  }

  function updateCourse(
    courseId: string,
    patch: Partial<Pick<Course, "name" | "includedInPlan" | "priority">>,
  ): void {
    updateSchedule((current) => ({
      ...current,
      courses: current.courses.map((course) =>
        course.id === courseId ? { ...course, ...patch } : course,
      ),
      classMeetings:
        patch.name === undefined
          ? current.classMeetings
          : current.classMeetings.map((meeting) =>
              meeting.courseId === courseId
                ? { ...meeting, label: patch.name ?? meeting.label }
                : meeting,
            ),
    }));
  }

  function removeCourse(courseId: string): void {
    updateSchedule((current) => ({
      ...current,
      courses: current.courses.filter((course) => course.id !== courseId),
      classMeetings: current.classMeetings.filter(
        (meeting) => meeting.courseId !== courseId,
      ),
    }));
    if (meetingCourseId === courseId) setMeetingCourseId("");
  }

  function resetMeetingForm(): void {
    setMeetingCourseId(schedule.courses[0]?.id ?? "");
    setMeetingDays([]);
    setMeetingStart(9 * 60);
    setMeetingEnd(10 * 60);
    setEditingMeetingId(null);
    setMeetingFormError(null);
  }

  function submitMeeting(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const course = schedule.courses.find(
      (candidate) => candidate.id === meetingCourseId,
    );
    if (!course) {
      setMeetingFormError("Choose the course this meeting belongs to.");
      return;
    }
    if (meetingDays.length === 0) {
      setMeetingFormError("Choose at least one day.");
      return;
    }
    if (meetingEnd <= meetingStart) {
      setMeetingFormError("End time must be later than start time.");
      return;
    }
    if (!editingMeetingId && schedule.classMeetings.length >= 80) {
      setMeetingFormError("You can add up to 80 recurring meeting patterns.");
      return;
    }

    const candidate: RecurringClassMeeting = {
      id: editingMeetingId ?? makeId("class"),
      courseId: course.id,
      label: course.name.trim(),
      days: DAYS.filter((day) => meetingDays.includes(day)),
      startMinute: meetingStart,
      endMinute: meetingEnd,
    };
    const nextMeetings = editingMeetingId
      ? schedule.classMeetings.map((meeting) =>
          meeting.id === editingMeetingId ? candidate : meeting,
        )
      : [...schedule.classMeetings, candidate];

    if (meetingConflictDays(nextMeetings).has(candidate.id)) {
      setMeetingFormError(
        "This meeting overlaps another class. Change the day or time.",
      );
      return;
    }

    updateSchedule((current) => ({
      ...current,
      classMeetings: nextMeetings,
    }));
    resetMeetingForm();
  }

  function editMeeting(meeting: RecurringClassMeeting): void {
    setMeetingCourseId(meeting.courseId ?? "");
    setMeetingDays([...meeting.days]);
    setMeetingStart(meeting.startMinute);
    setMeetingEnd(meeting.endMinute);
    setEditingMeetingId(meeting.id);
    setMeetingFormError(null);
    document.getElementById("class-meeting-form")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function removeMeeting(meetingId: string): void {
    updateSchedule((current) => ({
      ...current,
      classMeetings: current.classMeetings.filter(
        (meeting) => meeting.id !== meetingId,
      ),
    }));
    if (editingMeetingId === meetingId) resetMeetingForm();
  }

  function resetWindowForm(): void {
    setWindowDays([]);
    setWindowStart(18 * 60);
    setWindowEnd(20 * 60);
    setEditingWindowId(null);
    setWindowFormError(null);
  }

  function submitWindow(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (windowDays.length === 0) {
      setWindowFormError("Choose at least one day.");
      return;
    }
    if (windowEnd <= windowStart) {
      setWindowFormError("End time must be later than start time.");
      return;
    }
    if (windowEnd - windowStart < 30) {
      setWindowFormError("Study windows must be at least 30 minutes long.");
      return;
    }
    if (!editingWindowId && schedule.studyWindows.length >= 40) {
      setWindowFormError("You can add up to 40 study windows.");
      return;
    }

    const candidate: StudyWindow = {
      id: editingWindowId ?? makeId("window"),
      days: DAYS.filter((day) => windowDays.includes(day)),
      startMinute: windowStart,
      endMinute: windowEnd,
    };
    updateSchedule((current) => ({
      ...current,
      studyWindows: editingWindowId
        ? current.studyWindows.map((window) =>
            window.id === editingWindowId ? candidate : window,
          )
        : [...current.studyWindows, candidate],
    }));
    resetWindowForm();
  }

  function editWindow(window: StudyWindow): void {
    setWindowDays([...window.days]);
    setWindowStart(window.startMinute);
    setWindowEnd(window.endMinute);
    setEditingWindowId(window.id);
    setWindowFormError(null);
    document.getElementById("study-window-form")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function removeWindow(windowId: string): void {
    updateSchedule((current) => ({
      ...current,
      studyWindows: current.studyWindows.filter(
        (window) => window.id !== windowId,
      ),
    }));
    if (editingWindowId === windowId) resetWindowForm();
  }

  function applyPreset(preset: (typeof PRESETS)[number]): void {
    const alreadyAdded = schedule.studyWindows.some(
      (window) =>
        window.startMinute === preset.startMinute &&
        window.endMinute === preset.endMinute &&
        window.days.length === preset.days.length &&
        preset.days.every((day) => window.days.includes(day)),
    );
    if (alreadyAdded) return;
    if (schedule.studyWindows.length >= 40) {
      setWindowFormError("You can add up to 40 study windows.");
      return;
    }

    updateSchedule((current) => ({
      ...current,
      studyWindows: [
        ...current.studyWindows,
        {
          id: makeId("window"),
          days: [...preset.days],
          startMinute: preset.startMinute,
          endMinute: preset.endMinute,
        },
      ],
    }));
  }

  function finishSetup(): void {
    if (!canGenerate) return;
    const courseNames = new Map(
      schedule.courses.map((course) => [course.id, course.name.trim()]),
    );
    const finalSchedule: ScheduleSetup = {
      ...schedule,
      mode: "by-course",
      courses: schedule.courses.map((course) => ({
        ...course,
        name: course.name.trim(),
      })),
      classMeetings: sortMeetings(schedule.classMeetings).map((meeting) => ({
        ...meeting,
        label: courseNames.get(meeting.courseId ?? "") ?? meeting.label.trim(),
        days: DAYS.filter((day) => meeting.days.includes(day)),
      })),
      studyWindows: normalizeStudyWindows(schedule.studyWindows),
    };
    clearScheduleDraft();
    onComplete(finalSchedule);
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:py-14">
      <header className="max-w-2xl">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">
          Weekly Plan setup
        </p>
        <h1 className="text-3xl font-semibold sm:text-4xl">
          Build around the week you actually have
        </h1>
        <p className="mt-3 text-ink-soft">
          Add your classes and the hours you can realistically study. Scholara
          will assign every study block to a course and one of your methods.
        </p>
      </header>

      <nav aria-label="Schedule setup progress" className="mt-8">
        <Progress
          value={wizard.step}
          max={2}
          label={`Schedule setup step ${wizard.step} of 2`}
        />
        <ol className="mt-4 grid grid-cols-2 gap-2">
          {STEPS.map(({ number, label, icon: Icon }) => {
            const active = wizard.step === number;
            const complete = wizard.step > number;
            return (
              <li key={number}>
                <button
                  type="button"
                  disabled={number > wizard.step}
                  aria-current={active ? "step" : undefined}
                  onClick={() => goToStep(number)}
                  className={cn(
                    "flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-2 text-xs font-medium sm:text-sm",
                    active && "bg-brand-50 text-brand-700",
                    complete && "text-ink hover:bg-line-soft",
                    number > wizard.step && "cursor-not-allowed text-ink-faint",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-full border text-xs",
                      (active || complete) &&
                        "border-brand-500 bg-brand-500 text-white",
                      !active && !complete && "border-line",
                    )}
                    aria-hidden
                  >
                    {complete ? (
                      <Check className="size-3.5" />
                    ) : (
                      <Icon className="size-3.5" />
                    )}
                  </span>
                  <span>{label}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="mt-10 animate-rise" key={wizard.step}>
        {wizard.step === 1 && (
          <section aria-labelledby="schedule-step-heading">
            <h2
              id="schedule-step-heading"
              ref={headingRef}
              tabIndex={-1}
              className="text-2xl font-semibold sm:text-3xl"
            >
              Add your classes
            </h2>
            <p className="mt-2 max-w-2xl text-ink-soft">
              Tell Scholara which courses need study time and when their
              recurring meetings happen. Asynchronous courses can have no class
              time.
            </p>

            <Card className="mt-7">
              <form
                onSubmit={addCourse}
                className="flex flex-col gap-3 sm:flex-row sm:items-end"
              >
                <div className="flex-1">
                  <Field label="Course name" htmlFor="new-course-name">
                    <input
                      id="new-course-name"
                      value={courseName}
                      onChange={(event) => {
                        setCourseName(event.target.value);
                        setCourseFormError(null);
                      }}
                      maxLength={80}
                      placeholder="e.g. Organic Chemistry"
                      className={inputClass}
                    />
                  </Field>
                </div>
                <Button type="submit">
                  <Plus className="size-4" aria-hidden />
                  Add course
                </Button>
              </form>
              {courseFormError && (
                <div className="mt-3">
                  <InlineError>{courseFormError}</InlineError>
                </div>
              )}
            </Card>

            {schedule.courses.length > 0 && (
              <div className="mt-4 space-y-3" aria-label="Saved courses">
                {schedule.courses.map((course) => (
                  <Card key={course.id} className="p-4">
                    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-end">
                      <Field
                        label="Course name"
                        htmlFor={`course-name-${course.id}`}
                      >
                        <div className="relative">
                          <span
                            className={cn(
                              "absolute left-4 top-1/2 size-3 -translate-y-1/2 rounded-full",
                              COLOR_DOT[course.colorKey],
                            )}
                            aria-hidden
                          />
                          <input
                            id={`course-name-${course.id}`}
                            value={course.name}
                            onChange={(event) =>
                              updateCourse(course.id, {
                                name: event.target.value,
                              })
                            }
                            maxLength={80}
                            className={cn(inputClass, "pl-10")}
                          />
                        </div>
                      </Field>

                      <Field
                        label="Study priority"
                        htmlFor={`priority-${course.id}`}
                      >
                        <select
                          id={`priority-${course.id}`}
                          value={course.priority}
                          disabled={!course.includedInPlan}
                          onChange={(event) =>
                            updateCourse(course.id, {
                              priority: event.target.value as CoursePriority,
                            })
                          }
                          className={cn(inputClass, "min-w-36")}
                        >
                          {Object.entries(PRIORITY_LABELS).map(
                            ([value, label]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ),
                          )}
                        </select>
                      </Field>

                      <div className="flex items-center gap-1">
                        <label className="flex min-h-12 items-center gap-2 rounded-xl border border-line px-3 text-sm font-medium">
                          <input
                            type="checkbox"
                            checked={course.includedInPlan}
                            onChange={(event) =>
                              updateCourse(course.id, {
                                includedInPlan: event.target.checked,
                              })
                            }
                            className="size-5 rounded accent-brand-600"
                          />
                          Study this course
                        </label>
                        <button
                          type="button"
                          onClick={() => removeCourse(course.id)}
                          className="flex size-12 shrink-0 items-center justify-center rounded-xl text-ink-faint hover:bg-rose-50 hover:text-rose-700"
                          aria-label={`Remove ${course.name || "course"}`}
                        >
                          <Trash2 className="size-4" aria-hidden />
                        </button>
                      </div>
                    </div>
                    {!course.includedInPlan && (
                      <p className="mt-3 text-sm text-ink-faint">
                        Its meetings stay on the calendar, but it will not
                        receive study blocks.
                      </p>
                    )}
                  </Card>
                ))}
              </div>
            )}

            <div className="mt-10 flex items-baseline justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">Class times</h3>
                <p className="mt-1 text-sm text-ink-soft">
                  Optional for asynchronous courses. Add lectures and labs as
                  separate patterns.
                </p>
              </div>
              <Badge>
                {schedule.classMeetings.length}{" "}
                {schedule.classMeetings.length === 1 ? "pattern" : "patterns"}
              </Badge>
            </div>

            <Card id="class-meeting-form" className="mt-4 scroll-mt-24">
              <form onSubmit={submitMeeting} className="space-y-5">
                <Field label="Course" htmlFor="meeting-course">
                  <select
                    id="meeting-course"
                    value={meetingCourseId}
                    disabled={schedule.courses.length === 0}
                    onChange={(event) => {
                      setMeetingCourseId(event.target.value);
                      setMeetingFormError(null);
                    }}
                    className={inputClass}
                  >
                    <option value="">Choose a course</option>
                    {schedule.courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.name || "Unnamed course"}
                      </option>
                    ))}
                  </select>
                </Field>

                <DayPicker
                  legend="Meeting days"
                  days={meetingDays}
                  onChange={(days) => {
                    setMeetingDays(days);
                    setMeetingFormError(null);
                  }}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Starts" htmlFor="meeting-start">
                    <input
                      id="meeting-start"
                      type="time"
                      step={900}
                      value={minutesToTimeInput(meetingStart)}
                      onChange={(event) => {
                        setMeetingStart(timeInputToMinutes(event.target.value));
                        setMeetingFormError(null);
                      }}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Ends" htmlFor="meeting-end">
                    <input
                      id="meeting-end"
                      type="time"
                      step={900}
                      value={minutesToTimeInput(meetingEnd)}
                      onChange={(event) => {
                        setMeetingEnd(
                          timeInputToMinutes(event.target.value, true),
                        );
                        setMeetingFormError(null);
                      }}
                      className={inputClass}
                    />
                  </Field>
                </div>

                {meetingFormError && (
                  <InlineError>{meetingFormError}</InlineError>
                )}

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="submit"
                    disabled={schedule.courses.length === 0}
                  >
                    {editingMeetingId ? (
                      <Check className="size-4" aria-hidden />
                    ) : (
                      <Plus className="size-4" aria-hidden />
                    )}
                    {editingMeetingId ? "Save changes" : "Add class meeting"}
                  </Button>
                  {editingMeetingId && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={resetMeetingForm}
                    >
                      Cancel edit
                    </Button>
                  )}
                </div>
              </form>
            </Card>

            {schedule.classMeetings.length > 0 && (
              <div className="mt-3 space-y-3">
                {sortMeetings(schedule.classMeetings).map((meeting) => {
                  const conflict = conflictDays.get(meeting.id);
                  const linkedCourse = schedule.courses.find(
                    (course) => course.id === meeting.courseId,
                  );
                  return (
                    <Card
                      key={meeting.id}
                      className={cn(
                        "p-4",
                        (conflict || !linkedCourse) && "border-rose-300",
                      )}
                    >
                      <div className="flex items-start gap-4">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">
                            {linkedCourse?.name || meeting.label}
                          </p>
                          <p className="mt-1 text-sm text-ink-soft">
                            {formatDayList(meeting.days)} ·{" "}
                            {formatClock(meeting.startMinute)}-
                            {formatClock(meeting.endMinute)}
                          </p>
                          {!linkedCourse && (
                            <p role="alert" className="mt-2 text-sm text-rose-700">
                              Choose a course for this legacy class time.
                            </p>
                          )}
                          {conflict && (
                            <p role="alert" className="mt-2 text-sm text-rose-700">
                              Overlaps another class on {formatDayList(conflict)}.
                            </p>
                          )}
                        </div>
                        <div className="flex shrink-0 gap-1">
                          <button
                            type="button"
                            onClick={() => editMeeting(meeting)}
                            className="flex size-11 items-center justify-center rounded-xl text-ink-faint hover:bg-line-soft hover:text-ink"
                            aria-label={`Edit ${meeting.label}`}
                          >
                            <Pencil className="size-4" aria-hidden />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeMeeting(meeting.id)}
                            className="flex size-11 items-center justify-center rounded-xl text-ink-faint hover:bg-rose-50 hover:text-rose-700"
                            aria-label={`Remove ${meeting.label}`}
                          >
                            <Trash2 className="size-4" aria-hidden />
                          </button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}

            <div className="mt-5 space-y-3">
              {courseError && <InlineError>{courseError}</InlineError>}
              {meetingsInvalid && (
                <InlineError>
                  Link every class time to a course and fix missing days,
                  invalid times, or too many saved patterns.
                </InlineError>
              )}
            </div>

            <div className="mt-8 flex flex-col-reverse gap-3 border-t border-line pt-5 sm:flex-row sm:items-center">
              {onCancel && (
                <Button variant="ghost" onClick={onCancel}>
                  Cancel
                </Button>
              )}
              <Button
                className="sm:ml-auto"
                onClick={() => goToStep(2)}
                disabled={
                  Boolean(courseError) ||
                  meetingsInvalid ||
                  conflictDays.size > 0
                }
              >
                Continue to study availability
                <ArrowRight className="size-4" aria-hidden />
              </Button>
            </div>
          </section>
        )}

        {wizard.step === 2 && (
          <section aria-labelledby="schedule-step-heading">
            <h2
              id="schedule-step-heading"
              ref={headingRef}
              tabIndex={-1}
              className="text-2xl font-semibold sm:text-3xl"
            >
              When can you realistically study?
            </h2>
            <p className="mt-2 max-w-2xl text-ink-soft">
              These windows are hard boundaries. Scholara will never place a
              study block outside them.
            </p>

            <div className="mt-7">
              <h3 className="text-sm font-semibold">Quick presets</h3>
              <p className="mt-1 text-sm text-ink-faint">
                Add one, then review or edit every window below.
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className="min-h-20 rounded-xl border border-line bg-surface p-4 text-left transition-colors hover:border-brand-200 hover:bg-brand-50/40"
                  >
                    <span className="block text-sm font-medium">
                      {preset.label}
                    </span>
                    <span className="mt-1 block text-sm text-ink-faint">
                      {preset.detail}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <Card id="study-window-form" className="mt-7 scroll-mt-24">
              <form onSubmit={submitWindow} className="space-y-5">
                <DayPicker
                  legend="Days you can study"
                  days={windowDays}
                  onChange={(days) => {
                    setWindowDays(days);
                    setWindowFormError(null);
                  }}
                />
                <p className="-mt-3 text-sm text-ink-faint">
                  Select several days to copy this time window across them.
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Available from" htmlFor="window-start">
                    <input
                      id="window-start"
                      type="time"
                      step={900}
                      value={minutesToTimeInput(windowStart)}
                      onChange={(event) => {
                        setWindowStart(timeInputToMinutes(event.target.value));
                        setWindowFormError(null);
                      }}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Available until" htmlFor="window-end">
                    <input
                      id="window-end"
                      type="time"
                      step={900}
                      value={minutesToTimeInput(windowEnd)}
                      onChange={(event) => {
                        setWindowEnd(
                          timeInputToMinutes(event.target.value, true),
                        );
                        setWindowFormError(null);
                      }}
                      className={inputClass}
                    />
                  </Field>
                </div>

                {windowFormError && (
                  <InlineError>{windowFormError}</InlineError>
                )}

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button type="submit">
                    {editingWindowId ? (
                      <Check className="size-4" aria-hidden />
                    ) : (
                      <Plus className="size-4" aria-hidden />
                    )}
                    {editingWindowId ? "Save changes" : "Add study window"}
                  </Button>
                  {editingWindowId && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={resetWindowForm}
                    >
                      Cancel edit
                    </Button>
                  )}
                </div>
              </form>
            </Card>

            <div className="mt-7">
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="text-lg font-semibold">Confirmed windows</h3>
                <Badge>
                  {schedule.studyWindows.length}{" "}
                  {schedule.studyWindows.length === 1 ? "window" : "windows"}
                </Badge>
              </div>

              {schedule.studyWindows.length === 0 ? (
                <div className="mt-3 rounded-2xl border border-dashed border-line px-5 py-8 text-center text-sm text-ink-soft">
                  Add at least one window of 30 minutes or longer.
                </div>
              ) : (
                <div className="mt-3 space-y-3">
                  {sortStudyWindows(schedule.studyWindows).map((window) => (
                    <Card key={window.id} className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">
                            {formatDayList(window.days)}
                          </p>
                          <p className="mt-1 text-sm text-ink-soft">
                            {formatClock(window.startMinute)}-
                            {formatClock(window.endMinute)} ·{" "}
                            {formatDuration(
                              window.endMinute - window.startMinute,
                            )}
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-1">
                          <button
                            type="button"
                            onClick={() => editWindow(window)}
                            className="flex size-11 items-center justify-center rounded-xl text-ink-faint hover:bg-line-soft hover:text-ink"
                            aria-label={`Edit study window on ${formatDayList(window.days)}`}
                          >
                            <Pencil className="size-4" aria-hidden />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeWindow(window.id)}
                            className="flex size-11 items-center justify-center rounded-xl text-ink-faint hover:bg-rose-50 hover:text-rose-700"
                            aria-label={`Remove study window on ${formatDayList(window.days)}`}
                          >
                            <Trash2 className="size-4" aria-hidden />
                          </button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <Card className="mt-8">
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_2fr] lg:items-end">
                <Field
                  label="How many of these available hours do you actually want to commit?"
                  hint="This is your goal, not your total free time."
                  htmlFor="study-target"
                >
                  <div className="relative">
                    <input
                      id="study-target"
                      type="number"
                      min={0.5}
                      max={40}
                      step={0.5}
                      value={
                        schedule.targetStudyMinutes > 0
                          ? schedule.targetStudyMinutes / 60
                          : ""
                      }
                      onChange={(event) => {
                        const hours = Number(event.target.value);
                        updateSchedule((current) => ({
                          ...current,
                          targetStudyMinutes: Number.isFinite(hours)
                            ? Math.round(hours * 4) * 15
                            : 0,
                        }));
                      }}
                      className={cn(inputClass, "pr-20")}
                    />
                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-ink-faint">
                      hours
                    </span>
                  </div>
                </Field>

                <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {[
                    ["Available", capacity.availableMinutes, "Window time"],
                    [
                      "In class",
                      capacity.availableMinutes - capacity.usableMinutes,
                      "Removed",
                    ],
                    ["Target", schedule.targetStudyMinutes, "Your goal"],
                    ["Can plan", capacity.plannedMinutes, "Feasible"],
                    ["Buffer", capacity.bufferMinutes, "Still open"],
                    ["Shortfall", capacity.shortfallMinutes, "Cannot fit"],
                  ].map(([label, minutes, detail]) => (
                    <div key={String(label)} className="rounded-xl bg-line-soft p-3">
                      <dt className="text-xs font-medium text-ink-faint">
                        {label}
                      </dt>
                      <dd className="mt-1 font-semibold">
                        {formatDuration(Number(minutes))}
                      </dd>
                      <dd className="mt-0.5 text-xs text-ink-faint">
                        {detail}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </Card>

            {capacity.availableMinutes > capacity.usableMinutes && (
              <p className="mt-4 rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-700">
                Classes remove{" "}
                {formatDuration(
                  capacity.availableMinutes - capacity.usableMinutes,
                )}{" "}
                from these study windows. The feasible total already accounts
                for that overlap.
              </p>
            )}

            {capacity.shortfallMinutes > 0 && targetValid && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Your target is {formatDuration(capacity.shortfallMinutes)} over
                usable capacity. Scholara will still create the strongest plan
                that fits and show the unplanned time.
              </div>
            )}

            <div className="mt-5 space-y-3">
              {!hasUsableWindow && (
                <InlineError>
                  Add at least one study window of 30 minutes or longer.
                </InlineError>
              )}
              {hasUsableWindow && !hasUsableCapacity && (
                <InlineError>
                  Make at least 30 minutes available outside your class times.
                </InlineError>
              )}
              {windowsInvalid && (
                <InlineError>
                  Fix study windows with missing days, invalid times, or too
                  many saved windows.
                </InlineError>
              )}
              {!targetValid && (
                <InlineError>
                  Set a weekly target between 30 minutes and 40 hours.
                </InlineError>
              )}
            </div>

            <div className="mt-8 flex items-center gap-3 border-t border-line pt-5">
              <Button variant="ghost" onClick={() => goToStep(1)}>
                <ArrowLeft className="size-4" aria-hidden />
                Back
              </Button>
              <Button
                size="lg"
                className="ml-auto"
                onClick={finishSetup}
                disabled={!canGenerate}
              >
                Generate my weekly plan
                <ArrowRight className="size-4" aria-hidden />
              </Button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
