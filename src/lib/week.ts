import type { ScheduleSetup, WeekContext } from "@/lib/types";

export function currentWeekStart(date = new Date()): string {
  const local = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const mondayOffset = (local.getDay() + 6) % 7;
  local.setDate(local.getDate() - mondayOffset);
  const year = local.getFullYear();
  const month = String(local.getMonth() + 1).padStart(2, "0");
  const day = String(local.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function defaultWeekContext(schedule: ScheduleSetup): WeekContext {
  return {
    weekStart: currentWeekStart(),
    unavailableDays: [],
    busyWindows: [],
    courseTargets: [],
    targetStudyMinutes: schedule.targetStudyMinutes,
    load: "normal",
    energy: "steady",
    focusFrictions: [],
  };
}

export function normalizeWeekContext(
  schedule: ScheduleSetup,
  week?: WeekContext,
): WeekContext {
  const fallback = defaultWeekContext(schedule);
  return {
    ...fallback,
    ...week,
    unavailableDays: week?.unavailableDays ?? [],
    busyWindows: week?.busyWindows ?? [],
    courseTargets: week?.courseTargets ?? [],
    focusFrictions: week?.focusFrictions ?? [],
  };
}
