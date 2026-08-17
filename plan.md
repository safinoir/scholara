# Scholara Project Plan

**Last updated:** 2026-08-16
**Current branch:** `ui-changes` (based on the AI/onboarding work already merged
into `main`)
**Status:** The core challenge experience is implemented: an obstacle-aware,
course-specific Persona -> Methods -> Weekly Setup -> Weekly Plan workflow.
Post-intake six-axis editing remains a deferred enhancement, and final release
QA remains open.

For the detailed design and implementation record behind onboarding and weekly
planning, see [onboarding-redesign.md](./onboarding-redesign.md). This file is
the concise source of truth for what the application currently does and what
remains.

---

## 1. Product Purpose

### Challenge origin

Scholara was created for the **Stellic Pathfinders challenge**, in the
**Overcoming Obstacles** category. The challenge prompt was:

> Create something that helps you navigate your college journey, and what comes
> after. Stellic was founded by students who struggled to navigate college.
> We’ve spent a decade building software for higher ed, and we want to hear
> directly from you about what still needs to change.

Scholara's answer is that navigating college requires more than knowing which
courses to take. Students are expected to manage a faster pace, greater
independence, different course formats, and less structured time, often without
ever being taught how to study under those conditions. Strategies that were
enough in high school may stop working in college; when generic advice fails,
students can mistake a missing system for a personal failure.

### Product response

Scholara helps a college student build that missing system. Its north-star
outcome is that a learner leaves knowing which study methods to try, why those
methods suit their circumstances, and exactly how they can use them in the week
they actually have.

Scholara helps a student answer three questions:

1. What study conditions are they most likely to maintain?
2. Which evidence-aware study methods fit their profile and obstacles?
3. How can those methods fit around the classes, constraints, and study time
   they actually have?

The resulting journey moves from self-discovery to action: a learner identifies
their working patterns and obstacles, reviews evidence-aware methods, chooses
one to three, and turns those choices into a realistic course-specific weekly
plan.

### Individualized without fixed learner types

Scholara does **not** use traditional visual/auditory/kinesthetic learning
styles or force students into a small set of broad categories. Its six axes are
continuous adherence and planning factors. A persona is a readable starting
point derived from those axes, not a diagnosis, a psychometric label, or a box:
close matches can appear as a blend, and a learner can override the shorthand
without rewriting their measured axes.

Evidence determines which study practices are credible. The learner's axes,
obstacles, preferences, selected methods, courses, and real availability
determine how those practices can become maintainable. This distinction lets
Scholara be personal without claiming that memory works differently for each
persona.

Technique suggestions combine:

- evidence quality;
- fit with the six axes and closest persona;
- obstacles the student reported;
- a short-method preference when the student reports time scarcity; and
- category diversity, capped at two recommendations from one category.

The user sees five personalized suggestions and explicitly selects one to three
methods that Scholara incorporates into compatible study blocks in their weekly
schedule.

The central college-journey experience is the intake, Persona, Methods, and
Weekly Plan flow. Resources and Tracker support the journey, while the
year-and-field **After** checklist addresses the prompt's “what comes after”
dimension. Scholara is not a degree audit, registration system, LMS, or
replacement for academic advising; integration with those systems remains
future work.

---

## 2. Current Stack

| Area | Current implementation |
| --- | --- |
| Framework | Next.js 16.3 App Router, React 19, TypeScript |
| Styling | Tailwind CSS v4 and local UI primitives |
| State | React context plus typed `localStorage` helpers |
| Validation | Zod v4 on profiles, schedule data, and API payloads |
| Profile format | Version 3 with version 1 and 2 migrations |
| Backend | Next.js Route Handlers only |
| Database/auth | None |
| AI provider | OpenAI-compatible chat-completions endpoint |
| Default AI configuration | `https://api.ai.it.ufl.edu`, model `llama-3.3-70b-instruct` |
| Tests | Vitest units, RTL/jsdom components, and Playwright/axe responsive smoke coverage |
| Deployment target | Vercel; `main` is the intended production branch |

The deterministic engines remain the source of truth. The app works without an
AI key.

### Code organization

| Path | Responsibility |
| --- | --- |
| `src/app` | App Router pages, shared layout/styles/icon, and the single active API route |
| `src/components` | Feature views, accessible forms and sheets, navigation chrome, and shared UI primitives |
| `src/lib/data` | Typed personas, axes, methods, resources, and other reusable content |
| `src/lib/engine` | Pure scoring, matching, recommendation, capacity, and deterministic scheduling rules |
| `src/lib/ai` | Server-only OpenAI-compatible client and bounded tuning interpretation |
| `src/lib/types.ts` and `src/lib/schema.ts` | Shared domain contracts, Zod validation, and profile migrations |
| `src/lib/storage.ts`, `week.ts`, `plan.ts`, and `careerPreferences.ts` | Browser persistence and shared week/plan helpers |
| `src/hooks` | Profile and Tracker client-state adapters |
| `tests` and `e2e` | Unit/schema/migration tests, RTL/jsdom interaction tests, and Playwright/axe responsive coverage |

Presentation components may orchestrate forms and navigation, but reusable
content and recommendation/scheduling decisions stay outside the UI. The only
active server-side product endpoint is `POST /api/plan/tune`.

---

## 3. Current Guided Flow

```text
13-screen quiz or 3-step Express form
  -> Persona
  -> Methods (choose 1-3 methods for weekly study blocks)
  -> Weekly Plan setup
  -> Generated seven-day calendar
  -> Optional manual or AI-assisted weekly tuning
```

Saved onboarding stages are:

```ts
type OnboardingStage = "persona" | "toolkit" | "schedule" | "complete";
```

- Quiz completion creates a version 3 profile and opens `/persona`.
- The guided quiz contains 12 axis questions and one obstacle screen. Clicking
  or tapping an answer records it on the current screen and enables a blue
  **Next** button; pressing a valid number key selects that option and advances
  immediately. Back and Next retain consistent sizing and shape.
- An in-progress quiz draft resumes at the first unanswered axis question.
- Persona confirmation unlocks `/toolkit`.
- Confirming one to three methods unlocks weekly setup.
- A valid recurring schedule and generated plan complete onboarding.
- The home page resumes the first unfinished stage for returning users.
- Legacy version 1 and 2 profiles migrate without pretending old
  recommendations were user-selected. Their year and field may remain as
  optional education context for Resources/After, but never affect planning.

The current self-report route is `/express`. It uses three steps: choose a
starting persona, confirm or refine the six seeded axes, and select obstacles.
There is no intake context step. The final profile keeps the user's persona
choice distinct from the axis-derived match when necessary, then opens
`/persona`. Completing either intake over an existing profile requires a reset
confirmation before replacing its persona, methods, schedule, and plan.

---

## 4. Landing Page and Navigation

The home page is a short product explanation and conversion page. Its sections
are currently:

1. How it works
2. Overcoming obstacles
3. The six personas
4. The six axes
5. Technique recommendations
6. A weekly plan
7. Final quiz call to action

The hero's **How it works** control scrolls to the first section. `/about`
remains the longer methodology, limitations, privacy, and data-handling page.

The header home link uses the same `src/app/icon.svg` artwork as the site icon.
Public navigation is:

```text
About -> Resources -> Take the quiz
```

With a saved profile, the ordered navigation is **About -> Persona -> Methods ->
Plan -> Tracker -> Resources -> After**. Methods and Plan appear only when their
prerequisites are complete; Plan points to `/plan/setup` until a valid non-empty
plan exists, then to `/plan`. At `md` and above this is an inline navigation bar;
below `md` it becomes an accessible disclosure menu. The user-facing label is
**Methods**; its route remains `/toolkit`, and its persisted onboarding stage
remains `toolkit`.

---

## 5. Persona and Methods

### Persona

Implemented:

- primary persona and secondary blend;
- strengths and watch-outs;
- six-axis visualization;
- detailed comparison of all six personas with a reversible manual persona
  choice;
- a stage-aware next action that leads to Methods, Weekly Setup, or the saved
  Plan as appropriate;
- retake action; and
- focused Persona page with no technique cards or AI coach.

### Methods

Implemented:

- personalized top five as compact method rows showing the core summary, with
  every **How it works** detail panel collapsed initially;
- steps, supporting reasons, evidence detail, and tools available on demand in
  each row;
- all remaining methods behind one **Browse more methods** disclosure, grouped
  by the user goals **Learn and remember**, **Focus and start**, **Plan your
  workload**, and **Prepare for exams**;
- selection from either recommendations or the full library;
- one-to-three selection limit with explicit confirmation and a compact sticky
  control that shows the chosen methods, saves changes, and becomes **Continue
  to weekly setup** for first-time users or **View updated plan** for completed
  users;
- no separate bottom readiness card duplicating the sticky save/continue
  control;
- persisted selected IDs kept separate from recommended IDs; and
- scheduling roles for learning, review, focus support, planning, and
  assessment-related techniques.

The one to three selected methods are incorporated into compatible weekly study
blocks according to their scheduling roles. They affect what happens inside a
study block; they do not create extra availability or override calendar
constraints. A small or incompatible week can leave a selected method unused,
which the plan reports rather than forcing an unnecessary block.

---

## 6. Weekly Plan

### Recurring schedule setup

The two-step, course-only setup records:

1. named courses, priorities, include/exclude choices, and one or more linked
   recurring meeting patterns; and
2. confirmed study windows plus the amount of that available time the learner
   wants to commit.

At least one named course must be included in the plan. Asynchronous courses may
have no meeting time, while every saved class meeting must belong to a course.
The draft autosaves locally. The UI validates conflicts and time ranges, shows
available time, total recurring class time, target, feasible planned time,
buffer, and shortfall. Class time is subtracted from capacity only where it
overlaps a confirmed study window. A target above capacity still permits
generation and schedules only what safely fits. Drafts survive ordinary
navigation; **Discard changes** explicitly clears an editing draft and returns
to the saved plan. Invalid schedules and zero-block generation never replace a
valid plan.

### Deterministic scheduler

`buildSchedulePlan()`:

- uses integer minutes on a 15-minute grid;
- merges study windows and subtracts classes, unavailable days, and temporary
  busy windows;
- never schedules outside a confirmed study window;
- caps planned time by the requested target and physical capacity;
- reports unallocated time instead of inventing availability;
- spreads work across open days and prefers times near the student's peak-hours
  axis;
- allocates course time by baseline priority, temporary urgency, and deadlines;
- assigns selected methods by scheduling role, with compatible recommendation
  or foundation fallbacks when required;
- labels whether each primary method was selected or supplied as a foundation;
- creates exactly one visible response for every persistent or week-specific
  obstacle and ties it to the relevant blocks and methods;
- keeps every non-administration block course-specific, with a duration, method,
  and concrete instruction;
- adds a 30-minute weekly review only when the target reaches
  `max(120, 30 × (included courses + 1))` minutes, preserving first-pass course
  coverage before administration;
- exposes unused methods, unassigned courses, deadline compromises, and capacity
  warnings; and
- produces deterministic output for identical input.

There is no universal 85% scheduling rule and no guaranteed 1/3/7-day review
pattern in the current scheduler.

### Calendar experience

- `/plan` is the single completed-plan page: summary metrics, warnings, obstacle
  responses, the calendar, weekly tuning, and rationale remain together.
- `/plan/setup` is the separate recurring-schedule editor. There is no
  `/plan/calendar` route in the current product or plan.
- Generating from either first-time setup or `/plan/setup` returns to `/plan`
  and resets the viewport to the top so the summary and obstacle responses are
  seen before the calendar.
- Desktop defaults to a cropped, internally scrolling seven-column calendar
  with actual dates, classes, recurring availability, temporary busy time,
  unavailable-day overlays, and study blocks. Agenda remains available as a
  manual view.
- Below `lg`, the semantic chronological agenda is the default, with a
  seven-day selector and actual dates.
- Study-block detail opens in an accessible desktop side sheet or mobile bottom
  sheet and includes primary/supporting methods, source, instruction, and
  obstacles addressed.
- Before the calendar, **What this plan is helping you overcome** explains each
  reported obstacle, Scholara's response, and where it appears in the plan.
- Calendar blocks show course, method, and duration without requiring expansion;
  details also show the instruction, method source, and obstacles addressed.
- A compact sticky toolbar exposes the represented week, Current/Saved Week
  state, weekly adjustment, recurring schedule editing, and quiet copy action.
- A stale saved plan remains viewable but cannot be adjusted. **Start this
  week** clears temporary busy windows, unavailable days, deadlines, urgency,
  workload, energy, and weekly obstacle overrides while preserving recurring
  inputs.

### Weekly tuning

Manual tuning supports:

- weekly target;
- workload and energy;
- active friction points;
- unavailable days and temporary busy windows; and
- course focus, urgency, and deadlines.

The user can also submit a note of up to 500 characters to
`POST /api/plan/tune`. AI may propose only bounded structured changes. The user
reviews the resulting deterministic plan diff before applying it. Manual and AI
changes use the same validated review workflow, and applying provides a compact
change summary plus one-step undo.

AI never returns final calendar blocks, moves classes, adds study availability,
or selects methods.

---

## 7. Current Routes

### Pages

| Route | Current purpose |
| --- | --- |
| `/` | Persuasive overview, product explanation, and onboarding resume |
| `/about` | Detailed methodology, limitations, privacy, and reset controls |
| `/quiz` | Thirteen-screen guided intake with draft recovery; pointer selection enables an explicit blue Next action, number-key selection advances directly, and obstacles are the final screen |
| `/express` | Persona-first, three-step self-report intake with no context step |
| `/persona` | Persona, blend, strengths, watch-outs, and axes |
| `/toolkit` | User-facing **Methods** page with the top five, compact full library, and one-to-three selection |
| `/plan/setup` | Two-step recurring courses, meetings, availability, and target editor |
| `/plan` | Single completed experience: summary, obstacle responses, embedded course calendar, manual/AI tuning, rationale, and copy |
| `/resources` | Curated resource library; available without a profile |
| `/tracker` | Existing micro-habit tracker |
| `/career` | Existing field-and-year career checklist, labeled **After** in navigation |
| `/results` | Redirects to `/persona` |

### APIs

| Route | Current purpose |
| --- | --- |
| `/api/plan/tune` | Free-text weekly note to bounded structured proposal |

The former `/api/plan`, `/api/ask`, and `/api/coach` coaching routes and their UI
have been removed. AI is used only for the explicit weekly tuning proposal.
The former `/share/[code]` route, share-code helpers, payload type, and dedicated
tests have also been removed; old share URLs intentionally use the standard 404.

---

## 8. Data, Privacy, and Failure Behavior

- New profile v3 records do not contain the former broad learner context.
  `educationContext?: { year; field }` exists only for migrated Resources/After
  compatibility and never affects method ranking or scheduling.
- The validated profile, selected methods, recurring schedule, approved weekly
  settings, quiz and schedule drafts, Tracker data, and Career-only preferences
  are persisted only in browser storage. Career preferences use their own
  validated versioned record rather than changing `LearnerProfile`.
- There is no account, application database, or analytics pipeline.
- AI keys remain server-side.
- A bounded set of known courses and current week values is transmitted only
  when the user invokes AI weekly tuning. Scholara does not persist the request.
- A weekly free-text note leaves the browser only after explicit submission to
  the tuning action.
- The raw note is not persisted by Scholara or reused in later requests.
- API payloads are narrowly validated and timeout-guarded.
- Missing keys, timeouts, malformed JSON, or rejected output leave the plan
  unchanged and preserve manual controls.

---

## 9. Existing Supporting Features

These routes already work but were intentionally outside the recent workflow
redesign. They broaden the challenge response around the core “learn how to
study in college” journey:

- Resources: cost labels, fit sorting, campus resources, and paid-hidden default.
- Tracker: up to three micro-habits, forgiving streaks, local-calendar dates,
  atomic clearing, and a reassessment prompt.
- After/Career: field-by-year checklist with free supporting resources. Migrated
  profiles may seed it from optional legacy education context; otherwise the
  learner chooses a year before relevance labels appear. These Career-only
  preferences are validated and stored separately from the profile.

Future redesign work for these areas is deferred until Persona, Methods, and
Weekly Plan are fully polished.

---

## 10. Remaining Work

The red **TEST ONLY: Wipe localStorage** home-page control intentionally remains
available as temporary development functionality.

### Release verification

- Complete a keyboard-only walkthrough and automated accessibility scan.
- Check contrast and focus behavior at every onboarding stage.
- Test the full flow on a real phone and at desktop width.
- Run a fresh-browser first-time flow and a migrated-profile flow.
- Tighten final copy and record the demo walkthrough.

### Delivery

- Merge `ui-changes` into `main`.
- Verify the production Vercel environment variables and build.
- Run the production smoke test after deployment.

---

## 11. Deferred / Future Work

- Post-intake Persona-axis editing with deliberate recompute-and-save behavior
  that preserves the manual persona choice, valid method selections, and
  recurring schedule.
- Calendar or LMS import.
- Accounts and cross-device sync.
- Notification/reminder system.
- Institution-specific campus resource configuration.
- Tracker, Resources, and After workflow redesigns.
- Richer plan editing such as manual move/resize interactions.
- Detailed before/after AI tuning diff beyond the current compact summary.

---

## 12. Release Definition of Done

- [x] Quiz -> Persona -> Methods -> schedule setup -> weekly calendar works.
- [x] Pointer-selected quiz answers remain on the current question and activate
  a blue Next button; number-key answers advance immediately.
- [x] Users explicitly select one to three methods for incorporation into
  compatible weekly study blocks.
- [x] Plans stay inside confirmed availability and outside classes/busy time.
- [x] Setup is course-only, supports asynchronous classes, and links every class
  meeting to a course.
- [x] Manual tuning works without AI.
- [x] AI tuning is bounded, reviewable, and failure-safe.
- [x] Every reported obstacle has a visible deterministic response in the plan.
- [x] Every study block exposes its course, method, duration, and instruction.
- [x] Desktop calendar and mobile agenda are implemented.
- [x] Calendar, obstacle responses, tuning, and rationale remain consolidated on
  `/plan`; generation returns to the top of that page.
- [x] Profile v1/v2 migrations into profile v3 are covered by tests.
- [x] About and Resources are always available in navigation.
- [x] Users can compare all personas and override or restore their original
  axis-derived result.
- [x] Express users actively choose a persona and confirm the six axes.
- [x] Legacy AI coaching UI and API cleanup is complete.
- [x] The temporary test-only localStorage control remains present and is
  documented as development-only functionality.
- [ ] Accessibility and real-device verification are complete.
- [ ] Current UI branch is merged and production is smoke-tested.
