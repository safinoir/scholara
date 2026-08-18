import type { Metadata } from "next";
import Link from "next/link";
import {
  BookOpenCheck,
  CalendarRange,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Clock3,
  Compass,
  GraduationCap,
  Route,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { ArchetypeIcon } from "@/components/ArchetypeIcon";
import { ResetProfileButton } from "@/components/ResetProfileButton";
import { ButtonLink, Card, SectionHeading } from "@/components/ui";
import { ARCHETYPES } from "@/lib/data/archetypes";
import { AXIS_META } from "@/lib/data/axes";

export const metadata: Metadata = {
  title: "About Scholara — how the study planner works",
  description:
    "How Scholara turns study habits, chosen Methods, current courses, and real availability into a realistic plan for degree progress.",
};

const PAGE_LINKS = [
  { href: "#purpose", label: "Purpose" },
  { href: "#journey", label: "Guided journey" },
  { href: "#personalization", label: "Personalization" },
  { href: "#methods", label: "Methods" },
  { href: "#weekly-plan", label: "Weekly plan" },
  { href: "#support", label: "Beyond the plan" },
  { href: "#privacy", label: "Privacy" },
  { href: "#limits", label: "Limits" },
] as const;

const FLOW_STEPS = [
  {
    title: "Discover your working patterns",
    label: "Quiz or Express",
    body: "Use the 13-screen guided quiz or the three-step Express path to describe when, where, and how you tend to work, plus the obstacles you are facing.",
  },
  {
    title: "Understand your starting point",
    label: "Persona",
    body: "See six continuous axes, a primary persona, and a possible blend. The persona is readable shorthand, not a diagnosis or a permanent label.",
  },
  {
    title: "Choose your Methods",
    label: "Select 1–3",
    body: "Review a balanced top five and the full library, then explicitly choose the Methods you want Scholara to use in your study blocks.",
  },
  {
    title: "Build around real courses",
    label: "Weekly Setup",
    body: "Add courses, recurring classes, confirmed study windows, and a weekly target. Scholara never invents availability on your behalf.",
  },
  {
    title: "Use and adjust the week",
    label: "Weekly Plan",
    body: "Work from a course-specific calendar or agenda, review constraints and obstacle responses, then adjust this week without changing the recurring foundation.",
  },
] as const;

const PERSONALIZATION_PRINCIPLES = [
  {
    title: "Evidence guides what to try",
    body: "Every Method keeps the same evidence grade for everyone. Personal fit can change its ranking, not the strength of the underlying research.",
  },
  {
    title: "Your profile shapes delivery",
    body: "Axes, persona fit, reported obstacles, and time pressure influence which credible Methods rise and how they can fit into a week.",
  },
  {
    title: "You make the final choice",
    body: "Recommendations are a shortlist, not an assignment. You choose one to three Methods from the complete library before scheduling begins.",
  },
] as const;

const RANKING_FACTORS = [
  "The Method’s evidence grade",
  "Fit with the six axes and closest persona",
  "Direct matches to obstacles the learner reported",
  "A time-cost penalty when time scarcity is active",
  "A limit of two recommendations from one category",
] as const;

const PLAN_INPUTS = [
  {
    icon: BookOpenCheck,
    title: "Courses and classes",
    body: "Named courses, priorities, asynchronous status, and recurring meeting patterns.",
  },
  {
    icon: Clock3,
    title: "Confirmed study time",
    body: "The specific days and windows the learner is genuinely willing and able to use.",
  },
  {
    icon: CalendarRange,
    title: "A realistic target",
    body: "The amount of available time to commit, with visible capacity, buffer, or shortfall.",
  },
] as const;

const PLAN_GUARDRAILS = [
  "Study blocks stay inside confirmed availability and never overlap classes, temporary busy time, or unavailable days.",
  "The engine uses a 15-minute grid and ignores fragments too short to support a useful study block.",
  "Every non-administration block names a course, duration, Method, and concrete instruction.",
  "Compatible selected Methods are preferred; necessary foundation Methods and unused selections are labeled instead of hidden.",
  "Every active obstacle receives a visible response tied to relevant Methods or blocks.",
  "Capacity limits, deadline compromises, and unallocated target time remain visible.",
  "Invalid or empty updates never replace a valid saved plan.",
] as const;

const SUPPORT_SURFACES = [
  {
    icon: BookOpenCheck,
    title: "Resources",
    href: "/resources",
    body: "A public catalog of free and free-tier tools, practical study guides, and campus services. With a profile, current plan Methods and obstacles shape the ordering and fit labels.",
  },
  {
    icon: CalendarRange,
    title: "Tracker",
    href: "/tracker",
    body: "Up to three rolling seven-day habits drawn first from Methods used in the saved plan, then selected Methods and reported obstacles, with a two-week reflection point.",
  },
  {
    icon: GraduationCap,
    title: "After",
    href: "/career",
    body: "A stage-and-field degree-path guide that connects current courses to requirements, evidence of growth, and later academic or career opportunities.",
  },
] as const;

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:py-14">
      <SectionHeading
        as="h1"
        eyebrow="About Scholara"
        title="Make the work behind your degree manageable"
        lead="Scholara helps college students discover study conditions they can maintain, choose evidence-aware Methods, and turn current courses plus real availability into a realistic weekly plan."
        className="max-w-3xl"
      />

      <Card className="mt-8 overflow-hidden border-brand-100 bg-brand-50">
        <div className="grid gap-7 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">
              Why Scholara exists
            </p>
            <h2 className="mt-2 text-2xl font-semibold">
              Nobody ever taught you how to study.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-ink-soft">
              College asks you to manage faster courses, more independence, and
              less structured time without first helping you build a study
              system that fits how you actually work.
            </p>
          </div>
          <div className="space-y-3 text-sm leading-relaxed text-ink-soft">
            <p>
              A degree map can show which courses count. It cannot make the work
              inside those courses fit a student&rsquo;s attention, responsibilities,
              or actual week.
            </p>
            <p>
              Scholara focuses on that execution layer: understanding how you
              are likely to study consistently, choosing credible approaches,
              and making room for them. It supports an academic path without
              pretending to verify degree requirements or replace an advisor.
            </p>
          </div>
        </div>
      </Card>

      <nav
        aria-label="About Scholara sections"
        className="mt-6 rounded-2xl border border-line bg-surface p-4"
      >
        <p className="px-2 text-xs font-semibold uppercase tracking-[0.12em] text-ink-faint">
          On this page
        </p>
        <ul className="mt-2 grid sm:grid-cols-2 lg:grid-cols-4">
          {PAGE_LINKS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="inline-flex min-h-11 w-full items-center rounded-xl px-2 text-sm font-medium text-brand-700 hover:bg-brand-50 hover:text-brand-600"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <section id="purpose" className="scroll-mt-24 pt-16">
        <SectionHeading
          eyebrow="The problem"
          title="College changes the work, not just the course list"
          lead="The pace is faster, time is less structured, and strategies that were enough in high school may stop working. Generic advice can make a missing system feel like a personal failure."
        />

        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          <Card>
            <h3 className="font-semibold">What students are usually given</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              A syllabus, a degree audit, and broad instructions such as “study
              more” or “review your notes,” often without a way to decide what
              that means for a particular course or week.
            </p>
          </Card>
          <Card className="border-brand-100 bg-brand-50/60">
            <h3 className="font-semibold">What Scholara adds</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              A personal study system: conditions you can maintain, Methods you
              chose for a reason, and a schedule grounded in your courses and
              confirmed time.
            </p>
          </Card>
        </div>
      </section>

      <section id="journey" className="scroll-mt-24 pt-16">
        <SectionHeading
          eyebrow="The guided journey"
          title="From self-discovery to weekly action"
          lead="The flow stays progressive so each page answers one question before asking for the next decision."
        />

        <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {FLOW_STEPS.map((step, index) => (
            <li key={step.title} className="h-full">
              <Card className="h-full !p-5">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-brand-50 text-sm font-semibold text-brand-700">
                    {index + 1}
                  </span>
                  <span className="text-xs font-medium text-ink-faint">
                    {step.label}
                  </span>
                </div>
                <h3 className="mt-4 font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  {step.body}
                </p>
              </Card>
            </li>
          ))}
        </ol>

        <p className="mt-5 text-sm leading-relaxed text-ink-faint">
          Canonical flow: <strong className="text-ink-soft">Quiz or Express</strong>
          {" → "}<strong className="text-ink-soft">Persona</strong>
          {" → "}<strong className="text-ink-soft">Methods</strong>
          {" → "}<strong className="text-ink-soft">Weekly Setup</strong>
          {" → "}<strong className="text-ink-soft">Weekly Plan</strong>.
        </p>
      </section>

      <section id="personalization" className="scroll-mt-24 pt-16">
        <SectionHeading
          eyebrow="Personalized, not boxed in"
          title="Evidence guides what to do. Your preferences shape how."
          lead="Scholara does not sort people into visual, auditory, or kinesthetic learning styles. Those categories have not reliably shown that matching instruction to a stated style improves learning."
          className="max-w-3xl"
        />

        <div className="mt-7 grid gap-4 md:grid-cols-3">
          {PERSONALIZATION_PRINCIPLES.map((principle) => (
            <Card key={principle.title} className="!p-5">
              <ShieldCheck className="size-5 text-brand-600" aria-hidden />
              <h3 className="mt-4 font-semibold">{principle.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                {principle.body}
              </p>
            </Card>
          ))}
        </div>

        <div className="mt-10">
          <h3 className="text-lg font-semibold">The six continuous axes</h3>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-soft">
            These are self-reported planning and adherence factors. They shape
            persona matching and Method ranking; Rhythm, Structure, and Peak
            hours also affect cadence, flexibility, and placement in the plan.
          </p>
          <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {AXIS_META.map((axis) => (
              <div
                key={axis.id}
                className="rounded-2xl border border-line bg-surface p-5"
              >
                <dt className="font-semibold">
                  {axis.label}
                  <span className="mt-1 block text-xs font-medium text-brand-700">
                    {axis.lowLabel} &harr; {axis.highLabel}
                  </span>
                </dt>
                <dd className="mt-3 text-sm leading-relaxed text-ink-soft">
                  {axis.drives}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div id="personas" className="scroll-mt-24 pt-12">
          <h3 className="text-lg font-semibold">The six personas</h3>
          <div className="mt-2 max-w-3xl space-y-3 text-sm leading-relaxed text-ink-soft">
            <p>
              Scholara compares the shape of the six-axis profile with six
              archetypes. A close second match appears as a blend, and the
              learner can choose a different persona without rewriting their
              answers or measured axes.
            </p>
            <p>
              Personas make a nuanced profile easier to read. They are practical
              starting points, not diagnoses, fixed identities, or validated
              psychometric types.
            </p>
          </div>

          <ul className="mt-6 grid gap-4 lg:grid-cols-2">
            {ARCHETYPES.map((archetype) => (
              <li key={archetype.id}>
                <article
                  className="h-full overflow-hidden rounded-2xl border p-5 sm:p-6"
                  style={{
                    borderColor: `${archetype.accent}33`,
                    backgroundColor: `${archetype.accent}0a`,
                  }}
                >
                  <div className="flex items-start gap-3.5">
                    <span
                      className="flex size-11 shrink-0 items-center justify-center rounded-xl text-white"
                      style={{ backgroundColor: archetype.accent }}
                      aria-hidden
                    >
                      <ArchetypeIcon
                        name={archetype.icon}
                        className="size-5.5"
                      />
                    </span>
                    <div>
                      <h4 className="text-lg font-semibold">
                        {archetype.name}
                      </h4>
                      <p className="mt-1 text-sm text-ink-soft">
                        {archetype.tagline}
                      </p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed">
                    {archetype.description}
                  </p>

                  <details className="group mt-4 border-t border-line/70 pt-2">
                    <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium text-brand-700 [&::-webkit-details-marker]:hidden">
                      Strengths and watch-outs
                      <ChevronDown
                        className="size-4 transition-transform group-open:rotate-180"
                        aria-hidden
                      />
                    </summary>
                    <div className="grid gap-5 pb-1 pt-3 sm:grid-cols-2">
                      <div>
                        <h5 className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-faint">
                          What tends to work
                        </h5>
                        <ul className="mt-2 space-y-2">
                          {archetype.strengths.map((item) => (
                            <li
                              key={item}
                              className="flex gap-2 text-sm text-ink-soft"
                            >
                              <span
                                className="mt-1.5 size-1.5 shrink-0 rounded-full"
                                style={{ backgroundColor: archetype.accent }}
                                aria-hidden
                              />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h5 className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-faint">
                          Where it can slip
                        </h5>
                        <ul className="mt-2 space-y-2">
                          {archetype.watchOuts.map((item) => (
                            <li
                              key={item}
                              className="flex gap-2 text-sm text-ink-soft"
                            >
                              <span
                                className="mt-1.5 size-1.5 shrink-0 rounded-full bg-ink-faint"
                                aria-hidden
                              />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </details>
                </article>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="methods" className="scroll-mt-24 pt-16">
        <SectionHeading
          eyebrow="Evidence-aware Methods"
          title="How the recommendation list is built"
          lead="Scholara scores the full Method library, creates a varied top five, and explains why each suggestion fits. The ranking is deterministic for the same profile."
        />

        <div className="mt-7 grid gap-4 lg:grid-cols-[1fr_0.9fr]">
          <Card>
            <h3 className="font-semibold">Signals used in ranking</h3>
            <ol className="mt-4 space-y-3">
              {RANKING_FACTORS.map((factor, index) => (
                <li key={factor} className="flex items-start gap-3 text-sm">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-xs font-semibold text-brand-700">
                    {index + 1}
                  </span>
                  <span className="pt-1 text-ink-soft">{factor}</span>
                </li>
              ))}
            </ol>
          </Card>
          <Card className="border-brand-100 bg-brand-50/60">
            <h3 className="font-semibold">What the evidence labels mean</h3>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              Method cards distinguish <strong>strong</strong>,{" "}
              <strong>moderate</strong>, and <strong>promising</strong> support
              and include a plain-language note. A label summarizes the support
              behind a practice; it does not guarantee that the Method fits
              every learner, course, or assignment.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-ink-soft">
              Scheduling roles also matter. Learning, review, focus, planning,
              and exam Methods are placed only where they make sense rather than
              being forced into every block.
            </p>
          </Card>
        </div>
      </section>

      <section id="weekly-plan" className="scroll-mt-24 pt-16">
        <SectionHeading
          eyebrow="A plan you can inspect"
          title="The deterministic scheduler remains in charge"
          lead="Scholara uses the learner’s saved inputs to build the same plan from the same facts. AI never creates or places calendar blocks."
        />

        <div className="mt-7 grid gap-4 md:grid-cols-3">
          {PLAN_INPUTS.map((input) => (
            <Card key={input.title} className="!p-5">
              <span className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <input.icon className="size-5" aria-hidden />
              </span>
              <h3 className="mt-4 font-semibold">{input.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                {input.body}
              </p>
            </Card>
          ))}
        </div>

        <Card className="mt-4">
          <h3 className="font-semibold">Scheduling guardrails</h3>
          <ul className="mt-4 grid gap-3 lg:grid-cols-2">
            {PLAN_GUARDRAILS.map((guardrail) => (
              <li key={guardrail} className="flex items-start gap-3 text-sm">
                <CheckCircle2
                  className="mt-0.5 size-4 shrink-0 text-brand-600"
                  aria-hidden
                />
                <span className="leading-relaxed text-ink-soft">
                  {guardrail}
                </span>
              </li>
            ))}
          </ul>
        </Card>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Card className="border-brand-100 bg-brand-50/60">
            <div className="flex items-start gap-3">
              <Compass className="mt-0.5 size-5 shrink-0 text-brand-600" aria-hidden />
              <div>
                <h3 className="font-semibold">A saved week has an identity</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  Plans show their real Monday–Sunday range. An older saved week
                  stays viewable but read-only until the learner deliberately
                  starts the current week, which clears temporary exceptions and
                  preserves recurring courses, availability, and Methods.
                </p>
              </div>
            </div>
          </Card>

          <Card className="border-brand-100 bg-brand-50/60">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-0.5 size-5 shrink-0 text-brand-600" aria-hidden />
              <div>
                <h3 className="font-semibold">AI is optional and tuning-only</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  Manual weekly controls are complete on their own. If the
                  learner submits a note of at most 500 characters, AI may
                  propose bounded weekly settings for review. It cannot add
                  classes or availability, select Methods, or return final
                  blocks. Nothing changes until the learner confirms the
                  deterministic rebuild, and failure leaves the saved plan
                  untouched.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section id="support" className="scroll-mt-24 pt-16">
        <SectionHeading
          eyebrow="Support beyond one schedule"
          title="The plan is the center, not the end"
          lead="Three supporting pages help a learner find tools, build consistency, and connect today’s coursework to longer-term degree progress."
        />

        <ul className="mt-7 grid gap-4 md:grid-cols-3">
          {SUPPORT_SURFACES.map((surface) => (
            <li key={surface.title}>
              <Card className="flex h-full flex-col !p-5">
                <span className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <surface.icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-4 font-semibold">{surface.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-soft">
                  {surface.body}
                </p>
                <Link
                  href={surface.href}
                  className="mt-4 inline-flex min-h-11 items-center font-medium text-brand-700 underline hover:text-brand-600"
                >
                  Open {surface.title}
                </Link>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <section id="privacy" className="scroll-mt-24 pt-16">
        <SectionHeading
          eyebrow="Privacy and control"
          title="Local by default, explicit when data leaves"
          lead="Scholara has no account system, application database, analytics pipeline, or cross-device sync."
        />

        <div className="mt-7 grid gap-4 lg:grid-cols-3">
          <Card className="!p-5">
            <ClipboardList className="size-5 text-brand-600" aria-hidden />
            <h3 className="mt-4 font-semibold">Stored in this browser</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              The profile, selected Methods, recurring schedule, weekly plan,
              week settings, quiz and setup drafts, Tracker history, and
              separate After preferences use local storage on this device.
            </p>
          </Card>
          <Card className="!p-5">
            <ShieldCheck className="size-5 text-brand-600" aria-hidden />
            <h3 className="mt-4 font-semibold">Sent only on AI preview</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              The submitted note, represented week and time zone, known course
              IDs and names, and current weekly settings are sent to the
              configured provider only when the learner selects{" "}
              <strong>Preview AI changes</strong>.
            </p>
          </Card>
          <Card className="!p-5">
            <Route className="size-5 text-brand-600" aria-hidden />
            <h3 className="mt-4 font-semibold">Not retained by Scholara</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              Scholara does not save the raw note or reuse it later. The
              configured provider processes the submitted request under its own
              data policies.
            </p>
          </Card>
        </div>

        <Card className="mt-4 border-brand-100 bg-brand-50/60">
          <h3 className="font-semibold">Delete local data</h3>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-soft">
            This removes every Scholara record stored in this browser, including
            drafts and supporting-page preferences. It cannot be undone.
          </p>
          <div className="mt-5">
            <ResetProfileButton />
          </div>
        </Card>
      </section>

      <section id="limits" className="scroll-mt-24 pt-16">
        <Card className="border-line bg-paper">
          <SectionHeading
            eyebrow="Limits, stated plainly"
            title="What Scholara is not"
          />
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            <li className="flex items-start gap-3 text-sm text-ink-soft">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
              It is not a degree audit, registration system, LMS, or replacement
              for academic advising.
            </li>
            <li className="flex items-start gap-3 text-sm text-ink-soft">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
              It is not medical, psychological, accessibility, or crisis advice.
            </li>
            <li className="flex items-start gap-3 text-sm text-ink-soft">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
              The persona model is a practical interface, not a validated
              psychometric instrument.
            </li>
            <li className="flex items-start gap-3 text-sm text-ink-soft">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
              Evidence-aware suggestions cannot guarantee results for every
              learner, course, or assignment.
            </li>
            <li className="flex items-start gap-3 text-sm text-ink-soft">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
              Campus services vary by institution; check the school directory or
              ask the appropriate student-support office.
            </li>
            <li className="flex items-start gap-3 text-sm text-ink-soft">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
              Local-only storage means clearing browser data also clears the
              profile and plan.
            </li>
          </ul>
        </Card>
      </section>

      <Card className="mt-16 border-brand-100 bg-brand-50 text-center">
        <h2 className="text-2xl font-semibold sm:text-3xl">
          Build the study system behind your degree progress
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-ink-soft">
          Start with the guided quiz, use Express if you already know your
          tendencies, or browse the public resource library first.
        </p>
        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <ButtonLink href="/quiz" size="lg">
            Start the quiz
          </ButtonLink>
          <ButtonLink href="/express" variant="secondary" size="lg">
            Use Express setup
          </ButtonLink>
          <Link
            href="/resources"
            className="inline-flex min-h-12 items-center px-4 text-sm font-medium text-brand-700 underline hover:text-brand-600"
          >
            Browse resources
          </Link>
        </div>
      </Card>
    </div>
  );
}
