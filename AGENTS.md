<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Scholara project context

- Read `plan.md` and `onboarding-redesign.md` before product changes. Keep both
  files and `README.md` synchronized with implemented behavior.
- The guided flow is: 13-screen `/quiz` or three-step `/express` -> `/persona`
  -> `/toolkit` (shown to users as **Methods**, choose 1-3) -> `/plan/setup` ->
  `/plan`.
- `/plan/setup` is the two-step recurring editor for courses and meetings, then
  confirmed study windows and target. `/plan` is the single completed
  experience: summary, obstacle responses, embedded seven-day calendar, manual
  and optional AI tuning, and rationale. Do not introduce or document a
  `/plan/calendar` route unless a later approved redesign changes this.
- `LearnerProfile` is version 3, stored in `localStorage`, validated with Zod,
  and migrated from versions 1 and 2 in `src/lib/schema.ts`. There is no database
  or authentication. Preserve migrations and onboarding gates.
- `buildSchedulePlan()` is deterministic and authoritative. It creates
  course-specific blocks only inside confirmed availability, subtracts class or
  busy-time overlap, uses selected or labeled foundation methods, addresses
  every active obstacle, and reports capacity shortfalls and other warnings.
- AI is optional and tuning-only through `POST /api/plan/tune`. It converts an
  explicitly submitted note of at most 500 characters into a bounded,
  reviewable, Zod-validated proposal. It never creates calendar blocks, adds
  availability or classes, selects methods, or bypasses the deterministic
  scheduler. The app must remain complete without an AI key.
- Reusable content belongs in `src/lib/data`, deterministic domain rules in
  `src/lib/engine`, and shared types, schemas, and persistence in `src/lib`.
  Client components may own accessible forms, local-state orchestration, and
  route transitions; keep recommendation and scheduling rules out of UI code.
- Validate proportionally with `npm test`, `npx tsc --noEmit`, `npm run lint`,
  and `npm run build` when warranted. Existing automated coverage is focused on
  units, schemas, migrations, and route behavior; component, end-to-end, and
  accessibility suites are not yet present.
- Preserve the generated Next.js block above verbatim and consult its referenced
  bundled documentation before framework-specific work.
