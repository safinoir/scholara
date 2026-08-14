"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Circle, ExternalLink } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { getCareerTrack, isStepDue } from "@/lib/data/careerTracks";
import { RESOURCE_BY_ID } from "@/lib/data/resources";
import { FIELD_OPTIONS, YEAR_OPTIONS } from "@/lib/data/questions";
import {
  loadCareerPreferences,
  saveCareerPreferences,
  type CareerPreferences,
} from "@/lib/careerPreferences";
import type { Field, YearLevel } from "@/lib/types";
import { LoadingShell } from "@/components/NoProfile";
import { Badge, Card, SectionHeading, cn, inputClass } from "@/components/ui";

export function CareerView() {
  const { profile, ready } = useProfile();
  const [preferences, setPreferences] = useState<CareerPreferences>({
    version: 1,
  });
  const [preferencesReady, setPreferencesReady] = useState(false);
  const [done, setDone] = useState<Set<string>>(new Set());

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

  const updatePreferences = (next: Partial<CareerPreferences>) => {
    const updated = { ...preferences, ...next, version: 1 as const };
    setPreferences(updated);
    saveCareerPreferences(updated);
  };

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
        as="h1"
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

      <div
        className={cn(
          "mt-8 grid gap-5",
          !profile?.educationContext && "sm:grid-cols-2",
        )}
      >
        <div>
          <label htmlFor="field" className="text-sm font-medium">
            Showing the track for
          </label>
          <select
            id="field"
            className={cn(inputClass, "mt-2 sm:max-w-xs")}
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

        {!profile?.educationContext && (
          <div>
            <label htmlFor="career-year" className="text-sm font-medium">
              Your current stage
            </label>
            <select
              id="career-year"
              className={cn(inputClass, "mt-2 sm:max-w-xs")}
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
                Choose a stage to see what is relevant now and what can wait.
              </p>
            )}
          </div>
        )}
      </div>

      <ol className="mt-10 space-y-4">
        {track.steps.map((step) => {
          const due = year ? isStepDue(step, year) : null;
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
                  due === false && "opacity-70",
                )}
              >
                <div className="flex items-start gap-4">
                  <button
                    type="button"
                    onClick={() => toggle(step.id)}
                    aria-pressed={checked}
                    aria-label={`Mark done: ${step.title}`}
                    className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full text-brand-600"
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
                      {due === true && (
                        <Badge tone="brand">Relevant now</Badge>
                      )}
                      {due === false && <Badge>Later</Badge>}
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
