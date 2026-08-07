import type { Metadata } from "next";
import Link from "next/link";
import { ARCHETYPE_BY_ID } from "@/lib/data/archetypes";
import { FRICTION_BY_ID } from "@/lib/data/axes";
import { decodeShare } from "@/lib/share";
import { ArchetypeIcon } from "@/components/ArchetypeIcon";
import { AxisBars } from "@/components/results/AxisBars";
import { Badge, ButtonLink, Card } from "@/components/ui";

type Props = { params: Promise<{ code: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  const payload = decodeShare(code);
  if (!payload) return { title: "Shared persona — Scholara" };

  const archetype = ARCHETYPE_BY_ID[payload.primary];
  return {
    title: `${archetype.name} — Scholara`,
    description: `${archetype.tagline}. ${archetype.description}`,
  };
}

export default async function SharePage({ params }: Props) {
  const { code } = await params;
  const payload = decodeShare(code);

  if (!payload) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-20">
        <Card className="text-center">
          <h1 className="text-2xl font-semibold">That link didn&rsquo;t work</h1>
          <p className="mt-3 text-ink-soft">
            The share code looks incomplete. You can still take the quiz yourself
            — it takes about two minutes.
          </p>
          <ButtonLink href="/quiz" size="lg" className="mt-7">
            Take the quiz
          </ButtonLink>
        </Card>
      </div>
    );
  }

  const primary = ARCHETYPE_BY_ID[payload.primary];
  const secondary = ARCHETYPE_BY_ID[payload.secondary];

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 sm:py-16">
      <p className="text-sm text-ink-faint">Someone shared their study persona</p>

      <div
        className="mt-4 rounded-3xl border p-7 sm:p-9"
        style={{
          borderColor: `${primary.accent}33`,
          backgroundColor: `${primary.accent}0a`,
        }}
      >
        <div className="flex items-start gap-5">
          <span
            className="flex size-14 shrink-0 items-center justify-center rounded-2xl text-white"
            style={{ backgroundColor: primary.accent }}
          >
            <ArchetypeIcon name={primary.icon} className="size-7" />
          </span>
          <div>
            <h1 className="text-3xl font-semibold sm:text-4xl">{primary.name}</h1>
            <p className="mt-1 text-lg text-ink-soft">{primary.tagline}</p>
          </div>
        </div>

        <p className="mt-6 max-w-2xl leading-relaxed">{primary.description}</p>

        <p className="mt-5 text-sm text-ink-soft">
          With a secondary lean toward{" "}
          <span className="font-medium text-ink">{secondary.name}</span>.
        </p>
      </div>

      {payload.frictions.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-ink-faint">
            Obstacles they&rsquo;re working around
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {payload.frictions.map((friction) => (
              <Badge key={friction}>{FRICTION_BY_ID[friction].label}</Badge>
            ))}
          </div>
        </div>
      )}

      <Card className="mt-8">
        <h2 className="text-lg font-semibold">Their profile</h2>
        <div className="mt-6">
          <AxisBars axes={payload.axes} />
        </div>
      </Card>

      <Card className="mt-8 border-brand-100 bg-brand-50 text-center">
        <h2 className="text-xl font-semibold">What&rsquo;s your persona?</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-soft">
          Fourteen questions, about two minutes, no account. You&rsquo;ll get
          evidence-based techniques and a weekly plan built around your real
          schedule.
        </p>
        <ButtonLink href="/quiz" size="lg" className="mt-6">
          Take your own quiz
        </ButtonLink>
        <p className="mt-4 text-xs text-ink-faint">
          <Link href="/about" className="underline hover:text-ink">
            How Scholara works
          </Link>
        </p>
      </Card>
    </div>
  );
}
