"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { KEYS, removeRaw } from "@/lib/storage";
import { Button } from "@/components/ui";

export function ResetProfileButton() {
  const { profile, reset } = useProfile();
  const [confirming, setConfirming] = useState(false);
  const [cleared, setCleared] = useState(false);

  if (cleared) {
    return <p className="text-sm text-ink-soft">Everything has been deleted.</p>;
  }

  if (!profile) {
    return (
      <p className="text-sm text-ink-faint">
        There&rsquo;s nothing stored right now.
      </p>
    );
  }

  if (!confirming) {
    return (
      <Button variant="secondary" onClick={() => setConfirming(true)}>
        <Trash2 className="size-4" aria-hidden />
        Delete everything
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm text-ink-soft">
        This removes your profile and habit history. It can&rsquo;t be undone.
      </span>
      <Button
        onClick={() => {
          reset();
          removeRaw(KEYS.tracker);
          setCleared(true);
        }}
      >
        Yes, delete it
      </Button>
      <Button variant="ghost" onClick={() => setConfirming(false)}>
        Cancel
      </Button>
    </div>
  );
}
