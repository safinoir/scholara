# Scholara Guided Flow and Weekly Plan Redesign

**Status:** Individualized, course-specific guided flow and plan-first Weekly
Plan workspace implemented for Degree Planning & Discovery; post-intake
six-axis editing is deferred and release QA remains

**Current guided-flow scope:** Homepage, Persona, Methods, and Weekly Plan
**Later supporting refreshes:** Tracker and Resources
**Still outside this redesign:** After/Career (its workflow redesign is
deferred)

This document records the approved redesign and its current implementation
status. [plan.md](./plan.md) is the concise current-state source of truth.

The redesign supports Scholara's **Degree Planning & Discovery** entry in the
Stellic Pathfinders challenge. Scholara helps students understand the study
habits behind their academic progress and schedule the class and study time
needed to keep moving toward a degree. Personalization uses continuous
planning/adherence axes, obstacles, selected evidence-aware methods, and real
availability rather than fixed “learning style” categories.

## 1. Product Flow

```text
Quiz or self-report
  -> Persona
  -> Methods (choose 1-3 methods for weekly study blocks)
  -> Weekly Plan setup
  -> Generated weekly calendar
  -> Optional weekly AI tuning
```

The saved onboarding stage is one of:

```ts
type OnboardingStage = "persona" | "toolkit" | "schedule" | "complete";
```

- New quiz and self-report profiles begin at `persona`.
- Confirming Persona advances to `toolkit`.
- Saving 1-3 methods advances to `schedule`.
- Generating the first valid calendar advances to `complete`.
- Home resumes the first unfinished stage instead of jumping directly to Plan.

## 2. Persona

### Guided quiz path

- The guided quiz contains 12 axis questions and one final obstacle screen.
- Clicking or tapping an axis answer records it without advancing and activates
  the blue **Next** button. Pressing a valid number key selects its answer and
  advances immediately; screen navigation is otherwise handled by the visible
  Back and Next controls.
- Draft recovery resumes at the first unanswered axis question.
- Quiz completion opens `/persona`, not the old combined results page.
- Show the primary persona, secondary blend when relevant, strengths,
  watch-outs, and the six-axis profile.
- Keep this page focused on identity. Do not show study methods or AI coaching.
- End with one primary action: **Continue to Methods**.

### Self-report path

- **Current:** **Skip the quiz** opens `/express`.
- The current three-step form asks the learner to choose a starting persona,
  confirm or refine its seeded axes, and select obstacles.
- There is no learner-context step. Courses, class meetings, availability, and
  the weekly target belong in Plan setup instead.
- Switching personas reseeds untouched axes while preserving values the learner
  deliberately changed.
- Saving retains the explicit persona choice when it differs from the final
  axis-derived match, then opens `/persona`.
- `/express` remains the canonical self-report route; no duplicate
  `/persona/setup` route is planned.

### Manual persona choice

- The Persona callout links to a detailed chooser containing all six personas,
  including strengths and watch-outs.
- A manual choice is stored as an explicit override; it does not rewrite the
  six measured axes or silently change cadence and peak-time preferences.
- Recommendations, resources, and an existing plan refresh around the effective
  persona while preserving selected methods, schedule, and week settings.
- The learner can restore the original axis-derived result at any time.
- The About page reuses the same detailed persona cards for all six personas.

### Six-axis editing (deferred)

- Persona is read-only by default.
- **Edit profile** reveals the six axis controls.
- Saving recomputes the persona, recommendations, resources, and any generated
  plan while preserving explicitly selected methods.

## 3. Methods

Use the user-facing navigation label **Methods** and the page title **Choose 1-3
methods for your week**. The route remains `/toolkit`, and the saved onboarding
stage remains `toolkit`.

### Recommendations and library

- Show the personalized top five first as compact method rows.
- Keep every method row's **How it works** detail panel collapsed initially.
- Show the method name, short description, evidence, effort, approximate time,
  and the strongest personalized reason in the compact row. Keep full steps,
  additional reasons, evidence detail, and supporting tools in the on-demand
  panel.
- Put every remaining catalog method behind one **Browse more methods**
  disclosure, without duplicating the top five.
- Inside that single disclosure, group methods by the user goals:
  - Learn and remember
  - Focus and start
  - Plan your workload
  - Prepare for exams
- Users can choose from either the top five or the full catalog.

### Selection

- Start with nothing selected.
- Require 1-3 methods before continuing.
- Show a compact sticky `X of 3 chosen` control with the selected method names
  and prevent a fourth choice.
- Save only after explicit confirmation; unsaved changes remain a local UI draft.
- After a valid save, change the sticky action from **Save methods** to
  **Continue to weekly setup** for first-time users or **View updated plan** for
  completed users. Do not add a redundant bottom readiness card.
- Revisiting the page allows changes, but an empty draft cannot replace a valid
  saved method selection.
- Changing the six axes recalculates the top five but preserves the user's
  existing selections.

### Method behavior in the plan

The user's one to three selected methods are incorporated into compatible
weekly study blocks according to their scheduling roles. They affect how study
blocks are carried out, not when the user is available or how much time exists.

- Learning methods are assigned to new-material blocks.
- Review methods are assigned to review blocks.
- Focus methods support a learning or review method rather than replacing it.
- Planning methods augment the weekly review block.
- Exam-only methods are used only when the week includes an assessment or
  deadline; otherwise they stay saved for a relevant week.
- If the selected methods lack a required role, use the highest-ranked
  compatible recommendation or foundation method and label its source as
  **foundation** in block details.
- A small week does not need to use every selected method. Show which choices
  were not needed that week rather than adding unnecessary sessions.

Add scheduling metadata to technique content instead of branching on names:

```ts
type TechniqueScheduleRole =
  | "learn"
  | "review"
  | "focus-support"
  | "planning"
  | "pre-assessment";
```

Technique metadata may also define a minimum compatible block length and whether
an assessment is required.

## 4. Weekly Plan Setup

After saving the methods, `/plan/setup` opens a dedicated two-step,
course-only workspace. Drafts autosave locally after each change. Returning
users can edit the recurring schedule without repeating Persona or Methods;
`/plan` is reserved for a valid, non-empty generated plan.

### Step 1: Your classes

- Require at least one named course included in the plan.
- Add courses with an automatically assigned accessible color key.
- Let the learner include or exclude each course from study allocation.
- Give included courses a baseline priority: **Keep light** (`maintenance`),
  **Standard** (`standard`), or **Extra focus** (`focus`).
- Add one or more recurring meeting patterns directly inside a course, using
  weekday buttons and visible start/end fields on a 15-minute grid.
- Allow asynchronous courses with no meeting time.
- Keep meetings visible even when a course is excluded from study blocks.
- Require every class meeting to reference a known course. Generic class entries
  and general-study mode are not part of the active workflow.
- Reject cross-midnight, reversed, or conflicting class meetings.
- Calendar/LMS import remains deferred.

### Step 2: When you can study

Study windows mean: **I am free and realistically willing to study during this
time.** They are the hard boundary for generated study blocks.

- Add a day or group of days plus start and end time.
- Support quick presets such as weekday mornings, weeknights, and weekends, but
  require the user to review them before saving.
- Support copying one day's windows to selected days.
- Require at least one window of 30 minutes or longer.
- Merge overlapping or adjacent study windows on the same day.
- It is valid for a study window to overlap a class; class time is subtracted
  before scheduling and the reduced usable time is shown.

Keep the weekly study target separate from raw availability:

- New setups begin without an invented target. Ask how much of the available
  time the learner actually wants to commit.
- Place the target in a prominent full-width card at the bottom of the
  availability step, immediately before final validation and review actions.
- Show total marked availability, total recurring class time, target, feasible
  planned time, buffer, and shortfall before generation. Track class overlap
  separately: only class minutes that intersect a study window reduce usable
  study capacity.
- A target above physical capacity does not block generation. Schedule only what
  fits and report the shortfall.
- Generate after the course, class, availability, and target summary passes all
  hard validation.
- Use the scheduler's own normalization, class subtraction, 15-minute grid, and
  30-minute minimum-fragment rules for the authoritative capacity summary.
- Preserve an autosaved draft through ordinary navigation. **Discard changes**
  clears it explicitly. Loaded drafts and final schedules are Zod-validated,
  errors are connected to their controls, and submission focuses the first
  error.
- Preserve current-week exceptions after recurring edits only when they remain
  valid and produce blocks. Editing a stale saved plan explicitly starts the
  current week; zero-block generation never replaces the saved plan.

## 5. Deterministic Scheduling Engine

The engine remains the only component allowed to place calendar blocks. AI never
returns a finished schedule.

### Hard constraints

1. Normalize study windows into per-day minute ranges.
2. Subtract recurring class meetings.
3. Apply week-specific unavailable days and temporary busy windows.
4. Discard fragments too short for a valid study session.
5. Cap the requested target at physical usable capacity and report any shortfall.
6. Never overlap classes, study blocks, or other hard constraints.
7. Never schedule outside a confirmed study window.

Use integer minutes from midnight and a 15-minute grid rather than fractional
hours.

### Placement

- Use the rhythm axis and current energy to determine cadence. Selected focus
  methods support compatible blocks and may impose a minimum block length; they
  do not independently set cadence.
- Prefer slots closest to the user's peak-hours axis, but availability always
  wins.
- Spread blocks across days before stacking many blocks on one day.
- Reserve one 30-minute weekly review in the latest compatible slot only when
  the target reaches `max(120, 30 × (included courses + 1))` minutes. Prefer
  Sunday but never invent a time or sacrifice first-pass course coverage.
- Keep review blocks course-linked when possible. An explicit link back to the
  particular learning block they reinforce is not currently stored.
- Allocate course time with weighted fairness:
  - `maintenance` = weight 1
  - `standard` = weight 2
  - `focus` = weight 3
  - week-specific `urgent` = weight 4
- Give each included course one block when capacity permits, then distribute the
  remainder by weight and deadlines.
- Deadline-related study belongs before the deadline when a valid slot exists.

### Obstacle responses

Every unique profile or week-specific obstacle produces exactly one visible
`FrictionResponse`. Each response names the strategy and links to the blocks and
methods that apply it. Blocks also carry `addressedFrictionIds`.

| Reported obstacle | Deterministic response |
| --- | --- |
| Procrastination | Five-minute starter action on each course's first block |
| Distraction | Single-task, device-preparation instruction on the first block of each study day |
| Retention | Later course blocks become retrieval review when capacity permits |
| Test anxiety | Low-stakes practice before a known deadline, or on the highest-priority course |
| Overwhelm | One course and one finish line per block; first-pass course coverage first |
| Time scarcity | Course coverage and priorities first, optional administration omitted, shortfall explained |
| No quiet space | Portable environment setup on the first block of each study day |
| Motivation | Small visible output or finish line on each course's first block |
| Reading load | Active-reading output such as questions, a summary, or a concept map |
| Math-heavy | Solve, check, and record errors instead of rereading |

Selected compatible methods are preferred when addressing an obstacle.
Foundation methods appear only when no selected method can fill the required
learning or review role, and their source is labeled explicitly. Reading- and
math-specific tactics use Extra focus courses first, then stable course order;
Scholara does not invent topics, chapters, assignments, or exams.

### Output and warnings

Plans must expose rather than hide constraints:

- Requested versus scheduled minutes
- Unallocated minutes
- Courses that received no block
- Selected methods not used this week
- Deadline work that could not fit before the deadline
- Missing or insufficient study windows
- One explicit response for every active obstacle

Generation must be deterministic: identical inputs produce identical blocks,
ordering, IDs, totals, and warnings.

## 6. Weekly Calendar Experience

The calendar is not a separate route. `/plan` is the single completed-plan
experience containing summary metrics, warnings, obstacle responses, the
calendar, weekly tuning, and rationale. `/plan/setup` remains the separate
recurring-schedule editor, and `/plan/calendar` is not part of the approved
architecture. After generation, navigation returns to `/plan` and resets the
viewport to the top of the completed page.

### Desktop

- Render a real time-based week with a time rail and seven equal day columns.
- Show every day, including empty days.
- Crop the visible time range to the earliest and latest relevant item, with
  sensible daytime defaults.
- Use distinct labeled layers:
  - Class meetings: neutral commitment style
  - Confirmed study windows: subtle background availability
  - Generated study blocks: course color plus text and method labels
- Each day header shows the planned study total.
- Every study block shows its course, primary method, and duration without
  expansion. A focused or clicked block also shows the supporting methods,
  selected/foundation source, concrete instruction, and obstacles addressed.
- Put **How this week addresses your obstacles** before the calendar. Each row
  shows the obstacle, response, relevant method, linked classes/blocks, and a
  **This week** marker for temporary obstacles.
- Keep the consolidated **How Scholara built this week** rationale for cadence,
  peak time, course priorities, selected methods, and availability constraints.
  Place the collapsed disclosure directly after the summary metrics, before
  constraints, obstacle responses, and the schedule workspace. Full method
  steps and evidence remain on the Methods page.
- Provide **Edit recurring schedule** and **Adjust this week** actions.
- Show actual dates, Today state, availability, temporary busy periods, and
  unavailable-day overlays. Crop to relevant hours, scroll internally, and keep
  day headers sticky rather than using a fixed-width or fixed-height canvas.
- Open block details in a right-side sheet and place copy in a quieter overflow
  action.
- Keep the plan toolbar sticky beneath the global header only at `lg` and above;
  keep it in normal flow on smaller screens. Isolate the calendar's sticky day
  header inside its own scrolling layer.

### Mobile

- Do not compress detailed content into seven tiny columns.
- Keep the setup review bar in normal flow so it cannot cover target errors or
  availability controls; its sticky treatment is desktop-only.
- Default to a seven-day summary strip and one selected day's chronological
  agenda.
- Keep the seven-day strip compact and use the selected-day agenda for detailed
  mobile content.
- Use the agenda as the semantic keyboard, screen-reader, zoom, and print view;
  open block details in a bottom sheet.

The completed workspace displays the represented Monday-Sunday range. A stale
week stays viewable but weekly adjustment is locked until **Start this week**
clears its temporary busy windows, unavailable days, deadlines, urgency,
workload, energy, and weekly obstacle overrides. Recurring courses,
availability, persona, obstacles, and methods remain intact.

Calendar meaning must never depend on color alone. Interactive targets remain at
least 44px, and calendar items stay in chronological DOM order.

## 7. AI Weekly Tuning

AI is most useful here as an interpreter of messy weekly context, not as the
calendar engine.

### User experience

- After a plan exists, show a collapsed section: **Tell Scholara what changed**.
- Accept a note of at most 500 characters, for example:
  `Chemistry exam Friday, working Tuesday 5-9, and low energy this week.`
- Clearly disclose that the note is sent to the configured AI provider and tell
  the user not to include names or sensitive details.
- **Preview AI changes** sends the note. It never applies changes immediately.
- Show a structured proposal such as:
  - Tuesday 5:00-9:00 PM temporarily unavailable
  - Chemistry urgent until Friday
  - Energy reduced for this week
- Show assumptions and anything the model could not resolve.
- Let the user edit, apply, or discard the proposal.
- Applying reruns the deterministic scheduler and shows a compact summary of
  moved blocks and planned-minute change.
- Provide one-step undo to the previous structured week settings and plan.

### Allowed AI proposal

Add `POST /api/plan/tune`. The route may propose only bounded values:

```ts
type WeekTuningProposal = {
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
  courseTargets: Array<{
    courseId: string;
    priority: "focus" | "urgent";
    deadlineDay: Day | null;
  }>;
  assumptions: string[];
  unresolved: string[];
};
```

The request includes the note, current week start, local time zone, current
structured week values, and known course IDs/names. It does not require the full
persona or prior AI output.

### Safety and validation

- Treat the note as untrusted data, not instructions.
- Use the existing OpenAI-compatible client and JSON response path; do not assume
  provider support for strict JSON-schema outputs.
- Validate the entire response with Zod.
- Accept only known course IDs, enums, days, and 15-minute time ranges.
- Reject cross-midnight or invalid intervals and unknown output fields.
- Snap valid extracted times to 15-minute boundaries before preview.
- Vague times such as `Tuesday evening` remain unresolved unless the model states
  a visible assumption for user confirmation.
- Unknown course names never create courses.
- AI cannot move classes, add availability, select methods, create plan blocks,
  or exceed the weekly target.
- The raw note is not written to localStorage or an application database and is
  not forwarded into later requests. Persist only the approved structured
  override.
- Missing key, timeout, invalid JSON, or rejected output returns no proposal and
  leaves the existing plan unchanged.

### Manual fallback

The same week settings remain editable without AI:

- Temporary unavailable day or busy time
- Course focus/urgency and deadline day
- Weekly target
- Workload
- Energy
- Active friction points

The app remains fully usable without an AI key.

## 8. Data and Persistence

The profile is version 3 with explicit version 1 and version 2 migrations. New
profiles do not contain `LearnerContext` or fabricated course/hour defaults.
Migrated profiles may retain only:

```ts
type EducationContext = {
  year: YearLevel;
  field: Field;
};
```

This optional education context supports Resources/After compatibility and is
never used for recommendations or weekly planning.

```ts
type Course = {
  id: string;
  name: string;
  colorKey: string;
  includedInPlan: boolean;
  priority: "maintenance" | "standard" | "focus";
};

type RecurringClassMeeting = {
  id: string;
  courseId?: string;
  label: string;
  days: Day[];
  startMinute: number;
  endMinute: number;
};

type StudyWindow = {
  id: string;
  days: Day[];
  startMinute: number;
  endMinute: number;
};

type ScheduleSetup = {
  // "general" is retained only for legacy data and draft compatibility.
  mode: "general" | "by-course";
  courses: Course[];
  classMeetings: RecurringClassMeeting[];
  studyWindows: StudyWindow[];
  targetStudyMinutes: number;
};
```

Extend plan blocks rather than forcing one method to represent both content and
focus support:

```ts
type PlanBlock = {
  id: string;
  day: Day;
  startMinute: number;
  minutes: number;
  courseId?: string;
  label: string;
  techniqueId: string;
  supportingTechniqueIds: string[];
  techniqueSource: "selected" | "foundation";
  addressedFrictionIds: Friction[];
  intensity: "deep" | "review" | "admin";
  note: string;
};

type FrictionResponse = {
  frictionId: Friction;
  source: "profile" | "week" | "both";
  strategy: string;
  blockIds: string[];
  techniqueIds: string[];
};
```

Profile version 3 contains:

- `personaOverride?: ArchetypeId`
- `recommendedTechniqueIds: string[]`
- `selectedTechniqueIds: string[]`
- `onboardingStage: OnboardingStage`
- `schedule?: ScheduleSetup`
- `plan?: WeekPlan`
- `educationContext?: EducationContext` for migrated year/field only
- Structured week overrides separate from the recurring schedule
- No active `context` or AI `coaching` field

Migration behavior:

- Preserve axes, persona choice, recommendations, reasons, resources, selected
  methods, compatible schedules, and structured week settings.
- Preserve only legacy year and field as optional `educationContext`; discard
  legacy course count, estimated study hours, and outside-obligation values.
- Move legacy `techniqueIds` into `recommendedTechniqueIds`.
- Version 1 starts with no claimed user selections and resumes at Methods.
- Version 2 preserves valid selected methods. Later stages return to schedule
  setup so a course-only plan can be generated from current inputs.
- Preserve course-aware version 2 schedules; retain windows/target from general
  schedules but require the learner to add at least one course.
- Do not discard a valid version 1 profile merely because new fields are absent.

## 9. Homepage, Routes, and Navigation

### Homepage

The homepage now gives a concise version of the product story in this order:

1. How it works
2. Degree progress and real constraints
3. The six personas
4. The six axes
5. Technique recommendations
6. A weekly plan
7. Final quiz call to action

The hero's **How it works** control scrolls to `#how-it-works`. It does not
navigate to About. `/about` remains the detailed methodology, limitations,
privacy, and data-handling page.

### Current guided routes

- `/persona` - persona result and axis profile
- `/quiz` - 13-screen guided intake: 12 axis questions plus obstacles
- `/express` - persona-first, three-step self-report intake with no context step
- `/toolkit` - user-facing Methods page with recommendations, the compact full
  method library, and selection
- `/plan/setup` - first-time or recurring schedule editor
- `/plan` - single completed experience with summary, obstacle responses,
  embedded calendar, weekly tuning, and rationale
- `/results` - redirects to `/persona`

The guided sequence is Persona -> Methods -> `/plan/setup` -> `/plan`.
Express remains the canonical three-step self-report route. Direct visits to a
locked stage show a clear completion gate rather than partial content. The
route and internal onboarding stage retain the technical name `toolkit`.

Before a profile exists, global navigation is **About -> Resources -> Take the
quiz**. With a profile, About remains first, Resources remains available, and
the guided Persona/Methods/Plan destinations are progressively unlocked.

The legacy results coach, weekly coaching brief, fixed-topic questions,
`CoachNote`, `/api/coach`, `/api/plan`, and `/api/ask` have been removed. The only
active AI route is `/api/plan/tune`.

Privacy copy now states the precise behavior: profile and schedule data stay in
the browser; only an explicitly submitted weekly note and bounded tuning context
are sent to the configured provider, and the raw note is not stored by Scholara.

## 10. Edge Cases

- No named included course: do not generate; keep the learner on the class step.
- Asynchronous course: course may have no class meeting.
- No usable study window: do not generate; show how to add one.
- Availability smaller than target: schedule only safe capacity and show the
  shortfall before confirmation.
- Class overlaps availability: report total recurring class time, subtract only
  the overlap from study-window capacity, and show the remaining usable
  fragments.
- All week overrides block the schedule: preserve the previous plan and request
  a free window or smaller target.
- Deadline with no earlier slot: show a warning; never place work before/inside a
  class or outside availability to satisfy it.
- Selected 90-minute method with only short windows: use another compatible
  selected/foundation method and explain why the long method was not used.
- AI cannot resolve a course or time: place it in `unresolved`; do not guess
  silently.

## 11. Implementation Progress

### Phase 1 - Profile and navigation foundation

- [x] Add profile v3 and tested v1/v2 migrations.
- [x] Add onboarding stages, resume logic, and gates.
- [x] Make `plan` optional until scheduling is configured.
- [x] Retain `/express` as the canonical self-report route.

### Phase 2 - Persona and Methods

- [x] Split the current Results page.
- [x] Add detailed Persona comparison and a reversible manual choice.
- [x] Add persona-first Express intake with explicit axis confirmation.
- [x] Reduce Express to Persona, Six axes, and Obstacles; remove intake context.
- [ ] Add editable Persona axes after intake (deferred beyond the current
  release scope).
- [x] Add top-five/full-library selection with 1-3 persistence.
- [x] Add technique scheduling roles.
- [x] Remove the results coach from the active UI.
- [x] Delete legacy coaching components and `/api/coach`, `/api/plan`, and
  `/api/ask`.

### Phase 3 - Recurring schedule setup

- [x] Build two course-only steps: classes/meeting patterns, then study windows
  and target.
- [x] Persist drafts locally.
- [x] Add validation and capacity preview.

### Phase 4 - Scheduler and calendar

- [x] Refactor the engine around explicit time ranges and selected methods.
- [x] Add course allocation, warnings, and deterministic tests.
- [x] Add one visible deterministic response per reported obstacle.
- [x] Build the desktop seven-column calendar and mobile agenda.
- [x] Keep the completed calendar, obstacle responses, tuning, and rationale on
  one `/plan` page and return to its top after generation.

### Phase 5 - Weekly tuning and AI

- [x] Replace the old tuner with structured week overrides.
- [x] Add the manual adjustment workflow.
- [x] Add `/api/plan/tune`, proposal review, apply summary, and undo.
- [x] Remove plan coaching and fixed-topic answers so AI is tuning-only.
- [x] Update privacy copy.

### Phase 6 - Verification

- [x] Run engine, migration, schema, and AI-route tests.
- [x] Run TypeScript and targeted lint.
- [ ] Complete the final real-device, keyboard-only, and accessibility review.

## 12. Acceptance Criteria

- [x] Quiz users land on a focused Persona page.
- [x] The current self-report flow at `/express` also lands on Persona.
- [x] Express users choose a starting persona and explicitly confirm or refine
  all six seeded axes before saving.
- [x] Users intentionally choose 1-3 methods from the top five or full catalog.
- [x] Plan setup records real classes, real study windows, and a separate weekly
  target.
- [x] Every generated study block lies inside a confirmed study window and
  outside every class or temporary busy period.
- [x] Plans are course-specific; asynchronous courses may omit meetings, while
  every saved meeting belongs to a course.
- [x] Selected methods are used according to their scheduling role.
- [x] Every active obstacle is visibly addressed and linked to plan blocks.
- [x] Every study block exposes its course, method, duration, and instruction.
- [x] Desktop displays all seven days as a calendar; mobile uses a readable
  selected-day agenda.
- [x] A weekly free-text note produces only a reviewable structured proposal.
- [x] Nothing changes until the user applies that proposal.
- [x] AI failure never removes or corrupts the deterministic plan.
- [x] Homepage content follows the agreed section order, and the hero's How it
  works action scrolls to the in-page section.
- [x] About remains the detailed page, appears first in navigation, and Resources
  remains available before and after onboarding.
- [x] Users can compare all six personas, select a different one, and restore
  their original axis-derived result without rewriting measured axes.
- [x] Retain `/express` as canonical.
- [x] Delete the legacy results coach and plan-coaching files/routes.
- [x] Retain and document the temporary local-storage development control.
- [ ] Complete real-device, keyboard-only, and accessibility review.

Tracker was later refreshed as a supporting continuation surface. Its rolling
seven-day micro-habits now connect plan techniques, selected Methods, and
reported obstacles to repeatable check-ins, while preserving local-only tracker
history and the existing streak model. Resources was later polished as a public
supporting catalog of free and free-tier tools and campus services, with category
filters and live fit signals from the current plan, selected Methods, and
reported obstacles. It remains outside the guided-flow redesign. After/Career
also remains outside this phase, and its broader workflow redesign is deferred.

## 13. Implementation Status

Implemented in the current codebase:

- Consolidated homepage explanation and updated global navigation
- Persona-first Express setup with explicit six-axis review
- Persona comparison and reversible override, plus a separate Methods page with
  explicit method selection
- Two-step, course-only recurring schedule setup with local draft recovery
- Recurring class conflicts, study-window validation, and capacity preview
- Deterministic scheduling inside confirmed availability only
- Course weighting, deadline handling, selected-method roles, and visible warnings
- Deterministic obstacle responses linked to course study blocks
- Seven-column desktop calendar and mobile chronological agenda
- Manual weekly overrides with one-step undo
- Bounded AI note interpretation with proposal review before applying
- AI tuning-only context and privacy disclosures
- Personalized rolling seven-day Tracker habits tied to the saved plan, selected
  Methods, and reported obstacles

Post-intake six-axis editing is a deferred enhancement; final release QA remains
for the current scope. The red test-only storage control intentionally remains
as temporary development functionality.

Automated verification covers the recommendation engines, profile migration,
onboarding helpers, week identity and validation, schedule schemas and
constraints, Tracker/Career persistence, setup and sheet component behavior,
and the AI tuning route's validation and failure behavior. Playwright and axe
responsive smoke coverage is configured; browser execution, live-provider,
real-device, and keyboard-only review remain part of release verification.
