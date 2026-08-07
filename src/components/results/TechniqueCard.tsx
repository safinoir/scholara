"use client";

import { useState } from "react";
import { ChevronDown, Clock, FlaskConical } from "lucide-react";
import { RESOURCE_BY_ID } from "@/lib/data/resources";
import type { EvidenceStrength, Technique } from "@/lib/types";
import { Badge, cn } from "@/components/ui";

const EVIDENCE_LABEL: Record<EvidenceStrength, string> = {
  strong: "Strong evidence",
  moderate: "Moderate evidence",
  promising: "Promising",
};

const TIME_LABEL: Record<Technique["timeCost"], string> = {
  low: "Low effort",
  medium: "Medium effort",
  high: "High effort",
};

export function TechniqueCard({
  technique,
  reasons,
  rank,
}: {
  technique: Technique;
  reasons: string[];
  rank: number;
}) {
  const [open, setOpen] = useState(rank === 1);
  const cardId = `technique-${technique.id}`;
  const panelId = `${cardId}-details`;
  const tools = technique.toolIds
    .map((id) => RESOURCE_BY_ID[id])
    .filter(Boolean)
    .slice(0, 2);

  return (
    <div
      id={cardId}
      className="print-break-avoid scroll-mt-24 rounded-2xl border border-line bg-surface"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-start gap-4 p-5 text-left sm:p-6"
      >
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-sm font-semibold text-brand-700">
          {rank}
        </span>

        <span className="flex-1">
          <span className="block text-lg font-semibold">{technique.name}</span>
          <span className="mt-1 block text-sm text-ink-soft">
            {technique.blurb}
          </span>

          {reasons.length > 0 && (
            <span className="mt-3 flex flex-wrap gap-2">
              {reasons.map((reason) => (
                <Badge key={reason} tone="brand">
                  {reason}
                </Badge>
              ))}
            </span>
          )}
        </span>

        <ChevronDown
          className={cn(
            "mt-1 size-5 shrink-0 text-ink-faint transition-transform",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {open && (
        <div id={panelId} className="border-t border-line-soft px-5 pb-6 pt-5 sm:px-6">
          <div className="mb-5 flex flex-wrap gap-2">
            <Badge tone={technique.evidence === "strong" ? "free" : "neutral"}>
              <FlaskConical className="size-3.5" aria-hidden />
              {EVIDENCE_LABEL[technique.evidence]}
            </Badge>
            <Badge>
              <Clock className="size-3.5" aria-hidden />
              {TIME_LABEL[technique.timeCost]}
              {technique.sessionMinutes && ` · ~${technique.sessionMinutes} min`}
            </Badge>
          </div>

          <h4 className="text-sm font-semibold uppercase tracking-[0.1em] text-ink-faint">
            How to do it
          </h4>
          <ol className="mt-3 space-y-2.5">
            {technique.steps.map((step, index) => (
              <li key={step} className="flex gap-3 text-sm leading-relaxed">
                <span className="font-medium text-brand-600">{index + 1}.</span>
                <span className="text-ink-soft">{step}</span>
              </li>
            ))}
          </ol>

          <div className="mt-5 rounded-xl bg-paper p-4">
            <p className="text-sm text-ink-soft">
              <span className="font-medium text-ink">Why we trust it: </span>
              {technique.evidenceNote}
            </p>
          </div>

          {tools.length > 0 && (
            <p className="mt-4 text-sm text-ink-soft">
              <span className="font-medium text-ink">Free tools: </span>
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
    </div>
  );
}
