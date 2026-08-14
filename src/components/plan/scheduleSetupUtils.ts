import {
  DAYS,
  type Day,
  type RecurringClassMeeting,
  type ScheduleSetup,
  type StudyWindow,
} from "@/lib/types";
import { calculateScheduleCapacity } from "@/lib/engine";

type MinuteRange = {
  startMinute: number;
  endMinute: number;
};

export type CapacitySummary = {
  /** Normalized confirmed availability before classes are subtracted. */
  availableMinutes: number;
  /** Total recurring class time across the week. */
  classMinutes: number;
  /** Class time that overlaps the learner's confirmed study windows. */
  classOverlapMinutes: number;
  /** Engine-usable time after blocking and sub-30-minute fragments are removed. */
  usableMinutes: number;
  plannedMinutes: number;
  bufferMinutes: number;
  shortfallMinutes: number;
};

const DAY_INDEX = new Map<Day, number>(
  DAYS.map((day, index) => [day, index]),
);

export function sortDays(days: Day[]): Day[] {
  return [...days].sort(
    (left, right) =>
      (DAY_INDEX.get(left) ?? 0) - (DAY_INDEX.get(right) ?? 0),
  );
}

export function formatDayList(days: Day[]): string {
  return sortDays(days)
    .map((day) => day.slice(0, 3))
    .join(", ");
}

export function minutesToTimeInput(minutes: number): string {
  if (minutes === 1440) return "00:00";
  const safeMinutes = Math.max(0, Math.min(1439, minutes));
  const hours = Math.floor(safeMinutes / 60);
  const remainder = safeMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

export function timeInputToMinutes(value: string, isEnd = false): number {
  const [hours, minutes] = value.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return 0;
  if (isEnd && hours === 0 && minutes === 0) return 1440;
  return hours * 60 + minutes;
}

export function formatClock(minutes: number): string {
  const normalized = minutes === 1440 ? 0 : minutes;
  const hours = Math.floor(normalized / 60);
  const remainder = normalized % 60;
  const suffix = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${String(remainder).padStart(2, "0")} ${suffix}`;
}

export function formatDuration(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} hr`;
  return `${hours} hr ${minutes} min`;
}

function mergeRanges(ranges: MinuteRange[]): MinuteRange[] {
  const sorted = ranges
    .filter((range) => range.endMinute > range.startMinute)
    .sort(
      (left, right) =>
        left.startMinute - right.startMinute ||
        left.endMinute - right.endMinute,
    );
  const merged: MinuteRange[] = [];

  for (const range of sorted) {
    const previous = merged.at(-1);
    if (previous && range.startMinute <= previous.endMinute) {
      previous.endMinute = Math.max(previous.endMinute, range.endMinute);
    } else {
      merged.push({ ...range });
    }
  }

  return merged;
}

function rangesByDay<T extends { days: Day[] } & MinuteRange>(
  ranges: T[],
): Map<Day, MinuteRange[]> {
  const byDay = new Map<Day, MinuteRange[]>();
  for (const day of DAYS) byDay.set(day, []);

  for (const range of ranges) {
    for (const day of range.days) {
      byDay.get(day)?.push({
        startMinute: range.startMinute,
        endMinute: range.endMinute,
      });
    }
  }

  for (const day of DAYS) {
    byDay.set(day, mergeRanges(byDay.get(day) ?? []));
  }
  return byDay;
}

export function normalizeStudyWindows(windows: StudyWindow[]): StudyWindow[] {
  const byDay = rangesByDay(windows);
  const byTime = new Map<string, StudyWindow>();

  for (const day of DAYS) {
    for (const range of byDay.get(day) ?? []) {
      const key = `${range.startMinute}-${range.endMinute}`;
      const existing = byTime.get(key);
      if (existing) {
        existing.days.push(day);
      } else {
        byTime.set(key, {
          id: `window-${range.startMinute}-${range.endMinute}`,
          days: [day],
          ...range,
        });
      }
    }
  }

  return [...byTime.values()].map((window) => ({
    ...window,
    days: sortDays(window.days),
  }));
}

export function meetingConflictDays(
  meetings: RecurringClassMeeting[],
): Map<string, Day[]> {
  const conflicts = new Map<string, Set<Day>>();

  for (let left = 0; left < meetings.length; left += 1) {
    for (let right = left + 1; right < meetings.length; right += 1) {
      const first = meetings[left];
      const second = meetings[right];
      const overlaps =
        first.startMinute < second.endMinute &&
        second.startMinute < first.endMinute;
      if (!overlaps) continue;

      for (const day of first.days) {
        if (!second.days.includes(day)) continue;
        const firstDays = conflicts.get(first.id) ?? new Set<Day>();
        const secondDays = conflicts.get(second.id) ?? new Set<Day>();
        firstDays.add(day);
        secondDays.add(day);
        conflicts.set(first.id, firstDays);
        conflicts.set(second.id, secondDays);
      }
    }
  }

  return new Map(
    [...conflicts].map(([id, days]) => [id, sortDays([...days])]),
  );
}

export function sortMeetings(
  meetings: RecurringClassMeeting[],
): RecurringClassMeeting[] {
  return [...meetings].sort((left, right) => {
    const leftDay = Math.min(
      ...left.days.map((day) => DAY_INDEX.get(day) ?? 0),
    );
    const rightDay = Math.min(
      ...right.days.map((day) => DAY_INDEX.get(day) ?? 0),
    );
    return (
      leftDay - rightDay ||
      left.startMinute - right.startMinute ||
      left.label.localeCompare(right.label)
    );
  });
}

export function sortStudyWindows(windows: StudyWindow[]): StudyWindow[] {
  return [...windows].sort((left, right) => {
    const leftDay = Math.min(
      ...left.days.map((day) => DAY_INDEX.get(day) ?? 0),
    );
    const rightDay = Math.min(
      ...right.days.map((day) => DAY_INDEX.get(day) ?? 0),
    );
    return leftDay - rightDay || left.startMinute - right.startMinute;
  });
}

export function summarizeCapacity(schedule: ScheduleSetup): CapacitySummary {
  const capacity = calculateScheduleCapacity(schedule);

  return {
    availableMinutes: capacity.rawWindowMinutes,
    classMinutes: capacity.classMinutes,
    classOverlapMinutes: capacity.classOverlapMinutes,
    usableMinutes: capacity.availableMinutes,
    plannedMinutes: capacity.plannedMinutes,
    bufferMinutes: capacity.bufferMinutes,
    shortfallMinutes: capacity.shortfallMinutes,
  };
}
