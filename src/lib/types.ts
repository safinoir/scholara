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

export type PlanBlock = {
  id: string;
  day: Day;
  /** 24h start hour, e.g. 14.5 = 2:30pm. */
  start: number;
  minutes: number;
  label: string;
  techniqueId: string;
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

export const PROFILE_VERSION = 1;

export type LearnerProfile = {
  version: number;
  createdAt: string;
  axes: AxisScores;
  frictions: Friction[];
  context: LearnerContext;
  match: ArchetypeMatch;
  /** Ids of the recommended techniques, in rank order. */
  techniqueIds: string[];
  /** Why each technique was chosen, keyed by technique id. */
  reasons: Record<string, string[]>;
  plan: WeekPlan;
  resourceIds: string[];
};
