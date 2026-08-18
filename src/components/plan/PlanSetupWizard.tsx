"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import { z } from "zod";
import { scheduleSetupSchema } from "@/lib/schema";
import {
  clearScheduleDraft,
  loadScheduleDraft,
  saveScheduleDraft,
  type ScheduleDraft,
} from "@/lib/storage";
import {
  COURSE_COLOR_KEYS,
  COURSE_PRIORITIES,
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
  summarizeCapacity,
  timeInputToMinutes,
} from "./scheduleSetupUtils";

export type PlanSetupSubmitResult =
  | { success: true }
  | { success: false; message: string };

type PlanSetupWizardProps = {
  profile: LearnerProfile;
  onComplete: (schedule: ScheduleSetup) => PlanSetupSubmitResult;
  onDiscard?: () => void;
};

type WizardDraft = Omit<ScheduleDraft, "step"> & {
  version: 2;
  step: 1 | 2;
};

type DraftStatus = "saving" | "saved";

const STEPS = [
  { number: 1 as const, label: "Courses and classes", icon: BookOpen },
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
    detail: "Mon–Fri, 7–9 AM",
    days: DAYS.slice(0, 5) as Day[],
    startMinute: 7 * 60,
    endMinute: 9 * 60,
  },
  {
    label: "Weeknights",
    detail: "Mon–Fri, 6–9 PM",
    days: DAYS.slice(0, 5) as Day[],
    startMinute: 18 * 60,
    endMinute: 21 * 60,
  },
  {
    label: "Weekends",
    detail: "Sat–Sun, 10 AM–2 PM",
    days: DAYS.slice(5) as Day[],
    startMinute: 10 * 60,
    endMinute: 14 * 60,
  },
];

const draftMinuteSchema = z.number().int().min(0).max(1440);
const draftScheduleSchema = z
  .object({
    mode: z.enum(["general", "by-course"]),
    courses: z
      .array(
        z.object({
          id: z.string().min(1).max(80),
          name: z.string().max(80),
          colorKey: z.enum(COURSE_COLOR_KEYS),
          includedInPlan: z.boolean(),
          priority: z.enum(COURSE_PRIORITIES),
        }),
      )
      .max(20),
    classMeetings: z
      .array(
        z.object({
          id: z.string().min(1).max(80),
          courseId: z.string().min(1).max(80).optional(),
          label: z.string().max(80),
          days: z.array(z.enum(DAYS)).max(7),
          startMinute: draftMinuteSchema,
          endMinute: draftMinuteSchema,
        }),
      )
      .max(80),
    studyWindows: z
      .array(
        z.object({
          id: z.string().min(1).max(80),
          days: z.array(z.enum(DAYS)).max(7),
          startMinute: draftMinuteSchema,
          endMinute: draftMinuteSchema,
        }),
      )
      .max(40),
    targetStudyMinutes: z.number().int().min(0).max(2400),
  })
  .superRefine((schedule, context) => {
    for (const [path, ids] of [
      ["courses", schedule.courses.map((course) => course.id)],
      ["classMeetings", schedule.classMeetings.map((meeting) => meeting.id)],
      ["studyWindows", schedule.studyWindows.map((window) => window.id)],
    ] as const) {
      if (new Set(ids).size !== ids.length) {
        context.addIssue({
          code: "custom",
          path: [path],
          message: `Duplicate ${path} ids are not allowed`,
        });
      }
    }
  });

const wizardDraftSchema = z.object({
  version: z.literal(2).optional(),
  step: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  schedule: draftScheduleSchema,
});

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

function emptySchedule(): ScheduleSetup {
  return {
    mode: "by-course",
    courses: [],
    classMeetings: [],
    studyWindows: [],
    targetStudyMinutes: 0,
  };
}

function initialWizard(profile: LearnerProfile): WizardDraft {
  const parsedDraft = wizardDraftSchema.safeParse(loadScheduleDraft());
  if (parsedDraft.success) {
    const schedule = cloneSchedule(parsedDraft.data.schedule);
    const courseIds = new Set(schedule.courses.map((course) => course.id));
    const classesAreLinked = schedule.classMeetings.every(
      (meeting) => meeting.courseId && courseIds.has(meeting.courseId),
    );
    const coursesAreReady = courseValidationMessage(schedule) === null;
    const requestedStep =
      parsedDraft.data.version === 2
        ? parsedDraft.data.step
        : parsedDraft.data.step === 3
          ? 2
          : 1;

    return {
      version: 2,
      step:
        requestedStep === 2 && classesAreLinked && coursesAreReady ? 2 : 1,
      schedule,
    };
  }

  const parsedSchedule = scheduleSetupSchema.safeParse(profile.schedule);
  return {
    version: 2,
    step: 1,
    schedule: parsedSchedule.success
      ? cloneSchedule(parsedSchedule.data)
      : emptySchedule(),
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
    window.endMinute - window.startMinute < 30 ||
    window.startMinute % 15 !== 0 ||
    window.endMinute % 15 !== 0
  );
}

function rangesOverlap(
  left: { startMinute: number; endMinute: number },
  right: { startMinute: number; endMinute: number },
): boolean {
  return (
    left.startMinute < right.endMinute && right.startMinute < left.endMinute
  );
}

function DayPicker({
  legend,
  days,
  onChange,
  idPrefix,
  invalid = false,
  describedBy,
}: {
  legend: string;
  days: Day[];
  onChange: (days: Day[]) => void;
  idPrefix: string;
  invalid?: boolean;
  describedBy?: string;
}) {
  return (
    <fieldset aria-invalid={invalid || undefined} aria-describedby={describedBy}>
      <legend className="text-sm font-medium text-ink">{legend}</legend>
      <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-7">
        {DAYS.map((day) => {
          const selected = days.includes(day);
          return (
            <button
              key={day}
              id={`${idPrefix}-${day}`}
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

function InlineError({
  id,
  children,
  focusable = false,
}: {
  id?: string;
  children: React.ReactNode;
  focusable?: boolean;
}) {
  return (
    <div
      id={id}
      role="alert"
      tabIndex={focusable ? -1 : undefined}
      className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>{children}</span>
    </div>
  );
}

function MiniWeekPreview({ schedule }: { schedule: ScheduleSetup }) {
  return (
    <div>
      <div className="flex flex-wrap gap-3 text-xs text-ink-soft" aria-label="Preview legend">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-brand-500" aria-hidden />
          Study availability
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-slate-500" aria-hidden />
          Class
        </span>
      </div>
      <ol className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
        {DAYS.map((day) => {
          const windows = schedule.studyWindows
            .filter((window) => window.days.includes(day))
            .sort((left, right) => left.startMinute - right.startMinute);
          const meetings = schedule.classMeetings
            .filter((meeting) => meeting.days.includes(day))
            .sort((left, right) => left.startMinute - right.startMinute);
          return (
            <li
              key={day}
              className="rounded-xl border border-line bg-white px-3 py-2.5"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold">{DAY_SHORT[day]}</p>
                {windows.length === 0 && meetings.length === 0 && (
                  <span className="text-xs text-ink-faint">No times</span>
                )}
              </div>
              {(windows.length > 0 || meetings.length > 0) && (
                <div className="mt-2 space-y-1.5">
                  {windows.map((window) => (
                    <p
                      key={`window-${window.id}`}
                      className="rounded-lg bg-brand-50 px-2 py-1 text-xs text-brand-700"
                    >
                      Available {formatClock(window.startMinute)}–
                      {formatClock(window.endMinute)}
                    </p>
                  ))}
                  {meetings.map((meeting) => {
                    const overlaps = windows.some((window) =>
                      rangesOverlap(window, meeting),
                    );
                    return (
                      <p
                        key={`meeting-${meeting.id}`}
                        className="rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-700"
                      >
                        {meeting.label} {formatClock(meeting.startMinute)}–
                        {formatClock(meeting.endMinute)}
                        {overlaps && (
                          <span className="ml-1 font-semibold">· subtracts time</span>
                        )}
                      </p>
                    );
                  })}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function PlanSetupWizard({
  profile,
  onComplete,
  onDiscard,
}: PlanSetupWizardProps) {
  const [wizard, setWizard] = useState<WizardDraft>(() =>
    initialWizard(profile),
  );
  const [draftStatus, setDraftStatus] = useState<DraftStatus>("saving");
  const [courseName, setCourseName] = useState("");
  const [courseFormError, setCourseFormError] = useState<string | null>(null);
  const [courseStepError, setCourseStepError] = useState<string | null>(null);
  const [pendingCourseRemovalId, setPendingCourseRemovalId] = useState<
    string | null
  >(null);

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
  const [finalError, setFinalError] = useState<string | null>(null);

  const headingRef = useRef<HTMLHeadingElement>(null);
  const courseNameRef = useRef<HTMLInputElement>(null);
  const courseStepErrorRef = useRef<HTMLDivElement>(null);
  const removalConfirmRef = useRef<HTMLButtonElement>(null);
  const targetRef = useRef<HTMLInputElement>(null);
  const finalErrorRef = useRef<HTMLDivElement>(null);
  const persistDraftRef = useRef(true);
  const wizardRef = useRef(wizard);

  const schedule = wizard.schedule;
  const courseError = courseValidationMessage(schedule);
  const courseIds = useMemo(
    () => new Set(schedule.courses.map((course) => course.id)),
    [schedule.courses],
  );
  const unlinkedMeetings = schedule.classMeetings.filter(
    (meeting) => !meeting.courseId || !courseIds.has(meeting.courseId),
  );
  const conflictDays = meetingConflictDays(schedule.classMeetings);
  const meetingsInvalid = schedule.classMeetings.some((meeting) =>
    hasInvalidMeeting(meeting, courseIds),
  );
  const normalizedWindows = normalizeStudyWindows(schedule.studyWindows);
  const windowsInvalid =
    normalizedWindows.length > 40 ||
    schedule.studyWindows.some(hasInvalidWindow);
  const capacity = summarizeCapacity(schedule);
  const targetValid =
    Number.isInteger(schedule.targetStudyMinutes) &&
    schedule.targetStudyMinutes >= 30 &&
    schedule.targetStudyMinutes <= 2400;
  const activeCourse = schedule.courses.find(
    (course) => course.id === meetingCourseId,
  );

  useEffect(() => {
    if (!persistDraftRef.current) return;
    const timeout = window.setTimeout(() => {
      if (!persistDraftRef.current) return;
      saveScheduleDraft(wizard);
      setDraftStatus("saved");
    }, 200);
    return () => window.clearTimeout(timeout);
  }, [wizard]);

  useEffect(
    () => () => {
      if (persistDraftRef.current) {
        saveScheduleDraft(wizardRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    headingRef.current?.focus();
  }, [wizard.step]);

  useEffect(() => {
    if (pendingCourseRemovalId) removalConfirmRef.current?.focus();
  }, [pendingCourseRemovalId]);

  function updateSchedule(
    update: (current: ScheduleSetup) => ScheduleSetup,
  ): void {
    setDraftStatus("saving");
    setFinalError(null);
    setCourseStepError(null);
    setWizard((current) => {
      const next: WizardDraft = {
        ...current,
        schedule: { ...update(current.schedule), mode: "by-course" },
      };
      wizardRef.current = next;
      return next;
    });
  }

  function goToStep(step: 1 | 2): void {
    setDraftStatus("saving");
    setWizard((current) => {
      const next: WizardDraft = { ...current, step };
      wizardRef.current = next;
      return next;
    });
    setFinalError(null);
    setCourseStepError(null);
  }

  function addCourse(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const name = courseName.trim();
    if (!name) {
      setCourseFormError("Enter a course name first.");
      courseNameRef.current?.focus();
      return;
    }
    if (
      schedule.courses.some(
        (course) => course.name.trim().toLowerCase() === name.toLowerCase(),
      )
    ) {
      setCourseFormError("That course is already in your list.");
      courseNameRef.current?.focus();
      return;
    }
    if (schedule.courses.length >= 20) {
      setCourseFormError("You can add up to 20 courses.");
      courseNameRef.current?.focus();
      return;
    }

    updateSchedule((current) => ({
      ...current,
      courses: [
        ...current.courses,
        {
          id: makeId("course"),
          name,
          colorKey:
            COURSE_COLOR_KEYS[
              current.courses.length % COURSE_COLOR_KEYS.length
            ],
          includedInPlan: true,
          priority: "standard",
        },
      ],
    }));
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

  function confirmRemoveCourse(courseId: string): void {
    updateSchedule((current) => ({
      ...current,
      courses: current.courses.filter((course) => course.id !== courseId),
      classMeetings: current.classMeetings.filter(
        (meeting) => meeting.courseId !== courseId,
      ),
    }));
    if (meetingCourseId === courseId) resetMeetingForm();
    setPendingCourseRemovalId(null);
  }

  function resetMeetingForm(): void {
    setMeetingCourseId("");
    setMeetingDays([]);
    setMeetingStart(9 * 60);
    setMeetingEnd(10 * 60);
    setEditingMeetingId(null);
    setMeetingFormError(null);
  }

  function openMeetingForm(courseId: string): void {
    resetMeetingForm();
    setMeetingCourseId(courseId);
    window.requestAnimationFrame(() => {
      document.getElementById(`meeting-start-${courseId}`)?.focus();
    });
  }

  function submitMeeting(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!activeCourse) {
      setMeetingFormError("Choose the course this meeting belongs to.");
      return;
    }
    if (meetingDays.length === 0) {
      setMeetingFormError("Choose at least one day.");
      document
        .getElementById(`meeting-day-${activeCourse.id}-Monday`)
        ?.focus();
      return;
    }
    if (meetingEnd <= meetingStart) {
      setMeetingFormError("End time must be later than start time.");
      document.getElementById(`meeting-end-${activeCourse.id}`)?.focus();
      return;
    }
    if (!editingMeetingId && schedule.classMeetings.length >= 80) {
      setMeetingFormError("You can add up to 80 recurring meeting patterns.");
      return;
    }

    const candidate: RecurringClassMeeting = {
      id: editingMeetingId ?? makeId("class"),
      courseId: activeCourse.id,
      label: activeCourse.name.trim(),
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
    if (!meeting.courseId) return;
    setMeetingCourseId(meeting.courseId);
    setMeetingDays([...meeting.days]);
    setMeetingStart(meeting.startMinute);
    setMeetingEnd(meeting.endMinute);
    setEditingMeetingId(meeting.id);
    setMeetingFormError(null);
    window.requestAnimationFrame(() => {
      document
        .getElementById(`meeting-editor-${meeting.courseId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
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

  function linkMeeting(meetingId: string, courseId: string): void {
    const course = schedule.courses.find((candidate) => candidate.id === courseId);
    if (!course) return;
    updateSchedule((current) => ({
      ...current,
      classMeetings: current.classMeetings.map((meeting) =>
        meeting.id === meetingId
          ? { ...meeting, courseId, label: course.name.trim() }
          : meeting,
      ),
    }));
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
      document.getElementById("window-day-Monday")?.focus();
      return;
    }
    if (windowEnd <= windowStart) {
      setWindowFormError("End time must be later than start time.");
      document.getElementById("window-end")?.focus();
      return;
    }
    if (windowEnd - windowStart < 30) {
      setWindowFormError("Study windows must be at least 30 minutes long.");
      document.getElementById("window-end")?.focus();
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

  function continueToAvailability(): void {
    const message =
      courseError ??
      (meetingsInvalid
        ? "Link every class time to a course and fix invalid meeting details."
        : conflictDays.size > 0
          ? "Fix overlapping class meetings before continuing."
          : null);
    if (message) {
      setCourseStepError(message);
      window.requestAnimationFrame(() => {
        const invalidCourse = schedule.courses.find((course) => {
          const name = course.name.trim().toLowerCase();
          return (
            !name ||
            schedule.courses.filter(
              (candidate) => candidate.name.trim().toLowerCase() === name,
            ).length > 1
          );
        });
        if (invalidCourse) {
          document.getElementById(`course-name-${invalidCourse.id}`)?.focus();
        } else if (unlinkedMeetings[0]) {
          document
            .getElementById(`unlinked-meeting-${unlinkedMeetings[0].id}`)
            ?.focus();
        } else {
          courseStepErrorRef.current?.focus();
        }
      });
      return;
    }
    goToStep(2);
  }

  function buildFinalSchedule(): ScheduleSetup {
    const courseNames = new Map(
      schedule.courses.map((course) => [course.id, course.name.trim()]),
    );
    return {
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
  }

  function focusFinalIssue(path: PropertyKey[]): void {
    const root = path[0];
    window.requestAnimationFrame(() => {
      if (root === "targetStudyMinutes") {
        targetRef.current?.focus();
      } else if (root === "studyWindows") {
        document.getElementById("window-day-Monday")?.focus();
      } else {
        finalErrorRef.current?.focus();
      }
    });
  }

  function finishSetup(): void {
    setFinalError(null);
    if (windowsInvalid) {
      setFinalError(
        "Fix study windows with missing days, invalid times, or durations shorter than 30 minutes.",
      );
      window.requestAnimationFrame(() => {
        document.getElementById("window-day-Monday")?.focus();
      });
      return;
    }
    const finalSchedule = buildFinalSchedule();
    const parsed = scheduleSetupSchema.safeParse(finalSchedule);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      setFinalError(issue?.message ?? "Review the schedule details and try again.");
      focusFinalIssue(issue?.path ?? []);
      return;
    }

    const finalCapacity = summarizeCapacity(parsed.data);
    if (finalCapacity.usableMinutes < 30) {
      setFinalError(
        "Make at least 30 continuous minutes available outside class times.",
      );
      window.requestAnimationFrame(() => finalErrorRef.current?.focus());
      return;
    }

    try {
      const result = onComplete(parsed.data);
      if (!result.success) {
        setFinalError(result.message);
        window.requestAnimationFrame(() => finalErrorRef.current?.focus());
        return;
      }
      persistDraftRef.current = false;
      clearScheduleDraft();
    } catch {
      setFinalError(
        "Scholara could not save this schedule. Your draft is still available.",
      );
      window.requestAnimationFrame(() => finalErrorRef.current?.focus());
    }
  }

  function discardChanges(): void {
    if (!onDiscard) return;
    const confirmed = window.confirm(
      "Discard this schedule draft and return to your saved weekly plan?",
    );
    if (!confirmed) return;
    persistDraftRef.current = false;
    clearScheduleDraft();
    onDiscard();
  }

  return (
    <div className="mx-auto max-w-7xl px-5 py-8 sm:py-10">
      <header className="max-w-3xl">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">
          Weekly Plan setup
        </p>
        <h1 className="text-3xl font-semibold sm:text-4xl">
          Build around the week you actually have
        </h1>
        <p className="mt-3 text-ink-soft">
          Add your recurring classes and confirmed study time. Scholara will
          only schedule course-specific work inside those boundaries.
        </p>
      </header>

      <nav aria-label="Schedule setup progress" className="mt-7 max-w-3xl">
        <Progress
          value={wizard.step}
          max={2}
          label={`Schedule setup step ${wizard.step} of 2`}
        />
        <ol className="mt-3 grid grid-cols-2 gap-2">
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

      <div className="mt-8 animate-rise" key={wizard.step}>
        {wizard.step === 1 && (
          <section aria-labelledby="schedule-step-heading">
            <h2
              id="schedule-step-heading"
              ref={headingRef}
              tabIndex={-1}
              className="text-2xl font-semibold sm:text-3xl"
            >
              Courses and recurring classes
            </h2>
            <p className="mt-2 max-w-2xl text-ink-soft">
              Include the courses that need study time. A course without a
              meeting is treated as asynchronous.
            </p>

            <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
              <div className="space-y-3">
                {unlinkedMeetings.length > 0 && (
                  <Card className="border-amber-200 bg-amber-50/60 p-4 sm:p-5">
                    <h3 className="font-semibold text-amber-950">
                      Meetings needing a course
                    </h3>
                    <p className="mt-1 text-sm text-amber-900">
                      Link these older saved meetings before continuing.
                    </p>
                    <ul className="mt-3 divide-y divide-amber-200">
                      {unlinkedMeetings.map((meeting) => (
                        <li
                          key={meeting.id}
                          className="grid gap-2 py-3 first:pt-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_minmax(10rem,14rem)_auto] sm:items-center"
                        >
                          <div>
                            <p className="text-sm font-medium">
                              {meeting.label || "Saved class meeting"}
                            </p>
                            <p className="mt-0.5 text-xs text-amber-900">
                              {formatDayList(meeting.days)} ·{" "}
                              {formatClock(meeting.startMinute)}–
                              {formatClock(meeting.endMinute)}
                            </p>
                          </div>
                          <select
                            id={`unlinked-meeting-${meeting.id}`}
                            aria-label={`Course for ${meeting.label || "saved class meeting"}`}
                            defaultValue=""
                            disabled={schedule.courses.length === 0}
                            onChange={(event) =>
                              linkMeeting(meeting.id, event.target.value)
                            }
                            className={inputClass}
                          >
                            <option value="">
                              {schedule.courses.length === 0
                                ? "Add a course first"
                                : "Choose a course"}
                            </option>
                            {schedule.courses.map((course) => (
                              <option key={course.id} value={course.id}>
                                {course.name || "Unnamed course"}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => removeMeeting(meeting.id)}
                            className="flex size-11 items-center justify-center rounded-xl text-amber-900 hover:bg-rose-50 hover:text-rose-700"
                            aria-label={`Remove ${meeting.label || "saved class meeting"}`}
                          >
                            <Trash2 className="size-4" aria-hidden />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}

                {schedule.courses.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-line bg-surface px-5 py-10 text-center">
                    <BookOpen className="mx-auto size-6 text-ink-faint" aria-hidden />
                    <p className="mt-3 font-medium">No courses added yet</p>
                    <p className="mt-1 text-sm text-ink-soft">
                      Start with the classes you want Scholara to plan for.
                    </p>
                  </div>
                ) : (
                  schedule.courses.map((course) => {
                    const meetings = sortMeetings(
                      schedule.classMeetings.filter(
                        (meeting) => meeting.courseId === course.id,
                      ),
                    );
                    const normalizedName = course.name.trim().toLowerCase();
                    const duplicateName =
                      normalizedName.length > 0 &&
                      schedule.courses.filter(
                        (candidate) =>
                          candidate.name.trim().toLowerCase() === normalizedName,
                      ).length > 1;
                    const nameInvalid = !normalizedName || duplicateName;
                    const nameErrorId = `course-name-error-${course.id}`;
                    const editingThisCourse = meetingCourseId === course.id;
                    const pendingRemoval = pendingCourseRemovalId === course.id;

                    return (
                      <Card key={course.id} className="p-4 sm:p-5">
                        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_10rem_auto] md:items-end">
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
                                aria-invalid={nameInvalid || undefined}
                                aria-describedby={
                                  nameInvalid ? nameErrorId : undefined
                                }
                                className={cn(
                                  inputClass,
                                  "pl-10",
                                  nameInvalid && "border-rose-400",
                                )}
                              />
                            </div>
                          </Field>

                          <Field
                            label="Priority"
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
                              className={inputClass}
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
                            <label className="flex min-h-12 flex-1 items-center gap-2 rounded-xl border border-line px-3 text-sm font-medium md:flex-none">
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
                              Include
                            </label>
                            <button
                              type="button"
                              onClick={() => setPendingCourseRemovalId(course.id)}
                              className="flex size-12 shrink-0 items-center justify-center rounded-xl text-ink-faint hover:bg-rose-50 hover:text-rose-700"
                              aria-label={`Remove ${course.name || "course"}`}
                            >
                              <Trash2 className="size-4" aria-hidden />
                            </button>
                          </div>
                        </div>

                        {nameInvalid && (
                          <p
                            id={nameErrorId}
                            role="alert"
                            className="mt-2 text-sm text-rose-700"
                          >
                            {duplicateName
                              ? "Course names must be unique."
                              : "Enter a name for this course."}
                          </p>
                        )}
                        {!course.includedInPlan && (
                          <p className="mt-2 text-sm text-ink-faint">
                            Class meetings stay visible, but this course will not
                            receive study blocks.
                          </p>
                        )}

                        {pendingRemoval && (
                          <div
                            role="alert"
                            className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900"
                          >
                            <p>
                              Remove <strong>{course.name || "this course"}</strong>
                              {meetings.length > 0
                                ? ` and its ${meetings.length} meeting ${meetings.length === 1 ? "pattern" : "patterns"}`
                                : ""}
                              ?
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <Button
                                ref={removalConfirmRef}
                                size="sm"
                                onClick={() => confirmRemoveCourse(course.id)}
                                className="bg-rose-700 hover:bg-rose-800"
                              >
                                Remove course
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => setPendingCourseRemovalId(null)}
                              >
                                Keep course
                              </Button>
                            </div>
                          </div>
                        )}

                        <div className="mt-4 border-t border-line pt-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <h3 className="text-sm font-semibold">
                                Recurring class meetings
                              </h3>
                              <p className="mt-0.5 text-xs text-ink-faint">
                                Lectures, labs, and other fixed class time
                              </p>
                            </div>
                            {!editingThisCourse && (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => openMeetingForm(course.id)}
                              >
                                <Plus className="size-4" aria-hidden />
                                Add meeting
                              </Button>
                            )}
                          </div>

                          {meetings.length === 0 ? (
                            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-line-soft px-3 py-2.5">
                              <Badge>Asynchronous / no meeting time</Badge>
                              <span className="text-xs text-ink-faint">
                                Scholara can still schedule study blocks.
                              </span>
                            </div>
                          ) : (
                            <ul className="mt-3 divide-y divide-line rounded-xl border border-line bg-white">
                              {meetings.map((meeting) => {
                                const conflict = conflictDays.get(meeting.id);
                                return (
                                  <li
                                    key={meeting.id}
                                    className="flex items-start gap-3 px-3 py-2.5"
                                  >
                                    <div className="min-w-0 flex-1">
                                      <p className="text-sm font-medium">
                                        {formatDayList(meeting.days)} ·{" "}
                                        {formatClock(meeting.startMinute)}–
                                        {formatClock(meeting.endMinute)}
                                      </p>
                                      {conflict && (
                                        <p
                                          role="alert"
                                          className="mt-1 text-xs text-rose-700"
                                        >
                                          Overlaps another class on{" "}
                                          {formatDayList(conflict)}.
                                        </p>
                                      )}
                                    </div>
                                    <div className="flex shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => editMeeting(meeting)}
                                        className="flex size-11 items-center justify-center rounded-xl text-ink-faint hover:bg-line-soft hover:text-ink"
                                        aria-label={`Edit ${course.name} meeting`}
                                      >
                                        <Pencil className="size-4" aria-hidden />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => removeMeeting(meeting.id)}
                                        className="flex size-11 items-center justify-center rounded-xl text-ink-faint hover:bg-rose-50 hover:text-rose-700"
                                        aria-label={`Remove ${course.name} meeting`}
                                      >
                                        <Trash2 className="size-4" aria-hidden />
                                      </button>
                                    </div>
                                  </li>
                                );
                              })}
                            </ul>
                          )}

                          {editingThisCourse && (
                            <form
                              id={`meeting-editor-${course.id}`}
                              onSubmit={submitMeeting}
                              className="mt-4 space-y-4 rounded-xl border border-brand-100 bg-brand-50/40 p-4"
                            >
                              <DayPicker
                                legend="Meeting days"
                                days={meetingDays}
                                idPrefix={`meeting-day-${course.id}`}
                                invalid={Boolean(meetingFormError)}
                                describedBy={
                                  meetingFormError
                                    ? `meeting-error-${course.id}`
                                    : undefined
                                }
                                onChange={(days) => {
                                  setMeetingDays(days);
                                  setMeetingFormError(null);
                                }}
                              />
                              <div className="grid gap-3 sm:grid-cols-2">
                                <Field
                                  label="Starts"
                                  htmlFor={`meeting-start-${course.id}`}
                                >
                                  <input
                                    id={`meeting-start-${course.id}`}
                                    type="time"
                                    step={900}
                                    value={minutesToTimeInput(meetingStart)}
                                    aria-invalid={
                                      Boolean(meetingFormError) || undefined
                                    }
                                    aria-describedby={
                                      meetingFormError
                                        ? `meeting-error-${course.id}`
                                        : undefined
                                    }
                                    onChange={(event) => {
                                      setMeetingStart(
                                        timeInputToMinutes(event.target.value),
                                      );
                                      setMeetingFormError(null);
                                    }}
                                    className={inputClass}
                                  />
                                </Field>
                                <Field
                                  label="Ends"
                                  htmlFor={`meeting-end-${course.id}`}
                                >
                                  <input
                                    id={`meeting-end-${course.id}`}
                                    type="time"
                                    step={900}
                                    value={minutesToTimeInput(meetingEnd)}
                                    aria-invalid={
                                      Boolean(meetingFormError) || undefined
                                    }
                                    aria-describedby={
                                      meetingFormError
                                        ? `meeting-error-${course.id}`
                                        : undefined
                                    }
                                    onChange={(event) => {
                                      setMeetingEnd(
                                        timeInputToMinutes(
                                          event.target.value,
                                          true,
                                        ),
                                      );
                                      setMeetingFormError(null);
                                    }}
                                    className={inputClass}
                                  />
                                </Field>
                              </div>
                              {meetingFormError && (
                                <InlineError id={`meeting-error-${course.id}`}>
                                  {meetingFormError}
                                </InlineError>
                              )}
                              <div className="flex flex-wrap gap-2">
                                <Button type="submit" size="sm">
                                  {editingMeetingId ? (
                                    <Check className="size-4" aria-hidden />
                                  ) : (
                                    <Plus className="size-4" aria-hidden />
                                  )}
                                  {editingMeetingId
                                    ? "Save meeting"
                                    : "Add meeting"}
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={resetMeetingForm}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </form>
                          )}
                        </div>
                      </Card>
                    );
                  })
                )}

                {courseStepError && (
                  <div ref={courseStepErrorRef} tabIndex={-1}>
                    <InlineError>{courseStepError}</InlineError>
                  </div>
                )}
              </div>

              <aside className="order-first lg:order-last lg:sticky lg:top-24">
                <Card className="p-4 sm:p-5">
                  <h3 className="font-semibold">Add a course</h3>
                  <p className="mt-1 text-sm text-ink-soft">
                    You can include up to 20 courses.
                  </p>
                  <form onSubmit={addCourse} className="mt-4 space-y-3">
                    <Field label="Course name" htmlFor="new-course-name">
                      <input
                        ref={courseNameRef}
                        id="new-course-name"
                        value={courseName}
                        onChange={(event) => {
                          setCourseName(event.target.value);
                          setCourseFormError(null);
                        }}
                        maxLength={80}
                        placeholder="e.g. Organic Chemistry"
                        aria-invalid={Boolean(courseFormError) || undefined}
                        aria-describedby={
                          courseFormError ? "new-course-error" : undefined
                        }
                        className={inputClass}
                      />
                    </Field>
                    {courseFormError && (
                      <InlineError id="new-course-error">
                        {courseFormError}
                      </InlineError>
                    )}
                    <Button type="submit" className="w-full">
                      <Plus className="size-4" aria-hidden />
                      Add course
                    </Button>
                  </form>
                </Card>

                <div className="mt-3 rounded-2xl border border-line bg-line-soft/60 p-4 text-sm text-ink-soft">
                  <p className="font-medium text-ink">Recurring schedule</p>
                  <p className="mt-1">
                    {schedule.courses.length} {schedule.courses.length === 1 ? "course" : "courses"}
                    {" · "}
                    {schedule.classMeetings.length} {schedule.classMeetings.length === 1 ? "meeting pattern" : "meeting patterns"}
                  </p>
                  <p className="mt-2 text-xs text-ink-faint">
                    Meetings block study time but do not need to exist for
                    asynchronous courses.
                  </p>
                </div>
              </aside>
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
              Confirm your study availability
            </h2>
            <p className="mt-2 max-w-2xl text-ink-soft">
              These windows are hard boundaries. Scholara will never place a
              study block outside them.
            </p>

            <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
              <div>
                <div>
                  <h3 className="text-sm font-semibold">Quick presets</h3>
                  <p className="mt-1 text-sm text-ink-faint">
                    Add one, then review or edit every window below.
                  </p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    {PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => applyPreset(preset)}
                        className="min-h-16 rounded-xl border border-line bg-surface p-3 text-left transition-colors hover:border-brand-200 hover:bg-brand-50/40"
                      >
                        <span className="block text-sm font-medium">
                          {preset.label}
                        </span>
                        <span className="mt-0.5 block text-xs text-ink-faint">
                          {preset.detail}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <Card id="study-window-form" className="mt-5 scroll-mt-24 p-4 sm:p-5">
                  <form onSubmit={submitWindow} className="space-y-4">
                    <DayPicker
                      legend="Days you can study"
                      days={windowDays}
                      idPrefix="window-day"
                      invalid={Boolean(windowFormError)}
                      describedBy={
                        windowFormError ? "study-window-error" : undefined
                      }
                      onChange={(days) => {
                        setWindowDays(days);
                        setWindowFormError(null);
                      }}
                    />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Available from" htmlFor="window-start">
                        <input
                          id="window-start"
                          type="time"
                          step={900}
                          value={minutesToTimeInput(windowStart)}
                          aria-invalid={Boolean(windowFormError) || undefined}
                          aria-describedby={
                            windowFormError ? "study-window-error" : undefined
                          }
                          onChange={(event) => {
                            setWindowStart(
                              timeInputToMinutes(event.target.value),
                            );
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
                          aria-invalid={Boolean(windowFormError) || undefined}
                          aria-describedby={
                            windowFormError ? "study-window-error" : undefined
                          }
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
                      <InlineError id="study-window-error">
                        {windowFormError}
                      </InlineError>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <Button type="submit" size="sm">
                        {editingWindowId ? (
                          <Check className="size-4" aria-hidden />
                        ) : (
                          <Plus className="size-4" aria-hidden />
                        )}
                        {editingWindowId ? "Save window" : "Add window"}
                      </Button>
                      {editingWindowId && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={resetWindowForm}
                        >
                          Cancel edit
                        </Button>
                      )}
                    </div>
                  </form>
                </Card>

                <div className="mt-6">
                  <div className="flex items-baseline justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold">Confirmed windows</h3>
                      <p className="mt-1 text-sm text-ink-soft">
                        Grouped by day for a quick reality check.
                      </p>
                    </div>
                    <Badge>
                      {schedule.studyWindows.length} {schedule.studyWindows.length === 1 ? "window" : "windows"}
                    </Badge>
                  </div>

                  {schedule.studyWindows.length === 0 ? (
                    <div className="mt-3 rounded-2xl border border-dashed border-line px-5 py-8 text-center text-sm text-ink-soft">
                      Add at least one window of 30 minutes or longer.
                    </div>
                  ) : (
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {DAYS.filter((day) =>
                        schedule.studyWindows.some((window) =>
                          window.days.includes(day),
                        ),
                      ).map((day) => {
                        const windows = schedule.studyWindows
                          .filter((window) => window.days.includes(day))
                          .sort(
                            (left, right) =>
                              left.startMinute - right.startMinute,
                          );
                        return (
                          <div
                            key={day}
                            className="rounded-2xl border border-line bg-surface p-3"
                          >
                            <h4 className="text-sm font-semibold">{day}</h4>
                            <ul className="mt-2 divide-y divide-line">
                              {windows.map((window) => (
                                <li
                                  key={window.id}
                                  className="flex items-center gap-2 py-2 first:pt-0 last:pb-0"
                                >
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium">
                                      {formatClock(window.startMinute)}–
                                      {formatClock(window.endMinute)}
                                    </p>
                                    <p className="text-xs text-ink-faint">
                                      {formatDuration(
                                        window.endMinute - window.startMinute,
                                      )}
                                      {window.days.length > 1
                                        ? ` · repeats ${window.days.length} days`
                                        : ""}
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => editWindow(window)}
                                    className="flex size-11 shrink-0 items-center justify-center rounded-xl text-ink-faint hover:bg-line-soft hover:text-ink"
                                    aria-label={`Edit study window on ${formatDayList(window.days)}`}
                                  >
                                    <Pencil className="size-4" aria-hidden />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => removeWindow(window.id)}
                                    className="flex size-11 shrink-0 items-center justify-center rounded-xl text-ink-faint hover:bg-rose-50 hover:text-rose-700"
                                    aria-label={`Remove study window on ${formatDayList(window.days)}`}
                                  >
                                    <Trash2 className="size-4" aria-hidden />
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <aside>
                <Card className="p-4 sm:p-5">
                  <h3 className="font-semibold">Mini-week preview</h3>
                  <p className="mt-1 text-sm text-ink-soft">
                    Classes subtract from overlapping availability.
                  </p>
                  <div className="mt-4">
                    <MiniWeekPreview schedule={schedule} />
                  </div>
                </Card>
              </aside>
            </div>

            <Card className="mt-6 border-brand-100 bg-brand-50/50 p-4 sm:p-5">
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_15rem] md:items-end">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-700">
                    Study goal
                  </p>
                  <h3 className="mt-1 text-lg font-semibold">
                    Weekly study target
                  </h3>
                  <p className="mt-1 text-sm text-ink-soft">
                    Choose how much of your confirmed availability Scholara
                    should plan each week.
                  </p>
                </div>
                <Field label="Hours per week" htmlFor="study-target">
                  <div className="relative">
                    <input
                      ref={targetRef}
                      id="study-target"
                      type="number"
                      min={0.5}
                      max={40}
                      step={0.25}
                      value={
                        schedule.targetStudyMinutes > 0
                          ? schedule.targetStudyMinutes / 60
                          : ""
                      }
                      aria-invalid={!targetValid || undefined}
                      aria-describedby={
                        !targetValid ? "study-target-error" : undefined
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
                      className={cn(
                        inputClass,
                        "pr-20",
                        !targetValid && "border-rose-400",
                      )}
                    />
                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-ink-faint">
                      hours
                    </span>
                  </div>
                </Field>
              </div>
              {!targetValid && (
                <p
                  id="study-target-error"
                  role="alert"
                  className="mt-3 text-sm text-rose-700"
                >
                  Set a target between 30 minutes and 40 hours.
                </p>
              )}
              {capacity.classOverlapMinutes > 0 && (
                <p className="mt-4 rounded-xl bg-surface/80 px-3 py-2 text-sm text-brand-700">
                  Classes overlap{" "}
                  {formatDuration(capacity.classOverlapMinutes)} of your
                  confirmed windows.
                </p>
              )}
              {capacity.shortfallMinutes > 0 && targetValid && (
                <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  Your target is {formatDuration(capacity.shortfallMinutes)} over
                  usable capacity. Scholara will still plan what safely fits.
                </p>
              )}
            </Card>

            {finalError && (
              <div ref={finalErrorRef} tabIndex={-1} className="mt-5">
                <InlineError>{finalError}</InlineError>
              </div>
            )}
          </section>
        )}
      </div>

      <div className="no-print mt-8 rounded-2xl border border-line bg-paper/95 px-4 py-3 lg:sticky lg:bottom-0 lg:z-20 lg:-mx-5 lg:rounded-b-none lg:px-5 lg:shadow-[0_-8px_24px_rgba(15,23,42,0.08)] lg:backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <span>
              <span className="text-ink-faint">Target</span>{" "}
              <strong>{formatDuration(schedule.targetStudyMinutes)}</strong>
            </span>
            <span>
              <span className="text-ink-faint">Schedulable</span>{" "}
              <strong>{formatDuration(capacity.usableMinutes)}</strong>
            </span>
            <span className={capacity.shortfallMinutes > 0 ? "text-amber-800" : "text-teal-800"}>
              <span className="opacity-75">
                {capacity.shortfallMinutes > 0 ? "Shortfall" : "Buffer"}
              </span>{" "}
              <strong>
                {formatDuration(
                  capacity.shortfallMinutes > 0
                    ? capacity.shortfallMinutes
                    : capacity.bufferMinutes,
                )}
              </strong>
            </span>
            <span aria-live="polite" className="inline-flex items-center gap-1.5 text-xs text-ink-faint">
              {draftStatus === "saved" && <Check className="size-3.5" aria-hidden />}
              {draftStatus === "saving" ? "Saving draft…" : "Draft saved"}
            </span>
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center lg:ml-auto">
            {onDiscard && (
              <Button variant="ghost" onClick={discardChanges}>
                Discard changes
              </Button>
            )}
            {wizard.step === 2 && (
              <Button variant="secondary" onClick={() => goToStep(1)}>
                <ArrowLeft className="size-4" aria-hidden />
                Back
              </Button>
            )}
            {wizard.step === 1 ? (
              <Button onClick={continueToAvailability}>
                Continue to availability
                <ArrowRight className="size-4" aria-hidden />
              </Button>
            ) : (
              <Button onClick={finishSetup}>
                Generate weekly plan
                <ArrowRight className="size-4" aria-hidden />
              </Button>
            )}
          </div>
        </div>
      </div>

      {profile.plan && profile.weekContext && (
        <p className="mt-3 text-center text-xs text-ink-faint">
          Current-week adjustments will be preserved when they still fit this recurring schedule.
        </p>
      )}
    </div>
  );
}
