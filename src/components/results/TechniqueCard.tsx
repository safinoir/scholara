"use client";

import { useState } from "react";
import { Check, ChevronDown, Plus } from "lucide-react";
import { RESOURCE_BY_ID } from "@/lib/data/resources";
import type { EvidenceStrength, Technique } from "@/lib/types";
import { cn } from "@/components/ui";

const EVIDENCE_LABEL: Record<EvidenceStrength, string> = {
  strong: "Strong evidence",
  moderate: "Moderate evidence",
  promising: "Promising evidence",
};

const EFFORT_LABEL: Record<Technique["timeCost"], string> = {
  low: "Low effort",
  medium: "Medium effort",
  high: "High effort",
};

export function TechniqueCard({
  technique,
  reasons,
  rank,
  selected,
  selectionDisabled = false,
  onToggleSelection,
}: {
  technique: Technique;
  reasons: string[];
  rank?: number;
  selected?: boolean;
  selectionDisabled?: boolean;
  onToggleSelection?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const cardId = `technique-${technique.id}`;
  const panelId = `${cardId}-details`;
  const tools = technique.toolIds
    .map((id) => RESOURCE_BY_ID[id])
    .filter(Boolean)
    .slice(0, 2);

  return (
    <article
      id={cardId}
      className={cn(
        "print-break-avoid scroll-mt-24 rounded-xl border bg-surface",
        selected ? "border-brand-300 bg-brand-50/30" : "border-line",
      )}
    >
      <div className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            {rank !== undefined && (
              <span className="mt-0.5 shrink-0 text-xs font-semibold text-brand-700">
                #{rank}
              </span>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h3 className="text-base font-semibold">{technique.name}</h3>
                <span className="text-xs text-ink-faint">
                  {EVIDENCE_LABEL[technique.evidence]} ·{" "}
                  {EFFORT_LABEL[technique.timeCost]}
                  {technique.sessionMinutes
                    ? ` · about ${technique.sessionMinutes} min`
                    : ""}
                </span>
              </div>
              <p className="mt-1 text-sm leading-snug text-ink-soft">
                {technique.blurb}
              </p>
              {reasons.length > 0 && (
                <p className="mt-2 text-xs leading-relaxed text-brand-700">
                  <span className="font-semibold">Why it fits:</span>{" "}
                  {reasons[0]}
                </p>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:pl-2">
            {onToggleSelection && (
              <button
                type="button"
                aria-pressed={selected}
                aria-label={`${selected ? "Remove" : "Choose"} ${technique.name} ${selected ? "from" : "for"} your weekly study plan`}
                onClick={onToggleSelection}
                disabled={selectionDisabled}
                className={cn(
                  "inline-flex min-h-11 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-45",
                  selected
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-line bg-white text-ink-soft hover:border-brand-300 hover:text-brand-700",
                )}
              >
                {selected ? (
                  <Check className="size-4" aria-hidden="true" />
                ) : (
                  <Plus className="size-4" aria-hidden="true" />
                )}
                {selected ? "Chosen" : "Choose"}
              </button>
            )}

            <button
              type="button"
              onClick={() => setOpen((current) => !current)}
              aria-expanded={open}
              aria-controls={panelId}
              aria-label={`${open ? "Hide" : "Show"} how ${technique.name} works`}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-ink-soft hover:bg-line-soft hover:text-ink"
            >
              How it works
              <ChevronDown
                className={cn(
                  "size-4 transition-transform",
                  open && "rotate-180",
                )}
                aria-hidden="true"
              />
            </button>
          </div>
        </div>
      </div>

      {open && (
        <div id={panelId} className="border-t border-line-soft px-4 py-4">
          <h4 className="text-sm font-semibold">Use it like this</h4>
          <ol className="mt-2.5 space-y-1.5">
            {technique.steps.map((step, index) => (
              <li key={step} className="flex gap-2.5 text-sm leading-relaxed">
                <span className="font-medium text-brand-600">{index + 1}.</span>
                <span className="text-ink-soft">{step}</span>
              </li>
            ))}
          </ol>

          {reasons.length > 1 && (
            <p className="mt-4 text-sm leading-relaxed text-ink-soft">
              <span className="font-medium text-ink">Also matched because: </span>
              {reasons.slice(1).join(" · ")}
            </p>
          )}

          <p className="mt-4 text-sm leading-relaxed text-ink-soft">
            <span className="font-medium text-ink">Evidence: </span>
            {technique.evidenceNote}
          </p>

          {tools.length > 0 && (
            <p className="mt-3 text-sm text-ink-soft">
              <span className="font-medium text-ink">Helpful free tools: </span>
              {tools.map((tool, index) => (
                <span key={tool.id}>
                  {index > 0 && ", "}
                  {tool.url ? (
                    <a
                      href={tool.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-ink"
                    >
                      {tool.name}
                    </a>
                  ) : (
                    tool.name
                  )}
                </span>
              ))}
            </p>
          )}
        </div>
      )}
    </article>
  );
}
