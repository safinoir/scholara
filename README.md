# Scholara

**scholar + persona** — a study-habit builder that turns who you are into how you should study.

Built for the **Stellic Pathfinders** challenge, in the **Overcoming Obstacles** category.

> The evidence decides *what* you should do. Your persona decides *how* you'll do it — when, for how long, with whom, and in what format.

---

## The problem

Most students are never taught *how* to study. They get generic advice — "review your notes," "use flashcards" — that assumes a student with no job, no anxiety, and forty free hours a week. When that advice fails, students conclude they're the problem.

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
| Rhythm | Sprinter ↔ Marathoner | Session length (25 / 45 / 90 min) |
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
- Every non-administration block names the course, method, duration, and concrete action.
- Course priority, weekly urgency, deadlines, the six axes, and selected methods shape allocation and placement.
- Every reported obstacle gets a visible response tied to the blocks and methods that address it.
- If the target exceeds physical capacity, Scholara schedules only what fits and reports the shortfall.
- A 30-minute weekly review is added only when there is enough time to cover every included course first.

---

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router) + TypeScript |
| Styling | Tailwind CSS v4, deep-blue theme via `@theme` |
| State | React Context + `localStorage`, validated with Zod on read |
| Icons | lucide-react |
| Tests | Vitest for engines, schemas, migrations, onboarding, and AI tuning |
| AI | Optional, provider-agnostic, fully degradable |

### Project layout

```
src/
├─ app/              # routes: /, /quiz, /express, /persona, /toolkit,
│                    #         /plan, /resources, /tracker, /career, /about,
│                    #         /share/[code], /api/plan/tune
├─ components/       # display only — no business logic
├─ hooks/            # useProfile, useTracker
└─ lib/
   ├─ engine/        # pure functions: scoring, matching, ranking, planning
   ├─ ai/            # server-only client and bounded weekly-note tuning
   ├─ data/          # all content as typed arrays
   ├─ types.ts       # every shared shape
   ├─ schema.ts      # Zod validation + profile versioning
   ├─ storage.ts     # typed localStorage wrapper
   └─ share.ts       # profile ⇄ URL code
tests/               # engine + share round-trip
```

**The rule:** content lives in `lib/data`, logic lives in `lib/engine` as pure functions, components only display. Content can grow without touching logic, and logic is tested without rendering anything.

---

## Running it

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # engine tests
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

Treated as a core requirement, since the audience explicitly includes people who struggle to focus.

- Full keyboard navigation; the quiz answers to number keys and arrow keys
- Focus moves to each new quiz question; progress is announced via `aria-live`
- Visible focus rings, never removed
- `prefers-reduced-motion` disables all animation
- 44px minimum touch targets
- Meaning is never conveyed by color alone — axis positions are stated in text
- Semantic landmarks, skip-to-content link, labeled form controls

---

## Privacy

There is no database, analytics, or telemetry. Your profile and schedule live in `localStorage` and can be deleted in one click from `/about`. Legacy shared-persona URLs encode their data in the URL itself, but the active UI no longer creates them. A weekly note is sent to the configured AI provider only when the student selects **Preview AI changes**. Scholara does not save the raw note, and the model can return only a validated proposal that the student must apply.

---

## Known limitations

- The persona model is a practical framework, not a validated psychometric instrument.
- Campus resources are described generically, since every institution names them differently.
- Clearing browser data clears your profile — the tradeoff of having no accounts.
- Scholara is a study tool, not medical, psychological, or academic advising.

## Future work

- Optional accounts for cross-device sync
- **Stellic / LMS integration** to pull real course data, deadlines, and degree requirements so the plan is built from actual syllabi
- Calendar export (`.ics`) and notification nudges
- Institution-specific resource packs
