# Scholara Guided Flow and Weekly Plan Redesign

**Status:** Core guided flow and Weekly Plan implemented; self-report routing,
post-intake six-axis editing, legacy cleanup, and release QA remain

**Current scope:** Homepage, Persona, Study Toolkit, and Weekly Plan
**Existing but outside this redesign:** Tracker, Resources, and After/Career
(their workflow redesign is deferred)

This document records the approved redesign and its current implementation
status. [plan.md](./plan.md) is the concise current-state source of truth.

## 1. Product Flow

```text
Quiz or self-report
  -> Persona
  -> Study Toolkit (choose 1-3 methods)
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

- Quiz completion opens `/persona`, not the old combined results page.
- Show the primary persona, secondary blend when relevant, strengths,
  watch-outs, and the six-axis profile.
- Keep this page focused on identity. Do not show study methods or AI coaching.
- End with one primary action: **Continue to Study Toolkit**.

### Self-report path

- **Current:** **Skip the quiz** opens `/express`.
- The current four-step form asks the learner to choose a starting persona,
  confirm or refine its seeded axes, select obstacles, and add context.
- Switching personas reseeds untouched axes while preserving values the learner
  deliberately changed.
- Saving retains the explicit persona choice when it differs from the final
  axis-derived match, then opens `/persona`.
- **Pending:** decide whether `/persona/setup` becomes canonical with `/express`
  as a redirect.

### Manual persona choice

- The Persona callout links to a detailed chooser containing all six personas,
  including strengths and watch-outs.
- A manual choice is stored as an explicit override; it does not rewrite the
  six measured axes or silently change cadence and peak-time preferences.
- Recommendations, resources, and an existing plan refresh around the effective
  persona while preserving selected methods, schedule, and week settings.
- The learner can restore the original axis-derived result at any time.
- The About page reuses the same detailed persona cards for all six personas.

### Six-axis editing (pending)

- Persona is read-only by default.
- **Edit profile** reveals the six axis controls.
- Saving recomputes the persona, recommendations, resources, and any generated
  plan while preserving explicitly selected Study Toolkit methods.
- Stale AI plan coaching is cleared after a profile change.

## 3. Study Toolkit

Use `/toolkit` with the page title **Your Study Toolkit**.

### Recommendations and library

- Show the personalized top five first, including rank reasons, evidence,
  effort, instructions, and supporting tools.
- Show the remaining catalog methods below, without duplicating the top five.
- Group the remaining methods into expandable sections:
  - Memory and learning
  - Focus and starting
  - Planning and workload
  - Exams and confidence
- Users can choose from either the top five or the full catalog.

### Selection

- Start with nothing selected.
- Require 1-3 methods before continuing.
- Show a persistent `X of 3 selected` summary and prevent a fourth choice.
- Save only after explicit confirmation; unsaved changes remain a local UI draft.
- Revisiting the page allows changes, but an empty draft cannot replace a valid
  saved toolkit.
- Changing the six axes recalculates the top five but preserves the user's
  existing selections.

### Method behavior in the plan

Toolkit choices affect how study blocks are carried out, not when the user is
available or how much time exists.

- Learning methods are assigned to new-material blocks.
- Review methods are assigned to review blocks.
- Focus methods support a learning or review method rather than replacing it.
- Planning methods augment the weekly review block.
- Exam-only methods are used only when the week includes an assessment or
  deadline; otherwise they stay saved for a relevant week.
- If the selected toolkit lacks a required role, use the highest-ranked
  compatible recommendation or foundation method. The current calendar shows
  the method name, but an explicit **foundation method** label remains pending.
- A small week does not need to use every selected method. Show which toolkit
  choices were not needed that week rather than adding unnecessary sessions.

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

After saving the toolkit, Plan opens a three-step setup. Drafts autosave locally
after each change. Returning users can edit the recurring schedule without
repeating Persona or Toolkit.

### Step 1: Courses and study focus

Offer two modes:

1. **Plan by course** (default when courses are entered)
2. **General study time**

For course-aware planning:

- Add one course at a time with a name and automatically assigned accessible
  color key.
- Let the user include or exclude each course from study allocation.
- Give included courses a baseline priority: `maintenance`, `standard`, or
  `focus`.
- Keep class meetings visible even when a course is excluded from study blocks.
- Synchronize the numeric course count in learner context when named courses are
  saved.

General mode still allows class commitments but labels generated blocks as
general study rather than assigning them to a course.

### Step 2: Recurring class schedule

Use a structured form rather than free text or calendar import:

- Course or generic **Class** label
- One or more weekday buttons, allowing patterns such as Monday/Wednesday/Friday
- Visible start and end time fields using 15-minute increments
- **Add class meeting**, followed by an editable chronological list
- Multiple meeting patterns per course, so labs can use different days/times

Validation:

- End must be later than start.
- Class meetings cannot cross midnight.
- Conflicting class meetings show an inline error and must be resolved.
- Class meetings are immutable scheduling constraints.
- Calendar/LMS import is deferred.

### Step 3: Study windows and weekly target

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

- Initialize the target from the profile's existing hours-per-week answer.
- Show `available`, `target`, `planned`, and `buffer` totals before generation.
- The target cannot silently exceed usable window capacity. Show the shortfall
  and let the user add windows or lower the target.
- Generate only after the course, class, availability, and target summary passes
  validation.

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
- Reserve one 30-minute weekly review in the latest compatible slot, preferring
  Sunday but never inventing a time.
- Keep review blocks course-linked when possible. An explicit link back to the
  particular learning block they reinforce is not currently stored.
- In course-aware mode, allocate time with weighted fairness:
  - `maintenance` = weight 1
  - `standard` = weight 2
  - `focus` = weight 3
  - week-specific `urgent` = weight 4
- Give each included course one block when capacity permits, then distribute the
  remainder by weight and deadlines.
- Deadline-related study belongs before the deadline when a valid slot exists.

### Output and warnings

Plans must expose rather than hide constraints:

- Requested versus scheduled minutes
- Unallocated minutes
- Courses that received no block
- Selected methods not used this week
- Deadline work that could not fit before the deadline
- Missing or insufficient study windows

Generation must be deterministic: identical inputs produce identical blocks,
ordering, IDs, totals, and warnings.

## 6. Weekly Calendar Experience

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
- A focused or clicked study block shows its primary method, supporting methods,
  and block instruction. Full method steps and evidence remain in Study Toolkit.
- Provide **Edit recurring schedule** and **Adjust this week** actions.

### Mobile and print

- Do not compress detailed content into seven tiny columns.
- Default to a seven-day summary strip and one selected day's chronological
  agenda.
- Keep the seven-day strip compact and use the selected-day agenda for detailed
  mobile content.
- Print uses the existing print stylesheet; a dedicated agenda-only print mode
  is not currently implemented.

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
persona or prior AI coaching.

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
  not forwarded into later coaching prompts. Persist only the approved structured
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

The profile moves to version 2 with an explicit version 1 migration.

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
  intensity: "deep" | "review" | "admin";
  note: string;
};
```

Profile version 2 adds:

- `personaOverride?: ArchetypeId`
- `recommendedTechniqueIds: string[]`
- `selectedTechniqueIds: string[]`
- `onboardingStage: OnboardingStage`
- `schedule?: ScheduleSetup`
- `plan?: WeekPlan`
- Structured week overrides separate from the recurring schedule

Migration behavior:

- Preserve axes, persona, context, recommendations, reasons, resources, and
  existing local data.
- Move legacy `techniqueIds` into `recommendedTechniqueIds`.
- Start with no claimed user selections.
- Resume legacy profiles at Study Toolkit, then require recurring schedule setup.
- Do not discard a valid version 1 profile merely because new fields are absent.

## 9. Homepage, Routes, and Navigation

### Homepage

The homepage now gives a concise version of the product story in this order:

1. How it works
2. Overcoming obstacles
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
- `/express` - current persona-first, four-step self-report intake
- `/toolkit` - recommendations, full method library, and selection
- `/plan/setup` - first-time or recurring schedule editor
- `/plan` - generated calendar and weekly tuning
- `/results` - redirects to `/persona`
- `/persona/setup` - planned canonical self-report route; not implemented yet

The guided sequence is Persona -> Toolkit -> Plan. Plan appears after Toolkit is
confirmed and opens setup until a valid recurring schedule exists. Direct visits
to a locked stage show a clear completion gate rather than partial content.

Before a profile exists, global navigation is **About -> Resources -> Take the
quiz**. With a profile, About remains first, Resources remains available, and
the guided Persona/Toolkit/Plan destinations are progressively unlocked.

The results-page coach is no longer in the active UI. The unused
`src/components/results/CoachNote.tsx` component and legacy `/api/coach` route
still exist and remain cleanup work. `/api/plan` coaching and `/api/ask` use the
actual methods present in the plan and avoid presenting an unselected method as
if the user chose it.

Privacy copy now states the precise behavior: profile and schedule data stay in
the browser; explicitly submitted AI notes and bounded plan context are sent to
the configured provider for processing and are not stored by Scholara.

## 10. Edge Cases

- No named courses: use general study mode.
- Asynchronous course: course may have no class meeting.
- No usable study window: do not generate; show how to add one.
- Availability smaller than target: schedule only safe capacity and show the
  shortfall before confirmation.
- Class overlaps availability: subtract class time and show the remaining usable
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

- [x] Add profile v2 and tested v1 migration.
- [x] Add onboarding stages, resume logic, and gates.
- [x] Make `plan` optional until scheduling is configured.
- [ ] Finish the canonical self-report route transition.

### Phase 2 - Persona and Study Toolkit

- [x] Split the current Results page.
- [x] Add detailed Persona comparison and a reversible manual choice.
- [x] Add persona-first Express intake with explicit axis confirmation.
- [ ] Add editable Persona axes after intake.
- [x] Add top-five/full-library selection with 1-3 persistence.
- [x] Add technique scheduling roles.
- [x] Remove the results coach from the active UI.
- [ ] Delete the unused CoachNote component and `/api/coach` route.

### Phase 3 - Recurring schedule setup

- [x] Build course, class meeting, study window, target, and review steps.
- [x] Persist drafts locally.
- [x] Add validation and capacity preview.

### Phase 4 - Scheduler and calendar

- [x] Refactor the engine around explicit time ranges and selected methods.
- [x] Add course allocation, warnings, and deterministic tests.
- [x] Build the desktop seven-column calendar and mobile agenda.

### Phase 5 - Weekly tuning and AI

- [x] Replace the old tuner with structured week overrides.
- [x] Add the manual adjustment workflow.
- [x] Add `/api/plan/tune`, proposal review, apply summary, and undo.
- [x] Update plan coaching and fixed-topic answers for selected/used methods.
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
- [x] Course-aware plans distribute study time by course priority; general mode
  remains available.
- [x] Selected methods are used according to their scheduling role.
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
- [ ] Decide whether to move self-report to `/persona/setup` or retain
  `/express` as canonical.
- [ ] Add six-axis editing with a deliberate recompute-and-save flow.
- [ ] Delete the legacy results coach files and the temporary local-storage test
  button.
- [ ] Complete real-device, keyboard-only, and accessibility review.

Tracker, Resources, and After/Career already exist. Their broader workflow
redesign remains outside this phase.

## 13. Implementation Status

Implemented in the current codebase:

- Consolidated homepage explanation and updated global navigation
- Persona-first Express setup with explicit six-axis review
- Persona comparison and reversible override, plus Study Toolkit separation with
  explicit method selection
- Three-step recurring schedule setup with local draft recovery
- Course-aware and general study modes
- Recurring class conflicts, study-window validation, and capacity preview
- Deterministic scheduling inside confirmed availability only
- Course weighting, deadline handling, selected-method roles, and visible warnings
- Seven-column desktop calendar and mobile chronological agenda
- Manual weekly overrides with one-step undo
- Bounded AI note interpretation with proposal review before applying
- Updated AI coaching context and privacy disclosures

Known remaining work is the canonical self-report route decision, post-intake
six-axis editing, legacy coach cleanup, removal of the test-only storage button,
and final release QA.

Automated verification covers the recommendation engines, profile migration,
onboarding helpers, sharing, schedule schemas and constraints, and the AI tuning
route. The live AI integration test skips when no API key is configured. There
are not yet component, browser end-to-end, or automated accessibility tests, so
real-device and keyboard-only review remains part of release verification.
