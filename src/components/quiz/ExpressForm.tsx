"use client";

import {
  type FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, RotateCcw } from "lucide-react";
import { AxisSlider } from "@/components/persona/AxisSlider";
import { PersonaStarterStep } from "@/components/quiz/PersonaStarterStep";
import {
  Button,
  Card,
  Progress,
  cn,
} from "@/components/ui";
import { useProfile } from "@/hooks/useProfile";
import { ARCHETYPE_BY_ID } from "@/lib/data/archetypes";
import { AXIS_META, FRICTION_META } from "@/lib/data/axes";
import {
  axesFromDirectInput,
  changePersona,
  generateProfile,
} from "@/lib/engine";
import type {
  ArchetypeId,
  Axis,
  AxisScores,
  Friction,
} from "@/lib/types";

const TOTAL_STEPS = 3;

const ZERO_AXES: AxisScores = {
  rhythm: 0,
  structure: 0,
  social: 0,
  input: 0,
  drive: 0,
  clock: 0,
};

export function ExpressForm() {
  const router = useRouter();
  const { setProfile } = useProfile();
  const headingRef = useRef<HTMLHeadingElement>(null);

  const [step, setStep] = useState(0);
  const [selectedPersonaId, setSelectedPersonaId] =
    useState<ArchetypeId | null>(null);
  const [axes, setAxes] = useState<AxisScores>(ZERO_AXES);
  const [touchedAxes, setTouchedAxes] = useState<Axis[]>([]);
  const [axesConfirmed, setAxesConfirmed] = useState(false);
  const [frictions, setFrictions] = useState<Friction[]>([]);

  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  const choosePersona = (personaId: ArchetypeId) => {
    if (personaId === selectedPersonaId) return;
    const defaults = ARCHETYPE_BY_ID[personaId].vector;

    setAxes((current) => {
      const next = { ...defaults };
      for (const axis of touchedAxes) next[axis] = current[axis];
      return next;
    });
    setSelectedPersonaId(personaId);
    setAxesConfirmed(false);
  };

  const changeAxis = (axis: Axis, value: number) => {
    setAxes((current) => ({ ...current, [axis]: value }));
    setTouchedAxes((current) =>
      current.includes(axis) ? current : [...current, axis],
    );
    setAxesConfirmed(false);
  };

  const resetAxes = () => {
    if (!selectedPersonaId) return;
    setAxes({ ...ARCHETYPE_BY_ID[selectedPersonaId].vector });
    setTouchedAxes([]);
    setAxesConfirmed(false);
  };

  const toggleFriction = (friction: Friction) => {
    setFrictions((current) =>
      current.includes(friction)
        ? current.filter((item) => item !== friction)
        : [...current, friction],
    );
  };

  const goBack = () => setStep((current) => Math.max(0, current - 1));

  const continueFlow = () => {
    if (step === 0 && !selectedPersonaId) return;
    if (step === 1) setAxesConfirmed(true);
    setStep((current) => Math.min(TOTAL_STEPS - 1, current + 1));
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (step < TOTAL_STEPS - 1) {
      continueFlow();
      return;
    }
    if (!selectedPersonaId || !axesConfirmed) return;

    const profile = generateProfile({
      axes: axesFromDirectInput(axes),
      frictions,
    });
    setProfile(changePersona(profile, selectedPersonaId));
    router.push("/persona");
  };

  const canContinue =
    step === 0
      ? selectedPersonaId !== null
      : step === 2
        ? selectedPersonaId !== null && axesConfirmed
        : true;

  const actionLabel =
    step === 0
      ? "Continue to the six axes"
      : step === 1
        ? "Confirm these six axes"
        : "Save profile and see my persona";

  return (
    <form
      onSubmit={submit}
      className="mx-auto max-w-3xl px-5 py-10 sm:py-14"
    >
      <header className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">
          Express setup
        </p>
        <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">
          Build your profile your way
        </h1>
        <p className="mt-4 text-ink-soft">
          Choose the persona that feels closest, then refine the six practical
          preferences that shape your recommendations and schedule.
        </p>
        <p className="mt-3 text-sm text-ink-faint">
          Not sure yet?{" "}
          <Link href="/quiz" className="underline hover:text-ink">
            Take the guided quiz instead
          </Link>
          .
        </p>
      </header>

      <div className="mt-9">
        <div className="mb-3 flex items-center justify-between gap-4 text-sm text-ink-faint">
          <span>
            Step {step + 1} of {TOTAL_STEPS}
          </span>
          <span>
            {step === 0
              ? "Persona"
              : step === 1
                ? "Six axes"
                : "Obstacles"}
          </span>
        </div>
        <Progress
          value={step + 1}
          max={TOTAL_STEPS}
          label={`Express setup step ${step + 1} of ${TOTAL_STEPS}`}
        />
      </div>

      <section className="mt-10" aria-labelledby="express-step-heading">
        {step === 0 && (
          <>
            <h2
              id="express-step-heading"
              ref={headingRef}
              tabIndex={-1}
              className="text-2xl font-semibold sm:text-3xl"
            >
              Which persona sounds most like you?
            </h2>
            <p className="mt-3 max-w-2xl text-ink-soft">
              Pick a starting point, not a permanent label. You can compare the
              details now, adjust your axes next, and change your persona later.
            </p>
            <div className="mt-8">
              <PersonaStarterStep
                selectedId={selectedPersonaId}
                onSelect={choosePersona}
              />
            </div>
          </>
        )}

        {step === 1 && selectedPersonaId && (
          <>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2
                  id="express-step-heading"
                  ref={headingRef}
                  tabIndex={-1}
                  className="text-2xl font-semibold sm:text-3xl"
                >
                  Review your six axes
                </h2>
                <p className="mt-3 max-w-2xl text-ink-soft">
                  We started with {ARCHETYPE_BY_ID[selectedPersonaId].name}. Move
                  anything that does not fit; these values shape session length,
                  structure, timing, and method suggestions.
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="shrink-0 self-start"
                onClick={resetAxes}
              >
                <RotateCcw className="size-4" aria-hidden="true" />
                Reset defaults
              </Button>
            </div>

            <Card className="mt-8">
              <div className="space-y-10">
                {AXIS_META.map((meta) => (
                  <AxisSlider
                    key={meta.id}
                    meta={meta}
                    value={axes[meta.id]}
                    onChange={(value) => changeAxis(meta.id, value)}
                  />
                ))}
              </div>
            </Card>
          </>
        )}

        {step === 2 && (
          <>
            <h2
              id="express-step-heading"
              ref={headingRef}
              tabIndex={-1}
              className="text-2xl font-semibold sm:text-3xl"
            >
              What tends to get in your way?
            </h2>
            <p className="mt-3 max-w-2xl text-ink-soft">
              Choose every obstacle that applies, or leave this blank. Obstacles
              shape your method recommendations and how Scholara builds your
              weekly plan.
            </p>

            <fieldset className="mt-8">
              <legend className="sr-only">Current study obstacles</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {FRICTION_META.map((friction) => {
                  const selected = frictions.includes(friction.id);
                  return (
                    <button
                      key={friction.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => toggleFriction(friction.id)}
                      className={cn(
                        "flex min-h-20 items-start gap-3 rounded-xl border p-4 text-left transition-colors",
                        selected
                          ? "border-brand-500 bg-brand-50"
                          : "border-line bg-surface hover:border-brand-200",
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border",
                          selected
                            ? "border-brand-600 bg-brand-600 text-white"
                            : "border-line bg-paper text-transparent",
                        )}
                        aria-hidden="true"
                      >
                        <Check className="size-3.5" />
                      </span>
                      <span>
                        <span className="block text-sm font-medium text-ink">
                          {friction.label}
                        </span>
                        <span className="mt-1 block text-sm leading-relaxed text-ink-faint">
                          {friction.blurb}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          </>
        )}

      </section>

      <div className="sticky bottom-0 mt-10 flex flex-col-reverse gap-3 border-t border-line bg-paper/95 py-4 backdrop-blur sm:flex-row sm:items-center">
        {step > 0 && (
          <Button
            type="button"
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={goBack}
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back
          </Button>
        )}
        <Button
          type="submit"
          size="lg"
          className="w-full sm:ml-auto sm:w-auto"
          disabled={!canContinue}
        >
          {actionLabel}
          <ArrowRight className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </form>
  );
}
