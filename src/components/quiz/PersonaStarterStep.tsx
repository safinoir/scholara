"use client";

import { Check } from "lucide-react";
import { ArchetypeIcon } from "@/components/ArchetypeIcon";
import { PersonaDetailsCard } from "@/components/persona/PersonaDetailsCard";
import { Badge, cn } from "@/components/ui";
import { ARCHETYPES, ARCHETYPE_BY_ID } from "@/lib/data/archetypes";
import type { ArchetypeId } from "@/lib/types";

export function PersonaStarterStep({
  selectedId,
  onSelect,
}: {
  selectedId: ArchetypeId | null;
  onSelect: (id: ArchetypeId) => void;
}) {
  const selectedPersona = selectedId ? ARCHETYPE_BY_ID[selectedId] : null;

  return (
    <div>
      <ul className="grid gap-4 sm:grid-cols-2">
        {ARCHETYPES.map((archetype) => {
          const selected = archetype.id === selectedId;

          return (
            <li key={archetype.id}>
              <button
                type="button"
                aria-pressed={selected}
                onClick={() => onSelect(archetype.id)}
                className={cn(
                  "relative min-h-11 w-full rounded-2xl border p-5 text-left transition-colors",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600",
                  selected
                    ? "border-brand-500 bg-brand-50 ring-2 ring-brand-200"
                    : "border-line bg-surface hover:border-brand-200 hover:bg-brand-50/40",
                )}
              >
                <span className="flex items-start gap-3.5">
                  <span
                    className="flex size-11 shrink-0 items-center justify-center rounded-xl text-white"
                    style={{ backgroundColor: archetype.accent }}
                    aria-hidden="true"
                  >
                    <ArchetypeIcon name={archetype.icon} className="size-5" />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-start justify-between gap-2">
                      <span className="block text-lg font-semibold text-ink">
                        {archetype.name}
                      </span>
                      {selected && (
                        <Badge tone="brand" className="shrink-0">
                          <Check className="size-3" aria-hidden="true" />
                          Selected
                        </Badge>
                      )}
                    </span>
                    <span className="mt-0.5 block text-sm font-medium text-ink-soft">
                      {archetype.tagline}
                    </span>
                  </span>
                </span>

                <span className="mt-4 block text-sm leading-relaxed text-ink-soft">
                  {archetype.description}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {selectedPersona && (
        <div className="mt-10 animate-rise">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">
            Your starting persona
          </p>
          <PersonaDetailsCard
            archetype={selectedPersona}
            headingLevel="h3"
            compact
            notice={
              <p className="mt-5 rounded-xl border border-brand-100 bg-brand-50 p-4 text-sm leading-relaxed text-ink-soft">
                Next, you can refine your six axes so your profile and study
                recommendations reflect how you actually work.
              </p>
            }
          />
        </div>
      )}
    </div>
  );
}
