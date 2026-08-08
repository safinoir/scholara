# Scholara

**scholar + persona** — a study-habit builder that turns who you are into how you should study.

Built for the **Stellic Pathfinders** challenge, in the **Overcoming Obstacles** category.

> The evidence decides *what* you should do. Your persona decides *how* you'll do it — when, for how long, with whom, and in what format.

---

## The problem

Most students are never taught *how* to study. They get generic advice — "review your notes," "use flashcards" — that assumes a student with no job, no anxiety, and forty free hours a week. When that advice fails, students conclude they're the problem.

| Friction | What Scholara does about it |
| --- | --- |
| "I don't know *how* to study" | Diagnoses a learner persona and prescribes 5 techniques with step-by-step instructions |
| "I don't have time" | Builds a weekly plan from the hours you actually have, and never exceeds them |
| "I can't focus / I procrastinate" | Maps each obstacle you name to a specific countermeasure |
| "Good tools cost money" | Every resource is labeled free / free-tier / paid, and paid is hidden by default |
| "I don't have a quiet space" | Routes you to campus accommodations and free study spaces you already pay for |
| "I don't know what comes after" | A free, year-sequenced career track for your field |
| "Advice never sticks" | Habit tracking with forgiving streaks and a 2-week re-assessment prompt |

**No account. No database. No cost.** Your profile and schedule stay in your browser's local storage. Only AI features you explicitly invoke send bounded context to the configured provider.

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
QuizAnswers (14 questions)
  └─▶ scoreAxes()        → 6 axis scores, −100..100
        └─▶ matchArchetype()  → primary + secondary, by cosine similarity
              └─▶ rankTechniques()  → top 5, with category diversity cap
                    └─▶ buildWeeklyPlan()  → day/time blocks
                          └─▶ pickResources()  → fit-sorted, cost-aware
                                └─▶ LearnerProfile → localStorage
```

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

- **Only 85% of your stated hours get scheduled.** This is the single most important decision in the app: a full calendar breaks the first time life interferes, and a broken plan gets abandoned rather than adjusted.
- Session length comes from your rhythm axis; hardest material goes in your peak window.
- Spaced reviews are auto-placed on a 1 / 3 / 7-day cadence.
- **The weekly review is never cut** — it's trimmed out of a deep block instead, and it's sourced from the full technique library so it survives even when it didn't rank in your top five.
- If you report genuine time scarcity, you get a three-session "minimum effective dose" instead of a grid.

---

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router) + TypeScript |
| Styling | Tailwind CSS v4, deep-blue theme via `@theme` |
| State | React Context + `localStorage`, validated with Zod on read |
| Icons | lucide-react |
| Tests | Vitest on the engine (29 tests) |
| AI | Optional, provider-agnostic, fully degradable |

### Project layout

```
src/
├─ app/              # routes: /, /quiz, /express, /results, /plan,
│                    #         /resources, /tracker, /career, /about,
│                    #         /share/[code], /api/coach, /api/plan, /api/ask
├─ components/       # display only — no business logic
├─ hooks/            # useProfile, useTracker
└─ lib/
   ├─ engine/        # pure functions: scoring, matching, ranking, planning
   ├─ ai/            # server-only client, validation, prompts, fallbacks
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

### Optional AI coaching

The results page can generate a coaching note, while the weekly plan adds a personalized brief, block-level guidance, and grounded follow-up answers. AI **never selects techniques or edits the schedule** — the deterministic engine remains the source of truth.

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

There is no database, analytics, or telemetry. Your profile and schedule live in `localStorage` and can be deleted in one click from `/about`. Shared links encode the persona into the URL itself. Optional coaching sends bounded plan context to the configured AI provider. A weekly note is sent only when the student selects **Preview AI changes**, is not saved by Scholara, and can only produce a validated proposal that the student must apply.

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
