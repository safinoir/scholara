"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { KEYS, readRaw, writeRaw } from "@/lib/storage";
import { trackerSchema } from "@/lib/schema";
import type { HabitLog } from "@/lib/types";

const MAX_HABITS = 3;
const DAY_MS = 86_400_000;

export function localDateISO(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayISO(): string {
  return localDateISO();
}

/** Last `count` days, oldest first. */
export function recentDays(count = 7, now = new Date()): string[] {
  const days: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const day = new Date(now);
    day.setDate(now.getDate() - i);
    days.push(localDateISO(day));
  }
  return days;
}

function dateOrdinal(iso: string): number {
  const [year, month, day] = iso.split("-").map(Number);
  return Date.UTC(year, month - 1, day) / DAY_MS;
}

function streaks(
  dates: string[],
  today: string,
): { current: number; longest: number } {
  if (dates.length === 0) return { current: 0, longest: 0 };

  const sorted = [...new Set(dates)].sort();
  let longest = 1;
  let run = 1;

  for (let i = 1; i < sorted.length; i++) {
    const gapDays = dateOrdinal(sorted[i]) - dateOrdinal(sorted[i - 1]);
    run = gapDays === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
  }

  // A streak counts as current if it includes today or yesterday, so missing
  // one day pauses the streak rather than destroying it.
  const last = sorted[sorted.length - 1];
  const daysSinceLast = dateOrdinal(today) - dateOrdinal(last);
  const current = daysSinceLast <= 1 ? run : 0;

  return { current, longest };
}

export function useTracker() {
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [today, setToday] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const hydration = window.setTimeout(() => {
      const parsed = trackerSchema.safeParse(readRaw(KEYS.tracker));
      if (parsed.success) setLogs(parsed.data.logs);
      setToday(todayISO());
      setReady(true);
    }, 0);
    return () => window.clearTimeout(hydration);
  }, []);

  useEffect(() => {
    if (!ready) return;

    let rolloverTimer: number | undefined;
    const syncToday = () => {
      const next = todayISO();
      setToday((current) => (current === next ? current : next));
    };
    const scheduleRollover = () => {
      if (rolloverTimer !== undefined) window.clearTimeout(rolloverTimer);
      const now = new Date();
      const nextMidnight = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
      );
      rolloverTimer = window.setTimeout(() => {
        syncToday();
        scheduleRollover();
      }, nextMidnight.getTime() - now.getTime() + 100);
    };
    const syncWhenVisible = () => {
      if (document.visibilityState !== "visible") return;
      syncToday();
      scheduleRollover();
    };

    scheduleRollover();
    document.addEventListener("visibilitychange", syncWhenVisible);
    return () => {
      if (rolloverTimer !== undefined) window.clearTimeout(rolloverTimer);
      document.removeEventListener("visibilitychange", syncWhenVisible);
    };
  }, [ready]);

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

  const clearAll = useCallback(() => {
    persist([]);
  }, [persist]);

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
        logs.map((log) => [log.habitId, streaks(log.completedDates, today)]),
      ),
    [logs, today],
  );

  /** Days since the first logged check-in, used to prompt re-assessment. */
  const daysTracked = useMemo(() => {
    const all = logs.flatMap((l) => l.completedDates).sort();
    if (all.length === 0) return 0;
    return (
      Math.round(
        dateOrdinal(today) - dateOrdinal(all[0]),
      ) + 1
    );
  }, [logs, today]);

  return {
    logs,
    ready,
    today,
    stats,
    daysTracked,
    addHabit,
    removeHabit,
    clearAll,
    toggleDay,
    atCapacity: logs.length >= MAX_HABITS,
  };
}
