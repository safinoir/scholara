"use client";

import { useEffect, useState } from "react";
import { MessageSquareQuote } from "lucide-react";
import type { LearnerProfile } from "@/lib/types";
import { Card } from "@/components/ui";

export function CoachNote({ profile }: { profile: LearnerProfile }) {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    fetch("/api/coach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        primary: profile.match.primary,
        frictions: profile.frictions,
        techniqueIds: profile.techniqueIds,
        hoursPerWeek: profile.context.hoursPerWeek,
        courseLoad: profile.context.courseLoad,
      }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (active && data?.message) setMessage(data.message);
      })
      .catch(() => {
        // Silent by design — this section simply doesn't appear.
      });

    return () => {
      active = false;
    };
  }, [profile]);

  if (!message) return null;

  return (
    <Card className="mt-8 border-brand-100 bg-brand-50">
      <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-brand-700">
        <MessageSquareQuote className="size-4" aria-hidden />
        Where to start
      </h2>
      <p className="mt-3 leading-relaxed">{message}</p>
    </Card>
  );
}
