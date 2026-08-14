"use client";

import { useRouter } from "next/navigation";
import { useProfile } from "@/hooks/useProfile";
import {
  hasCompletedSchedule,
  hasConfirmedToolkit,
  resumeDestination,
} from "@/lib/onboarding";
import { buildPlanForProfile } from "@/lib/plan";
import { parseProfile, parseWeekContext } from "@/lib/schema";
import type {
  ScheduleSetup,
  WeekContext,
} from "@/lib/types";
import {
  isCurrentWeek,
  normalizeWeekContext,
  startCurrentWeek,
} from "@/lib/week";
import { LoadingShell, NoProfile } from "@/components/NoProfile";
import { OnboardingGate } from "@/components/OnboardingGate";
import {
  PlanSetupWizard,
  type PlanSetupSubmitResult,
} from "@/components/plan/PlanSetupWizard";

function currentWeekForSchedule(
  schedule: ScheduleSetup,
  savedWeek?: WeekContext,
): WeekContext {
  if (!savedWeek || !isCurrentWeek(savedWeek.weekStart)) {
    return startCurrentWeek(schedule);
  }

  const courseIds = new Set(schedule.courses.map((course) => course.id));
  const normalized = normalizeWeekContext(schedule, {
    ...savedWeek,
    courseTargets: (savedWeek.courseTargets ?? []).filter((target) =>
      courseIds.has(target.courseId),
    ),
  });
  return parseWeekContext(normalized, schedule) ?? startCurrentWeek(schedule);
}

function hasTemporaryOverrides(
  week: WeekContext,
  schedule: ScheduleSetup,
): boolean {
  return (
    week.load !== "normal" ||
    week.energy !== "steady" ||
    week.unavailableDays.length > 0 ||
    week.focusFrictions.length > 0 ||
    (week.busyWindows?.length ?? 0) > 0 ||
    (week.courseTargets?.length ?? 0) > 0 ||
    week.targetStudyMinutes !== schedule.targetStudyMinutes
  );
}

export function PlanSetupView() {
  const { profile, ready, setProfile } = useProfile();
  const router = useRouter();

  if (!ready) return <LoadingShell />;
  if (!profile) return <NoProfile />;
  if (!hasConfirmedToolkit(profile)) {
    const destination = resumeDestination(profile);
    return (
      <OnboardingGate
        title="Finish your study setup first"
        body="Review your persona and save at least one study method before adding your recurring week."
        href={destination.href}
        action={destination.label}
      />
    );
  }

  const hasSavedPlan = hasCompletedSchedule(profile);

  const completeSchedule = (
    schedule: ScheduleSetup,
  ): PlanSetupSubmitResult => {
    const savedWeekWasStale =
      hasSavedPlan && !isCurrentWeek(profile.weekContext?.weekStart);
    if (
      savedWeekWasStale &&
      !window.confirm(
        "Saving these recurring changes will start the current week and clear last week's temporary deadlines, busy times, workload, and energy. Continue?",
      )
    ) {
      return {
        success: false,
        message:
          "Your saved plan is unchanged. Continue editing or discard this draft to return.",
      };
    }

    let week = currentWeekForSchedule(schedule, profile.weekContext);
    let plan = buildPlanForProfile(profile, schedule, week);

    if (plan.blocks.length === 0 && hasTemporaryOverrides(week, schedule)) {
      const cleanWeek = startCurrentWeek(schedule);
      const cleanPlan = buildPlanForProfile(profile, schedule, cleanWeek);
      if (
        cleanPlan.blocks.length > 0 &&
        window.confirm(
          "Your current-week exceptions leave no usable study blocks. Reset those temporary exceptions and save the recurring schedule?",
        )
      ) {
        week = cleanWeek;
        plan = cleanPlan;
      }
    }

    if (plan.blocks.length === 0) {
      return {
        success: false,
        message:
          "Scholara could not create a study block from this schedule. Keep editing until at least one 30-minute fragment remains outside class times.",
      };
    }

    const nextProfile = parseProfile({
      ...profile,
      schedule,
      weekContext: week,
      plan,
      onboardingStage: "complete",
    });
    if (!nextProfile) {
      return {
        success: false,
        message:
          "The schedule did not pass Scholara's safety checks. Your saved plan and draft were kept.",
      };
    }

    setProfile(nextProfile);
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    });
    router.replace("/plan", { scroll: true });
    return { success: true };
  };

  return (
    <PlanSetupWizard
      profile={profile}
      onComplete={completeSchedule}
      onDiscard={
        hasSavedPlan ? () => router.replace("/plan", { scroll: true }) : undefined
      }
    />
  );
}
