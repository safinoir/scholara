import { TECHNIQUE_BY_ID } from "@/lib/data/techniques";
import {
  DAYS,
  type AxisScores,
  type Course,
  type Day,
  type Friction,
  type PlanBlock,
  type PlanWarning,
  type ScheduleSetup,
  type ScoredTechnique,
  type Technique,
  type TechniqueScheduleRole,
  type WeekContext,
  type WeekPlan,
} from "@/lib/types";

const GRID_MINUTES = 15;
const MIN_BLOCK_MINUTES = 30;
const WEEKLY_REVIEW_MINUTES = 30;
const MAX_BLOCK_MINUTES = 120;

export type UsableStudyWindow = Readonly<{
  day: Day;
  startMinute: number;
  endMinute: number;
}>;

export type ScheduleCapacity = Readonly<{
  usableWindows: readonly UsableStudyWindow[];
  availableMinutes: number;
  rawWindowMinutes: number;
  removedMinutes: number;
}>;

export type BuildSchedulePlanInput = {
  axes: AxisScores;
  frictions: Friction[];
  schedule: ScheduleSetup;
  techniques: ScoredTechnique[];
  selectedTechniqueIds: string[];
  week?: WeekContext;
};

type MinuteRange = {
  startMinute: number;
  endMinute: number;
};

type WorkingWindow = MinuteRange & { day: Day };

type DraftBlock = Omit<PlanBlock, "id">;

const dayIndex = (day: Day) => DAYS.indexOf(day);
const floorToGrid = (minutes: number) =>
  Math.floor(minutes / GRID_MINUTES) * GRID_MINUTES;
const ceilToGrid = (minutes: number) =>
  Math.ceil(minutes / GRID_MINUTES) * GRID_MINUTES;

function emptyRangesByDay(): Record<Day, MinuteRange[]> {
  return DAYS.reduce(
    (ranges, day) => {
      ranges[day] = [];
      return ranges;
    },
    {} as Record<Day, MinuteRange[]>,
  );
}

function studyRange(startMinute: number, endMinute: number): MinuteRange | null {
  const start = Math.max(0, Math.min(1440, ceilToGrid(startMinute)));
  const end = Math.max(0, Math.min(1440, floorToGrid(endMinute)));
  return end > start ? { startMinute: start, endMinute: end } : null;
}

function blockedRange(
  startMinute: number,
  endMinute: number,
): MinuteRange | null {
  const start = Math.max(0, Math.min(1440, floorToGrid(startMinute)));
  const end = Math.max(0, Math.min(1440, ceilToGrid(endMinute)));
  return end > start ? { startMinute: start, endMinute: end } : null;
}

function mergeRanges(ranges: MinuteRange[]): MinuteRange[] {
  const sorted = [...ranges].sort(
    (left, right) =>
      left.startMinute - right.startMinute || left.endMinute - right.endMinute,
  );
  const merged: MinuteRange[] = [];

  for (const range of sorted) {
    const previous = merged[merged.length - 1];
    if (!previous || range.startMinute > previous.endMinute) {
      merged.push({ ...range });
    } else {
      previous.endMinute = Math.max(previous.endMinute, range.endMinute);
    }
  }

  return merged;
}

function subtractRanges(
  studyRanges: MinuteRange[],
  blockedRanges: MinuteRange[],
): MinuteRange[] {
  let remaining = studyRanges.map((range) => ({ ...range }));

  for (const blocked of mergeRanges(blockedRanges)) {
    remaining = remaining.flatMap((range) => {
      if (
        blocked.endMinute <= range.startMinute ||
        blocked.startMinute >= range.endMinute
      ) {
        return [range];
      }

      const fragments: MinuteRange[] = [];
      if (blocked.startMinute > range.startMinute) {
        fragments.push({
          startMinute: range.startMinute,
          endMinute: blocked.startMinute,
        });
      }
      if (blocked.endMinute < range.endMinute) {
        fragments.push({
          startMinute: blocked.endMinute,
          endMinute: range.endMinute,
        });
      }
      return fragments;
    });
  }

  return remaining;
}

/** Returns normalized study time after recurring and week-specific constraints. */
export function calculateScheduleCapacity(
  schedule: ScheduleSetup,
  week?: WeekContext,
): ScheduleCapacity {
  const studyByDay = emptyRangesByDay();
  const blockedByDay = emptyRangesByDay();

  for (const window of schedule.studyWindows) {
    const range = studyRange(window.startMinute, window.endMinute);
    if (!range) continue;
    for (const day of window.days) studyByDay[day].push(range);
  }

  for (const meeting of schedule.classMeetings) {
    const range = blockedRange(meeting.startMinute, meeting.endMinute);
    if (!range) continue;
    for (const day of meeting.days) blockedByDay[day].push(range);
  }

  for (const busy of week?.busyWindows ?? []) {
    const range = blockedRange(busy.startMinute, busy.endMinute);
    if (range) blockedByDay[busy.day].push(range);
  }

  const unavailableDays = new Set(week?.unavailableDays ?? []);
  let rawWindowMinutes = 0;
  const usableWindows: UsableStudyWindow[] = [];

  for (const day of DAYS) {
    const normalized = mergeRanges(studyByDay[day]);
    rawWindowMinutes += normalized.reduce(
      (total, range) => total + range.endMinute - range.startMinute,
      0,
    );
    if (unavailableDays.has(day)) continue;

    const available = subtractRanges(normalized, blockedByDay[day]).filter(
      (range) => range.endMinute - range.startMinute >= MIN_BLOCK_MINUTES,
    );
    for (const range of available) usableWindows.push({ day, ...range });
  }

  const availableMinutes = usableWindows.reduce(
    (total, range) => total + range.endMinute - range.startMinute,
    0,
  );

  return {
    usableWindows,
    availableMinutes,
    rawWindowMinutes,
    removedMinutes: Math.max(0, rawWindowMinutes - availableMinutes),
  };
}

function formatDuration(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} minutes`;
  if (minutes === 0) return `${hours} hour${hours === 1 ? "" : "s"}`;
  return `${hours}h ${minutes}m`;
}

function cadenceMinutes(axes: AxisScores, week?: WeekContext): number {
  if (week?.energy === "depleted") return 30;
  if (axes.rhythm <= -35) return 30;
  if (axes.rhythm >= 45) return 90;
  return 45;
}

function peakMinute(clock: number): number {
  if (clock <= -50) return 7 * 60;
  if (clock <= -15) return 9 * 60;
  if (clock < 30) return 16 * 60;
  return 20 * 60;
}

function techniqueRoles(technique: Technique): TechniqueScheduleRole[] {
  if (technique.scheduleRoles?.length) return technique.scheduleRoles;
  if (technique.category === "focus") return ["focus-support"];
  if (technique.category === "planning") return ["planning"];
  if (technique.category === "exam") return ["review"];
  return ["learn", "review"];
}

function techniqueMinimum(technique: Technique): number {
  return Math.max(
    MIN_BLOCK_MINUTES,
    ceilToGrid(technique.minBlockMinutes ?? MIN_BLOCK_MINUTES),
  );
}

function hasAssessment(
  course: Course | undefined,
  week?: WeekContext,
): boolean {
  if (!course || !week?.courseTargets?.length) return false;
  return week.courseTargets.some(
    (target) => target.courseId === course.id && target.deadlineDay !== null,
  );
}

function supportsRole(
  technique: Technique,
  role: TechniqueScheduleRole,
  maxMinutes: number,
  assessment: boolean,
): boolean {
  return (
    techniqueRoles(technique).includes(role) &&
    techniqueMinimum(technique) <= maxMinutes &&
    (!technique.requiresAssessment || assessment)
  );
}

function uniqueTechniques(techniques: Technique[]): Technique[] {
  const seen = new Set<string>();
  return techniques.filter((technique) => {
    if (seen.has(technique.id)) return false;
    seen.add(technique.id);
    return true;
  });
}

function foundationTechniques(role: TechniqueScheduleRole): Technique[] {
  const ids: Record<TechniqueScheduleRole, string[]> = {
    learn: ["retrieval-practice", "feynman"],
    review: ["spaced-repetition", "retrieval-practice", "error-log"],
    "focus-support": ["pomodoro", "five-minute-rule"],
    planning: ["weekly-review", "time-blocking"],
    "pre-assessment": ["brain-dump", "practice-testing"],
  };
  return ids[role]
    .map((id) => TECHNIQUE_BY_ID[id])
    .filter((technique): technique is Technique => Boolean(technique));
}

function removeWindowSection(
  windows: WorkingWindow[],
  chosen: WorkingWindow,
  startMinute: number,
  minutes: number,
): void {
  const index = windows.indexOf(chosen);
  if (index === -1) return;
  const endMinute = startMinute + minutes;
  const replacements: WorkingWindow[] = [];
  if (startMinute - chosen.startMinute >= MIN_BLOCK_MINUTES) {
    replacements.push({
      day: chosen.day,
      startMinute: chosen.startMinute,
      endMinute: startMinute,
    });
  }
  if (chosen.endMinute - endMinute >= MIN_BLOCK_MINUTES) {
    replacements.push({
      day: chosen.day,
      startMinute: endMinute,
      endMinute: chosen.endMinute,
    });
  }
  windows.splice(index, 1, ...replacements);
}

function reserveWeeklyReview(
  windows: WorkingWindow[],
): { day: Day; startMinute: number } | null {
  const candidates = windows
    .filter(
      (window) =>
        window.endMinute - window.startMinute >= WEEKLY_REVIEW_MINUTES,
    )
    .sort((left, right) => {
      const leftSunday = left.day === "Sunday" ? 1 : 0;
      const rightSunday = right.day === "Sunday" ? 1 : 0;
      return (
        rightSunday - leftSunday ||
        dayIndex(right.day) - dayIndex(left.day) ||
        right.endMinute - left.endMinute ||
        right.startMinute - left.startMinute
      );
    });
  const chosen = candidates[0];
  if (!chosen) return null;
  const startMinute = chosen.endMinute - WEEKLY_REVIEW_MINUTES;
  removeWindowSection(
    windows,
    chosen,
    startMinute,
    WEEKLY_REVIEW_MINUTES,
  );
  return { day: chosen.day, startMinute };
}

function preferredStart(
  window: WorkingWindow,
  minutes: number,
  peak: number,
): number {
  const latestStart = window.endMinute - minutes;
  return Math.max(window.startMinute, Math.min(latestStart, peak));
}

function placeInWindow(
  windows: WorkingWindow[],
  minutes: number,
  peak: number,
  dayBlockCounts: Record<Day, number>,
  dayMinutes: Record<Day, number>,
  deadlineDay?: Day | null,
): { day: Day; startMinute: number } | null {
  let candidates = windows.filter(
    (window) => window.endMinute - window.startMinute >= minutes,
  );
  if (deadlineDay) {
    const beforeDeadline = candidates.filter(
      (window) => dayIndex(window.day) <= dayIndex(deadlineDay),
    );
    if (beforeDeadline.length) candidates = beforeDeadline;
  }

  candidates.sort((left, right) => {
    const leftStart = preferredStart(left, minutes, peak);
    const rightStart = preferredStart(right, minutes, peak);
    return (
      dayBlockCounts[left.day] - dayBlockCounts[right.day] ||
      dayMinutes[left.day] - dayMinutes[right.day] ||
      Math.abs(leftStart - peak) - Math.abs(rightStart - peak) ||
      dayIndex(left.day) - dayIndex(right.day) ||
      left.startMinute - right.startMinute
    );
  });

  const chosen = candidates[0];
  if (!chosen) return null;
  const startMinute = preferredStart(chosen, minutes, peak);
  removeWindowSection(windows, chosen, startMinute, minutes);
  dayBlockCounts[chosen.day]++;
  dayMinutes[chosen.day] += minutes;
  return { day: chosen.day, startMinute };
}

function chooseDuration(
  preferred: number,
  minimum: number,
  remaining: number,
  largestWindow: number,
): number {
  const maximum = floorToGrid(
    Math.min(remaining, largestWindow, MAX_BLOCK_MINUTES),
  );
  if (maximum < minimum) return 0;

  let duration = Math.min(maximum, Math.max(minimum, preferred));
  duration = floorToGrid(duration);
  const leftover = remaining - duration;

  if (leftover > 0 && leftover < MIN_BLOCK_MINUTES) {
    if (duration + leftover <= maximum) {
      duration += leftover;
    } else if (duration - GRID_MINUTES >= minimum) {
      duration -= GRID_MINUTES;
    }
  }

  return duration >= minimum ? duration : 0;
}

function priorityWeight(course: Course, week?: WeekContext): number {
  const base = { maintenance: 1, standard: 2, focus: 3 }[course.priority];
  const target = week?.courseTargets?.find(
    (candidate) => candidate.courseId === course.id,
  );
  if (target?.priority === "urgent") return 4;
  if (target?.priority === "focus") return Math.max(base, 3);
  return base;
}

function courseDeadline(course: Course | undefined, week?: WeekContext) {
  if (!course) return null;
  return (
    week?.courseTargets?.find((target) => target.courseId === course.id)
      ?.deadlineDay ?? null
  );
}

const FRICTION_STRATEGIES: Record<Friction, string> = {
  procrastination:
    "Each course starts with a five-minute action so beginning feels smaller than the full assignment.",
  distraction:
    "The first block on each study day includes a single-task, device-free setup.",
  retention:
    "Later course blocks become closed-note retrieval reviews whenever the available time permits.",
  "test-anxiety":
    "The plan uses low-stakes, closed-note practice before deadlines or on the highest-priority course.",
  overwhelm:
    "Every block contains one course and one concrete finish line instead of an open-ended study goal.",
  "time-scarcity":
    "The plan protects first-pass course coverage, prioritizes higher-need courses, and reports any target shortfall.",
  "no-quiet-space":
    "The first block each day begins with a portable study setup such as headphones and downloaded materials.",
  motivation:
    "The first block for each course ends with a small, visible result that makes progress easy to see.",
  "reading-load":
    "Reading work is converted into an active output such as questions, a summary, or a concept map.",
  "math-heavy":
    "Problem-based work emphasizes solving, checking, and recording errors instead of rereading examples.",
};

const STARTER_INSTRUCTION =
  "Begin with five minutes on one finish line and leave one visible result.";

const FRICTION_BLOCK_INSTRUCTIONS: Record<Friction, string> = {
  procrastination: STARTER_INSTRUCTION,
  distraction: "Silence notifications and work only on this course.",
  retention: "Finish with closed-note recall and record what you missed.",
  "test-anxiety":
    "Attempt a few questions from memory before checking answers.",
  overwhelm: "Work toward one finish line and defer everything else.",
  "time-scarcity":
    "Do the highest-value task first and stop at the scheduled end.",
  "no-quiet-space":
    "Prepare headphones and downloaded materials before starting.",
  motivation: STARTER_INSTRUCTION,
  "reading-load":
    "Turn the reading into questions, a summary, or a concept map.",
  "math-heavy":
    "Solve, check, and record errors instead of rereading examples.",
};

function uniqueFrictions(
  profileFrictions: readonly Friction[],
  weekFrictions: readonly Friction[],
): Friction[] {
  return [...new Set([...profileFrictions, ...weekFrictions])];
}

/** Builds a plan only inside the study windows the learner confirmed. */
export function buildSchedulePlan(input: BuildSchedulePlanInput): WeekPlan {
  const {
    axes,
    frictions,
    schedule,
    techniques,
    selectedTechniqueIds,
    week,
  } = input;
  const capacity = calculateScheduleCapacity(schedule, week);
  const requestedMinutes = Math.max(
    0,
    Math.floor(week?.targetStudyMinutes ?? schedule.targetStudyMinutes),
  );
  const energyFactor = week?.energy === "depleted" ? 0.7 : 1;
  const loadFactor = week?.load === "light" ? 0.85 : 1;
  const effectiveRequestedMinutes = floorToGrid(
    requestedMinutes * Math.min(energyFactor, loadFactor),
  );
  const targetMinutes = Math.min(
    effectiveRequestedMinutes,
    capacity.availableMinutes,
  );
  const includedCourses = schedule.courses.filter(
    (course) => course.includedInPlan,
  );
  const reviewThreshold = Math.max(
    120,
    WEEKLY_REVIEW_MINUTES * (includedCourses.length + 1),
  );
  const shouldAttemptReview =
    includedCourses.length > 0 && targetMinutes >= reviewThreshold;
  let remainingMinutes = Math.max(
    0,
    targetMinutes - (shouldAttemptReview ? WEEKLY_REVIEW_MINUTES : 0),
  );
  const workingWindows: WorkingWindow[] = capacity.usableWindows.map(
    (window) => ({ ...window }),
  );
  const profileFrictionSet = new Set(frictions);
  const weekFrictionSet = new Set(week?.focusFrictions ?? []);
  const effectiveFrictions = uniqueFrictions(
    frictions,
    week?.focusFrictions ?? [],
  );
  const effectiveFrictionSet = new Set(effectiveFrictions);
  const resolvedFrictions = new Set<Friction>();

  const recommended = uniqueTechniques(
    techniques.map((scored) => scored.technique),
  );
  const techniqueLookup = new Map(
    uniqueTechniques([
      ...recommended,
      ...Object.values(TECHNIQUE_BY_ID),
    ]).map((technique) => [technique.id, technique]),
  );
  const selected = uniqueTechniques(
    selectedTechniqueIds
      .map((id) => techniqueLookup.get(id))
      .filter((technique): technique is Technique => Boolean(technique)),
  );
  const selectedIds = new Set(selectedTechniqueIds);
  const recommendedFallbacks = recommended.filter(
    (technique) => !selectedIds.has(technique.id),
  );
  const usedTechniqueIds = new Set<string>();
  const draftBlocks: DraftBlock[] = [];
  const cadence = cadenceMinutes(axes, week);
  const peak = peakMinute(axes.clock);
  const dayBlockCounts = Object.fromEntries(DAYS.map((day) => [day, 0])) as Record<
    Day,
    number
  >;
  const dayMinutes = Object.fromEntries(DAYS.map((day) => [day, 0])) as Record<
    Day,
    number
  >;

  const allocatedByCourse = new Map(
    includedCourses.map((course) => [course.id, 0]),
  );
  const firstPass = [...includedCourses].sort((left, right) => {
    const weightDifference =
      priorityWeight(right, week) - priorityWeight(left, week);
    if (weightDifference) return weightDifference;
    const leftDeadline = courseDeadline(left, week);
    const rightDeadline = courseDeadline(right, week);
    if (leftDeadline && rightDeadline) {
      return dayIndex(leftDeadline) - dayIndex(rightDeadline);
    }
    if (leftDeadline) return -1;
    if (rightDeadline) return 1;
    return (
      includedCourses.indexOf(left) - includedCourses.indexOf(right)
    );
  });
  const subjectFrictionCourseId = [...includedCourses].sort(
    (left, right) =>
      priorityWeight(right) - priorityWeight(left) ||
      includedCourses.indexOf(left) - includedCourses.indexOf(right),
  )[0]?.id;
  const assessmentFrictionCourseId =
    firstPass.find((course) => courseDeadline(course, week))?.id ??
    subjectFrictionCourseId;
  let firstPassIndex = 0;
  let contentIndex = 0;

  const nextCourse = (): Course | undefined => {
    if (!includedCourses.length) return undefined;
    if (firstPassIndex < firstPass.length) return firstPass[firstPassIndex++];
    return [...includedCourses].sort((left, right) => {
      const leftShare =
        (allocatedByCourse.get(left.id) ?? 0) / priorityWeight(left, week);
      const rightShare =
        (allocatedByCourse.get(right.id) ?? 0) / priorityWeight(right, week);
      return (
        leftShare - rightShare ||
        priorityWeight(right, week) - priorityWeight(left, week) ||
        includedCourses.indexOf(left) - includedCourses.indexOf(right)
      );
    })[0];
  };

  const roleForTechnique = (
    technique: Technique,
    assessment: boolean,
    wantsReview: boolean,
  ): TechniqueScheduleRole => {
    const roles = techniqueRoles(technique);
    if (assessment && roles.includes("pre-assessment")) {
      return "pre-assessment";
    }
    if (wantsReview && roles.includes("review")) return "review";
    if (
      roles.includes("learn") &&
      roles.includes("review") &&
      usedTechniqueIds.has(technique.id) &&
      contentIndex % 3 === 2
    ) {
      return "review";
    }
    if (roles.includes("learn")) return "learn";
    return "review";
  };

  const pickPrimary = (
    maxMinutes: number,
    assessment: boolean,
    wantsReview: boolean,
  ): {
    technique: Technique;
    role: TechniqueScheduleRole;
    source: "selected" | "foundation";
  } | null => {
    const fixesUnresolvedFriction = (technique: Technique) =>
      effectiveFrictions.some(
        (friction) =>
          !resolvedFrictions.has(friction) && technique.fixes.includes(friction),
      );
    const selectedPrimary = selected.filter((technique) => {
      const roles = techniqueRoles(technique);
      return (
        (roles.includes(wantsReview ? "review" : "learn") ||
          (assessment &&
            (roles.includes("pre-assessment") ||
              (technique.requiresAssessment && roles.includes("review"))))) &&
        techniqueMinimum(technique) <= maxMinutes &&
        (!technique.requiresAssessment || assessment)
      );
    });
    const selectedTechnique =
      (assessment && effectiveFrictionSet.has("test-anxiety")
        ? selectedPrimary.find(
            (technique) =>
              technique.fixes.includes("test-anxiety") &&
              (technique.requiresAssessment ||
                techniqueRoles(technique).includes("pre-assessment")),
          )
        : undefined) ??
      (wantsReview
        ? selectedPrimary.find(
            (technique) =>
              techniqueRoles(technique).includes("review") &&
              technique.fixes.includes("retention"),
          )
        : undefined) ??
      selectedPrimary.find(fixesUnresolvedFriction) ??
      selectedPrimary.find((technique) => !usedTechniqueIds.has(technique.id)) ??
      selectedPrimary[contentIndex % Math.max(1, selectedPrimary.length)];
    if (selectedTechnique) {
      return {
        technique: selectedTechnique,
        role: roleForTechnique(selectedTechnique, assessment, wantsReview),
        source: "selected",
      };
    }

    const fallbackPool = uniqueTechniques([
      ...recommendedFallbacks,
      ...foundationTechniques("learn"),
      ...foundationTechniques("review"),
    ]);
    const preferredRole: TechniqueScheduleRole =
      assessment ? "pre-assessment" : wantsReview ? "review" : "learn";
    for (const role of [preferredRole, "learn", "review"] as const) {
      const compatible = fallbackPool.filter((technique) =>
        supportsRole(technique, role, maxMinutes, assessment),
      );
      const fallback =
        compatible.find(fixesUnresolvedFriction) ?? compatible[0];
      if (fallback) return { technique: fallback, role, source: "foundation" };
    }
    return null;
  };

  while (remainingMinutes >= MIN_BLOCK_MINUTES) {
    const largestWindow = Math.max(
      0,
      ...workingWindows.map(
        (window) => window.endMinute - window.startMinute,
      ),
    );
    const unconstrainedMax = floorToGrid(
      Math.min(remainingMinutes, largestWindow, MAX_BLOCK_MINUTES),
    );
    if (unconstrainedMax < MIN_BLOCK_MINUTES) break;

    const course = nextCourse();
    if (!course) break;
    const courseHadBlock = (allocatedByCourse.get(course.id) ?? 0) > 0;
    const uncoveredCourses = Math.max(0, firstPass.length - firstPassIndex);
    const coverableCourses = Math.min(
      uncoveredCourses,
      Math.floor(
        Math.max(0, remainingMinutes - MIN_BLOCK_MINUTES) /
          MIN_BLOCK_MINUTES,
      ),
    );
    const coverageReserve = coverableCourses * MIN_BLOCK_MINUTES;
    const maxMinutes = floorToGrid(
      Math.min(unconstrainedMax, remainingMinutes - coverageReserve),
    );
    if (maxMinutes < MIN_BLOCK_MINUTES) break;

    const assessment = hasAssessment(course, week);
    const wantsReview =
      courseHadBlock &&
      (effectiveFrictionSet.has("retention") || contentIndex % 3 === 2);
    const primary = pickPrimary(maxMinutes, assessment, wantsReview);
    if (!primary) break;

    const focusCandidates = selected.filter((technique) =>
      supportsRole(
        technique,
        "focus-support",
        maxMinutes,
        assessment,
      ),
    );
    const focusSupport =
      focusCandidates.find((technique) =>
        effectiveFrictions.some(
          (friction) =>
            !resolvedFrictions.has(friction) &&
            technique.fixes.includes(friction),
        ),
      ) ??
      focusCandidates.find((technique) => !usedTechniqueIds.has(technique.id)) ??
      focusCandidates[contentIndex % Math.max(1, focusCandidates.length)];
    const minimum = Math.max(
      techniqueMinimum(primary.technique),
      focusSupport ? techniqueMinimum(focusSupport) : MIN_BLOCK_MINUTES,
    );
    const duration = chooseDuration(
      cadence,
      minimum,
      maxMinutes,
      maxMinutes,
    );
    if (!duration) break;

    const deadline = courseDeadline(course, week);
    const placement = placeInWindow(
      workingWindows,
      duration,
      peak,
      dayBlockCounts,
      dayMinutes,
      deadline,
    );
    if (!placement) break;

    const isReview = primary.role === "review";
    const isAssessment = primary.role === "pre-assessment";
    const isFirstBlockToday = dayBlockCounts[placement.day] === 1;
    const addressed = new Set<Friction>();
    for (const friction of effectiveFrictions) {
      if (
        (["reading-load", "math-heavy"] as Friction[]).includes(friction) &&
        course.id !== subjectFrictionCourseId
      ) {
        continue;
      }
      if (
        friction === "test-anxiety" &&
        course.id !== assessmentFrictionCourseId
      ) {
        continue;
      }
      if (
        primary.technique.fixes.includes(friction) ||
        focusSupport?.fixes.includes(friction)
      ) {
        addressed.add(friction);
      }
    }
    if (!courseHadBlock) {
      for (const friction of [
        "procrastination",
        "motivation",
      ] as const) {
        if (effectiveFrictionSet.has(friction)) addressed.add(friction);
      }
    }
    if (effectiveFrictionSet.has("overwhelm")) addressed.add("overwhelm");
    if (effectiveFrictionSet.has("time-scarcity")) addressed.add("time-scarcity");
    if (isFirstBlockToday) {
      for (const friction of ["distraction", "no-quiet-space"] as const) {
        if (effectiveFrictionSet.has(friction)) addressed.add(friction);
      }
    }
    if (
      effectiveFrictionSet.has("retention") &&
      (courseHadBlock || primary.technique.fixes.includes("retention"))
    ) {
      addressed.add("retention");
    }
    if (
      effectiveFrictionSet.has("test-anxiety") &&
      course.id === assessmentFrictionCourseId
    ) {
      addressed.add("test-anxiety");
    }
    for (const friction of ["reading-load", "math-heavy"] as const) {
      if (
        effectiveFrictionSet.has(friction) &&
        course.id === subjectFrictionCourseId
      ) {
        addressed.add(friction);
      }
    }

    const instructions: string[] = [];
    if (
      !courseHadBlock &&
      ["procrastination", "motivation"].some((friction) =>
        addressed.has(friction as Friction),
      )
    ) {
      instructions.push(STARTER_INSTRUCTION);
    }
    if (addressed.has("overwhelm")) {
      instructions.push("Work toward one finish line and defer everything else.");
    }
    if (addressed.has("distraction")) {
      instructions.push("Silence notifications and work only on this course.");
    }
    if (addressed.has("no-quiet-space")) {
      instructions.push("Prepare headphones and downloaded materials before starting.");
    }
    if (addressed.has("retention")) {
      instructions.push("Finish with closed-note recall and record what you missed.");
    }
    if (addressed.has("test-anxiety")) {
      instructions.push("Attempt a few questions from memory before checking answers.");
    }
    if (addressed.has("time-scarcity")) {
      instructions.push("Do the highest-value task first and stop at the scheduled end.");
    }
    if (addressed.has("reading-load")) {
      instructions.push("Turn the reading into questions, a summary, or a concept map.");
    }
    if (addressed.has("math-heavy")) {
      instructions.push("Solve, check, and record errors instead of rereading examples.");
    }

    draftBlocks.push({
      ...placement,
      start: placement.startMinute / 60,
      minutes: duration,
      courseId: course.id,
      label: isAssessment
        ? `${course.name}: assessment prep`
        : isReview
          ? `${course.name}: review`
          : course.name,
      techniqueId: primary.technique.id,
      supportingTechniqueIds: focusSupport ? [focusSupport.id] : [],
      techniqueSource: primary.source,
      addressedFrictionIds: [...addressed],
      intensity: isReview ? "review" : "deep",
      note: [
        focusSupport
          ? `Use ${primary.technique.name} with ${focusSupport.name} for structure.`
          : `Use ${primary.technique.name} and finish by identifying the next step.`,
        ...instructions,
      ].join(" "),
    });
    for (const friction of addressed) resolvedFrictions.add(friction);
    usedTechniqueIds.add(primary.technique.id);
    if (focusSupport) usedTechniqueIds.add(focusSupport.id);
    if (course) {
      allocatedByCourse.set(
        course.id,
        (allocatedByCourse.get(course.id) ?? 0) + duration,
      );
    }
    remainingMinutes -= duration;
    contentIndex++;
  }

  if (draftBlocks.length > 0) {
    for (const friction of effectiveFrictions) {
      if (
        draftBlocks.some((block) =>
          block.addressedFrictionIds.includes(friction),
        )
      ) {
        continue;
      }

      const preferredCourseId =
        friction === "reading-load" || friction === "math-heavy"
          ? subjectFrictionCourseId
          : friction === "test-anxiety"
            ? assessmentFrictionCourseId
            : undefined;
      const targetBlock =
        (friction === "retention"
          ? draftBlocks.find((block, index) =>
              draftBlocks
                .slice(0, index)
                .some((earlier) => earlier.courseId === block.courseId),
            )
          : undefined) ??
        draftBlocks.find((block) => block.courseId === preferredCourseId) ??
        draftBlocks[0];

      targetBlock.addressedFrictionIds.push(friction);
      targetBlock.note = `${targetBlock.note} ${FRICTION_BLOCK_INSTRUCTIONS[friction]}`;
    }
  }

  const contentMinutes = draftBlocks.reduce(
    (total, block) => total + block.minutes,
    0,
  );
  const requiredCourseMinutes = Math.max(
    90,
    includedCourses.length * MIN_BLOCK_MINUTES,
  );
  const everyCourseCovered = includedCourses.every(
    (course) => (allocatedByCourse.get(course.id) ?? 0) > 0,
  );
  const reviewSlot =
    shouldAttemptReview &&
    everyCourseCovered &&
    contentMinutes >= requiredCourseMinutes
      ? reserveWeeklyReview(workingWindows)
      : null;

  if (reviewSlot) {
    const planningSupport = selected.find(
      (technique) =>
        technique.id !== "weekly-review" &&
        supportsRole(
          technique,
          "planning",
          WEEKLY_REVIEW_MINUTES,
          false,
        ),
    );
    const weeklyReview = TECHNIQUE_BY_ID["weekly-review"];

    draftBlocks.push({
      ...reviewSlot,
      start: reviewSlot.startMinute / 60,
      minutes: WEEKLY_REVIEW_MINUTES,
      label: "Weekly review",
      techniqueId: weeklyReview.id,
      supportingTechniqueIds: planningSupport ? [planningSupport.id] : [],
      techniqueSource: selectedIds.has(weeklyReview.id)
        ? "selected"
        : "foundation",
      addressedFrictionIds: [],
      intensity: "admin",
      note: planningSupport
        ? `Run the weekly review with ${planningSupport.name} to shape next week.`
        : "Check upcoming deadlines, review this week, and block the next one.",
    });
    usedTechniqueIds.add(weeklyReview.id);
    if (planningSupport) usedTechniqueIds.add(planningSupport.id);
  }

  draftBlocks.sort(
    (left, right) =>
      dayIndex(left.day) - dayIndex(right.day) ||
      left.startMinute - right.startMinute ||
      left.label.localeCompare(right.label),
  );
  const blocks: PlanBlock[] = draftBlocks.map((block, index) => ({
    ...block,
    id: `block-${String(index + 1).padStart(2, "0")}`,
  }));
  const totalMinutes = blocks.reduce(
    (total, block) => total + block.minutes,
    0,
  );
  const unallocatedMinutes = Math.max(
    0,
    effectiveRequestedMinutes - totalMinutes,
  );
  const assignedCourseIds = new Set(
    blocks
      .map((block) => block.courseId)
      .filter((courseId): courseId is string => Boolean(courseId)),
  );
  const unassignedCourseIds = includedCourses
    .filter((course) => !assignedCourseIds.has(course.id))
    .map((course) => course.id);
  const unusedTechniqueIds = [...new Set(selectedTechniqueIds)].filter(
    (id) => !usedTechniqueIds.has(id),
  );
  const warnings: PlanWarning[] = [];

  if (capacity.availableMinutes === 0) {
    warnings.push({
      code: "no-study-window",
      message:
        "No usable 30-minute study window remains after classes and this week's commitments.",
    });
  }
  if (unallocatedMinutes > 0) {
    warnings.push({
      code: "insufficient-availability",
      message: `${formatDuration(unallocatedMinutes)} of the requested target could not fit safely.`,
    });
  }
  for (const courseId of unassignedCourseIds) {
    const course = includedCourses.find((candidate) => candidate.id === courseId);
    warnings.push({
      code: "course-unassigned",
      courseId,
      message: `${course?.name ?? "A course"} did not receive a study block this week.`,
    });
  }
  for (const target of week?.courseTargets ?? []) {
    if (!target.deadlineDay || !includedCourses.some((course) => course.id === target.courseId)) {
      continue;
    }
    const scheduledBeforeDeadline = blocks.some(
      (block) =>
        block.courseId === target.courseId &&
        dayIndex(block.day) <= dayIndex(target.deadlineDay!),
    );
    if (!scheduledBeforeDeadline) {
      const course = includedCourses.find(
        (candidate) => candidate.id === target.courseId,
      );
      warnings.push({
        code: "deadline-after-slot",
        courseId: target.courseId,
        message: `${course?.name ?? "Deadline work"} could not fit on or before ${target.deadlineDay}.`,
      });
    }
  }
  for (const techniqueId of unusedTechniqueIds) {
    const technique = techniqueLookup.get(techniqueId);
    warnings.push({
      code: "method-not-used",
      message: `${technique?.name ?? techniqueId} did not fit a compatible block this week.`,
    });
  }

  const rationale = [
    `The plan places ${formatDuration(totalMinutes)} inside ${formatDuration(capacity.availableMinutes)} of usable study availability.`,
    "Course time is distributed by priority after each included course gets a first block when capacity allows.",
    `Sessions use a ${cadence}-minute focus cadence and favor the time of day closest to your stated peak.`,
  ];
  if (reviewSlot) {
    rationale.push(
      "One weekly review uses the latest compatible window, preferring Sunday.",
    );
  }
  if (capacity.removedMinutes > 0) {
    rationale.push(
      `${formatDuration(capacity.removedMinutes)} was removed from study windows for classes, temporary commitments, unavailable days, or fragments shorter than 30 minutes.`,
    );
  }
  if (effectiveRequestedMinutes < requestedMinutes) {
    rationale.push(
      `This week's ${week?.energy === "depleted" ? "lower energy" : "lighter workload"} reduced the active target to ${formatDuration(effectiveRequestedMinutes)} without changing recurring availability.`,
    );
  }
  const frictionResponses = effectiveFrictions.map((frictionId) => {
    const matchingBlocks = blocks.filter((block) =>
      block.addressedFrictionIds.includes(frictionId),
    );
    const techniqueIds = uniqueTechniques(
      matchingBlocks.flatMap((block) =>
        [block.techniqueId, ...block.supportingTechniqueIds]
          .map((id) => techniqueLookup.get(id))
          .filter((technique): technique is Technique => {
            if (!technique) return false;
            return technique.fixes.includes(frictionId);
          }),
      ),
    ).map((technique) => technique.id);
    const source: "profile" | "week" | "both" =
      profileFrictionSet.has(frictionId) && weekFrictionSet.has(frictionId)
        ? "both"
        : profileFrictionSet.has(frictionId)
          ? "profile"
          : "week";

    return {
      frictionId,
      source,
      strategy: FRICTION_STRATEGIES[frictionId],
      blockIds: matchingBlocks.map((block) => block.id),
      techniqueIds,
    };
  });

  return {
    algorithmVersion: 2,
    blocks,
    flexible: axes.structure <= -25,
    totalMinutes,
    budgetMinutes: requestedMinutes,
    minimumEffectiveDose:
      week?.energy === "depleted" ||
      (effectiveFrictionSet.has("time-scarcity") && requestedMinutes <= 480),
    rationale,
    unallocatedMinutes,
    unassignedCourseIds,
    unusedTechniqueIds,
    warnings,
    frictionResponses,
  };
}
