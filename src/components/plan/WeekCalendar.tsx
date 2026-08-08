"use client";

import { useState } from "react";
import { BookOpen, CalendarDays, Clock3 } from "lucide-react";
import { TECHNIQUE_BY_ID } from "@/lib/data/techniques";
import {
  COURSE_COLOR_KEYS,
  DAYS,
  type CourseColorKey,
  type Day,
  type PlanBlock,
  type ScheduleSetup,
  type WeekPlan,
} from "@/lib/types";
import { Card, cn } from "@/components/ui";

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

function formatMinute(minute: number) {
  const normalized = Math.max(0, Math.min(1440, minute));
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  const suffix = hours >= 12 && hours < 24 ? "PM" : "AM";
  const hour = hours === 0 || hours === 24 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${hour}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

function blockStart(block: PlanBlock) {
  return block.startMinute ?? Math.round(block.start * 60);
}

function blockCourseName(block: PlanBlock, schedule: ScheduleSetup) {
  if (!block.courseId) return "General study";
  return schedule.courses.find((course) => course.id === block.courseId)?.name ?? "Course";
}

function blockStyle(block: PlanBlock, schedule: ScheduleSetup) {
  const color = schedule.courses.find((course) => course.id === block.courseId)?.colorKey;
  if (color && COURSE_COLOR_KEYS.includes(color)) return COURSE_STYLE[color];
  if (block.intensity === "admin") return "border-slate-300 bg-slate-100 text-slate-950";
  if (block.intensity === "review") return "border-teal-300 bg-teal-50 text-teal-950";
  return "border-brand-200 bg-brand-50 text-ink";
}

type CalendarItem =
  | { kind: "class"; id: string; start: number; end: number; label: string }
  | { kind: "study"; id: string; start: number; end: number; block: PlanBlock };

function itemsForDay(day: Day, schedule: ScheduleSetup, plan: WeekPlan): CalendarItem[] {
  const classes: CalendarItem[] = schedule.classMeetings
    .filter((meeting) => meeting.days.includes(day))
    .map((meeting) => ({
      kind: "class",
      id: `${meeting.id}-${day}`,
      start: meeting.startMinute,
      end: meeting.endMinute,
      label: meeting.label,
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
  return [...classes, ...study].sort((a, b) => a.start - b.start || a.id.localeCompare(b.id));
}

export function WeekCalendar({
  schedule,
  plan,
}: {
  schedule: ScheduleSetup;
  plan: WeekPlan;
}) {
  const [selectedDay, setSelectedDay] = useState<Day>(() => {
    const first = DAYS.find((day) => plan.blocks.some((block) => block.day === day));
    return first ?? "Monday";
  });
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

  const selectedBlock = plan.blocks.find((block) => block.id === selectedBlockId) ?? null;

  const boundaries = [
    ...schedule.classMeetings.flatMap((meeting) => [meeting.startMinute, meeting.endMinute]),
    ...schedule.studyWindows.flatMap((window) => [window.startMinute, window.endMinute]),
    ...plan.blocks.flatMap((block) => [blockStart(block), blockStart(block) + block.minutes]),
  ];
  const rangeStart = Math.max(0, Math.floor((Math.min(...boundaries, 8 * 60) - 30) / 60) * 60);
  const rangeEnd = Math.min(
    24 * 60,
    Math.ceil((Math.max(...boundaries, 21 * 60) + 30) / 60) * 60,
  );
  const calendarHeight = ((rangeEnd - rangeStart) / 60) * 90;
  const position = (minute: number) => ((minute - rangeStart) / (rangeEnd - rangeStart)) * 100;
  const duration = (minutes: number) => (minutes / (rangeEnd - rangeStart)) * 100;

  const dayTotals = Object.fromEntries(
    DAYS.map((day) => [
      day,
      plan.blocks
        .filter((block) => block.day === day)
        .reduce((sum, block) => sum + block.minutes, 0),
    ]),
  ) as Record<Day, number>;

  return (
    <section aria-labelledby="weekly-calendar-title" className="mt-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="weekly-calendar-title" className="text-2xl font-semibold">
            Your seven-day plan
          </h2>
          <p className="mt-1.5 text-sm text-ink-soft">
            Classes stay fixed. Study blocks only use availability you confirmed.
          </p>
        </div>
        <p className="text-xs text-ink-faint">Times use your local time zone.</p>
      </div>

      <div className="mt-5 hidden overflow-x-auto rounded-2xl border border-line bg-surface md:block">
        <div className="min-w-[1080px]">
          <div
            className="sticky top-0 z-30 grid border-b border-line bg-surface"
            style={{ gridTemplateColumns: "64px repeat(7, minmax(140px, 1fr))" }}
          >
            <div aria-hidden />
            {DAYS.map((day) => (
              <div key={day} className="border-l border-line px-2 py-3 text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-faint">
                  {DAY_SHORT[day]}
                </p>
                <p className="mt-0.5 text-xs tabular-nums text-ink-soft">
                  {dayTotals[day] ? `${Math.round((dayTotals[day] / 60) * 10) / 10}h planned` : "Open"}
                </p>
              </div>
            ))}
          </div>

          <div
            className="grid"
            style={{
              gridTemplateColumns: "64px repeat(7, minmax(140px, 1fr))",
              height: calendarHeight,
            }}
          >
            <div className="relative bg-line-soft/30">
              {Array.from({ length: Math.floor((rangeEnd - rangeStart) / 60) + 1 }, (_, index) => {
                const minute = rangeStart + index * 60;
                return (
                  <span
                    key={minute}
                    className="absolute right-2 -translate-y-1/2 text-[10px] text-ink-faint"
                    style={{ top: `${position(minute)}%` }}
                  >
                    {formatMinute(minute)}
                  </span>
                );
              })}
            </div>

            {DAYS.map((day) => {
              const items = itemsForDay(day, schedule, plan);
              const windows = schedule.studyWindows.filter((window) => window.days.includes(day));
              return (
                <div
                  key={day}
                  className="relative border-l border-line bg-[linear-gradient(to_bottom,var(--color-line-soft)_1px,transparent_1px)] bg-[length:100%_90px]"
                >
                  {windows.map((window) => (
                    <div
                      key={`${window.id}-${day}`}
                      className="absolute inset-x-1 rounded-lg border border-dashed border-brand-100 bg-brand-50/35"
                      style={{
                        top: `${position(window.startMinute)}%`,
                        height: `${duration(window.endMinute - window.startMinute)}%`,
                      }}
                      title={`Available ${formatMinute(window.startMinute)} to ${formatMinute(window.endMinute)}`}
                    />
                  ))}

                  {items.map((item) => {
                    const top = `${position(item.start)}%`;
                    const height = `${duration(item.end - item.start)}%`;
                    if (item.kind === "class") {
                      return (
                        <div
                          key={item.id}
                          className="absolute inset-x-1 z-10 overflow-hidden rounded-lg border border-slate-300 bg-slate-200/95 p-2 text-xs text-slate-800"
                          style={{ top, height }}
                          aria-label={`${item.label}, ${day}, ${formatMinute(item.start)} to ${formatMinute(item.end)}`}
                        >
                          <p className="font-semibold">{item.label}</p>
                          <p className="mt-0.5 text-[10px]">{formatMinute(item.start)}</p>
                        </div>
                      );
                    }
                    const courseName = blockCourseName(item.block, schedule);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedBlockId(item.block.id)}
                        className={cn(
                          "absolute inset-x-1 z-20 overflow-hidden rounded-lg border p-2 text-left text-xs shadow-sm focus-visible:z-30 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-600",
                          blockStyle(item.block, schedule),
                        )}
                        style={{ top, height, minHeight: 44 }}
                        aria-label={`${courseName} study, ${day}, ${formatMinute(item.start)} to ${formatMinute(item.end)}, ${TECHNIQUE_BY_ID[item.block.techniqueId]?.name ?? item.block.label}`}
                      >
                        <p className="truncate font-semibold">{courseName}</p>
                        <p className="mt-0.5 truncate text-[10px]">{item.block.label}</p>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-5 md:hidden">
        <div className="flex gap-2 overflow-x-auto pb-2" aria-label="Choose a day">
          {DAYS.map((day) => (
            <button
              key={day}
              type="button"
              aria-pressed={selectedDay === day}
              onClick={() => setSelectedDay(day)}
              className={cn(
                "min-h-11 min-w-16 rounded-xl border px-2 text-sm",
                selectedDay === day
                  ? "border-brand-500 bg-brand-50 font-semibold text-brand-700"
                  : "border-line bg-surface text-ink-soft",
              )}
            >
              <span className="block">{DAY_SHORT[day]}</span>
              <span className="block text-[10px] font-normal">{dayTotals[day] ? `${dayTotals[day]}m` : "Open"}</span>
            </button>
          ))}
        </div>

        <Card className="mt-3 p-4 sm:p-5">
          <h3 className="font-semibold">{selectedDay}</h3>
          <p className="mt-1 text-xs text-ink-faint">
            {schedule.studyWindows
              .filter((window) => window.days.includes(selectedDay))
              .map((window) => `${formatMinute(window.startMinute)}–${formatMinute(window.endMinute)}`)
              .join(" · ") || "No study availability marked"}
          </p>
          <ol className="mt-4 space-y-3">
            {itemsForDay(selectedDay, schedule, plan).map((item) =>
              item.kind === "class" ? (
                <li key={item.id} className="rounded-xl border border-slate-300 bg-slate-100 p-4">
                  <p className="text-xs font-medium text-ink-faint">{formatMinute(item.start)}–{formatMinute(item.end)}</p>
                  <p className="mt-1 font-semibold">{item.label}</p>
                  <p className="mt-1 text-sm text-ink-soft">Class commitment</p>
                </li>
              ) : (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedBlockId(item.block.id)}
                    className={cn("min-h-11 w-full rounded-xl border p-4 text-left", blockStyle(item.block, schedule))}
                  >
                    <p className="text-xs font-medium opacity-70">{formatMinute(item.start)}–{formatMinute(item.end)}</p>
                    <p className="mt-1 font-semibold">{blockCourseName(item.block, schedule)}</p>
                    <p className="mt-1 text-sm">{item.block.label}</p>
                  </button>
                </li>
              ),
            )}
            {itemsForDay(selectedDay, schedule, plan).length === 0 && (
              <li className="rounded-xl border border-dashed border-line p-5 text-sm text-ink-faint">
                No classes or study blocks today.
              </li>
            )}
          </ol>
        </Card>
      </div>

      {selectedBlock && (
        <Card className="mt-5 border-brand-100 bg-brand-50/50" aria-live="polite">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-brand-700">
                Study block
              </p>
              <h3 className="mt-1 text-xl font-semibold">
                {blockCourseName(selectedBlock, schedule)} · {selectedBlock.label}
              </h3>
              <p className="mt-2 flex items-center gap-2 text-sm text-ink-soft">
                <Clock3 className="size-4" aria-hidden />
                {selectedBlock.day}, {formatMinute(blockStart(selectedBlock))}–{formatMinute(blockStart(selectedBlock) + selectedBlock.minutes)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedBlockId(null)}
              className="min-h-11 rounded-xl px-4 text-sm text-ink-soft hover:bg-white"
            >
              Close
            </button>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold">
                <BookOpen className="size-4 text-brand-600" aria-hidden />
                {TECHNIQUE_BY_ID[selectedBlock.techniqueId]?.name ?? "Study method"}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{selectedBlock.note}</p>
            </div>
            {selectedBlock.supportingTechniqueIds.length > 0 && (
              <div>
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <CalendarDays className="size-4 text-brand-600" aria-hidden />
                  Supporting method
                </p>
                <p className="mt-2 text-sm text-ink-soft">
                  {selectedBlock.supportingTechniqueIds
                    .map((id) => TECHNIQUE_BY_ID[id]?.name)
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
            )}
          </div>
        </Card>
      )}
    </section>
  );
}
