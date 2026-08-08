"use client";

import { ArrowRight, Clock, Lock, Trash2, WalletMinimal } from "lucide-react";
import { ButtonLink } from "@/components/ui";
import { useProfile } from "@/hooks/useProfile";
import { ARCHETYPE_BY_ID } from "@/lib/data/archetypes";
import { resumeDestination } from "@/lib/onboarding";

const PROMISES = [
  { icon: Clock, text: "About two minutes" },
  { icon: Lock, text: "No account, nothing stored on a server" },
  { icon: WalletMinimal, text: "Free, and so is everything we recommend" },
];

export function HomeHero() {
  const { profile, ready } = useProfile();
  const returning = ready && profile !== null;
  const archetype = profile ? ARCHETYPE_BY_ID[profile.match.primary] : null;
  const resume = profile ? resumeDestination(profile) : null;

  return (
    <section className="mx-auto max-w-6xl px-5 pt-16 pb-14 sm:pt-24">
      <div className="max-w-3xl">
        <p className="mb-5 text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">
          Scholara
        </p>
        <h1 className="text-4xl font-semibold leading-[1.08] sm:text-6xl">
          Nobody ever taught you{" "}
          <span className="text-brand-600">how</span> to study.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-ink-soft sm:text-xl">
          You were handed advice built for a student who has no job, no anxiety,
          and forty free hours a week. Scholara starts from the schedule and the
          obstacles you actually have, then builds a study plan around them.
        </p>

        <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
          {returning && archetype && resume ? (
            <>
              <ButtonLink href={resume.href} size="lg">
                {resume.label}
                <ArrowRight className="size-4" aria-hidden />
              </ButtonLink>
              {resume.href !== "/persona" && (
                <ButtonLink href="/persona" variant="secondary" size="lg">
                  You&rsquo;re {archetype.name}
                </ButtonLink>
              )}
            </>
          ) : (
            <>
              <ButtonLink href="/quiz" size="lg">
                Start the quiz
                <ArrowRight className="size-4" aria-hidden />
              </ButtonLink>
              <ButtonLink href="/about" variant="ghost" size="lg">
                How it works
              </ButtonLink>
            </>
          )}
        </div>

        <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-ink-faint">
          {PROMISES.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-2">
              <Icon className="size-4 text-brand-500" aria-hidden />
              {text}
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={() => {
            window.localStorage.clear();
            window.location.reload();
          }}
          className="mt-8 inline-flex min-h-11 items-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
        >
          <Trash2 className="size-4" aria-hidden />
          TEST ONLY: Wipe localStorage
        </button>
      </div>
    </section>
  );
}
