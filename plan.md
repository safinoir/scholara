# Scholara Project Plan

**Last updated:** 2026-08-09
**Current branch:** `ui-changes` (based on the AI/onboarding work already merged
into `main`)
**Status:** The guided Persona -> Toolkit -> Weekly Plan workflow is implemented.
The remaining work is persona self-report/editing cleanup, release QA, and
merging the current UI refinements.

For the detailed design and implementation record behind onboarding and weekly
planning, see [onboarding-redesign.md](./onboarding-redesign.md). This file is
the concise source of truth for what the application currently does and what
remains.

---

## 1. Product

Scholara helps a student answer three questions:

1. What study conditions are they most likely to maintain?
2. Which evidence-aware study methods fit their profile and obstacles?
3. How can those methods fit into the classes and study time they actually have?

Scholara does **not** use traditional visual/auditory/kinesthetic learning
styles. Its six axes are adherence and planning factors. A persona is a
practical summary of those axes, not a diagnosis or a psychometric label.

Technique suggestions combine:

- evidence quality;
- fit with the six axes and closest persona;
- obstacles the student reported;
- time cost relative to the student's week; and
- category diversity, capped at two recommendations from one category.

The user sees five personalized suggestions and explicitly selects one to three
methods for their Study Toolkit.

---

## 2. Current Stack

| Area | Current implementation |
| --- | --- |
| Framework | Next.js 16.3 App Router, React 19, TypeScript |
| Styling | Tailwind CSS v4 and local UI primitives |
| State | React context plus typed `localStorage` helpers |
| Validation | Zod v4 on profiles, schedule data, and API payloads |
| Profile format | Version 2 with an explicit version 1 migration |
| Backend | Next.js Route Handlers only |
| Database/auth | None |
| AI provider | OpenAI-compatible chat-completions endpoint |
| Default AI configuration | `https://api.ai.it.ufl.edu`, model `llama-3.3-70b-instruct` |
| Tests | Vitest for engines, schemas, migrations, onboarding, sharing, and AI routes |
| Deployment target | Vercel; `main` is the intended production branch |

The deterministic engines remain the source of truth. The app works without an
AI key.

---

## 3. Current Guided Flow

```text
Quiz or current self-report form
  -> Persona
  -> Study Toolkit (choose 1-3 methods)
  -> Weekly Plan setup
  -> Generated seven-day calendar
  -> Optional manual or AI-assisted weekly tuning
```

Saved onboarding stages are:

```ts
type OnboardingStage = "persona" | "toolkit" | "schedule" | "complete";
```

- Quiz completion creates a version 2 profile and opens `/persona`.
- Persona confirmation unlocks `/toolkit`.
- Confirming one to three methods unlocks weekly setup.
- A valid recurring schedule and generated plan complete onboarding.
- The home page resumes the first unfinished stage for returning users.
- Legacy version 1 profiles migrate to the Toolkit stage without pretending the
  old recommendations were user-selected.

The current self-report route is `/express`. It derives a persona from directly
set axes, friction points, and context, then opens `/persona`.

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

Public navigation is:

```text
About -> Resources -> Take the quiz
```

With a saved profile, About remains first and Resources remains available.
Persona, Toolkit, and Plan follow the guided access rules; Tracker and After
remain available as existing supporting features.

---

## 5. Persona and Study Toolkit

### Persona

Implemented:

- primary persona and secondary blend;
- strengths and watch-outs;
- six-axis visualization;
- explicit continuation to Study Toolkit;
- retake and share actions; and
- focused Persona page with no technique cards or AI coach.

### Study Toolkit

Implemented:

- personalized top five with reasons, evidence, effort, steps, and tools;
- remaining methods grouped by category;
- selection from either recommendations or the full library;
- one-to-three selection limit with explicit confirmation;
- persisted selected IDs kept separate from recommended IDs; and
- scheduling roles for learning, review, focus support, planning, and
  assessment-related techniques.

Toolkit selections affect what happens inside a study block. They do not create
extra availability or override calendar constraints.

---

## 6. Weekly Plan

### Recurring schedule setup

The three-step setup records:

1. named courses and priorities, or general study mode;
2. recurring class meetings; and
3. confirmed study windows plus a separate weekly target.

The draft autosaves locally. The UI validates meeting conflicts, time ranges,
window capacity, and target shortfalls before generation.

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
- reserves one 30-minute weekly review when a valid slot exists;
- exposes unused methods, unassigned courses, deadline compromises, and capacity
  warnings; and
- produces deterministic output for identical input.

There is no universal 85% scheduling rule and no guaranteed 1/3/7-day review
pattern in the current scheduler.

### Calendar experience

- Desktop: time rail with seven day columns, classes, availability, and study
  blocks.
- Mobile: seven-day selector plus a chronological agenda for the chosen day.
- Study-block detail: primary method, supporting methods, and block instruction.
- Utilities: edit recurring schedule, copy as text, print, weekly adjustment,
  AI coaching brief, and fixed-topic plan questions.

### Weekly tuning

Manual tuning supports:

- weekly target;
- workload and energy;
- active friction points;
- unavailable days and temporary busy windows; and
- course focus, urgency, and deadlines.

The user can also submit a note of up to 500 characters to
`POST /api/plan/tune`. AI may propose only bounded structured changes. The user
previews and applies or discards the proposal; applying reruns the deterministic
scheduler and provides a compact change summary plus one-step undo.

AI never returns final calendar blocks, moves classes, adds study availability,
or selects toolkit methods.

---

## 7. Current Routes

### Pages

| Route | Current purpose |
| --- | --- |
| `/` | Persuasive overview, product explanation, and onboarding resume |
| `/about` | Detailed methodology, limitations, privacy, and reset controls |
| `/quiz` | Fourteen-question guided intake with draft recovery |
| `/express` | Current direct self-report intake |
| `/persona` | Persona, blend, strengths, watch-outs, and axes |
| `/toolkit` | Top five, full method library, and one-to-three selection |
| `/plan/setup` | Canonical recurring schedule setup entry |
| `/plan` | Generated calendar, manual tuning, AI tuning, coaching, copy, and print |
| `/resources` | Curated resource library; available without a profile |
| `/tracker` | Existing micro-habit tracker |
| `/career` | Existing field-and-year career checklist, labeled **After** in navigation |
| `/share/[code]` | Read-only serverless shared persona |
| `/results` | Redirects to `/persona` |

### APIs

| Route | Current purpose |
| --- | --- |
| `/api/plan` | Optional weekly brief and block-level coaching over an engine-built plan |
| `/api/ask` | Fixed-topic answers grounded in the actual plan |
| `/api/plan/tune` | Free-text weekly note to bounded structured proposal |
| `/api/coach` | Legacy results-coach endpoint; no longer used by the active UI |

---

## 8. Data, Privacy, and Failure Behavior

- Profile, toolkit, recurring schedule, approved weekly settings, and tracker
  data are persisted only in browser storage.
- There is no account, application database, or analytics pipeline.
- AI keys remain server-side.
- Bounded profile, method, week, and plan context is transmitted only when the
  user invokes an AI coaching, question, or tuning action. Scholara does not
  persist those requests.
- A weekly free-text note leaves the browser only after explicit submission to
  the tuning action.
- The raw note is not persisted by Scholara or forwarded into later coaching
  requests.
- API payloads are narrowly validated and timeout-guarded.
- Missing keys, timeouts, malformed JSON, or rejected output leave the plan
  unchanged and preserve manual controls.
- Shared personas are encoded into the URL rather than stored on a server.

---

## 9. Existing Supporting Features

These routes already work but were intentionally outside the recent workflow
redesign:

- Resources: cost labels, fit sorting, campus resources, and paid-hidden default.
- Tracker: up to three micro-habits, forgiving streaks, and reassessment prompt.
- After/Career: field-by-year checklist with free supporting resources.
- Share: URL-encoded read-only persona.

Future redesign work for these areas is deferred until Persona, Toolkit, and
Weekly Plan are fully polished.

---

## 10. Remaining Work

### Product cleanup

- Replace `/express` with the planned canonical `/persona/setup` route, or make
  `/express` redirect there.
- Require active confirmation of self-report axes so untouched neutral defaults
  cannot silently assign a persona.
- Add Persona-page profile editing that recomputes persona and recommendations
  while preserving valid toolkit selections and rebuilding an existing plan.
- Remove the unused `CoachNote` component and legacy `/api/coach` route.
- Remove the red **TEST ONLY: Wipe localStorage** home-page button before release.

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

- Calendar or LMS import.
- Accounts and cross-device sync.
- Notification/reminder system.
- Institution-specific campus resource configuration.
- Tracker, Resources, and After workflow redesigns.
- Richer plan editing such as manual move/resize interactions.
- Detailed before/after AI tuning diff beyond the current compact summary.

---

## 12. Release Definition of Done

- [x] Quiz -> Persona -> Toolkit -> schedule setup -> weekly calendar works.
- [x] Users explicitly select one to three methods.
- [x] Plans stay inside confirmed availability and outside classes/busy time.
- [x] Course-aware and general-study modes both work.
- [x] Manual tuning works without AI.
- [x] AI tuning is bounded, reviewable, and failure-safe.
- [x] Desktop calendar and mobile agenda are implemented.
- [x] Profile v1 migration is covered by tests.
- [x] About and Resources are always available in navigation.
- [ ] Self-report confirmation and Persona editing are complete.
- [ ] Temporary and legacy UI/API cleanup is complete.
- [ ] Accessibility and real-device verification are complete.
- [ ] Current UI branch is merged and production is smoke-tested.
