"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { AXIS_QUESTIONS, TOTAL_STEPS } from "@/lib/data/questions";
import { FRICTION_META } from "@/lib/data/axes";
import { generateProfileFromQuiz } from "@/lib/engine";
import { useProfile } from "@/hooks/useProfile";
import {
  clearQuizDraft,
  loadQuizDraft,
  saveQuizDraft,
} from "@/lib/storage";
import type { Friction, LearnerContext, QuizAnswers } from "@/lib/types";
import { Button, Progress, cn } from "@/components/ui";
import { ContextStep } from "./ContextStep";

const DEFAULT_CONTEXT: LearnerContext = {
  year: "freshman",
  field: "undecided",
  courseLoad: 4,
  hoursPerWeek: 10,
  hasOutsideObligations: false,
};

export function QuizFlow() {
  const router = useRouter();
  const { setProfile } = useProfile();

  const [step, setStep] = useState(0);
  const [axisAnswers, setAxisAnswers] = useState<Record<string, number>>({});
  const [frictions, setFrictions] = useState<Friction[]>([]);
  const [context, setContext] = useState<LearnerContext>(DEFAULT_CONTEXT);
  const [hydrated, setHydrated] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Restore an in-progress quiz so a refresh doesn't cost the user their answers.
  useEffect(() => {
    const draft = loadQuizDraft();
    if (draft) {
      if (draft.axisAnswers) setAxisAnswers(draft.axisAnswers);
      if (draft.frictions) setFrictions(draft.frictions);
      if (draft.context) setContext({ ...DEFAULT_CONTEXT, ...draft.context });
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveQuizDraft({ axisAnswers, frictions, context });
  }, [hydrated, axisAnswers, frictions, context]);

  // Move focus to the new question so keyboard and screen-reader users follow along.
  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  const isAxisStep = step < AXIS_QUESTIONS.length;
  const isFrictionStep = step === AXIS_QUESTIONS.length;
  const isContextStep = step === AXIS_QUESTIONS.length + 1;
  const question = isAxisStep ? AXIS_QUESTIONS[step] : null;

  const canAdvance = isAxisStep
    ? axisAnswers[AXIS_QUESTIONS[step].id] !== undefined
    : true;

  const goNext = useCallback(() => {
    setStep((s) => Math.min(TOTAL_STEPS - 1, s + 1));
  }, []);

  const goBack = useCallback(() => {
    setStep((s) => Math.max(0, s - 1));
  }, []);

  const selectOption = useCallback(
    (questionId: string, index: number) => {
      setAxisAnswers((prev) => ({ ...prev, [questionId]: index }));
      // Brief pause so the selection is visible before the screen changes.
      window.setTimeout(goNext, 180);
    },
    [goNext],
  );

  const toggleFriction = useCallback((friction: Friction) => {
    setFrictions((prev) =>
      prev.includes(friction)
        ? prev.filter((f) => f !== friction)
        : [...prev, friction],
    );
  }, []);

  const finish = useCallback(() => {
    const answers: QuizAnswers = { axisAnswers, frictions, context };
    setProfile(generateProfileFromQuiz(answers));
    clearQuizDraft();
    router.push("/persona");
  }, [axisAnswers, frictions, context, setProfile, router]);

  // Number keys pick an option; arrows move between screens.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      const target = event.target as HTMLElement | null;
      if (
        target &&
        ["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName)
      ) {
        return;
      }

      if (question) {
        const digit = Number(event.key);
        if (digit >= 1 && digit <= question.options.length) {
          event.preventDefault();
          selectOption(question.id, digit - 1);
          return;
        }
      }

      if (event.key === "ArrowRight" && canAdvance && !isContextStep) {
        event.preventDefault();
        goNext();
      }
      if (event.key === "ArrowLeft" && step > 0) {
        event.preventDefault();
        goBack();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [question, canAdvance, isContextStep, step, selectOption, goNext, goBack]);

  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-2xl flex-col px-5 py-8">
      <div className="mb-10">
        <div className="mb-3 flex items-baseline justify-between text-sm text-ink-faint">
          <span aria-live="polite">
            Question {step + 1} of {TOTAL_STEPS}
          </span>
          <Link href="/express" className="underline hover:text-ink">
            Skip the quiz
          </Link>
        </div>
        <Progress value={step + 1} max={TOTAL_STEPS} label="Quiz progress" />
      </div>

      <div key={step} className="animate-rise flex-1">
        {question && (
          <fieldset>
            <legend className="w-full">
              <h1
                ref={headingRef}
                tabIndex={-1}
                className="text-2xl font-semibold sm:text-3xl"
              >
                {question.prompt}
              </h1>
              {question.hint && (
                <p className="mt-2 text-ink-soft">{question.hint}</p>
              )}
            </legend>

            <div className="mt-8 space-y-3">
              {question.options.map((option, index) => {
                const selected = axisAnswers[question.id] === index;
                return (
                  <button
                    key={option.label}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => selectOption(question.id, index)}
                    className={cn(
                      "group flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-colors",
                      selected
                        ? "border-brand-500 bg-brand-50"
                        : "border-line bg-surface hover:border-brand-200 hover:bg-brand-50/40",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-7 shrink-0 items-center justify-center rounded-md border text-xs font-medium",
                        selected
                          ? "border-brand-500 bg-brand-500 text-white"
                          : "border-line text-ink-faint",
                      )}
                      aria-hidden
                    >
                      {selected ? <Check className="size-4" /> : index + 1}
                    </span>
                    <span className="text-[0.975rem]">{option.label}</span>
                  </button>
                );
              })}
            </div>
            <p className="mt-5 text-sm text-ink-faint">
              Tip: press {question.options.map((_, i) => i + 1).join(", ")} to
              answer with the keyboard.
            </p>
          </fieldset>
        )}

        {isFrictionStep && (
          <fieldset>
            <legend className="w-full">
              <h1
                ref={headingRef}
                tabIndex={-1}
                className="text-2xl font-semibold sm:text-3xl"
              >
                What actually gets in your way?
              </h1>
              <p className="mt-2 text-ink-soft">
                Pick everything that applies, or none. This is the part that
                changes your recommendations the most.
              </p>
            </legend>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {FRICTION_META.map((friction) => {
                const selected = frictions.includes(friction.id);
                return (
                  <button
                    key={friction.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleFriction(friction.id)}
                    className={cn(
                      "rounded-xl border p-4 text-left transition-colors",
                      selected
                        ? "border-brand-500 bg-brand-50"
                        : "border-line bg-surface hover:border-brand-200",
                    )}
                  >
                    <span className="flex items-start gap-3">
                      <span
                        className={cn(
                          "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border",
                          selected
                            ? "border-brand-500 bg-brand-500 text-white"
                            : "border-line",
                        )}
                        aria-hidden
                      >
                        {selected && <Check className="size-3.5" />}
                      </span>
                      <span>
                        <span className="block text-sm font-medium">
                          {friction.label}
                        </span>
                        <span className="mt-0.5 block text-sm text-ink-faint">
                          {friction.blurb}
                        </span>
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}

        {isContextStep && (
          <ContextStep
            headingRef={headingRef}
            context={context}
            onChange={setContext}
          />
        )}
      </div>

      <div className="sticky bottom-0 mt-10 flex items-center gap-3 border-t border-line bg-paper/90 py-4 backdrop-blur">
        <Button variant="ghost" onClick={goBack} disabled={step === 0}>
          <ArrowLeft className="size-4" aria-hidden />
          Back
        </Button>

        <div className="ml-auto">
          {isContextStep ? (
            <Button size="lg" onClick={finish}>
              See my persona
              <ArrowRight className="size-4" aria-hidden />
            </Button>
          ) : (
            <Button
              variant={isFrictionStep ? "primary" : "secondary"}
              onClick={goNext}
              disabled={!canAdvance}
            >
              {isFrictionStep ? "Continue" : "Skip"}
              <ArrowRight className="size-4" aria-hidden />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
