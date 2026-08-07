import Link from "next/link";
import {
  BookOpenCheck,
  CalendarRange,
  ClipboardList,
  FlaskConical,
  Quote,
} from "lucide-react";
import { HomeHero } from "@/components/home/HomeHero";
import { ARCHETYPES } from "@/lib/data/archetypes";
import { Badge, ButtonLink, Card, SectionHeading } from "@/components/ui";

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
    body: "A real schedule built from your available hours and peak focus window \u2014 deliberately under-filled, so it survives a bad week.",
  },
];

const OBSTACLES = [
  {
    problem: "\u201cGood study tools cost money.\u201d",
    answer:
      "Every resource is labeled free, free-tier, or paid, and paid options are hidden by default. We also point you at the campus services your tuition already covers.",
  },
  {
    problem: "\u201cI don\u2019t have enough hours.\u201d",
    answer:
      "Tell us the real number. If it\u2019s small, you get a minimum effective dose \u2014 three sessions that matter \u2014 instead of a fantasy calendar.",
  },
  {
    problem: "\u201cI can\u2019t focus.\u201d",
    answer:
      "Focus problems get specific countermeasures matched to the obstacle you named, plus a route to the accommodations you may not know you qualify for.",
  },
  {
    problem: "\u201cAdvice never sticks.\u201d",
    answer:
      "Pick one or two micro-habits, track them for two weeks, then re-assess. Streaks pause when you miss a day. They don\u2019t die.",
  },
];

export default function Home() {
  return (
    <>
      <HomeHero />

      <section className="border-y border-line bg-surface">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <SectionHeading eyebrow="How it works" title="Three steps, one sitting" />
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step.title}>
                <Card className="h-full border-line-soft">
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                      <step.icon className="size-4.5" aria-hidden />
                    </span>
                    <span className="text-sm font-medium text-ink-faint">
                      Step {index + 1}
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                    {step.body}
                  </p>
                </Card>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <div>
            <Badge tone="brand" className="mb-4">
              <FlaskConical className="size-3.5" aria-hidden />
              Why this isn&rsquo;t a personality test
            </Badge>
            <h2 className="text-2xl font-semibold sm:text-3xl">
              We don&rsquo;t believe in learning styles. We use personality
              anyway &mdash; for a different job.
            </h2>
            <div className="mt-5 space-y-4 text-ink-soft">
              <p>
                The idea that you&rsquo;re a &ldquo;visual learner&rdquo; who
                learns better from pictures has been tested repeatedly, and
                matching instruction to a stated style doesn&rsquo;t improve
                results. Any tool built on that premise is built on sand.
              </p>
              <p>
                So Scholara splits the problem in two. Which techniques you get
                is decided by evidence &mdash; retrieval practice, spaced
                repetition, interleaving. Every technique card tells you how
                strong that evidence is.
              </p>
              <p className="rounded-xl border border-brand-100 bg-brand-50 p-5 text-ink">
                <Quote className="mb-2 size-4 text-brand-500" aria-hidden />
                The evidence decides <strong>what</strong> you should do. Your
                persona decides <strong>how</strong> you&rsquo;ll do it &mdash;
                when, for how long, with whom, and in what format.
              </p>
              <p>
                That second half matters more than it sounds. A perfect technique
                you abandon in four days is worth nothing.
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-ink-faint">
              The six personas
            </h3>
            <ul className="mt-5 space-y-3">
              {ARCHETYPES.map((archetype) => (
                <li
                  key={archetype.id}
                  className="flex items-start gap-4 rounded-xl border border-line bg-surface p-4"
                >
                  <span
                    className="mt-1.5 size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: archetype.accent }}
                    aria-hidden
                  />
                  <div>
                    <p className="font-medium">{archetype.name}</p>
                    <p className="text-sm text-ink-soft">{archetype.tagline}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="border-t border-line bg-surface">
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
                className="rounded-2xl border border-line bg-paper p-6"
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
    </>
  );
}
