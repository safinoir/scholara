"use client";

import { AlertTriangle, RefreshCw, Sparkles, Target } from "lucide-react";
import type { PlanCoaching } from "@/lib/types";
import { Badge, Button, Card } from "@/components/ui";

export function CoachPanel({
  coaching,
  busy,
  onRefresh,
}: {
  coaching: PlanCoaching | null;
  busy: boolean;
  onRefresh: () => void;
}) {
  if (busy && !coaching) {
    return (
      <Card className="no-print mt-6 border-brand-100 bg-brand-50">
        <p className="text-sm text-brand-700" aria-live="polite">
          Your coach is reading your week…
        </p>
      </Card>
    );
  }

  if (!coaching) return null;

  return (
    <Card className="mt-6 border-brand-100 bg-brand-50">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-brand-700">
          <Sparkles className="size-4" aria-hidden />
          Your coach on this week
        </h2>
        <div className="no-print flex items-center gap-2">
          {coaching.source === "fallback" && (
            <Badge tone="neutral">Offline guidance</Badge>
          )}
          <Button
            variant="quiet"
            size="sm"
            onClick={onRefresh}
            disabled={busy}
            aria-label="Get fresh coaching for this week"
          >
            <RefreshCw className="size-4" aria-hidden />
            {busy ? "Thinking…" : "Refresh"}
          </Button>
        </div>
      </div>

      <p className="mt-4 leading-relaxed">{coaching.brief}</p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-brand-100 bg-surface p-4">
          <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-brand-700">
            <Target className="size-3.5" aria-hidden />
            Start here
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            {coaching.focus}
          </p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4">
          <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-amber-800">
            <AlertTriangle className="size-3.5" aria-hidden />
            Watch out for
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            {coaching.watchOut}
          </p>
        </div>
      </div>
    </Card>
  );
}
