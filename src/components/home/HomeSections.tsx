import Link from "next/link";
import {
  BookOpenCheck,
  CalendarRange,
  ClipboardList,
  Clock3,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { ArchetypeIcon } from "@/components/ArchetypeIcon";
import { ButtonLink, Card, SectionHeading } from "@/components/ui";
import { ARCHETYPES } from "@/lib/data/archetypes";
import { AXIS_META } from "@/lib/data/axes";

const STEPS = [
  {
    icon: ClipboardList,
    title: "Answer thirteen questions",
    body: "Not a horoscope. We ask when you focus, how long you last, and what keeps derailing you.",
  },
  {
    icon: BookOpenCheck,
    title: "Meet your persona",
    body: "Six axes place you against six learner archetypes, and you get the study techniques that fit how you actually operate.",
  },
  {
    icon: CalendarRange,
    title: "Get a week you'll keep",
    body: "A real schedule built from your classes, confirmed study windows, and chosen methods — without inventing time.",
  },
] as const;

const OBSTACLES = [
  {
    problem: "“Good study tools cost money.”",
    answer:
      "Every resource is free or has a usable free tier. We also point you toward campus services that may be available at your school.",
  },
  {
    problem: "“I don’t have enough hours.”",
    answer:
      "Tell us the real number. If it’s small, you get a smaller plan built around the sessions that matter most — not a fantasy calendar.",
  },
  {
    problem: "“I can’t focus.”",
    answer:
      "Focus problems get specific countermeasures matched to the obstacle you named, plus a route to the accommodations you may not know you qualify for.",
  },
  {
    problem: "“Advice never sticks.”",
    answer:
      "Pick one or two micro-habits, track them for two weeks, then re-assess. Streaks pause when you miss a day. They don’t die.",
  },
] as const;

const RANKING_SIGNALS = [
  {
    title: "Evidence quality",
    body: "Methods with stronger research support receive a higher starting score.",
  },
  {
    title: "Fit with your profile",
    body: "Your six axes and closest persona raise methods that suit how you work.",
  },
  {
    title: "Obstacles you named",
    body: "A method gets a meaningful boost when it directly addresses your friction points.",
  },
  {
    title: "Time pressure you report",
    body: "If time scarcity gets in your way, shorter methods move higher in your recommendations.",
  },
] as const;

const PLAN_INPUTS = [
  {
    icon: SlidersHorizontal,
    eyebrow: "Your profile",
    title: "Sets the rhythm",
    body: "Your six axes shape cadence and structure, while each obstacle you reported gets a concrete response in the plan.",
  },
  {
    icon: BookOpenCheck,
    eyebrow: "Your methods",
    title: "Shapes each block",
    body: "The methods you selected determine what you do inside learning, review, focus, and planning sessions.",
  },
  {
    icon: Clock3,
    eyebrow: "Your real week",
    title: "Keeps it realistic",
    body: "Classes, confirmed study windows, course priorities, and your target decide when work can actually fit.",
  },
] as const;

function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-20 border-y border-line bg-surface"
    >
      <div className="mx-auto max-w-6xl px-5 py-10 sm:py-12 lg:py-16">
        <SectionHeading
          eyebrow="How it works"
          title="Three steps from profile to plan"
        />
        <ol className="mt-6 grid gap-3 sm:mt-8 sm:gap-4 md:grid-cols-3 lg:mt-10 lg:gap-6">
          {STEPS.map((step, index) => (
            <li key={step.title}>
              <Card className="h-full border-line-soft !p-4 sm:!p-5 lg:!p-6">
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                    <step.icon className="size-4.5" aria-hidden />
                  </span>
                  <span className="text-sm font-medium text-ink-faint">
                    Step {index + 1}
                  </span>
                </div>
                <h3 className="mt-3 text-lg font-semibold">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                  {step.body}
                </p>
              </Card>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function ObstaclesSection() {
  return (
    <section className="border-b border-line bg-paper">
      <div className="mx-auto max-w-6xl px-5 py-16">
        <SectionHeading
          eyebrow="Degree progress"
          title="Plan around what gets in the way"
          lead="Staying on track is not just a discipline problem. Time, money, space, and missing information all shape whether a study plan is realistic."
        />
        <dl className="mt-10 grid gap-6 sm:grid-cols-2">
          {OBSTACLES.map((item) => (
            <div
              key={item.problem}
              className="rounded-2xl border border-line bg-surface p-6"
            >
              <dt className="font-medium">{item.problem}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-ink-soft">
                {item.answer}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function PersonasSection() {
  return (
    <section className="border-b border-line bg-surface">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">
            No traditional learning styles
          </p>
          <h2 className="text-2xl font-semibold sm:text-3xl">
            The six personas
          </h2>
          <p className="mt-4 leading-relaxed text-ink-soft">
            Scholara doesn&rsquo;t label you a visual, auditory, or kinesthetic
            learner. Matching instruction to a preferred learning style has not
            reliably improved learning. Instead, the quiz looks at practical
            preferences that affect whether a study plan fits your life.
          </p>
          <p className="mt-5 text-sm text-ink-faint">
            A persona is a practical starting point, not a diagnosis or a fixed
            identity. Many people are a blend.
          </p>
        </div>

        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {ARCHETYPES.map((archetype) => (
            <li
              key={archetype.id}
              className="rounded-2xl border border-line bg-paper p-4"
            >
              <span
                className="flex size-9 items-center justify-center rounded-xl text-white"
                style={{ backgroundColor: archetype.accent }}
              >
                <ArchetypeIcon name={archetype.icon} className="size-4.5" />
              </span>
              <h3 className="mt-3 font-semibold">{archetype.name}</h3>
              <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                {archetype.tagline}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function AxesSection() {
  return (
    <section className="border-b border-line bg-paper">
      <div className="mx-auto max-w-6xl px-5 py-16">
        <SectionHeading
          eyebrow="The six axes"
          title="What the quiz actually measures"
          lead="Each axis changes a concrete planning choice—not how your memory works."
        />

        <dl className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {AXIS_META.map((axis) => (
            <div
              key={axis.id}
              className="rounded-2xl border border-line bg-surface p-5"
            >
              <dt>
                <span className="font-semibold">{axis.label}</span>
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
    </section>
  );
}

function TechniqueRankingSection() {
  return (
    <section className="border-b border-line bg-surface">
      <div className="mx-auto max-w-6xl px-5 py-16">
        <SectionHeading
          eyebrow="Technique recommendations"
          title="How Scholara suggests your methods"
          lead="The quiz does not lock you into a study system. Scholara scores every method in the library for your situation, then gives you a balanced top five to review."
        />

        <ol className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {RANKING_SIGNALS.map((signal, index) => (
            <li
              key={signal.title}
              className="rounded-2xl border border-line bg-paper p-5"
            >
              <div className="flex items-center gap-3">
                <span className="flex size-8 items-center justify-center rounded-lg bg-brand-50 text-sm font-semibold text-brand-700">
                  {index + 1}
                </span>
                <ShieldCheck className="size-4 text-brand-500" aria-hidden />
              </div>
              <h3 className="mt-4 font-semibold">{signal.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                {signal.body}
              </p>
            </li>
          ))}
        </ol>

        <div className="mt-6 rounded-2xl border border-brand-100 bg-brand-50 p-5 sm:flex sm:items-center sm:justify-between sm:gap-8">
          <p className="max-w-3xl text-sm leading-relaxed text-ink-soft">
            Scholara ranks the full library, limits repeated categories, and
            shows five varied recommendations. They are suggestions, not
            assignments: you choose the one to three methods Scholara can build
            into your weekly study blocks.
          </p>
          <Link
            href="/about"
            className="mt-4 inline-flex min-h-11 shrink-0 items-center font-medium text-brand-700 underline sm:mt-0"
          >
            Read the full methodology
          </Link>
        </div>
      </div>
    </section>
  );
}

function WeeklyPlanSection() {
  return (
    <section className="border-b border-line bg-paper">
      <div className="mx-auto max-w-6xl px-5 py-16">
        <SectionHeading
          eyebrow="A weekly plan"
          title="Your persona and methods become a week you can keep"
          lead="Scholara combines how you work, what you chose, and when you are truly available to build a schedule that feels personal without pretending you have unlimited time."
        />

        <div className="mt-8 grid gap-3 lg:grid-cols-3">
          {PLAN_INPUTS.map((item) => (
            <article
              key={item.eyebrow}
              className="rounded-2xl border border-line bg-surface p-5"
            >
              <span className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <item.icon className="size-5" aria-hidden />
              </span>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-brand-600">
                {item.eyebrow}
              </p>
              <h3 className="mt-1 text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                {item.body}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-4 rounded-2xl border border-brand-100 bg-brand-50 p-6 sm:p-7">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="flex items-start gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white">
                <CalendarRange className="size-5" aria-hidden />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-700">
                  The result
                </p>
                <h3 className="mt-1 text-xl font-semibold">
                  A seven-day schedule designed to survive real life
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  Study blocks stay inside your confirmed windows, use your
                  selected techniques in the right roles, balance course
                  priorities and deadlines, and show you when something cannot
                  fit.
                </p>
              </div>
            </div>

            <div className="border-t border-brand-100 pt-5 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6">
              <div className="flex items-start gap-3">
                <Sparkles
                  className="mt-0.5 size-5 shrink-0 text-brand-600"
                  aria-hidden
                />
                <div>
                  <h3 className="font-semibold">Fine-tune it with AI</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                    Tell Scholara what changed this week. AI proposes adjustments
                    for you to review before the scheduling engine rebuilds the
                    plan within your boundaries.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-20">
      <Card className="border-brand-100 bg-brand-50 text-center">
        <h2 className="text-2xl font-semibold sm:text-3xl">
          Two minutes to meet your persona. Then build a plan you&rsquo;ll keep.
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-ink-soft">
          No signup, no email, no cost. If you don&rsquo;t like the result, you
          can retake it or delete everything in one click.
        </p>
        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <ButtonLink href="/quiz" size="lg">
            Start the quiz
          </ButtonLink>
          <Link
            href="/resources"
            className="inline-flex min-h-12 items-center px-4 text-sm text-brand-700 underline hover:text-brand-600"
          >
            Or just browse the free resources
          </Link>
        </div>
      </Card>
    </section>
  );
}

export function HomeSections() {
  return (
    <>
      <HowItWorksSection />
      <ObstaclesSection />
      <PersonasSection />
      <AxesSection />
      <TechniqueRankingSection />
      <WeeklyPlanSection />
      <FinalCta />
    </>
  );
}
