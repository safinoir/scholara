"use client";

import { useState } from "react";
import { MessageCircleQuestion } from "lucide-react";
import { coachingPayload } from "@/lib/ai/payload";
import { ASK_PROMPTS, type AskTopic } from "@/lib/ai/topics";
import type { LearnerProfile } from "@/lib/types";
import { Badge, Card, cn } from "@/components/ui";

const TOPICS = Object.keys(ASK_PROMPTS) as AskTopic[];

/**
 * A fixed menu of questions rather than a chat box. Every option is answerable
 * from the student's own plan, which keeps answers grounded and means no free
 * text ever leaves the browser.
 */
export function AskCoach({ profile }: { profile: LearnerProfile }) {
  const [active, setActive] = useState<AskTopic | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [source, setSource] = useState<"ai" | "fallback" | null>(null);
  const [busy, setBusy] = useState(false);

  const ask = async (topic: AskTopic) => {
    setActive(topic);
    setAnswer(null);
    setSource(null);
    setBusy(true);
    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, ...coachingPayload(profile) }),
      });
      const data = response.ok ? await response.json() : null;
      setSource(data?.source === "ai" ? "ai" : "fallback");
      setAnswer(
        typeof data?.message === "string"
          ? data.message
          : "That didn't go through. Try again in a moment — your plan is unchanged.",
      );
    } catch {
      setSource("fallback");
      setAnswer(
        "That didn't go through. Try again in a moment — your plan is unchanged.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="no-print mt-6">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <MessageCircleQuestion className="size-4.5 text-brand-600" aria-hidden />
        Ask about your plan
      </h2>
      <p className="mt-1.5 text-sm text-ink-soft">
        Answers come from your plan and your techniques — nothing invented, and
        nothing you type is ever sent anywhere.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {TOPICS.map((topic) => (
          <button
            key={topic}
            type="button"
            onClick={() => ask(topic)}
            disabled={busy}
            aria-pressed={active === topic}
            className={cn(
              "inline-flex min-h-11 items-center rounded-xl border px-4 text-sm transition-colors disabled:opacity-50",
              active === topic
                ? "border-brand-500 bg-brand-50 font-medium text-brand-700"
                : "border-line bg-surface text-ink-soft hover:bg-line-soft",
            )}
          >
            {ASK_PROMPTS[topic].label}
          </button>
        ))}
      </div>

      <div aria-live="polite" className="mt-5">
        {busy && <p className="text-sm text-ink-faint">Thinking it through…</p>}
        {!busy && answer && (
          <div className="rounded-xl border border-line bg-line-soft/60 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium text-ink-faint">
                {active ? ASK_PROMPTS[active].label : ""}
              </p>
              {source && (
                <Badge tone={source === "ai" ? "brand" : "neutral"}>
                  {source === "ai" ? "AI personalized" : "Built-in guidance"}
                </Badge>
              )}
            </div>
            <p className="mt-2 leading-relaxed whitespace-pre-line">{answer}</p>
          </div>
        )}
      </div>
    </Card>
  );
}
