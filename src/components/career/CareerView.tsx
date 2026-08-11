"use client";

import { useState } from "react";
import { CheckCircle2, Circle, ExternalLink } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { getCareerTrack, isStepDue } from "@/lib/data/careerTracks";
import { RESOURCE_BY_ID } from "@/lib/data/resources";
import { FIELD_OPTIONS } from "@/lib/data/questions";
import type { Field } from "@/lib/types";
import { LoadingShell } from "@/components/NoProfile";
import { Badge, Card, SectionHeading, cn, inputClass } from "@/components/ui";

export function CareerView() {
  const { profile, ready } = useProfile();
  const [override, setOverride] = useState<Field | null>(null);
  const [done, setDone] = useState<Set<string>>(new Set());

  if (!ready) return <LoadingShell />;

  const field = override ?? profile?.educationContext?.field ?? "undecided";
  const year = profile?.educationContext?.year ?? "freshman";
  const track = getCareerTrack(field);

  const toggle = (id: string) =>
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 sm:py-14">
      <SectionHeading
        eyebrow="What comes after"
        title={track.title}
        lead={track.intro}
      />

      <Card className="mt-8 border-brand-100 bg-brand-50">
        <p className="text-sm text-ink-soft">
          The habit that gets you the GPA is the same habit that gets you the
          offer: start earlier than feels necessary, in small consistent pieces.
          Everything below is free.
        </p>
      </Card>

      <div className="mt-8">
        <label htmlFor="field" className="text-sm font-medium">
          Showing the track for
        </label>
        <select
          id="field"
          className={cn(inputClass, "mt-2 sm:max-w-xs")}
          value={field}
          onChange={(e) => setOverride(e.target.value as Field)}
        >
          {FIELD_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <ol className="mt-10 space-y-4">
        {track.steps.map((step) => {
          const due = isStepDue(step, year);
          const checked = done.has(step.id);
          const resources = step.resourceIds
            .map((id) => RESOURCE_BY_ID[id])
            .filter(Boolean);

          return (
            <li key={step.id}>
              <Card
                className={cn(
                  "transition-colors",
                  checked && "border-brand-200 bg-brand-50/50",
                  !due && "opacity-70",
                )}
              >
                <div className="flex items-start gap-4">
                  <button
                    type="button"
                    onClick={() => toggle(step.id)}
                    aria-pressed={checked}
                    aria-label={`Mark done: ${step.title}`}
                    className="mt-0.5 shrink-0 rounded-full text-brand-600"
                  >
                    {checked ? (
                      <CheckCircle2 className="size-6" aria-hidden />
                    ) : (
                      <Circle className="size-6 text-ink-faint" aria-hidden />
                    )}
                  </button>

                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3
                        className={cn(
                          "font-semibold",
                          checked && "text-ink-soft line-through",
                        )}
                      >
                        {step.title}
                      </h3>
                      {due ? (
                        <Badge tone="brand">Relevant now</Badge>
                      ) : (
                        <Badge>Later</Badge>
                      )}
                    </div>

                    <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                      {step.detail}
                    </p>

                    {resources.length > 0 && (
                      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                        {resources.map((resource) => (
                          <li key={resource.id}>
                            {resource.url ? (
                              <a
                                href={resource.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-brand-700 underline hover:text-brand-600"
                              >
                                {resource.name}
                                <ExternalLink className="size-3" aria-hidden />
                              </a>
                            ) : (
                              <span className="text-ink-faint">
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
        })}
      </ol>

      <p className="mt-8 text-sm text-ink-faint">
        Checkmarks here are just for this visit &mdash; this page is a reference,
        not another thing to maintain.
      </p>
    </div>
  );
}
