# Scholara

**scholar + persona** — a college study-planning tool that turns how you work,
the obstacles you face, and the time you actually have into methods and a
weekly plan.

Built for the **Stellic Pathfinders** challenge, in the **Overcoming Obstacles** category.

> The evidence decides *what* you should do. Your persona decides *how* you'll do it — when, for how long, with whom, and in what format.

---

## The problem

Most students are never taught *how* to study. The pace, independence, course
formats, and unstructured time of college can make strategies that worked in
high school stop working. Students then get generic advice — "review your
notes," "use flashcards" — that assumes a student with no job, no anxiety, and
forty free hours a week. When that advice fails, students conclude they're the
problem.

| Friction | What Scholara does about it |
| --- | --- |
| "I don't know *how* to study" | Shows a practical persona, suggests five methods, and lets the learner choose one to three |
| "I don't have time" | Builds a weekly plan only inside confirmed study availability and reports any shortfall |
| "I can't focus / I procrastinate" | Maps each obstacle you name to a specific countermeasure |
| "Good tools cost money" | Every resource is labeled free / free-tier / paid, and paid is hidden by default |
| "I don't have a quiet space" | Routes you to campus accommodations and free study spaces you already pay for |
| "I don't know what comes after" | A free, year-sequenced career track for your field |
| "Advice never sticks" | Habit tracking with forgiving streaks and a 2-week re-assessment prompt |

**No account. No database. No cost.** Your profile and schedule stay in your browser's local storage. Only the AI weekly-tuning action you explicitly invoke sends bounded context to the configured provider.

---

## Why this isn't a personality quiz

The "learning styles" model — that you're a visual or auditory learner and learn better when material matches that style — has been tested repeatedly, and matching instruction to a stated style does not reliably improve outcomes. Building a study tool on it means confidently giving students worse advice.

Scholara splits the problem in two:

1. **Techniques are chosen by evidence.** Retrieval practice, spaced repetition, interleaving, implementation intentions, practice testing. Every technique card displays an evidence grade (`strong` / `moderate` / `promising`) and a plain-language note explaining that grade — including when the support is weak.
2. **Personas are treated as adherence factors.** Your rhythm, structure, company, format, fuel, and peak hours don't change what encodes into memory. They change whether you're still doing this in three weeks — which is the difference between a technique that works and a technique you abandon.

This distinction is stated openly inside the app, on `/about`.

---

## How it works

```
QuizAnswers (13 screens) or Express setup (3 steps)
  └─▶ scoreAxes()        → 6 axis scores, −100..100
        └─▶ matchArchetype()  → primary + secondary, by cosine similarity
              └─▶ rankTechniques()  → top 5, with category diversity cap
                    └─▶ learner chooses 1–3 methods
                          └─▶ classes + confirmed study windows
                                └─▶ buildSchedulePlan() → course-specific blocks
                                      └─▶ LearnerProfile v3 → localStorage
```

The guided path asks 12 axis questions followed by one obstacle screen. Express
collects Persona, Six axes, and Obstacles. Neither path asks for estimated course
load or weekly hours; those concrete inputs belong in the two-step Plan setup.
New version 3 profiles contain no general learner context. Year and field may be
retained only when migrating old profiles, for supporting Resources/After pages,
and never influence the weekly schedule.

### The six axes

| Axis | Low ← → High | What it changes |
| --- | --- | --- |
| Rhythm | Sprinter ↔ Marathoner | Session length (30 / 45 / 90 min) |
| Structure | Improviser ↔ Architect | Fixed grid vs. flexible anchors |
| Company | Solo ↔ Collaborative | Body doubling, group study |
| Format | Verbal ↔ Spatial | Note format, technique choice |
| Fuel | Pressure ↔ Curiosity | Artificial deadlines vs. exploration |
| Peak hours | Early bird ↔ Night owl | Which hours get the hardest material |

### The six personas

The Architect · The Sprinter · The Connector · The Cartographer · The Explorer · The Anchor

Matched by cosine similarity, so the *shape* of your preferences matters rather than their intensity. A student with mild preferences still matches the archetype leaning the same way, and a close call is surfaced as a blend rather than hidden.

### Scheduling rules

- Study blocks stay inside the windows the learner confirms and never overlap a class or temporary busy time.
- The setup summary reports total recurring class time separately from class time that overlaps a study window; only the overlap reduces usable study capacity.
- Every non-administration block names the course, method, duration, and concrete action.
- Course priority, weekly urgency, deadlines, the six axes, and selected methods shape allocation and placement.
- Every reported obstacle gets a visible response tied to the blocks and methods that address it.
- If the target exceeds physical capacity, Scholara schedules only what fits and reports the shortfall.
- A 30-minute weekly review is added only when there is enough time to cover every included course first.

Recurring courses, meetings, availability, and the study target are edited on
`/plan/setup`. The completed experience remains one page at `/plan`: summary,
obstacle responses, the responsive calendar/agenda workspace, reviewed weekly
tuning, and the build rationale. Saved weeks show their real Monday-Sunday date
range and remain read-only until the learner deliberately starts the current
week, which clears temporary exceptions. Generating a plan returns the learner
to the top of that page. There is no separate calendar route.

---

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16.3 (App Router) + React 19 + TypeScript |
| Styling | Tailwind CSS v4, deep-blue theme via `@theme` |
| State | React Context + `localStorage`, validated with Zod on read |
| Icons | lucide-react |
| Tests | Vitest units plus RTL/jsdom components; Playwright and axe responsive smoke coverage |
| AI | Optional OpenAI-compatible weekly tuning with deterministic fallback |

### Project layout

```
src/
├─ app/              # routes: /, /quiz, /express, /persona, /toolkit,
│                    #         /plan, /plan/setup, /resources, /tracker,
│                    #         /career, /about,
│                    #         /results redirect, and /api/plan/tune
├─ components/       # views, accessible forms, and client-side orchestration
├─ hooks/            # useProfile, useTracker
└─ lib/
   ├─ engine/        # pure functions: scoring, matching, ranking, planning
   ├─ ai/            # server-only client and bounded weekly-note tuning
   ├─ data/          # all content as typed arrays
   ├─ types.ts       # shared domain types
   ├─ schema.ts      # Zod validation + profile versioning
   └─ storage.ts     # typed localStorage wrapper
tests/               # engines, schemas, migrations, onboarding, planning, AI
```

**The boundary:** reusable content lives in `lib/data`; deterministic domain
rules live in `lib/engine`; shared shapes, validation, and persistence live in
`lib`. Client components may coordinate forms, local profile state, and route
transitions, but the scheduler and recommendation rules stay outside the UI and
remain directly testable.

---

## Running it

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # full Vitest suite
npm run build    # production build
```

No environment variables are required.

### Optional AI weekly tuning

The complete plan works without AI. After a plan exists, the learner may submit a short note about changes such as an exam, work shift, or low-energy week. AI converts that note into a bounded proposal that the learner reviews before applying. The deterministic engine still creates every calendar block; AI cannot move classes, add availability, select methods, or directly edit the schedule.

```bash
cp .env.example .env.local
```

```
AI_API_KEY=...
AI_BASE_URL=https://api.ai.it.ufl.edu
AI_MODEL=llama-3.3-70b-instruct
```

The endpoint is OpenAI-compatible and can be changed with environment variables. The key stays server-side, request bodies are Zod-validated, and calls have a strict timeout. Weekly free text is sent only after explicit disclosure and is constrained to a reviewable structured proposal. **Any** failure leaves the deterministic plan and manual controls available.

---

## Accessibility

Accessibility is treated as a core requirement, with final keyboard-only,
real-device, and touch-target verification still pending.

- In the guided quiz, pointer selection enables an explicit blue Next button;
  number keys select an answer and advance immediately
- Focus moves to each new quiz question; progress is announced via `aria-live`
- Visible focus rings, never removed
- `prefers-reduced-motion` disables all animation
- Primary onboarding and planning controls are designed for comfortable touch targets
- Meaning is never conveyed by color alone — axis positions are stated in text
- Semantic landmarks, skip-to-content link, labeled form controls

---

## Privacy

There is no database, analytics, or telemetry. Your profile, schedule and
onboarding drafts, and tracker history live in browser storage and can be
removed from `/about` through the confirmed **Delete everything** action.
Career-only field/year preferences are also stored locally, separately from the
learner profile. A weekly note is sent to the configured AI provider only when
the student selects **Preview AI changes**. Scholara does not save the raw note,
and the model can return only a validated proposal that the student must apply.

The red **TEST ONLY: Wipe localStorage** home-page control is intentionally
retained as temporary development functionality and is not a production
account-management feature.

---

## Known limitations

- The persona model is a practical framework, not a validated psychometric instrument.
- Campus resources are described generically, since every institution names them differently.
- Clearing browser data clears your profile — the tradeoff of having no accounts.
- Scholara is a study tool, not medical, psychological, or academic advising.

## Future work

- Post-intake six-axis editing with a deliberate recompute-and-save flow
- Optional accounts for cross-device sync
- **Stellic / LMS integration** to pull real course data, deadlines, and degree requirements so the plan is built from actual syllabi
- Calendar export (`.ics`) and notification nudges
- Institution-specific resource packs
