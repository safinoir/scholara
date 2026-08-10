import Link from "next/link";
import {
  BookOpenCheck,
  CalendarRange,
  ClipboardList,
  Clock3,
  FlaskConical,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { ArchetypeIcon } from "@/components/ArchetypeIcon";
import { Badge, ButtonLink, Card, SectionHeading } from "@/components/ui";
import { ARCHETYPES } from "@/lib/data/archetypes";
import { AXIS_META } from "@/lib/data/axes";

const STEPS = [
  {
    icon: ClipboardList,
    title: "Answer fourteen questions",
    body: "Not a horoscope. We ask when you focus, how long you last, what keeps derailing you, and how many hours you genuinely have.",
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
      "Every resource is labeled free, free-tier, or paid, and paid options are hidden by default. We also point you at the campus services your tuition already covers.",
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
  "Evidence strength",
  "Axis and persona fit",
  "Obstacles it addresses",
  "Time cost for your week",
] as const;

const PLAN_STEPS = [
  {
    icon: CalendarRange,
    title: "Add the fixed parts",
    body: "Courses and recurring class meetings establish when you are already busy.",
  },
  {
    icon: Clock3,
    title: "Set honest boundaries",
    body: "Mark the times you can really study, your weekly target, and which courses need attention.",
  },
  {
    icon: BookOpenCheck,
    title: "Get a usable calendar",
    body: "Your selected methods become study blocks placed only inside those confirmed windows.",
  },
] as const;

function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-20 border-y border-line bg-surface"
    >
      <div className="mx-auto max-w-6xl px-5 py-10 sm:py-12 lg:py-16">
        <SectionHeading eyebrow="How it works" title="Three steps, one sitting" />
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
          eyebrow="Overcoming obstacles"
          title="The friction, and what we do about it"
          lead="Studying badly is rarely a discipline problem. It's usually a money, time, space, or information problem."
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
          <Badge tone="brand" className="mb-4">
            <FlaskConical className="size-3.5" aria-hidden />
            No learning-style labels
          </Badge>
          <h2 className="text-2xl font-semibold sm:text-3xl">
            The six personas
          </h2>
          <p className="mt-4 leading-relaxed text-ink-soft">
            Scholara doesn&rsquo;t label you a visual, auditory, or kinesthetic
            learner. Matching instruction to a preferred learning style has not
            reliably improved learning. Instead, the quiz looks at practical
            preferences that affect whether a study plan fits your life.
          </p>
          <p className="mt-5 rounded-xl border border-brand-100 bg-brand-50 p-5 text-sm leading-relaxed text-ink">
            <strong>Evidence guides what you practice.</strong> Your persona
            shapes how it fits into your week.
          </p>
          <p className="mt-4 text-sm text-ink-faint">
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

        <div className="mt-6 grid overflow-hidden rounded-2xl bg-brand-900 text-white lg:grid-cols-[0.9fr_1.1fr]">
          <div className="p-6 sm:p-7">
            <div className="flex items-center gap-3 text-brand-100">
              <SlidersHorizontal className="size-5" aria-hidden />
              <p className="text-xs font-semibold uppercase tracking-[0.14em]">
                Technique ranking
              </p>
            </div>
            <h3 className="mt-3 text-xl font-semibold">
              How methods reach your top five
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-brand-100">
              Every method is scored for the signals that matter, then repeated
              categories are limited so you don&rsquo;t get five versions of the
              same idea.
            </p>
          </div>
          <div className="border-t border-white/15 bg-white/5 p-6 sm:p-7 lg:border-t-0 lg:border-l">
            <ul className="grid gap-3 text-sm sm:grid-cols-2">
              {RANKING_SIGNALS.map((signal) => (
                <li key={signal} className="flex items-center gap-2.5">
                  <ShieldCheck
                    className="size-4 shrink-0 text-brand-200"
                    aria-hidden
                  />
                  {signal}
                </li>
              ))}
            </ul>
            <p className="mt-5 text-sm text-brand-100">
              You see five personalized matches, then choose one to three for
              your toolkit.{" "}
              <Link href="/about" className="font-medium text-white underline">
                Read the full methodology
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function WeeklyPlanSection() {
  return (
    <section className="border-b border-line bg-surface">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:gap-16">
        <div>
          <SectionHeading
            eyebrow="A weekly plan"
            title="A recommendation only matters if it fits Tuesday"
            lead="Scholara turns the methods you chose into study blocks that respect the calendar you actually have."
          />
          <div className="mt-6 rounded-2xl border border-brand-100 bg-brand-50 p-5">
            <div className="flex items-start gap-3">
              <Sparkles
                className="mt-0.5 size-5 shrink-0 text-brand-600"
                aria-hidden
              />
              <div>
                <h3 className="font-semibold">When the week changes, say so</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  Write something like &ldquo;exam Friday, work shift Thursday,
                  low energy.&rdquo; AI turns it into proposed adjustments for
                  you to review. The scheduling engine—not AI—places every block
                  inside your hard boundaries.
                </p>
              </div>
            </div>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-ink-faint">
            Your profile and schedule stay in this browser. A weekly note is sent
            to the configured AI provider only when you submit it.
          </p>
        </div>

        <ol className="space-y-3">
          {PLAN_STEPS.map((step, index) => (
            <li
              key={step.title}
              className="flex gap-4 rounded-2xl border border-line bg-paper p-5"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <step.icon className="size-5" aria-hidden />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-faint">
                  Plan step {index + 1}
                </p>
                <h3 className="mt-1 font-semibold">{step.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-20">
      <Card className="border-brand-100 bg-brand-50 text-center">
        <h2 className="text-2xl font-semibold sm:text-3xl">
          Two minutes now, a plan you&rsquo;ll actually keep.
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
      <WeeklyPlanSection />
      <FinalCta />
    </>
  );
}
