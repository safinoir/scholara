"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { LearnerProfile } from "@/lib/types";
import { clearProfile, loadProfile, saveProfile } from "@/lib/storage";

type ProfileContextValue = {
  profile: LearnerProfile | null;
  /** False until localStorage has been read, so pages don't flash empty states. */
  ready: boolean;
  setProfile: (profile: LearnerProfile) => void;
  reset: () => void;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfileState] = useState<LearnerProfile | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const hydration = window.setTimeout(() => {
      setProfileState(loadProfile());
      setReady(true);
    }, 0);
    return () => window.clearTimeout(hydration);
  }, []);

  const setProfile = useCallback((next: LearnerProfile) => {
    setProfileState(next);
    saveProfile(next);
  }, []);

  const reset = useCallback(() => {
    setProfileState(null);
    clearProfile();
  }, []);

  const value = useMemo(
    () => ({ profile, ready, setProfile, reset }),
    [profile, ready, setProfile, reset],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile(): ProfileContextValue {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile must be used inside ProfileProvider");
  }
  return context;
}
