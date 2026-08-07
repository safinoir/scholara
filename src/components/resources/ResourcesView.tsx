"use client";

import { useMemo, useState } from "react";
import { ExternalLink, GraduationCap, Info } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import {
  CATEGORY_LABELS,
  COST_LABELS,
  RESOURCES,
} from "@/lib/data/resources";
import { TECHNIQUE_BY_ID } from "@/lib/data/techniques";
import { sortResourcesByFit } from "@/lib/engine";
import type { Resource, ResourceCategory } from "@/lib/types";
import { Badge, Card, SectionHeading, cn } from "@/components/ui";

const COST_TONE = {
  free: "free",
  "free-tier": "tier",
  paid: "paid",
} as const;

function ResourceCard({
  resource,
  recommended,
}: {
  resource: Resource;
  recommended: boolean;
}) {
  return (
    <li className="flex flex-col rounded-2xl border border-line bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold">
          {resource.url ? (
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-brand-700 hover:underline"
            >
              {resource.name}
              <ExternalLink className="size-3.5 shrink-0 text-ink-faint" aria-hidden />
            </a>
          ) : (
            resource.name
          )}
        </h3>
        <Badge tone={COST_TONE[resource.cost]}>{COST_LABELS[resource.cost]}</Badge>
      </div>

      <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-soft">
        {resource.blurb}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Badge>{CATEGORY_LABELS[resource.category]}</Badge>
        {recommended && <Badge tone="brand">Matched to you</Badge>}
      </div>
    </li>
  );
}

export function ResourcesView() {
  const { profile, ready } = useProfile();
  const [showPaid, setShowPaid] = useState(false);
  const [category, setCategory] = useState<ResourceCategory | "all">("all");

  const toolIds = useMemo(() => {
    if (!profile) return [];
    return profile.techniqueIds.flatMap(
      (id) => TECHNIQUE_BY_ID[id]?.toolIds ?? [],
    );
  }, [profile]);

  const sorted = useMemo(() => {
    if (!profile) return RESOURCES;
    return sortResourcesByFit({
      axes: profile.axes,
      frictions: profile.frictions,
      context: profile.context,
      toolIds,
    });
  }, [profile, toolIds]);

  const recommendedIds = useMemo(
    () => new Set(profile?.resourceIds ?? []),
    [profile],
  );

  const campus = sorted.filter((r) => r.campus);
  const rest = sorted.filter((r) => !r.campus);

  const visible = rest.filter((resource) => {
    if (!showPaid && resource.cost === "paid") return false;
    if (category !== "all" && resource.category !== category) return false;
    return true;
  });

  const categories = useMemo(() => {
    const present = new Set(rest.map((r) => r.category));
    return (Object.keys(CATEGORY_LABELS) as ResourceCategory[]).filter((c) =>
      present.has(c),
    );
  }, [rest]);

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:py-14">
      <SectionHeading
        eyebrow="Resources"
        title="Everything here is free, or has a real free tier"
        lead="Cost is labeled on every card and paid tools are hidden unless you ask for them. Studying well should not be a purchase."
      />

      {!ready || !profile ? (
        <p className="mt-6 flex items-start gap-2.5 rounded-xl border border-line bg-surface p-4 text-sm text-ink-soft">
          <Info className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden />
          Take the quiz and this library reorders itself around your obstacles and
          field of study.
        </p>
      ) : null}

      {/* Campus first — highest value, already paid for */}
      <section className="mt-12">
        <div className="flex items-start gap-3">
          <GraduationCap className="mt-1 size-5 shrink-0 text-brand-600" aria-hidden />
          <div>
            <h2 className="text-xl font-semibold">
              Things your tuition already covers
            </h2>
            <p className="mt-1.5 max-w-2xl text-sm text-ink-soft">
              The most underused resources in higher education. You are already
              paying for all of these, and most students never walk in.
            </p>
          </div>
        </div>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {campus.map((resource) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              recommended={recommendedIds.has(resource.id)}
            />
          ))}
        </ul>
      </section>

      {/* Filters */}
      <section className="mt-16">
        <h2 className="text-xl font-semibold">Tools and guides</h2>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setCategory("all")}
            aria-pressed={category === "all"}
            className={cn(
              "min-h-11 rounded-lg border px-3.5 text-sm transition-colors",
              category === "all"
                ? "border-brand-500 bg-brand-50 font-medium text-brand-700"
                : "border-line bg-surface text-ink-soft hover:border-brand-200",
            )}
          >
            Everything
          </button>
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              aria-pressed={category === c}
              className={cn(
                "min-h-11 rounded-lg border px-3.5 text-sm transition-colors",
                category === c
                  ? "border-brand-500 bg-brand-50 font-medium text-brand-700"
                  : "border-line bg-surface text-ink-soft hover:border-brand-200",
              )}
            >
              {CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>

        <label className="mt-5 flex w-fit cursor-pointer items-center gap-2.5 text-sm text-ink-soft">
          <input
            type="checkbox"
            checked={showPaid}
            onChange={(e) => setShowPaid(e.target.checked)}
            className="size-4 accent-brand-600"
          />
          Include paid tools
        </label>

        <ul className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((resource) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              recommended={recommendedIds.has(resource.id)}
            />
          ))}
        </ul>

        {visible.length === 0 && (
          <Card className="mt-6 text-center text-ink-soft">
            Nothing matches that filter yet.
          </Card>
        )}
      </section>
    </div>
  );
}
