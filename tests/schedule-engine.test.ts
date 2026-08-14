import { describe, expect, it } from "vitest";
import { TECHNIQUE_BY_ID } from "@/lib/data/techniques";
import {
  buildSchedulePlan,
  calculateScheduleCapacity,
} from "@/lib/engine";
import {
  DAYS,
  FRICTIONS,
  type AxisScores,
  type Course,
  type ScheduleSetup,
  type ScoredTechnique,
  type WeekContext,
} from "@/lib/types";

const AXES: AxisScores = {
  rhythm: 0,
  structure: 40,
  social: 0,
  input: 0,
  drive: 0,
  clock: 0,
};

const RECOMMENDED_IDS = [
  "retrieval-practice",
  "spaced-repetition",
  "pomodoro",
  "weekly-review",
  "feynman",
];

const TECHNIQUES: ScoredTechnique[] = RECOMMENDED_IDS.map((id, index) => ({
  technique: TECHNIQUE_BY_ID[id],
  score: 100 - index,
  reasons: [],
}));

const COURSES: Course[] = [
  {
    id: "maintenance",
    name: "History",
    colorKey: "amber",
    includedInPlan: true,
    priority: "maintenance",
  },
  {
    id: "standard",
    name: "Chemistry",
    colorKey: "teal",
    includedInPlan: true,
    priority: "standard",
  },
  {
    id: "focus",
    name: "Calculus",
    colorKey: "indigo",
    includedInPlan: true,
    priority: "focus",
  },
];

function schedule(overrides: Partial<ScheduleSetup> = {}): ScheduleSetup {
  return {
    mode: "by-course",
    courses: [COURSES[1]],
    classMeetings: [],
    studyWindows: [
      {
        id: "evenings",
        days: [...DAYS],
        startMinute: 18 * 60,
        endMinute: 21 * 60,
      },
    ],
    targetStudyMinutes: 480,
    ...overrides,
  };
}

function week(overrides: Partial<WeekContext> = {}): WeekContext {
  return {
    unavailableDays: [],
    load: "normal",
    energy: "steady",
    focusFrictions: [],
    ...overrides,
  };
}

function overlaps(
  start: number,
  minutes: number,
  blockedStart: number,
  blockedEnd: number,
) {
  return start < blockedEnd && start + minutes > blockedStart;
}

describe("calculateScheduleCapacity", () => {
  it("merges study windows and subtracts classes and temporary commitments", () => {
    const setup = schedule({
      studyWindows: [
        {
          id: "first",
          days: ["Monday"],
          startMinute: 9 * 60,
          endMinute: 14 * 60,
        },
        {
          id: "overlap",
          days: ["Monday"],
          startMinute: 11 * 60,
          endMinute: 15 * 60,
        },
      ],
      classMeetings: [
        {
          id: "class",
          label: "Class",
          days: ["Monday"],
          startMinute: 10 * 60,
          endMinute: 11 * 60,
        },
      ],
    });
    const capacity = calculateScheduleCapacity(
      setup,
      week({
        busyWindows: [
          {
            id: "appointment",
            day: "Monday",
            startMinute: 12 * 60,
            endMinute: 13 * 60,
          },
        ],
      }),
    );

    expect(capacity.rawWindowMinutes).toBe(360);
    expect(capacity.availableMinutes).toBe(240);
    expect(capacity.classMinutes).toBe(60);
    expect(capacity.classOverlapMinutes).toBe(60);
    expect(capacity.plannedMinutes).toBe(240);
    expect(capacity.shortfallMinutes).toBe(240);
    expect(capacity.bufferMinutes).toBe(0);
    expect(capacity.usableWindows).toEqual([
      { day: "Monday", startMinute: 540, endMinute: 600 },
      { day: "Monday", startMinute: 660, endMinute: 720 },
      { day: "Monday", startMinute: 780, endMinute: 900 },
    ]);
  });

  it("removes unavailable days and fragments shorter than 30 minutes", () => {
    const capacity = calculateScheduleCapacity(
      schedule({
        studyWindows: [
          {
            id: "monday",
            days: ["Monday"],
            startMinute: 9 * 60,
            endMinute: 10 * 60,
          },
          {
            id: "tuesday",
            days: ["Tuesday"],
            startMinute: 9 * 60,
            endMinute: 10 * 60,
          },
        ],
        classMeetings: [
          {
            id: "partial",
            label: "Class",
            days: ["Tuesday"],
            startMinute: 9 * 60 + 15,
            endMinute: 10 * 60,
          },
        ],
      }),
      week({ unavailableDays: ["Monday"] }),
    );

    expect(capacity.availableMinutes).toBe(0);
    expect(capacity.usableWindows).toEqual([]);
  });

  it("excludes class-split fragments shorter than a schedulable block", () => {
    const capacity = calculateScheduleCapacity(
      schedule({
        targetStudyMinutes: 60,
        studyWindows: [
          {
            id: "two-hours",
            days: ["Monday"],
            startMinute: 9 * 60,
            endMinute: 11 * 60,
          },
        ],
        classMeetings: [
          {
            id: "splitter",
            label: "Class",
            days: ["Monday"],
            startMinute: 9 * 60 + 30,
            endMinute: 10 * 60 + 45,
          },
        ],
      }),
    );

    expect(capacity).toMatchObject({
      rawWindowMinutes: 120,
      classMinutes: 75,
      classOverlapMinutes: 75,
      availableMinutes: 30,
      plannedMinutes: 30,
      bufferMinutes: 0,
      shortfallMinutes: 30,
      removedMinutes: 90,
    });
    expect(capacity.usableWindows).toEqual([
      { day: "Monday", startMinute: 9 * 60, endMinute: 9 * 60 + 30 },
    ]);
  });
});

describe("buildSchedulePlan", () => {
  it("only emits non-overlapping 15-minute blocks inside usable windows", () => {
    const setup = schedule({
      studyWindows: [
        {
          id: "weeknights",
          days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          startMinute: 18 * 60,
          endMinute: 21 * 60,
        },
      ],
      classMeetings: [
        {
          id: "monday-class",
          label: "Lab",
          days: ["Monday"],
          startMinute: 18 * 60 + 30,
          endMinute: 19 * 60 + 30,
        },
      ],
    });
    const currentWeek = week({
      unavailableDays: ["Wednesday"],
      busyWindows: [
        {
          id: "tuesday-busy",
          day: "Tuesday",
          startMinute: 19 * 60,
          endMinute: 20 * 60,
        },
      ],
    });
    const plan = buildSchedulePlan({
      axes: AXES,
      frictions: [],
      schedule: setup,
      techniques: TECHNIQUES,
      selectedTechniqueIds: [
        "retrieval-practice",
        "pomodoro",
        "time-blocking",
      ],
      week: currentWeek,
    });

    expect(plan.blocks.filter((block) => block.intensity === "admin")).toHaveLength(1);
    expect(plan.unallocatedMinutes).toBe(0);
    expect(plan.unusedTechniqueIds).toEqual([]);
    for (const block of plan.blocks) {
      expect(block.startMinute % 15).toBe(0);
      expect(block.minutes % 15).toBe(0);
      expect(block.day).not.toBe("Wednesday");
      expect(block.startMinute).toBeGreaterThanOrEqual(18 * 60);
      expect(block.startMinute + block.minutes).toBeLessThanOrEqual(21 * 60);
      if (block.day === "Monday") {
        expect(overlaps(block.startMinute, block.minutes, 1110, 1170)).toBe(false);
      }
      if (block.day === "Tuesday") {
        expect(overlaps(block.startMinute, block.minutes, 1140, 1200)).toBe(false);
      }
    }

    for (const day of DAYS) {
      const blocks = plan.blocks
        .filter((block) => block.day === day)
        .sort((left, right) => left.startMinute - right.startMinute);
      for (let index = 1; index < blocks.length; index++) {
        expect(blocks[index].startMinute).toBeGreaterThanOrEqual(
          blocks[index - 1].startMinute + blocks[index - 1].minutes,
        );
      }
    }
  });

  it("caps the target to physical capacity and exposes the shortfall", () => {
    const plan = buildSchedulePlan({
      axes: AXES,
      frictions: [],
      schedule: schedule({
        studyWindows: [
          {
            id: "one-hour",
            days: ["Monday"],
            startMinute: 9 * 60,
            endMinute: 10 * 60,
          },
        ],
        targetStudyMinutes: 240,
      }),
      techniques: TECHNIQUES,
      selectedTechniqueIds: ["retrieval-practice"],
    });

    expect(plan.totalMinutes).toBe(60);
    expect(plan.budgetMinutes).toBe(240);
    expect(plan.unallocatedMinutes).toBe(180);
    expect(plan.warnings?.some((warning) => warning.code === "insufficient-availability")).toBe(true);
    expect(plan.blocks.filter((block) => block.label === "Weekly review")).toHaveLength(0);
  });

  it("uses a 30-minute target on the highest-priority course", () => {
    const plan = buildSchedulePlan({
      axes: AXES,
      frictions: [],
      schedule: schedule({
        courses: COURSES,
        targetStudyMinutes: 30,
      }),
      techniques: TECHNIQUES,
      selectedTechniqueIds: ["retrieval-practice"],
    });

    expect(plan.totalMinutes).toBe(30);
    expect(plan.blocks).toHaveLength(1);
    expect(plan.blocks[0]).toMatchObject({
      courseId: "focus",
      minutes: 30,
      techniqueSource: "selected",
    });
  });

  it("returns an explicit empty plan when no usable window remains", () => {
    const plan = buildSchedulePlan({
      axes: AXES,
      frictions: [],
      schedule: schedule({
        studyWindows: [
          {
            id: "too-short-after-class",
            days: ["Monday"],
            startMinute: 9 * 60,
            endMinute: 10 * 60,
          },
        ],
        classMeetings: [
          {
            id: "class",
            label: "Class",
            days: ["Monday"],
            startMinute: 9 * 60 + 15,
            endMinute: 10 * 60,
          },
        ],
      }),
      techniques: TECHNIQUES,
      selectedTechniqueIds: ["retrieval-practice"],
    });

    expect(plan.blocks).toEqual([]);
    expect(plan.warnings?.map((warning) => warning.code)).toContain("no-study-window");
  });

  it("allocates course time with weighted fairness after a first pass", () => {
    const plan = buildSchedulePlan({
      axes: AXES,
      frictions: [],
      schedule: schedule({
        mode: "by-course",
        courses: COURSES,
        studyWindows: [
          {
            id: "daily",
            days: [...DAYS],
            startMinute: 8 * 60,
            endMinute: 12 * 60,
          },
        ],
        targetStudyMinutes: 960,
      }),
      techniques: TECHNIQUES,
      selectedTechniqueIds: ["retrieval-practice"],
    });

    const minutes = Object.fromEntries(
      COURSES.map((course) => [
        course.id,
        plan.blocks
          .filter((block) => block.courseId === course.id)
          .reduce((total, block) => total + block.minutes, 0),
      ]),
    );
    expect(minutes.focus).toBeGreaterThan(minutes.standard);
    expect(minutes.standard).toBeGreaterThan(minutes.maintenance);
    expect(plan.unassignedCourseIds).toEqual([]);
  });

  it("uses a selected focus method as support when its minimum fits", () => {
    const plan = buildSchedulePlan({
      axes: AXES,
      frictions: [],
      schedule: schedule({
        studyWindows: [
          {
            id: "long-window",
            days: ["Monday"],
            startMinute: 9 * 60,
            endMinute: 12 * 60,
          },
        ],
        targetStudyMinutes: 120,
      }),
      techniques: TECHNIQUES,
      selectedTechniqueIds: ["deep-block"],
    });

    expect(plan.blocks.some((block) => block.supportingTechniqueIds.includes("deep-block"))).toBe(true);
    expect(plan.unusedTechniqueIds).toEqual([]);
  });

  it("falls back safely and reports a selected long method in short windows", () => {
    const plan = buildSchedulePlan({
      axes: AXES,
      frictions: [],
      schedule: schedule({
        studyWindows: [
          {
            id: "short-windows",
            days: ["Monday", "Tuesday", "Wednesday", "Thursday"],
            startMinute: 9 * 60,
            endMinute: 9 * 60 + 45,
          },
        ],
        targetStudyMinutes: 180,
      }),
      techniques: TECHNIQUES,
      selectedTechniqueIds: ["deep-block"],
    });

    expect(plan.blocks.some((block) => block.techniqueId === "retrieval-practice")).toBe(true);
    expect(plan.unusedTechniqueIds).toEqual(["deep-block"]);
    expect(plan.warnings?.some((warning) => warning.code === "method-not-used")).toBe(true);
  });

  it("warns when deadline work cannot fit before its deadline", () => {
    const plan = buildSchedulePlan({
      axes: AXES,
      frictions: [],
      schedule: schedule({
        mode: "by-course",
        courses: [COURSES[2]],
        studyWindows: [
          {
            id: "tuesday-only",
            days: ["Tuesday"],
            startMinute: 9 * 60,
            endMinute: 10 * 60,
          },
        ],
        targetStudyMinutes: 60,
      }),
      techniques: TECHNIQUES,
      selectedTechniqueIds: ["retrieval-practice"],
      week: week({
        courseTargets: [
          {
            courseId: "focus",
            priority: "urgent",
            deadlineDay: "Monday",
          },
        ],
      }),
    });

    expect(plan.blocks.some((block) => block.courseId === "focus" && block.day === "Tuesday")).toBe(true);
    expect(plan.warnings?.some((warning) => warning.code === "deadline-after-slot")).toBe(true);
  });

  it.each(FRICTIONS)(
    "creates one visible deterministic response for %s",
    (friction) => {
      const plan = buildSchedulePlan({
        axes: AXES,
        frictions: [friction],
        schedule: schedule({
          courses: COURSES,
          targetStudyMinutes: 180,
        }),
        techniques: TECHNIQUES,
        selectedTechniqueIds: [
          "retrieval-practice",
          "pomodoro",
          "dual-coding",
        ],
      });

      const responses = plan.frictionResponses.filter(
        (response) => response.frictionId === friction,
      );
      expect(responses).toHaveLength(1);
      expect(responses[0].source).toBe("profile");
      expect(responses[0].strategy.length).toBeGreaterThan(20);
      expect(responses[0].blockIds.length).toBeGreaterThan(0);
      for (const blockId of responses[0].blockIds) {
        expect(
          plan.blocks.find((block) => block.id === blockId)?.addressedFrictionIds,
        ).toContain(friction);
      }
    },
  );

  it("deduplicates persistent and weekly obstacles while preserving their source", () => {
    const plan = buildSchedulePlan({
      axes: AXES,
      frictions: ["distraction"],
      schedule: schedule({ targetStudyMinutes: 180 }),
      techniques: TECHNIQUES,
      selectedTechniqueIds: ["retrieval-practice", "pomodoro"],
      week: week({ focusFrictions: ["distraction", "motivation"] }),
    });

    expect(plan.frictionResponses).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ frictionId: "distraction", source: "both" }),
        expect.objectContaining({ frictionId: "motivation", source: "week" }),
      ]),
    );
    expect(plan.frictionResponses).toHaveLength(2);
  });

  it("links every active obstacle to a tactic when only one block fits", () => {
    const plan = buildSchedulePlan({
      axes: AXES,
      frictions: [...FRICTIONS],
      schedule: schedule({
        courses: COURSES,
        targetStudyMinutes: 30,
      }),
      techniques: TECHNIQUES,
      selectedTechniqueIds: ["interleaving"],
      week: week({
        courseTargets: [
          {
            courseId: "standard",
            priority: "urgent",
            deadlineDay: "Friday",
          },
        ],
      }),
    });

    const contentBlock = plan.blocks.find(
      (block) => block.intensity !== "admin",
    );
    expect(contentBlock).toBeDefined();
    expect(plan.frictionResponses).toHaveLength(FRICTIONS.length);
    for (const response of plan.frictionResponses) {
      expect(response.blockIds).toContain(contentBlock!.id);
      expect(contentBlock!.addressedFrictionIds).toContain(
        response.frictionId,
      );
    }
  });

  it("prioritizes a selected method that fixes an unresolved obstacle", () => {
    const plan = buildSchedulePlan({
      axes: AXES,
      frictions: ["motivation"],
      schedule: schedule({ targetStudyMinutes: 60 }),
      techniques: TECHNIQUES,
      selectedTechniqueIds: ["retrieval-practice", "feynman"],
    });

    expect(plan.blocks[0]).toMatchObject({
      techniqueId: "feynman",
      techniqueSource: "selected",
      courseId: "standard",
    });
  });

  it("labels a required content fallback as a foundation method", () => {
    const plan = buildSchedulePlan({
      axes: AXES,
      frictions: ["distraction"],
      schedule: schedule({ targetStudyMinutes: 60 }),
      techniques: TECHNIQUES,
      selectedTechniqueIds: ["pomodoro"],
    });

    expect(plan.blocks[0]).toMatchObject({
      techniqueSource: "foundation",
      supportingTechniqueIds: ["pomodoro"],
      courseId: "standard",
    });
    expect(plan.blocks[0].label).not.toContain("General study");
  });

  it("turns a later course block into retrieval review for retention", () => {
    const plan = buildSchedulePlan({
      axes: AXES,
      frictions: ["retention"],
      schedule: schedule({ targetStudyMinutes: 180 }),
      techniques: TECHNIQUES,
      selectedTechniqueIds: ["retrieval-practice"],
    });

    const courseBlocks = plan.blocks.filter(
      (block) => block.courseId === "standard",
    );
    expect(courseBlocks.length).toBeGreaterThan(1);
    expect(courseBlocks.slice(1).some((block) => block.intensity === "review")).toBe(true);
  });

  it("adds administration only after the review threshold preserves course coverage", () => {
    const belowThreshold = buildSchedulePlan({
      axes: AXES,
      frictions: [],
      schedule: schedule({ targetStudyMinutes: 90 }),
      techniques: TECHNIQUES,
      selectedTechniqueIds: ["retrieval-practice"],
    });
    const atThreshold = buildSchedulePlan({
      axes: AXES,
      frictions: [],
      schedule: schedule({ courses: COURSES, targetStudyMinutes: 120 }),
      techniques: TECHNIQUES,
      selectedTechniqueIds: ["retrieval-practice"],
    });

    expect(belowThreshold.blocks.some((block) => block.intensity === "admin")).toBe(false);
    expect(atThreshold.blocks.filter((block) => block.intensity === "admin")).toHaveLength(1);
    expect(
      new Set(
        atThreshold.blocks
          .filter((block) => block.intensity !== "admin")
          .map((block) => block.courseId),
      ),
    ).toEqual(new Set(COURSES.map((course) => course.id)));
  });

  it("is deterministic for identical inputs", () => {
    const input = {
      axes: { ...AXES, clock: 80 },
      frictions: ["distraction" as const],
      schedule: schedule({
        mode: "by-course" as const,
        courses: COURSES,
        targetStudyMinutes: 720,
      }),
      techniques: TECHNIQUES,
      selectedTechniqueIds: ["retrieval-practice", "pomodoro"],
      week: week(),
    };

    expect(buildSchedulePlan(input)).toEqual(buildSchedulePlan(input));
  });
});
