import type { Metadata } from "next";
import Link from "next/link";
import { ARCHETYPES } from "@/lib/data/archetypes";
import { AXIS_META } from "@/lib/data/axes";
import { TECHNIQUES } from "@/lib/data/techniques";
import { ArchetypeIcon } from "@/components/ArchetypeIcon";
import { ButtonLink, Card, SectionHeading } from "@/components/ui";
import { ResetProfileButton } from "@/components/ResetProfileButton";

export const metadata: Metadata = {
  title: "How Scholara works",
  description:
    "The reasoning behind Scholara: why we reject learning styles, what the six axes measure, and how techniques are chosen.",
};

export default function AboutPage() {
  const strong = TECHNIQUES.filter((t) => t.evidence === "strong");

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 sm:py-16">
      <SectionHeading
        eyebrow="How it works"
        title="What Scholara actually does"
        lead="Short version: research decides which techniques you're shown, and your persona decides how they're delivered."
      />

      <section className="mt-14">
        <h2 className="text-xl font-semibold">
          Why we don&rsquo;t use learning styles
        </h2>
        <div className="mt-4 space-y-4 text-ink-soft">
          <p>
            The most popular idea in study advice is that each person has a
            learning style &mdash; visual, auditory, kinesthetic &mdash; and
            learns better when material is delivered in that style. It&rsquo;s
            intuitive, it&rsquo;s everywhere, and when researchers have tested it
            directly, matching instruction to a stated style has not reliably
            improved outcomes.
          </p>
          <p>
            People do have real preferences. Those preferences just don&rsquo;t
            change which method encodes information into memory best. So building
            a study tool on learning styles means confidently giving students
            worse advice.
          </p>
          <p>
            Scholara keeps the part that&rsquo;s true and throws out the part
            that isn&rsquo;t. Your preferences are treated as{" "}
            <strong className="text-ink">adherence factors</strong>: they predict
            whether you&rsquo;ll still be doing this in three weeks. That&rsquo;s
            a real and important variable. It just isn&rsquo;t the same variable
            as what works.
          </p>
        </div>
      </section>

      <section className="mt-14">
        <h2 className="text-xl font-semibold">The six axes</h2>
        <p className="mt-3 text-ink-soft">
          None of these claim to change how your memory works. Each one changes
          how a plan gets built so you&rsquo;re more likely to follow it.
        </p>
        <dl className="mt-6 space-y-4">
          {AXIS_META.map((meta) => (
            <div
              key={meta.id}
              className="rounded-xl border border-line bg-surface p-5"
            >
              <dt className="font-medium">
                {meta.label}
                <span className="ml-2 text-sm font-normal text-ink-faint">
                  {meta.lowLabel} &harr; {meta.highLabel}
                </span>
              </dt>
              <dd className="mt-1.5 text-sm text-ink-soft">{meta.drives}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-14">
        <h2 className="text-xl font-semibold">How techniques get ranked</h2>
        <div className="mt-4 space-y-4 text-ink-soft">
          <p>
            Every technique in the library carries axis weights, the obstacles it
            addresses, and an evidence grade. Your score for a technique combines
            how well it fits your axes, a substantial bonus for each obstacle you
            reported that it directly targets, a bonus for stronger evidence, and
            a penalty for high time cost if your hours are tight.
          </p>
          <p>
            Then we cap it at two techniques per category. Without that cap, a
            student who checks &ldquo;I forget things&rdquo; gets five variations
            on flashcards and nothing about starting or scheduling.
          </p>
          <p>
            The evidence grades are stated on every card, including when
            they&rsquo;re weak. Techniques marked{" "}
            <em>promising</em> are useful in practice but don&rsquo;t have the
            experimental support that {strong.length} of our techniques do. You
            deserve to know which is which.
          </p>
        </div>
      </section>

      <section className="mt-14">
        <h2 className="text-xl font-semibold">How the schedule is built</h2>
        <div className="mt-4 space-y-4 text-ink-soft">
          <p>
            The generator only ever schedules 85% of the hours you say you have.
            This is the single most important design decision in the app. A full
            calendar breaks the first time life interferes, and a broken plan
            gets abandoned entirely rather than adjusted.
          </p>
          <p>
            Session length comes from your rhythm axis, your hardest material
            goes in your peak window, spaced reviews are placed one, three, and
            seven days out, and the weekly review is never cut. If you tell us
            time is genuinely scarce, you get three sessions instead of a grid.
          </p>
        </div>
      </section>

      <section className="mt-14">
        <h2 className="text-xl font-semibold">The six personas</h2>
        <ul className="mt-6 space-y-3">
          {ARCHETYPES.map((archetype) => (
            <li
              key={archetype.id}
              className="flex items-start gap-4 rounded-xl border border-line bg-surface p-5"
            >
              <span
                className="flex size-10 shrink-0 items-center justify-center rounded-xl text-white"
                style={{ backgroundColor: archetype.accent }}
              >
                <ArchetypeIcon name={archetype.icon} className="size-5" />
              </span>
              <div>
                <p className="font-medium">{archetype.name}</p>
                <p className="mt-1 text-sm text-ink-soft">
                  {archetype.description}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-14">
        <h2 className="text-xl font-semibold">Your data</h2>
        <div className="mt-4 space-y-4 text-ink-soft">
          <p>
            Everything stays in your browser&rsquo;s local storage. There is no
            account, no database, no analytics, and no server that ever sees your
            answers. That also means clearing your browser data clears your
            profile.
          </p>
        </div>
        <div className="mt-6">
          <ResetProfileButton />
        </div>
      </section>

      <Card className="mt-14 border-brand-100 bg-brand-50">
        <h2 className="text-lg font-semibold">Limitations, stated plainly</h2>
        <ul className="mt-3 space-y-2 text-sm text-ink-soft">
          <li>
            Scholara is a study tool. It is not medical, psychological, or
            academic advising.
          </li>
          <li>
            The persona model is a practical framework, not a validated
            psychometric instrument.
          </li>
          <li>
            Campus resources are described generically because every institution
            names them differently. Your advisor can point you to the local
            version.
          </li>
          <li>
            If you&rsquo;re struggling with your mental health, that comes before
            any study plan. Counseling services are free at most schools, and 988
            is available any time in the US.
          </li>
        </ul>
      </Card>

      <div className="mt-12 flex flex-wrap gap-3">
        <ButtonLink href="/quiz" size="lg">
          Take the quiz
        </ButtonLink>
        <Link
          href="/resources"
          className="inline-flex min-h-12 items-center px-4 text-sm text-brand-700 underline hover:text-brand-600"
        >
          Browse the free resources
        </Link>
      </div>
    </div>
  );
}
