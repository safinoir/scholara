"use client";

import { useMemo, useState } from "react";
import { CalendarDays, List, LockKeyhole } from "lucide-react";
import { TECHNIQUE_BY_ID } from "@/lib/data/techniques";
import {
  COURSE_COLOR_KEYS,
  DAYS,
  type CourseColorKey,
  type Day,
  type PlanBlock,
  type ScheduleSetup,
  type WeekContext,
  type WeekPlan,
} from "@/lib/types";
import { isCurrentWeek, weekDateForDay } from "@/lib/week";
import { Badge, Card, cn } from "@/components/ui";

const DAY_SHORT: Record<Day, string> = {
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
  Saturday: "Sat",
  Sunday: "Sun",
};

const COURSE_STYLE: Record<CourseColorKey, string> = {
  indigo: "border-indigo-300 bg-indigo-100 text-indigo-950",
  teal: "border-teal-300 bg-teal-100 text-teal-950",
  sky: "border-sky-300 bg-sky-100 text-sky-950",
  violet: "border-violet-300 bg-violet-100 text-violet-950",
  amber: "border-amber-300 bg-amber-100 text-amber-950",
  rose: "border-rose-300 bg-rose-100 text-rose-950",
};

type CalendarItem =
  | { kind: "class"; id: string; start: number; end: number; label: string }
  | { kind: "busy"; id: string; start: number; end: number; label: string }
  | { kind: "study"; id: string; start: number; end: number; block: PlanBlock };

function formatMinute(minute: number) {
  const normalized = Math.max(0, Math.min(1440, minute));
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  const suffix = hours >= 12 && hours < 24 ? "PM" : "AM";
  const hour = hours === 0 || hours === 24 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${hour}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

function formatDuration(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} hr`;
  return `${hours} hr ${minutes} min`;
}

function formatDate(date: Date, includeWeekday = false) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: includeWeekday ? "long" : undefined,
    month: "short",
    day: "numeric",
  }).format(date);
}

function blockStart(block: PlanBlock) {
  return block.startMinute ?? Math.round(block.start * 60);
}

export function blockCourseName(block: PlanBlock, schedule: ScheduleSetup) {
  if (!block.courseId) {
    return block.intensity === "admin" ? "Weekly planning" : "Course study";
  }
  return schedule.courses.find((course) => course.id === block.courseId)?.name ?? "Course";
}

function blockStyle(block: PlanBlock, schedule: ScheduleSetup) {
  const color = schedule.courses.find((course) => course.id === block.courseId)?.colorKey;
  if (color && COURSE_COLOR_KEYS.includes(color)) return COURSE_STYLE[color];
  if (block.intensity === "admin") return "border-slate-300 bg-slate-100 text-slate-950";
  if (block.intensity === "review") return "border-teal-300 bg-teal-50 text-teal-950";
  return "border-brand-200 bg-brand-50 text-ink";
}

function itemsForDay(
  day: Day,
  schedule: ScheduleSetup,
  plan: WeekPlan,
  week: WeekContext,
): CalendarItem[] {
  const classes: CalendarItem[] = schedule.classMeetings
    .filter((meeting) => meeting.days.includes(day))
    .map((meeting) => ({
      kind: "class",
      id: `${meeting.id}-${day}`,
      start: meeting.startMinute,
      end: meeting.endMinute,
      label: meeting.label,
    }));
  const busy: CalendarItem[] = (week.busyWindows ?? [])
    .filter((window) => window.day === day)
    .map((window) => ({
      kind: "busy",
      id: window.id,
      start: window.startMinute,
      end: window.endMinute,
      label: "Unavailable this week",
    }));
  const study: CalendarItem[] = plan.blocks
    .filter((block) => block.day === day)
    .map((block) => ({
      kind: "study",
      id: block.id,
      start: blockStart(block),
      end: blockStart(block) + block.minutes,
      block,
    }));
  return [...classes, ...busy, ...study].sort(
    (left, right) => left.start - right.start || left.id.localeCompare(right.id),
  );
}

function emptyDayMessage(day: Day, schedule: ScheduleSetup, week: WeekContext) {
  if (week.unavailableDays.includes(day)) return "Unavailable this week.";
  if (!schedule.studyWindows.some((window) => window.days.includes(day))) {
    return "No study availability marked.";
  }
  return "Available, with no study block planned.";
}

export function WeekCalendar({
  schedule,
  plan,
  week,
  weekStart,
  onSelectBlock,
}: {
  schedule: ScheduleSetup;
  plan: WeekPlan;
  week: WeekContext;
  weekStart?: string;
  onSelectBlock: (block: PlanBlock) => void;
}) {
  const [desktopView, setDesktopView] = useState<"calendar" | "agenda">("calendar");

  const dayTotals = useMemo(
    () =>
      Object.fromEntries(
        DAYS.map((day) => [
          day,
          plan.blocks
            .filter((block) => block.day === day)
            .reduce((sum, block) => sum + block.minutes, 0),
        ]),
      ) as Record<Day, number>,
    [plan.blocks],
  );

  const boundaries = [
    ...schedule.classMeetings.flatMap((meeting) => [meeting.startMinute, meeting.endMinute]),
    ...schedule.studyWindows.flatMap((window) => [window.startMinute, window.endMinute]),
    ...(week.busyWindows ?? []).flatMap((window) => [window.startMinute, window.endMinute]),
    ...plan.blocks.flatMap((block) => [blockStart(block), blockStart(block) + block.minutes]),
  ];
  const earliest = boundaries.length > 0 ? Math.min(...boundaries) : 8 * 60;
  const latest = boundaries.length > 0 ? Math.max(...boundaries) : 18 * 60;
  let rangeStart = Math.max(0, Math.floor((earliest - 30) / 60) * 60);
  let rangeEnd = Math.min(24 * 60, Math.ceil((latest + 30) / 60) * 60);
  if (rangeEnd - rangeStart < 4 * 60) {
    const center = (rangeStart + rangeEnd) / 2;
    rangeStart = Math.max(0, Math.floor((center - 2 * 60) / 60) * 60);
    rangeEnd = Math.min(24 * 60, rangeStart + 4 * 60);
  }
  const calendarHeight = ((rangeEnd - rangeStart) / 60) * 64;
  const position = (minute: number) => ((minute - rangeStart) / (rangeEnd - rangeStart)) * 100;
  const duration = (minutes: number) => (minutes / (rangeEnd - rangeStart)) * 100;
  return (
    <section aria-labelledby="weekly-calendar-title" className="mt-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="weekly-calendar-title" className="text-xl font-semibold sm:text-2xl">
            Schedule workspace
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            Classes, weekly exceptions, and study blocks in your local time.
          </p>
        </div>
        <div className="hidden rounded-xl border border-line bg-surface p-1 lg:flex" aria-label="Schedule view">
          <button
            type="button"
            onClick={() => setDesktopView("calendar")}
            aria-pressed={desktopView === "calendar"}
            className={cn(
              "inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm",
              desktopView === "calendar" ? "bg-brand-50 font-medium text-brand-700" : "text-ink-soft",
            )}
          >
            <CalendarDays className="size-4" aria-hidden /> Calendar
          </button>
          <button
            type="button"
            onClick={() => setDesktopView("agenda")}
            aria-pressed={desktopView === "agenda"}
            className={cn(
              "inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm",
              desktopView === "agenda" ? "bg-brand-50 font-medium text-brand-700" : "text-ink-soft",
            )}
          >
            <List className="size-4" aria-hidden /> Agenda
          </button>
        </div>
      </div>

      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-ink-soft" aria-label="Calendar legend">
        <li className="flex items-center gap-2"><span className="size-3 rounded-sm border border-brand-200 bg-brand-50" />Available</li>
        <li className="flex items-center gap-2"><span className="size-3 rounded-sm border border-slate-300 bg-slate-200" />Class</li>
        <li className="flex items-center gap-2"><span className="size-3 rounded-sm border border-rose-300 bg-rose-100" />Weekly exception</li>
        <li className="flex items-center gap-2"><span className="size-3 rounded-sm border border-indigo-300 bg-indigo-100" />Study block</li>
      </ul>

      <div className={cn("mt-4 print:hidden", desktopView === "calendar" ? "hidden lg:block" : "hidden")}>
        <div className="relative isolate max-h-[min(70dvh,54rem)] overflow-auto rounded-2xl border border-line bg-surface shadow-sm">
          <div
            className="sticky top-0 z-40 grid border-b border-line bg-surface/95 backdrop-blur"
            style={{ gridTemplateColumns: "56px repeat(7,minmax(0,1fr))" }}
          >
            <div aria-hidden />
            {DAYS.map((day) => {
              const date = weekStart ? weekDateForDay(weekStart, day) : null;
              const today =
                date !== null &&
                isCurrentWeek(weekStart) &&
                date.toDateString() === new Date().toDateString();
              const unavailable = week.unavailableDays.includes(day);
              const hasAvailability = schedule.studyWindows.some((window) => window.days.includes(day));
              return (
                <div key={day} className={cn("min-w-0 border-l border-line px-1.5 py-2 text-center", today && "bg-brand-50")}>
                  <p className="truncate text-xs font-semibold">
                    {DAY_SHORT[day]} {date ? formatDate(date) : ""}
                  </p>
                  <p className="mt-0.5 truncate text-[10px] text-ink-faint">
                    {unavailable ? "Unavailable" : dayTotals[day] ? `${dayTotals[day]}m planned` : hasAvailability ? "Open" : "No window"}
                  </p>
                </div>
              );
            })}
          </div>

          <div
            className="grid"
            style={{ gridTemplateColumns: "56px repeat(7,minmax(0,1fr))", height: calendarHeight }}
          >
            <div className="relative bg-line-soft/30">
              {Array.from({ length: Math.floor((rangeEnd - rangeStart) / 60) + 1 }, (_, index) => {
                const minute = rangeStart + index * 60;
                return (
                  <span
                    key={minute}
                    className="absolute right-2 -translate-y-1/2 text-[10px] tabular-nums text-ink-faint"
                    style={{ top: `${position(minute)}%` }}
                  >
                    {formatMinute(minute)}
                  </span>
                );
              })}
            </div>

            {DAYS.map((day) => {
              const items = itemsForDay(day, schedule, plan, week);
              const windows = schedule.studyWindows.filter((window) => window.days.includes(day));
              const unavailable = week.unavailableDays.includes(day);
              return (
                <div
                  key={day}
                  className="relative min-w-0 border-l border-line bg-[linear-gradient(to_bottom,var(--color-line-soft)_1px,transparent_1px)] bg-[length:100%_64px]"
                >
                  {windows.map((window) => (
                    <div
                      key={`${window.id}-${day}`}
                      className="absolute inset-x-1 rounded-md border border-dashed border-brand-100 bg-brand-50/45"
                      style={{ top: `${position(window.startMinute)}%`, height: `${duration(window.endMinute - window.startMinute)}%` }}
                      title={`Available ${formatMinute(window.startMinute)} to ${formatMinute(window.endMinute)}`}
                    />
                  ))}
                  {unavailable && (
                    <div className="absolute inset-0 z-30 flex items-start justify-center bg-slate-100/80 px-1 pt-3 text-center text-[10px] font-medium text-slate-700">
                      <LockKeyhole className="mr-1 size-3" aria-hidden /> Unavailable
                    </div>
                  )}
                  {!unavailable && items.map((item) => {
                    const top = `${position(item.start)}%`;
                    const height = `${duration(item.end - item.start)}%`;
                    if (item.kind === "class") {
                      return (
                        <div
                          key={item.id}
                          className="absolute inset-x-1 z-10 overflow-hidden rounded-md border border-slate-300 bg-slate-200/95 p-1.5 text-[10px] text-slate-800"
                          style={{ top, height }}
                          aria-label={`${item.label}, ${day}, ${formatMinute(item.start)} to ${formatMinute(item.end)}`}
                        >
                          <p className="truncate font-semibold">{item.label}</p>
                          <p className="truncate">{formatMinute(item.start)}</p>
                        </div>
                      );
                    }
                    if (item.kind === "busy") {
                      return (
                        <div
                          key={item.id}
                          className="absolute inset-x-1 z-20 overflow-hidden rounded-md border border-rose-300 bg-[repeating-linear-gradient(135deg,#fff1f2,#fff1f2_6px,#ffe4e6_6px,#ffe4e6_12px)] p-1.5 text-[10px] text-rose-900"
                          style={{ top, height, minHeight: 30 }}
                          aria-label={`${item.label}, ${day}, ${formatMinute(item.start)} to ${formatMinute(item.end)}`}
                        >
                          <p className="truncate font-medium">Busy</p>
                        </div>
                      );
                    }
                    const courseName = blockCourseName(item.block, schedule);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onSelectBlock(item.block)}
                        className={cn(
                          "absolute inset-x-1 z-20 overflow-hidden rounded-md border p-1.5 text-left text-[10px] shadow-sm focus-visible:z-30",
                          blockStyle(item.block, schedule),
                        )}
                        style={{ top, height, minHeight: 44 }}
                        aria-label={`${courseName} study, ${day}, ${formatMinute(item.start)} to ${formatMinute(item.end)}, ${item.block.minutes} minutes`}
                      >
                        <p className="truncate font-semibold">{courseName}</p>
                        <p className="mt-0.5 truncate">
                          {item.block.minutes}m · {TECHNIQUE_BY_ID[item.block.techniqueId]?.name ?? "Study method"}
                        </p>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div
        className={cn(
          "mt-4 print:block",
          desktopView === "agenda" ? "lg:block" : "lg:hidden",
        )}
      >
        <nav
          className="no-print flex gap-2 overflow-x-auto pb-2"
          aria-label="Jump to an agenda day"
        >
          {DAYS.map((day) => {
            const date = weekStart ? weekDateForDay(weekStart, day) : null;
            const today =
              date !== null &&
              isCurrentWeek(weekStart) &&
              date.toDateString() === new Date().toDateString();
            return (
              <a
                key={day}
                href={`#agenda-${day.toLowerCase()}`}
                className={cn(
                  "min-h-12 min-w-20 rounded-xl border px-2 py-1.5 text-center text-sm",
                  today
                    ? "border-brand-500 bg-brand-50 font-semibold text-brand-700"
                    : "border-line bg-surface text-ink-soft",
                )}
              >
                <span className="block">{DAY_SHORT[day]}</span>
                <span className="block text-[10px] font-normal">
                  {date ? formatDate(date) : "Saved"} · {dayTotals[day] || 0}m
                </span>
              </a>
            );
          })}
        </nav>

        <div className="mt-3 space-y-3 print:space-y-2">
          {DAYS.map((day) => {
            const date = weekStart ? weekDateForDay(weekStart, day) : null;
            const items = itemsForDay(day, schedule, plan, week);
            const availability = schedule.studyWindows
              .filter((window) => window.days.includes(day))
              .map(
                (window) =>
                  `${formatMinute(window.startMinute)}–${formatMinute(window.endMinute)}`,
              )
              .join(" · ");
            const unavailable = week.unavailableDays.includes(day);

            return (
              <Card
                key={day}
                id={`agenda-${day.toLowerCase()}`}
                className="scroll-mt-28 p-4 print-break-avoid sm:p-5 lg:scroll-mt-44"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-semibold">
                    {date ? formatDate(date, true) : day}
                  </h3>
                  <div className="flex items-center gap-2">
                    {dayTotals[day] > 0 && (
                      <span className="text-xs font-medium text-ink-soft">
                        {formatDuration(dayTotals[day])} planned
                      </span>
                    )}
                    {unavailable && <Badge>Unavailable this week</Badge>}
                  </div>
                </div>
                <p className="mt-1 text-xs text-ink-faint">
                  {availability || "No recurring study availability"}
                </p>
                <ol className="mt-4 grid gap-3 lg:grid-cols-2">
                  {items.map((item) => {
                    if (item.kind === "class") {
                      return (
                        <li
                          key={item.id}
                          className="rounded-xl border border-slate-300 bg-slate-100 p-4"
                        >
                          <p className="text-xs font-medium text-ink-faint">
                            {formatMinute(item.start)}–{formatMinute(item.end)}
                          </p>
                          <p className="mt-1 font-semibold">{item.label}</p>
                          <p className="mt-1 text-sm text-ink-soft">
                            Class commitment
                          </p>
                        </li>
                      );
                    }
                    if (item.kind === "busy") {
                      return (
                        <li
                          key={item.id}
                          className="rounded-xl border border-rose-200 bg-rose-50 p-4"
                        >
                          <p className="text-xs font-medium text-rose-800">
                            {formatMinute(item.start)}–{formatMinute(item.end)}
                          </p>
                          <p className="mt-1 font-semibold text-rose-950">
                            Unavailable this week
                          </p>
                        </li>
                      );
                    }
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => onSelectBlock(item.block)}
                          className={cn(
                            "min-h-11 w-full rounded-xl border p-4 text-left",
                            blockStyle(item.block, schedule),
                          )}
                        >
                          <p className="text-xs font-medium opacity-70">
                            {formatMinute(item.start)}–{formatMinute(item.end)}
                          </p>
                          <p className="mt-1 font-semibold">
                            {blockCourseName(item.block, schedule)}
                          </p>
                          <p className="mt-1 text-sm">
                            {item.block.minutes} min ·{" "}
                            {TECHNIQUE_BY_ID[item.block.techniqueId]?.name ??
                              "Study method"}
                          </p>
                        </button>
                      </li>
                    );
                  })}
                  {items.length === 0 && (
                    <li className="rounded-xl border border-dashed border-line p-5 text-sm text-ink-faint lg:col-span-2">
                      {emptyDayMessage(day, schedule, week)}
                    </li>
                  )}
                </ol>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
