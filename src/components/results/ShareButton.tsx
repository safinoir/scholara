"use client";

import { useState } from "react";
import { Check, Link2 } from "lucide-react";
import { encodeShare } from "@/lib/share";
import type { LearnerProfile } from "@/lib/types";
import { Button } from "@/components/ui";

export function ShareButton({ profile }: { profile: LearnerProfile }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  const share = async () => {
    const code = encodeShare({
      primary: profile.match.primary,
      secondary: profile.match.secondary,
      axes: profile.axes,
      frictions: profile.frictions,
    });
    const url = `${window.location.origin}/share/${code}`;

    try {
      await navigator.clipboard.writeText(url);
      setState("copied");
      window.setTimeout(() => setState("idle"), 2400);
    } catch {
      setState("failed");
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="secondary" size="sm" onClick={share}>
        {state === "copied" ? (
          <>
            <Check className="size-4" aria-hidden />
            Link copied
          </>
        ) : (
          <>
            <Link2 className="size-4" aria-hidden />
            Copy share link
          </>
        )}
      </Button>
      {state === "failed" && (
        <span className="text-sm text-ink-soft">
          Couldn&rsquo;t copy automatically — your browser blocked it.
        </span>
      )}
      <span aria-live="polite" className="sr-only">
        {state === "copied" ? "Share link copied to clipboard" : ""}
      </span>
    </div>
  );
}
