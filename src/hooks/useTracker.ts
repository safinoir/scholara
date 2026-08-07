"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { KEYS, readRaw, writeRaw } from "@/lib/storage";
import { trackerSchema } from "@/lib/schema";
import type { HabitLog } from "@/lib/types";

const MAX_HABITS = 3;

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Last `count` days, oldest first. */
export function recentDays(count = 7): string[] {
  const days: string[] = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const day = new Date(now);
    day.setDate(now.getDate() - i);
    days.push(day.toISOString().slice(0, 10));
  }
  return days;
}

function streaks(dates: string[]): { current: number; longest: number } {
  if (dates.length === 0) return { current: 0, longest: 0 };

  const sorted = [...new Set(dates)].sort();
  let longest = 1;
  let run = 1;

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const gapDays = Math.round(
      (curr.getTime() - prev.getTime()) / 86_400_000,
    );
    run = gapDays === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
  }

  // A streak counts as current if it includes today or yesterday, so missing
  // one day pauses the streak rather than destroying it.
  const last = sorted[sorted.length - 1];
  const daysSinceLast = Math.round(
    (new Date(todayISO()).getTime() - new Date(last).getTime()) / 86_400_000,
  );
  const current = daysSinceLast <= 1 ? run : 0;

  return { current, longest };
}

export function useTracker() {
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const parsed = trackerSchema.safeParse(readRaw(KEYS.tracker));
    if (parsed.success) setLogs(parsed.data.logs);
    setReady(true);
  }, []);

  const persist = useCallback((next: HabitLog[]) => {
    setLogs(next);
    writeRaw(KEYS.tracker, { version: 1, logs: next });
  }, []);

  const addHabit = useCallback(
    (habitId: string) => {
      if (logs.some((l) => l.habitId === habitId)) return;
      if (logs.length >= MAX_HABITS) return;
      persist([...logs, { habitId, completedDates: [] }]);
    },
    [logs, persist],
  );

  const removeHabit = useCallback(
    (habitId: string) => {
      persist(logs.filter((l) => l.habitId !== habitId));
    },
    [logs, persist],
  );

  const toggleDay = useCallback(
    (habitId: string, date: string) => {
      persist(
        logs.map((log) => {
          if (log.habitId !== habitId) return log;
          const done = log.completedDates.includes(date);
          return {
            ...log,
            completedDates: done
              ? log.completedDates.filter((d) => d !== date)
              : [...log.completedDates, date],
          };
        }),
      );
    },
    [logs, persist],
  );

  const stats = useMemo(
    () =>
      Object.fromEntries(
        logs.map((log) => [log.habitId, streaks(log.completedDates)]),
      ),
    [logs],
  );

  /** Days since the first logged check-in, used to prompt re-assessment. */
  const daysTracked = useMemo(() => {
    const all = logs.flatMap((l) => l.completedDates).sort();
    if (all.length === 0) return 0;
    return (
      Math.round(
        (new Date(todayISO()).getTime() - new Date(all[0]).getTime()) /
          86_400_000,
      ) + 1
    );
  }, [logs]);

  return {
    logs,
    ready,
    stats,
    daysTracked,
    addHabit,
    removeHabit,
    toggleDay,
    atCapacity: logs.length >= MAX_HABITS,
  };
}
