/**
 * Every shared shape in Scholara lives here.
 * Content lives in lib/data, logic lives in lib/engine, components only display.
 */

// ---------------------------------------------------------------------------
// Persona axes
// ---------------------------------------------------------------------------

/**
 * Six adherence axes. These do NOT claim to be "learning styles" — they
 * describe the conditions under which a student actually sticks to a routine.
 * Each is scored from -100 (low pole) to +100 (high pole).
 */
export const AXES = [
  "rhythm",
  "structure",
  "social",
  "input",
  "drive",
  "clock",
] as const;

export type Axis = (typeof AXES)[number];

export type AxisScores = Record<Axis, number>;

export type AxisMeta = {
  id: Axis;
  label: string;
  lowLabel: string;
  highLabel: string;
  lowBlurb: string;
  highBlurb: string;
  /** What this axis changes about the recommendations. */
  drives: string;
};

// ---------------------------------------------------------------------------
// Friction points
// ---------------------------------------------------------------------------

export const FRICTIONS = [
  "procrastination",
  "distraction",
  "retention",
  "test-anxiety",
  "overwhelm",
  "time-scarcity",
  "no-quiet-space",
  "motivation",
  "reading-load",
  "math-heavy",
] as const;

export type Friction = (typeof FRICTIONS)[number];

export type FrictionMeta = {
  id: Friction;
  label: string;
  blurb: string;
};

// ---------------------------------------------------------------------------
// Context (self-reported, not scored)
// ---------------------------------------------------------------------------

export type YearLevel =
  | "hs-senior"
  | "freshman"
  | "sophomore"
  | "junior"
  | "senior"
  | "grad"
  | "returning";

export type Field =
  | "stem"
  | "health"
  | "business"
  | "humanities"
  | "arts"
  | "undecided";

export type LearnerContext = {
  year: YearLevel;
  field: Field;
  /** Number of courses this term. */
  courseLoad: number;
  /** Realistic study hours available per week, outside of class. */
  hoursPerWeek: number;
  /** Works a job or has caregiving responsibilities. */
  hasOutsideObligations: boolean;
};

// ---------------------------------------------------------------------------
// Quiz
// ---------------------------------------------------------------------------

export type QuizOption = {
  label: string;
  /** How much this choice moves each axis, in axis points. */
  weights: Partial<AxisScores>;
};

export type AxisQuestion = {
  id: string;
  kind: "axis";
  prompt: string;
  /** Optional clarifier shown under the prompt. */
  hint?: string;
  options: QuizOption[];
};

export type FrictionQuestion = {
  id: string;
  kind: "friction";
  prompt: string;
  hint?: string;
};

export type ContextQuestion = {
  id: string;
  kind: "context";
  prompt: string;
  hint?: string;
};

export type Question = AxisQuestion | FrictionQuestion | ContextQuestion;

/** Raw quiz state: axis answers by question id, plus friction and context. */
export type QuizAnswers = {
  /** questionId -> selected option index */
  axisAnswers: Record<string, number>;
  frictions: Friction[];
  context: LearnerContext;
};

// ---------------------------------------------------------------------------
// Archetypes
// ---------------------------------------------------------------------------

export const ARCHETYPE_IDS = [
  "architect",
  "sprinter",
  "connector",
  "cartographer",
  "explorer",
  "anchor",
] as const;

export type ArchetypeId = (typeof ARCHETYPE_IDS)[number];

export type Archetype = {
  id: ArchetypeId;
  name: string;
  tagline: string;
  description: string;
  strengths: string[];
  watchOuts: string[];
  /** Position on each axis; used for cosine similarity matching. */
  vector: AxisScores;
  /** Tailwind-friendly hex accent. */
  accent: string;
  icon: string;
};

export type ArchetypeMatch = {
  primary: ArchetypeId;
  secondary: ArchetypeId;
  /** 0..1 — how cleanly the primary won. Low means a genuine blend. */
  confidence: number;
};

// ---------------------------------------------------------------------------
// Techniques
// ---------------------------------------------------------------------------

export type TechniqueCategory = "encoding" | "focus" | "planning" | "exam";

export type TechniqueScheduleRole =
  | "learn"
  | "review"
  | "focus-support"
  | "planning"
  | "pre-assessment";

export type EvidenceStrength = "strong" | "moderate" | "promising";

export type Technique = {
  id: string;
  name: string;
  category: TechniqueCategory;
  /** One sentence: what it is. */
  blurb: string;
  steps: string[];
  timeCost: "low" | "medium" | "high";
  evidence: EvidenceStrength;
  /** Why the evidence rating is what it is, in plain language. */
  evidenceNote: string;
  axisWeights: Partial<AxisScores>;
  fixes: Friction[];
  archetypeBoost?: Partial<Record<ArchetypeId, number>>;
  /** Ids from lib/data/resources. */
  toolIds: string[];
  /** Minutes a single rep of this technique typically takes. */
  sessionMinutes?: number;
  /** How this method may be used inside a generated study block. */
  scheduleRoles?: TechniqueScheduleRole[];
  /** A block shorter than this uses another compatible method. */
  minBlockMinutes?: number;
  /** Held back unless the week includes a matching deadline. */
  requiresAssessment?: boolean;
};

export type ScoredTechnique = {
  technique: Technique;
  score: number;
  /** Human-readable drivers, highest impact first. Powers "why you got this". */
  reasons: string[];
};

// ---------------------------------------------------------------------------
// Weekly plan
// ---------------------------------------------------------------------------

export const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export type Day = (typeof DAYS)[number];

export type BlockIntensity = "deep" | "review" | "admin";

export const COURSE_PRIORITIES = ["maintenance", "standard", "focus"] as const;
export type CoursePriority = (typeof COURSE_PRIORITIES)[number];

export const COURSE_COLOR_KEYS = [
  "indigo",
  "teal",
  "sky",
  "violet",
  "amber",
  "rose",
] as const;
export type CourseColorKey = (typeof COURSE_COLOR_KEYS)[number];

export type Course = {
  id: string;
  name: string;
  colorKey: CourseColorKey;
  includedInPlan: boolean;
  priority: CoursePriority;
};

export type RecurringClassMeeting = {
  id: string;
  courseId?: string;
  label: string;
  days: Day[];
  startMinute: number;
  endMinute: number;
};

export type StudyWindow = {
  id: string;
  days: Day[];
  startMinute: number;
  endMinute: number;
};

export type ScheduleSetup = {
  mode: "general" | "by-course";
  courses: Course[];
  classMeetings: RecurringClassMeeting[];
  studyWindows: StudyWindow[];
  targetStudyMinutes: number;
};

export type PlanBlock = {
  id: string;
  day: Day;
  /** Kept while old saved plans migrate to integer minute ranges. */
  start: number;
  /** Local minutes from midnight, snapped to a 15-minute grid. */
  startMinute: number;
  minutes: number;
  courseId?: string;
  label: string;
  techniqueId: string;
  supportingTechniqueIds: string[];
  intensity: BlockIntensity;
  /** Short instruction shown on the block. */
  note: string;
};

export type WeekPlan = {
  blocks: PlanBlock[];
  /** True when the user's structure score is low: fewer fixed times. */
  flexible: boolean;
  totalMinutes: number;
  /** Minutes the user said they had. */
  budgetMinutes: number;
  /** Set when time scarcity forced a stripped-down plan. */
  minimumEffectiveDose: boolean;
  /** Plain-language explanation of the scheduling choices. */
  rationale: string[];
  /** Requested time that could not safely fit in confirmed study windows. */
  unallocatedMinutes?: number;
  /** Known courses that could not receive a block this week. */
  unassignedCourseIds?: string[];
  /** Selected methods that were not compatible with this week's blocks. */
  unusedTechniqueIds?: string[];
  /** Visible constraints and compromises made by the scheduler. */
  warnings?: PlanWarning[];
};

export type PlanWarningCode =
  | "insufficient-availability"
  | "no-study-window"
  | "course-unassigned"
  | "deadline-after-slot"
  | "method-not-used";

export type PlanWarning = {
  code: PlanWarningCode;
  message: string;
  courseId?: string;
};

/**
 * Week-specific circumstances, re-answered whenever the week changes.
 * Structured on purpose so the scheduler can act on it deterministically.
 * Optional free text is converted into this shape only after explicit review.
 */
export const WEEK_LOADS = ["light", "normal", "crunch"] as const;

export type WeekLoad = (typeof WEEK_LOADS)[number];

export const ENERGY_LEVELS = ["depleted", "steady", "strong"] as const;

export type EnergyLevel = (typeof ENERGY_LEVELS)[number];

export type TemporaryBusyWindow = {
  id: string;
  day: Day;
  startMinute: number;
  endMinute: number;
};

export type CourseTarget = {
  courseId: string;
  priority: "focus" | "urgent";
  deadlineDay: Day | null;
};

export type WeekTuningProposal = {
  load: WeekLoad | null;
  energy: EnergyLevel | null;
  targetStudyMinutes: number | null;
  focusFrictions: Friction[];
  unavailableDays: Day[];
  busyWindows: Array<{
    day: Day;
    startMinute: number;
    endMinute: number;
  }>;
  courseTargets: CourseTarget[];
  assumptions: string[];
  unresolved: string[];
};

export type WeekContext = {
  /** Days with no realistic study window — class-heavy, shifts, caregiving. */
  unavailableDays: Day[];
  /** How much is due in the next seven days. */
  load: WeekLoad;
  /** How much capacity the student actually has right now. */
  energy: EnergyLevel;
  /** Courses that need disproportionate attention, by friction tag. */
  focusFrictions: Friction[];
  /** Optional replacement for the recurring weekly target. */
  targetStudyMinutes?: number;
  /** One-off commitments that subtract from this week's availability. */
  busyWindows?: TemporaryBusyWindow[];
  /** Temporary course urgency or deadline information. */
  courseTargets?: CourseTarget[];
  /** Local ISO date for the Monday represented by this plan. */
  weekStart?: string;
};

// ---------------------------------------------------------------------------
// AI coaching (optional layer — the engine is always the source of truth)
// ---------------------------------------------------------------------------

/**
 * Written by the model, never structural. Every field is prose that explains
 * or reframes a decision the engine already made, and every one has a
 * deterministic fallback so the app is complete without a key.
 */
export type PlanCoaching = {
  /** 2-3 sentence brief on how to approach the week. */
  brief: string;
  /** The single highest-leverage move, phrased as an action. */
  focus: string;
  /** The most likely way this week goes wrong for this student. */
  watchOut: string;
  /** blockId -> a rewritten, personal instruction for that block. */
  blockNotes: Record<string, string>;
  source: "ai" | "fallback";
  generatedAt: string;
};

// ---------------------------------------------------------------------------
// Resources
// ---------------------------------------------------------------------------

export type ResourceCost = "free" | "free-tier" | "paid";

export type ResourceCategory =
  | "notes"
  | "recall"
  | "scheduling"
  | "focus"
  | "subject"
  | "writing"
  | "accessibility"
  | "basic-needs"
  | "wellbeing"
  | "career"
  | "campus";

export type Resource = {
  id: string;
  name: string;
  category: ResourceCategory;
  cost: ResourceCost;
  blurb: string;
  /** Omitted for campus resources, which have no single URL. */
  url?: string;
  axisFit?: Partial<AxisScores>;
  frictionFit?: Friction[];
  fieldFit?: Field[];
  /** Campus resources are surfaced separately and always free to the student. */
  campus?: boolean;
};

// ---------------------------------------------------------------------------
// Habits
// ---------------------------------------------------------------------------

export type Habit = {
  id: string;
  label: string;
  /** Why this habit, in one line. */
  why: string;
  frictions: Friction[];
  techniqueId?: string;
};

export type HabitLog = {
  habitId: string;
  /** ISO dates (YYYY-MM-DD) the habit was completed. */
  completedDates: string[];
};

// ---------------------------------------------------------------------------
// Career
// ---------------------------------------------------------------------------

export type CareerStep = {
  id: string;
  title: string;
  detail: string;
  /** Earliest year level where this step makes sense. */
  from: YearLevel;
  resourceIds: string[];
};

export type CareerTrack = {
  field: Field;
  title: string;
  intro: string;
  steps: CareerStep[];
};

// ---------------------------------------------------------------------------
// The profile
// ---------------------------------------------------------------------------

export const PROFILE_VERSION = 2;

export const ONBOARDING_STAGES = [
  "persona",
  "toolkit",
  "schedule",
  "complete",
] as const;

export type OnboardingStage = (typeof ONBOARDING_STAGES)[number];

export type LearnerProfile = {
  version: typeof PROFILE_VERSION;
  createdAt: string;
  axes: AxisScores;
  frictions: Friction[];
  context: LearnerContext;
  match: ArchetypeMatch;
  /** Explicit learner choice. The measured axis match remains unchanged. */
  personaOverride?: ArchetypeId;
  /** Ids of the recommended techniques, in rank order. */
  recommendedTechniqueIds: string[];
  /** The 1-3 methods the learner explicitly confirms in Study Toolkit. */
  selectedTechniqueIds: string[];
  /** The next guided workflow step the learner needs to complete. */
  onboardingStage: OnboardingStage;
  /** Why each technique was chosen, keyed by technique id. */
  reasons: Record<string, string[]>;
  /** Present only after the learner completes recurring schedule setup. */
  plan?: WeekPlan;
  /** Recurring classes, study availability, and weekly target. */
  schedule?: ScheduleSetup;
  resourceIds: string[];
  /** Present once the student has tuned the plan for a specific week. */
  weekContext?: WeekContext;
  /** Optional AI polish over the current plan. Safe to be absent. */
  coaching?: PlanCoaching;
};

export type PlannedLearnerProfile = LearnerProfile & { plan: WeekPlan };
export type ScheduledLearnerProfile = PlannedLearnerProfile & {
  schedule: ScheduleSetup;
};
