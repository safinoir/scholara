"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Circle,
  Compass,
  ExternalLink,
  GraduationCap,
  Layers3,
  Route,
} from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { getCareerTrack, isStepDue } from "@/lib/data/careerTracks";
import { RESOURCE_BY_ID } from "@/lib/data/resources";
import { FIELD_OPTIONS, YEAR_OPTIONS } from "@/lib/data/questions";
import {
  loadCareerPreferences,
  saveCareerPreferences,
  type CareerPreferences,
} from "@/lib/careerPreferences";
import type { CareerStep, Field, YearLevel } from "@/lib/types";
import { LoadingShell } from "@/components/NoProfile";
import {
  Badge,
  ButtonLink,
  Card,
  SectionHeading,
  cn,
  inputClass,
} from "@/components/ui";

const PATH_LENSES = [
  {
    icon: Layers3,
    title: "Use your current courses",
    body: "Notice which work builds skill, holds your interest, and points toward a direction worth testing.",
  },
  {
    icon: Route,
    title: "Check the degree path",
    body: "Connect prerequisites and choices to your program map before registration decisions become urgent.",
  },
  {
    icon: GraduationCap,
    title: "Keep evidence of growth",
    body: "Save projects, feedback, and relationships that can support the next academic or career step.",
  },
] as const;

type StepStatus = "now" | "later" | "explore";

function CareerStepItem({
  step,
  status,
  checked,
  onToggle,
}: {
  step: CareerStep;
  status: StepStatus;
  checked: boolean;
  onToggle: () => void;
}) {
  const resources = step.resourceIds
    .map((id) => RESOURCE_BY_ID[id])
    .filter(Boolean);

  return (
    <li>
      <Card
        className={cn(
          "transition-colors",
          checked && "border-brand-200 bg-brand-50/50",
          status === "later" && "bg-paper",
        )}
      >
        <div className="flex items-start gap-3 sm:gap-4">
          <button
            type="button"
            onClick={onToggle}
            aria-pressed={checked}
            aria-label={`${checked ? "Mark not reviewed" : "Mark reviewed"}: ${step.title}`}
            className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full text-brand-600 transition-colors hover:bg-brand-50"
          >
            {checked ? (
              <CheckCircle2 className="size-6" aria-hidden />
            ) : (
              <Circle className="size-6 text-ink-faint" aria-hidden />
            )}
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold">{step.title}</h3>
              {checked ? (
                <Badge tone="brand">Reviewed</Badge>
              ) : status === "now" ? (
                <Badge tone="brand">Focus now</Badge>
              ) : status === "later" ? (
                <Badge>Later</Badge>
              ) : null}
            </div>

            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              {step.detail}
            </p>

            {resources.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-sm">
                {resources.map((resource) => (
                  <li key={resource.id}>
                    {resource.url ? (
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-1 text-brand-700 underline hover:text-brand-600"
                      >
                        {resource.name}
                        <ExternalLink className="size-3.5" aria-hidden />
                        <span className="sr-only">(opens in a new tab)</span>
                      </a>
                    ) : (
                      <span className="inline-flex min-h-11 items-center text-ink-faint">
                        {resource.name}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Card>
    </li>
  );
}

export function CareerView() {
  const { profile, ready } = useProfile();
  const [preferences, setPreferences] = useState<CareerPreferences>({
    version: 1,
  });
  const [preferencesReady, setPreferencesReady] = useState(false);
  const [reviewed, setReviewed] = useState<Set<string>>(new Set());

  useEffect(() => {
    const hydration = window.setTimeout(() => {
      setPreferences(loadCareerPreferences());
      setPreferencesReady(true);
    }, 0);
    return () => window.clearTimeout(hydration);
  }, []);

  if (!ready || !preferencesReady) return <LoadingShell />;

  const field =
    preferences.field ?? profile?.educationContext?.field ?? "undecided";
  const year = preferences.year ?? profile?.educationContext?.year ?? null;
  const track = getCareerTrack(field);
  const stageLabel = YEAR_OPTIONS.find((option) => option.value === year)?.label;
  const focusSteps = year
    ? track.steps.filter((step) => isStepDue(step, year))
    : track.steps;
  const laterSteps = year
    ? track.steps.filter((step) => !isStepDue(step, year))
    : [];
  const hasPlan = Boolean(profile?.plan?.blocks.length);

  const updatePreferences = (next: Partial<CareerPreferences>) => {
    const updated = { ...preferences, ...next, version: 1 as const };
    setPreferences(updated);
    saveCareerPreferences(updated);
  };

  const toggleReviewed = (id: string) =>
    setReviewed((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:py-14">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <SectionHeading
          as="h1"
          eyebrow="Your degree path"
          title="Connect this semester to what comes next"
          lead="Your weekly plan helps you do the work in front of you. After helps you use that work to make clearer degree decisions, build evidence of your skills, and prepare for the next step."
        />
        {hasPlan && (
          <ButtonLink
            href="/plan"
            variant="secondary"
            className="shrink-0 self-start"
          >
            View weekly plan
            <ArrowRight className="size-4" aria-hidden />
          </ButtonLink>
        )}
      </div>

      <Card className="mt-8 border-brand-100 bg-brand-50">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-brand-600 shadow-sm">
            <Compass className="size-5" aria-hidden />
          </span>
          <div>
            <h2 className="font-semibold">
              Your path is built from work you are already doing
            </h2>
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-ink-soft">
              You do not need a perfect ten-year plan. Use each semester to test
              a direction, learn what fits, and leave yourself better evidence
              for the next decision.
            </p>
          </div>
        </div>

        <ul className="mt-6 grid gap-3 sm:grid-cols-3">
          {PATH_LENSES.map((lens) => (
            <li key={lens.title} className="rounded-xl bg-white/80 p-4">
              <lens.icon className="size-4.5 text-brand-600" aria-hidden />
              <h3 className="mt-3 text-sm font-semibold">{lens.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                {lens.body}
              </p>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="mt-8">
        <div>
          <h2 className="text-lg font-semibold">Shape your path guide</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Choose where you are now. These preferences stay on this device and
            do not change your learning profile or weekly plan.
          </p>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="career-field" className="text-sm font-medium">
              Area you are exploring
            </label>
            <select
              id="career-field"
              className={cn(inputClass, "mt-2")}
              value={field}
              onChange={(event) =>
                updatePreferences({ field: event.target.value as Field })
              }
            >
              {FIELD_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="career-year" className="text-sm font-medium">
              Current stage
            </label>
            <select
              id="career-year"
              className={cn(inputClass, "mt-2")}
              value={year ?? ""}
              onChange={(event) =>
                updatePreferences({ year: event.target.value as YearLevel })
              }
            >
              <option value="" disabled>
                Choose a stage
              </option>
              {YEAR_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {!year && (
              <p className="mt-2 text-sm text-ink-faint">
                Choose a stage to separate useful next actions from later ones.
              </p>
            )}
          </div>
        </div>
      </Card>

      <section className="mt-10" aria-labelledby="path-guide-heading">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">
              Personalized guide
            </p>
            <h2 id="path-guide-heading" className="mt-2 text-2xl font-semibold">
              A path for {track.title}
            </h2>
            <p className="mt-2 text-ink-soft">{track.intro}</p>
          </div>
          {stageLabel && (
            <Badge tone="brand" className="shrink-0 self-start whitespace-nowrap">
              {stageLabel}
            </Badge>
          )}
        </div>

        <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">
              {year ? "Focus for your current stage" : "Explore the full guide"}
            </h2>
            <p className="mt-1 text-sm text-ink-soft">
              {year
                ? "Review what matters now; you do not need to do every item at once."
                : "Nothing is labeled urgent until you choose your current stage."}
            </p>
          </div>
          {year && (
            <p className="text-sm text-ink-faint">
              {focusSteps.length} {focusSteps.length === 1 ? "action" : "actions"} to review
            </p>
          )}
        </div>

        <ol className="mt-5 space-y-4">
          {focusSteps.map((step) => (
            <CareerStepItem
              key={step.id}
              step={step}
              status={year ? "now" : "explore"}
              checked={reviewed.has(step.id)}
              onToggle={() => toggleReviewed(step.id)}
            />
          ))}
        </ol>

        {laterSteps.length > 0 && (
          <details className="group mt-8 rounded-2xl border border-line bg-surface">
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-5 py-3 font-medium [&::-webkit-details-marker]:hidden">
              <span>Keep on your radar</span>
              <span className="flex items-center gap-2 text-sm text-ink-faint">
                {laterSteps.length} later
                <ChevronDown
                  className="size-4 transition-transform group-open:rotate-180"
                  aria-hidden
                />
              </span>
            </summary>
            <ol className="space-y-4 border-t border-line p-4 sm:p-5">
              {laterSteps.map((step) => (
                <CareerStepItem
                  key={step.id}
                  step={step}
                  status="later"
                  checked={reviewed.has(step.id)}
                  onToggle={() => toggleReviewed(step.id)}
                />
              ))}
            </ol>
          </details>
        )}
      </section>

      <p className="mt-10 border-t border-line pt-6 text-sm leading-relaxed text-ink-faint">
        Review marks last only for this visit, so this stays a reference rather
        than another tracker. Scholara helps you prepare questions and next
        actions; confirm degree requirements and course sequencing in your
        institution&apos;s degree audit or with an academic advisor.
      </p>
    </div>
  );
}
