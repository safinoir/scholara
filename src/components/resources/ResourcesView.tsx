"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  ExternalLink,
  GraduationCap,
  Info,
  Sparkles,
} from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { FRICTION_BY_ID } from "@/lib/data/axes";
import {
  CATEGORY_LABELS,
  COST_LABELS,
  RESOURCES,
  RESOURCE_CATALOG_REVIEWED,
} from "@/lib/data/resources";
import { TECHNIQUE_BY_ID } from "@/lib/data/techniques";
import { sortResourcesByFit } from "@/lib/engine";
import {
  resourceFitForProfile,
  resourcePersonalizationForProfile,
  resourceRankingInputForProfile,
  type ResourceFit,
} from "@/lib/resources";
import type { Resource, ResourceCategory } from "@/lib/types";
import {
  Badge,
  ButtonLink,
  Card,
  SectionHeading,
  cn,
} from "@/components/ui";

const COST_TONE = {
  free: "free",
  "free-tier": "tier",
  paid: "paid",
} as const;

function fitLabel(fit: ResourceFit | null): string | null {
  if (!fit) return null;

  if (fit.techniqueId) {
    const techniqueName = TECHNIQUE_BY_ID[fit.techniqueId]?.name;
    if (techniqueName) {
      if (fit.methodSource === "plan") {
        return `In your plan · ${techniqueName}`;
      }
      if (fit.methodSource === "selected") {
        return `Supports ${techniqueName}`;
      }
      return `Fits ${techniqueName}`;
    }
  }

  const firstObstacle = fit.obstacleMatches[0];
  if (firstObstacle) {
    return `Helps with ${FRICTION_BY_ID[firstObstacle].label.toLowerCase()}`;
  }
  if (fit.fieldMatch) return "Relevant to your field";
  return null;
}

function ResourceCard({
  resource,
  fit,
}: {
  resource: Resource;
  fit: ResourceFit | null;
}) {
  const matchLabel = fitLabel(fit);

  return (
    <li className="flex flex-col rounded-2xl border border-line bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold">{resource.name}</h3>
        <Badge
          tone={resource.campus ? "free" : COST_TONE[resource.cost]}
          className="shrink-0 whitespace-nowrap"
        >
          {resource.campus ? "Campus service" : COST_LABELS[resource.cost]}
        </Badge>
      </div>

      <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-soft">
        {resource.blurb}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Badge>{CATEGORY_LABELS[resource.category]}</Badge>
        {matchLabel && <Badge tone="brand">{matchLabel}</Badge>}
      </div>

      {resource.url && (
        <a
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex min-h-11 w-fit items-center gap-2 rounded-xl font-medium text-brand-700 transition-colors hover:bg-brand-50 hover:text-brand-600"
        >
          <span aria-hidden>Open resource</span>
          <ExternalLink className="size-4 shrink-0" aria-hidden />
          <span className="sr-only">
            Open {resource.name} (opens in a new tab)
          </span>
        </a>
      )}
    </li>
  );
}

export function ResourcesView() {
  const { profile, ready } = useProfile();
  const [category, setCategory] = useState<ResourceCategory | "all">("all");

  const personalization = useMemo(
    () => (profile ? resourcePersonalizationForProfile(profile) : null),
    [profile],
  );

  const personalizationSummary = personalization
    ? personalization.planTechniqueIds.length > 0
      ? "This library is ordered using Methods in your saved plan, the Methods you selected, and the obstacles you reported."
      : personalization.selectedTechniqueIds.length > 0
        ? "This library is ordered using the Methods you selected and the obstacles you reported."
        : "This library is ordered using your recommended Methods and the obstacles you reported. Choose Methods to make these matches more specific."
    : null;

  const sorted = useMemo(
    () =>
      profile
        ? sortResourcesByFit(resourceRankingInputForProfile(profile))
        : RESOURCES,
    [profile],
  );

  const campus = sorted.filter((resource) => resource.campus);
  const rest = sorted.filter((resource) => !resource.campus);
  const visible = rest.filter(
    (resource) => category === "all" || resource.category === category,
  );

  const presentCategories = new Set(
    rest.map((resource) => resource.category),
  );
  const categories = (
    Object.keys(CATEGORY_LABELS) as ResourceCategory[]
  ).filter((resourceCategory) => presentCategories.has(resourceCategory));

  const fitFor = (resource: Resource) =>
    profile && personalization
      ? resourceFitForProfile(resource, profile, personalization)
      : null;

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:py-14">
      <SectionHeading
        as="h1"
        eyebrow="Resources"
        title="Study support that fits your situation"
        lead="Browse free and free-tier tools, practical study guides, and campus services. With a profile, Scholara puts support for your current Methods and obstacles first."
      />

      {ready && !profile && (
        <div className="mt-7 flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex max-w-2xl items-start gap-2.5 text-sm text-ink-soft">
            <Info className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden />
            Take the quiz and choose your Methods to reorder this library around
            your study approach and reported obstacles.
          </p>
          <ButtonLink href="/quiz" variant="secondary" size="sm" className="shrink-0">
            Personalize the library
            <ArrowRight className="size-4" aria-hidden />
          </ButtonLink>
        </div>
      )}

      {ready && profile && (
        <p className="mt-7 flex max-w-3xl items-start gap-2.5 rounded-2xl border border-brand-100 bg-brand-50 p-5 text-sm text-ink-soft">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden />
          {personalizationSummary}
        </p>
      )}

      <section className="mt-12" aria-labelledby="campus-resources-heading">
        <div className="flex items-start gap-3">
          <GraduationCap
            className="mt-1 size-5 shrink-0 text-brand-600"
            aria-hidden
          />
          <div>
            <h2 id="campus-resources-heading" className="text-xl font-semibold">
              Start with your campus
            </h2>
            <p className="mt-1.5 max-w-2xl text-sm text-ink-soft">
              Many colleges include these services or offer them at no additional
              cost. Names, eligibility, and availability vary, so search your
              school site or ask student services where to begin.
            </p>
          </div>
        </div>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {campus.map((resource) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              fit={fitFor(resource)}
            />
          ))}
        </ul>
      </section>

      <section className="mt-16" aria-labelledby="resource-library-heading">
        <h2 id="resource-library-heading" className="text-xl font-semibold">
          Tools, guides, and open materials
        </h2>
        <p className="mt-1.5 max-w-2xl text-sm text-ink-soft">
          Browse the whole catalog or narrow it to what you need right now.
        </p>

        <div className="-mx-5 mt-5 overflow-x-auto px-5 pb-2 sm:mx-0 sm:px-0">
          <div
            className="flex w-max gap-2 sm:w-auto sm:flex-wrap"
            role="group"
            aria-label="Filter resources by category"
          >
            <button
              type="button"
              onClick={() => setCategory("all")}
              aria-pressed={category === "all"}
              className={cn(
                "min-h-11 shrink-0 rounded-xl border px-4 text-sm transition-colors",
                category === "all"
                  ? "border-brand-500 bg-brand-50 font-medium text-brand-700"
                  : "border-line bg-surface text-ink-soft hover:border-brand-200",
              )}
            >
              Everything
            </button>
            {categories.map((resourceCategory) => (
              <button
                key={resourceCategory}
                type="button"
                onClick={() => setCategory(resourceCategory)}
                aria-pressed={category === resourceCategory}
                className={cn(
                  "min-h-11 shrink-0 rounded-xl border px-4 text-sm transition-colors",
                  category === resourceCategory
                    ? "border-brand-500 bg-brand-50 font-medium text-brand-700"
                    : "border-line bg-surface text-ink-soft hover:border-brand-200",
                )}
              >
                {CATEGORY_LABELS[resourceCategory]}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-1 text-sm text-ink-soft sm:flex-row sm:items-center sm:justify-between">
          <p aria-live="polite" aria-atomic="true">
            Showing {visible.length} {visible.length === 1 ? "resource" : "resources"}
            {category === "all" ? "" : ` in ${CATEGORY_LABELS[category]}`}.
          </p>
          <p>Free tiers may include feature or usage limits.</p>
        </div>

        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((resource) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              fit={fitFor(resource)}
            />
          ))}
        </ul>

        {visible.length === 0 && (
          <Card className="mt-6 text-center text-ink-soft">
            Nothing matches that filter yet.
          </Card>
        )}
      </section>

      <p className="mt-12 border-t border-line pt-6 text-sm text-ink-faint">
        Catalog reviewed {RESOURCE_CATALOG_REVIEWED}. Third-party plans and
        availability can change, so confirm current terms before signing up.
      </p>
    </div>
  );
}
