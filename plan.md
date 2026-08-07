# Scholara — Project Plan

> **Scholara** = *scholar* + *persona*.
> A study-habit builder that turns who you are into how you should study.

**Challenge:** Stellic Pathfinders — *"Create something that helps you navigate your college journey, and what comes after."*
**Category:** Overcoming Obstacles — helping students navigate cost, paperwork, scheduling, requirements, and the friction that gets in the way.

---

## 1. The Problem

Most students are never taught *how* to study. They're handed generic advice ("just review your notes", "use flashcards") that ignores their actual life: a 6pm shift, ADHD, a 4-course load, test anxiety, no quiet room. When that generic advice fails, students conclude they're the problem.

**The friction Scholara removes:**

| Friction | How Scholara addresses it |
| --- | --- |
| "I don't know *how* to study" | Diagnoses a learner persona, prescribes 3–5 concrete techniques with step-by-step instructions |
| "I don't have time" | Generates a weekly plan around the hours the student *actually* has |
| "I can't focus / I procrastinate" | Maps stated friction points to targeted countermeasures, not generic willpower advice |
| "Good tools cost money" | Every recommended resource is free or has a real free tier. Cost is labeled on every card |
| "I don't know what comes after" | A career-readiness track tied to the student's field, sequenced by year |
| "Advice doesn't stick" | Habit tracker with streaks + a 2-week re-assessment loop |

**Cost angle (important for this category):** Scholara itself requires no account, no payment, and no data collection. Every resource in the library is tagged `Free`, `Free tier`, or `Paid`, and the library defaults to filtering out paid options.

---

## 2. What Scholara Is Not

Deciding this now prevents scope creep:

- Not a note-taking app, flashcard app, or calendar app. It routes students *to* those and teaches them how to use them.
- Not a tutoring or homework-help service.
- Not a social network. No accounts, no profiles to browse, no feed.
- Not a "learning styles" quiz in the debunked VARK sense (see §4).

---

## 3. Decisions (locked)

| Area | Decision |
| --- | --- |
| Framework | **Next.js 15 (App Router) + TypeScript** |
| Styling | **Tailwind CSS v4** + a small set of hand-rolled components |
| State | React Context + `localStorage` (one `ScholaraProfile` object) |
| Validation | **Zod** schema on the profile, with a `version` field for migrations |
| Backend | Next.js Route Handlers only. No separate server |
| Database | **None for v1.** All data client-side |
| Auth | **None for v1.** Architected so Supabase auth + a `profiles` table can be dropped in later |
| AI | Rule-based engine is the source of truth. One optional route handler adds a coaching paragraph. App is fully functional with no API key |
| Icons | `lucide-react` |
| Charts | None. A hand-built CSS bar display for the persona axes |
| Deploy | **Vercel**, auto-deploy from `main` |
| Testing | **Vitest** on the scoring engine only. No component tests |
| Package manager | npm |

**Why no database:** it removes auth, privacy review, migrations, env secrets, and cold-start bugs from a one-week build — while making a genuine product claim ("we never collect your data"). Sharing still works via URL encoding (§7.8).

---

## 4. Scientific Framing (a differentiator — do not skip)

The VARK "learning styles" model (visual / auditory / kinesthetic) has been repeatedly tested and does **not** improve outcomes when instruction is matched to a stated style. Building the app on it would be a factual weak point a judge could poke.

So Scholara splits the model in two:

1. **Persona axes = *adherence* factors.** Things that genuinely predict whether a student will *stick with* a routine: their schedule, energy, need for structure, social fuel, motivation source, and tolerance for long focus blocks.
2. **Techniques = *evidence-based* methods.** Every recommended technique comes from cognitive-science literature with strong support: retrieval practice, spaced repetition, interleaving, elaboration, self-explanation, distributed practice.

> **The core thesis:** *The technique is chosen by the evidence. The persona chooses the delivery — when, how long, with whom, and in what format.*

Every technique card carries an `evidence` line stating support strength. This is what turns Scholara from a BuzzFeed quiz into a tool.

---

## 5. The Persona Model

### 5.1 Six axes (each scored −100 to +100)

| Axis | Low pole (−100) | High pole (+100) | What it drives |
| --- | --- | --- | --- |
| `rhythm` | **Sprinter** — short bursts | **Marathoner** — long deep blocks | Session length, break cadence |
| `structure` | **Improviser** — flexible | **Architect** — planned | How rigid the weekly plan is |
| `social` | **Solo** | **Collaborative** | Group study, body doubling, accountability partners |
| `input` | **Verbal** — text/talk | **Spatial** — diagrams/maps | Note format, technique presentation |
| `drive` | **Pressure** — deadline-fueled | **Curiosity** — interest-fueled | Framing, artificial deadlines vs. exploration |
| `clock` | **Early bird** | **Night owl** | Which hours get the hardest material |

### 5.2 Friction points (multi-select, not an axis)

Independent of persona. These directly unlock targeted countermeasures.

`procrastination` · `distraction` · `retention` · `test-anxiety` · `overwhelm` · `time-scarcity` · `no-quiet-space` · `motivation` · `reading-load` · `math-heavy`

### 5.3 Context (from the intake form)

`year` (HS senior → grad) · `fieldOfStudy` · `courseLoad` · `hoursAvailablePerWeek` · `worksOrCaregives` · `toolsAlreadyUsed`

### 5.4 Archetypes (six)

Each archetype is a fixed vector across the six axes. The user's vector is matched by **cosine similarity**; nearest archetype wins, second-nearest is shown as a "secondary blend."

| Archetype | Signature | One-line identity |
| --- | --- | --- |
| **The Architect** | +structure, +rhythm, −social | Builds the system, then trusts it |
| **The Sprinter** | −rhythm, −structure, drive=pressure | Fast, intense, allergic to long sessions |
| **The Connector** | +social, input=verbal, +drive | Learns by talking it through |
| **The Cartographer** | input=spatial, +rhythm | Needs to see how it all connects |
| **The Explorer** | drive=curiosity, −structure | Follows interest, resists rigid plans |
| **The Anchor** | +structure, −rhythm, routine-dependent | Steady and consistent; thrown off by chaos |

Each archetype ships with: name, tagline, 2-sentence description, strengths, watch-outs, an accent color, and a `lucide` icon.

**Guardrail:** the archetype is presented as a *starting point*, never a fixed identity. Copy says "This is where you're starting from," and re-assessment is one click away.

---

## 6. The Recommendation Engine (the heart of the app)

Pure functions in `lib/engine/`. No React, no network — trivially unit-testable.

### 6.1 Pipeline

```
QuizAnswers
  └─▶ scoreAxes()        → AxisScores  (6 numbers, −100..100)
        └─▶ matchArchetype()  → { primary, secondary, confidence }
              └─▶ rankTechniques()  → ScoredTechnique[]  (top 5)
                    └─▶ buildWeeklyPlan()  → WeekPlan
                          └─▶ pickResources()  → Resource[]
                                └─▶ pickCareerTrack()  → CareerTrack
                                      └─▶ LearnerProfile   ← saved to localStorage
```

### 6.2 Technique scoring

```
score(technique, profile) =
    Σ over axes:     technique.axisWeights[axis] * (profile.axes[axis] / 100)
  + Σ over friction: technique.fixes.includes(f) ? FRICTION_BONUS : 0
  + technique.archetypeBoost[profile.primaryArchetype] ?? 0
  - technique.timeCostPenalty * timeScarcityFactor(profile)
```

Then: take the top 5, but enforce **category diversity** — max 2 from the same category, so nobody gets five flavors of flashcards.

Each technique card renders: name · why-you-got-it (generated from the top contributing factors) · 3–5 step how-to · time cost · evidence strength · a free tool that supports it.

### 6.3 Technique library (~15 entries)

**Encoding & retention:** Retrieval Practice · Spaced Repetition · Interleaving · Elaborative Interrogation · Feynman Technique · Dual Coding / Mind Mapping · Cornell Notes
**Focus & initiation:** Pomodoro (25/5) · 90-Minute Deep Block · 5-Minute Rule · Body Doubling · Implementation Intentions ("if X then Y")
**Planning & load:** Time Blocking · Eisenhower Matrix · Weekly Review · Backwards Planning from due dates
**Exam & anxiety:** Practice Testing Under Conditions · Brain Dump · Error Log

Each entry is typed:

```ts
type Technique = {
  id: string
  name: string
  category: 'encoding' | 'focus' | 'planning' | 'exam'
  blurb: string
  steps: string[]
  timeCost: 'low' | 'medium' | 'high'
  evidence: 'strong' | 'moderate' | 'promising'
  evidenceNote: string
  axisWeights: Partial<Record<Axis, number>>
  fixes: Friction[]
  archetypeBoost?: Partial<Record<ArchetypeId, number>>
  toolIds: string[]
}
```

### 6.4 Weekly plan generator

**Inputs:** `hoursAvailablePerWeek`, `courseLoad`, `clock`, `rhythm`, `structure`, top techniques.

**Rules:**
- Session length from `rhythm`: Sprinter → 25 min; mid → 45 min; Marathoner → 90 min.
- Hardest material lands in the user's peak window from `clock`.
- Total scheduled time ≤ 85% of stated availability. **Deliberately under-schedule** — over-scheduling is why plans get abandoned.
- Low `structure` → output 3 flexible "anchor blocks" + a menu, not a rigid grid.
- One weekly review block, always.
- Spaced-repetition reviews auto-placed on days 1 / 3 / 7 after each new-material block.
- If `time-scarcity` is a friction point → the plan is capped at 3 blocks and labeled "Minimum Effective Dose."

**Output:** a 7-day × time-slot grid. Each block: `{ day, start, minutes, label, techniqueId, intensity }`. Rendered as a responsive grid (stacked list on mobile), plus a plain-text copy button and a print view.

---

## 7. Features & Pages

### 7.0 Priority tiers

Given the one-week timeline, build strictly in this order. **P0 is the demo.** Nothing in P1 starts until every P0 item works end to end.

| Tier | Scope |
| --- | --- |
| **P0 — must ship** | Landing · Quiz · Persona result · Top techniques · Weekly plan · Resource library · localStorage persistence · Mobile responsive · Deployed |
| **P1 — high value** | Habit tracker with streaks · Career track · Shareable link · Print/PDF export |
| **P2 — if time remains** | AI coach paragraph · Re-assessment diff view · Onboarding tour |
| **P3 — README "future work"** | Accounts, Stellic/LMS integration, notification nudges, cohort insights |

### 7.1 `/` — Landing
Hero with the thesis line. Three-step "how it works." A 60-second promise ("takes 2 minutes, no signup, nothing stored on a server"). Primary CTA → `/quiz`. If a saved profile exists, show "Welcome back → your plan."

### 7.2 `/quiz` — The intake

- **One question per screen.** Large tap targets, progress bar, keyboard nav (`1–5`, arrows, Enter), Back always available.
- **12–14 questions total**, targeting ~2 minutes.
  - 12 forced-choice / Likert items → the six axes (2 per axis, +1 tiebreaker)
  - 1 multi-select → friction points
  - 1 short form → context (year, field, hours/week, works-or-caregives)
- Answers persist to `localStorage` on every step, so a refresh doesn't lose progress.
- "Skip the quiz, I know my habits" link → a single-page express form that sets axes from direct self-report (this is the old "Path B", collapsed into one screen rather than a second engine).
- Motion respects `prefers-reduced-motion`.

### 7.3 `/results` — The persona reveal

Reveal animation → archetype card (icon, name, tagline, accent color). Axis visualization: six horizontal bars with pole labels. "You also lean *Secondary*" blend line. Then top 5 technique cards, each expandable to its how-to. Sticky footer CTA → "Build my week."

### 7.4 `/plan` — Weekly plan
The grid. Toggle: Structured ↔ Flexible view. Copy-as-text. Print → PDF via a print stylesheet. "Regenerate with different hours" control.

### 7.5 `/resources` — Curated library

~35 resources, each tagged with `cost` (`free` | `free-tier` | `paid`), `category`, `axisFit`, `frictionFit`, `fieldFit`.
- Default filter hides `paid`. Cost badge on every card.
- Auto-sorted by fit to the user's profile; a "Show everything" toggle reveals the rest.
- Categories: Note-taking · Flashcards & recall · Scheduling · Focus & blocking · Subject help · Writing & citation · Accessibility & accommodations · Money & basic needs · Mental health.
- **Include a "Campus resources you're already paying for" section** — tutoring center, writing center, office hours, disability/accessibility services, library databases, career center. This is the highest-ROI, lowest-cost advice in the whole app and it fits the category perfectly.

### 7.6 `/tracker` — Habit tracker *(P1)*
Pick 1–3 micro-habits from the plan. 7-day check-off grid. Current + longest streak. Encouraging, non-punitive copy on a miss (streak "pauses," never "dies"). After 14 days → "Ready to re-assess?"

### 7.7 `/career` — What comes after *(P1)*
Field-based track (STEM · Health · Business · Humanities · Arts · Undecided) × year. Sequenced checklist: résumé → LinkedIn → office-hours relationships → first internship → interview prep (STAR) → portfolio. Free resources only. Ties the study habit to the outcome: "the habit that gets you the GPA is the habit that gets you the offer."

### 7.8 `/share/[code]` *(P1)*
The profile is compressed → base64url → URL. Renders a read-only persona card with a "Take your own quiz" CTA. No server, no database. Also serves as dynamic OG-image content if time allows.

### 7.9 `/api/coach` *(P2)*
POST profile summary → short, specific coaching paragraph. Provider-agnostic (OpenAI-compatible `baseURL`, so NaviGator or any compatible endpoint drops in). **Rules:** key is server-side only and never in client code; no free-text PII sent; strict timeout; if the key is absent or the call fails, the UI silently falls back to pre-written copy. The AI never selects techniques — it only re-words the rationale.

---

## 8. Design Direction

The audience includes people who struggle to focus. **Design is a feature, not decoration.**

- **Calm, low-clutter.** One primary action per screen. Generous whitespace.
- **Palette:** warm off-white base, deep ink text, one indigo/violet primary, per-archetype accent. Dark mode if it's cheap (Tailwind `dark:`), skipped otherwise.
- **Type:** one geometric sans (Inter or Geist) at 2–3 sizes only.
- **Accessibility, non-negotiable:** WCAG AA contrast · full keyboard nav · visible focus rings · semantic landmarks · `aria-live` on quiz progress · `prefers-reduced-motion` honored · 44px minimum touch targets · never color-only meaning.
- **Mobile-first.** Judges will open it on a phone.
- **Copy voice:** direct, warm, never condescending. No shame language. No "just do it." Second person. Short sentences.

---

## 9. Repository Structure

```
scholara/
├─ app/
│  ├─ layout.tsx
│  ├─ page.tsx                  # landing
│  ├─ quiz/page.tsx
│  ├─ results/page.tsx
│  ├─ plan/page.tsx
│  ├─ resources/page.tsx
│  ├─ tracker/page.tsx          # P1
│  ├─ career/page.tsx           # P1
│  ├─ share/[code]/page.tsx     # P1
│  ├─ api/coach/route.ts        # P2
│  └─ globals.css
├─ components/
│  ├─ ui/                       # Button, Card, Badge, Progress, Toggle
│  ├─ quiz/                     # QuestionCard, ProgressBar, LikertScale
│  ├─ results/                  # ArchetypeCard, AxisBars, TechniqueCard
│  ├─ plan/                     # WeekGrid, BlockCard
│  └─ resources/                # ResourceCard, FilterBar
├─ lib/
│  ├─ engine/
│  │  ├─ scoreAxes.ts
│  │  ├─ matchArchetype.ts
│  │  ├─ rankTechniques.ts
│  │  ├─ buildWeeklyPlan.ts
│  │  ├─ pickResources.ts
│  │  └─ index.ts               # single generateProfile() entry point
│  ├─ data/
│  │  ├─ questions.ts
│  │  ├─ archetypes.ts
│  │  ├─ techniques.ts
│  │  ├─ resources.ts
│  │  ├─ habits.ts
│  │  └─ careerTracks.ts
│  ├─ types.ts                  # Axis, Friction, Technique, LearnerProfile
│  ├─ schema.ts                 # Zod + profile version/migration
│  ├─ storage.ts                # typed localStorage wrapper
│  └─ share.ts                  # encode/decode profile ⇄ URL code
├─ hooks/
│  ├─ useProfile.ts
│  └─ useTracker.ts
├─ tests/engine.test.ts
├─ plan.md
└─ README.md
```

**Rule of thumb:** all content lives in `lib/data/` as typed arrays. All logic lives in `lib/engine/` as pure functions. Components only display. This means content can be expanded without touching logic, and logic can be tested without rendering anything.

---

## 10. Build Schedule (7 days)

### Day 0 — Foundation
- [ ] `create-next-app` (TS, Tailwind, App Router, ESLint); push to GitHub
- [ ] Deploy to Vercel immediately, so deployment is never a last-day risk
- [ ] `lib/types.ts` + `lib/schema.ts` + `lib/storage.ts` + `useProfile`
- [ ] Base UI primitives + global styles + fonts

### Day 1 — Content & engine
- [ ] Write all 14 questions with axis weights (`questions.ts`)
- [ ] Write 6 archetypes with vectors (`archetypes.ts`)
- [ ] Write 15 techniques, fully tagged (`techniques.ts`) ← the biggest writing task
- [ ] `scoreAxes` + `matchArchetype` + `rankTechniques`
- [ ] Vitest: axis math, archetype boundaries, diversity cap, all-neutral edge case

### Day 2 — Quiz + results
- [ ] Quiz flow: one-per-screen, progress, back, keyboard, resume-on-refresh
- [ ] Express-intake alternate form
- [ ] `/results`: archetype card, axis bars, technique cards

### Day 3 — Plan + resources
- [ ] `buildWeeklyPlan` + Vitest coverage
- [ ] Week grid UI, flexible/structured toggle, copy-as-text
- [ ] Write ~35 resources incl. campus resources; filter + fit sort

### Day 4 — P1 features
- [ ] Habit tracker + streaks (`useTracker`)
- [ ] Career tracks
- [ ] Share link encode/decode + `/share/[code]`
- [ ] Print stylesheet → PDF

### Day 5 — Polish
- [ ] Mobile pass on every page
- [ ] Accessibility pass: keyboard-only run-through, contrast check, axe scan
- [ ] Empty/error/reset states; "start over" flow
- [ ] Copy editing pass — tighten every sentence
- [ ] Optional: `/api/coach` if and only if everything above is done

### Day 6 — Ship
- [ ] Test on a real phone
- [ ] Fresh-browser walkthrough; watch someone else use it silently
- [ ] README: problem, category fit, thesis, screenshots, run instructions, evidence citations, future work
- [ ] Demo script + recorded walkthrough
- [ ] Final deploy; verify prod build

**Every day ends with a commit and a green Vercel deploy.**

---

## 11. Definition of Done (v1)

1. A first-time visitor can go landing → quiz → persona → plan in under 3 minutes with zero instructions.
2. The plan reflects the actual hours they entered and never exceeds them.
3. Every technique shown states *why they got it* and *how to do it*.
4. Every resource shows its cost. Paid options are hidden by default.
5. Refreshing or closing the tab loses nothing.
6. Fully usable on a phone, keyboard-only, and at AA contrast.
7. Works with no API key, no account, and no network calls after load.
8. The engine has passing unit tests.
9. Live on a public URL.

---

## 12. Risks

| Risk | Mitigation |
| --- | --- |
| Content writing (15 techniques × 5 steps, 35 resources) is the real bottleneck | Day 1 is dedicated to it. Ship a thinner library rather than fewer features |
| Feature creep across 6 selected features | Hard P0/P1/P2 tiers in §7.0. P0 works end-to-end before anything else begins |
| Quiz feels like a horoscope | Evidence line on every technique; visible rationale; §4 framing in the README |
| Weekly plan generator is the trickiest logic | Build it behind unit tests before building its UI |
| Deploy problems on the last day | Deploy on Day 0 and every day after |
| AI layer breaks the demo | It's P2, server-side, timeout-guarded, and silently falls back |
| Beginner + TypeScript friction | All types defined Day 0 in one file; pure functions over clever abstractions; no premature generics |

---

## 13. Judging Alignment

| What judges look for | Scholara's answer |
| --- | --- |
| Fits "Overcoming Obstacles" | Directly attacks cost, scheduling, focus, and paperwork friction (§1 table) |
| Real problem, real users | Study skills are the #1 unaddressed gap for first-gen and working students |
| Depth, not a toy | Six-axis model, evidence-graded technique library, constraint-aware scheduler |
| Intellectual honesty | Explicitly rejects the debunked learning-styles model and explains why (§4) |
| Craft | Accessibility and calm design treated as core requirements |
| Trust | No account, no server-side data, no paywall |
| Path forward | Clear roadmap incl. Stellic/LMS integration for real course data |

---

## 14. Open Questions

1. **AI provider** — is a NaviGator API key available, or should the coach route target OpenAI-compatible endpoints generically?
2. **Institution** — should campus resources be generic ("your school's writing center") or hard-coded for one specific university for the demo?
3. **Submission requirements** — is there a required demo video length, deck, or write-up format to reserve time for?

---

*Last updated: 2026-08-06 · Status: planning complete, awaiting go-ahead to build*
