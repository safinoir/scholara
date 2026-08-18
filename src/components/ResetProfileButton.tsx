"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import {
  clearAllStoredScholaraData,
  hasStoredScholaraData,
} from "@/lib/privacy";
import { Button } from "@/components/ui";

export function ResetProfileButton() {
  const { profile, ready, reset } = useProfile();
  const [confirming, setConfirming] = useState(false);
  const [cleared, setCleared] = useState(false);
  const [storageReady, setStorageReady] = useState(false);
  const [hasStoredData, setHasStoredData] = useState(false);

  useEffect(() => {
    const hydration = window.setTimeout(() => {
      setHasStoredData(hasStoredScholaraData());
      setStorageReady(true);
    }, 0);
    return () => window.clearTimeout(hydration);
  }, [profile]);

  if (cleared) {
    return (
      <p className="text-sm text-ink-soft" role="status">
        Everything Scholara stored in this browser has been deleted.
      </p>
    );
  }

  if (!ready || !storageReady) {
    return (
      <p className="text-sm text-ink-faint" role="status">
        Checking this browser&hellip;
      </p>
    );
  }

  if (!profile && !hasStoredData) {
    return (
      <p className="text-sm text-ink-faint">
        There&rsquo;s nothing stored right now.
      </p>
    );
  }

  if (!confirming) {
    return (
      <Button variant="danger" onClick={() => setConfirming(true)}>
        <Trash2 className="size-4" aria-hidden />
        Delete everything
      </Button>
    );
  }

  return (
    <div
      className="flex flex-wrap items-center gap-3"
      role="group"
      aria-label="Confirm deletion"
    >
      <span className="text-sm text-ink-soft">
        This removes your profile, drafts, plan, habit history, and After
        preferences. It can&rsquo;t be undone.
      </span>
      <Button
        variant="danger"
        onClick={() => {
          reset();
          clearAllStoredScholaraData();
          setHasStoredData(false);
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
