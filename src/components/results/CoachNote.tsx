"use client";

import { useEffect, useState } from "react";
import { MessageSquareQuote } from "lucide-react";
import { effectiveArchetypeMatch } from "@/lib/persona";
import type { LearnerProfile } from "@/lib/types";
import { Badge, Card } from "@/components/ui";

type CoachReply = {
  message: string;
  source: "ai" | "fallback";
};

export function CoachNote({ profile }: { profile: LearnerProfile }) {
  const [reply, setReply] = useState<CoachReply | null>(null);

  useEffect(() => {
    let active = true;
    const match = effectiveArchetypeMatch(profile);

    fetch("/api/coach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        primary: match.primary,
        frictions: profile.frictions,
        techniqueIds: profile.recommendedTechniqueIds,
        hoursPerWeek: profile.context.hoursPerWeek,
        courseLoad: profile.context.courseLoad,
      }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (active && typeof data?.message === "string") {
          setReply({
            message: data.message,
            source: data.source === "ai" ? "ai" : "fallback",
          });
        }
      })
      .catch(() => {
        // Silent by design — this section simply doesn't appear.
      });

    return () => {
      active = false;
    };
  }, [profile]);

  if (!reply) return null;

  return (
    <Card className="mt-8 border-brand-100 bg-brand-50">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-brand-700">
          <MessageSquareQuote className="size-4" aria-hidden />
          Where to start
        </h2>
        <Badge tone={reply.source === "ai" ? "brand" : "neutral"}>
          {reply.source === "ai" ? "AI personalized" : "Built-in guidance"}
        </Badge>
      </div>
      <p className="mt-3 leading-relaxed">{reply.message}</p>
    </Card>
  );
}
