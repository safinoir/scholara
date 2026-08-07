"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AXIS_META, FRICTION_META } from "@/lib/data/axes";
import { FIELD_OPTIONS, YEAR_OPTIONS } from "@/lib/data/questions";
import { axesFromDirectInput, generateProfile } from "@/lib/engine";
import { useProfile } from "@/hooks/useProfile";
import type {
  AxisScores,
  Field,
  Friction,
  LearnerContext,
  YearLevel,
} from "@/lib/types";
import {
  Button,
  Field as FieldWrap,
  SectionHeading,
  cn,
  inputClass,
} from "@/components/ui";

const ZERO: AxisScores = {
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

  const [axes, setAxes] = useState<AxisScores>(ZERO);
  const [frictions, setFrictions] = useState<Friction[]>([]);
  const [context, setContext] = useState<LearnerContext>({
    year: "freshman",
    field: "undecided",
    courseLoad: 4,
    hoursPerWeek: 10,
    hasOutsideObligations: false,
  });

  const submit = () => {
    setProfile(
      generateProfile({ axes: axesFromDirectInput(axes), frictions, context }),
    );
    router.push("/results");
  };

  return (
    <div className="mx-auto max-w-2xl px-5 py-10 sm:py-14">
      <SectionHeading
        eyebrow="Express intake"
        title="You already know how you work"
        lead="Set these yourself instead of answering questions. Same engine, same results — it just trusts your self-report."
      />

      <p className="mt-4 text-sm text-ink-faint">
        Prefer the guided version?{" "}
        <Link href="/quiz" className="underline hover:text-ink">
          Take the quiz instead
        </Link>
        .
      </p>

      <div className="mt-10 space-y-8">
        {AXIS_META.map((meta) => (
          <div key={meta.id}>
            <div className="flex items-baseline justify-between gap-4">
              <label htmlFor={meta.id} className="text-sm font-medium">
                {meta.label}
              </label>
              <span className="text-sm text-ink-faint">{meta.drives}</span>
            </div>
            <input
              id={meta.id}
              type="range"
              min={-100}
              max={100}
              step={5}
              value={axes[meta.id]}
              onChange={(e) =>
                setAxes((prev) => ({ ...prev, [meta.id]: Number(e.target.value) }))
              }
              className="mt-3 w-full accent-brand-600"
            />
            <div className="mt-1 flex justify-between text-xs text-ink-faint">
              <span>{meta.lowLabel}</span>
              <span>{meta.highLabel}</span>
            </div>
          </div>
        ))}

        <fieldset>
          <legend className="text-sm font-medium">What gets in your way?</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {FRICTION_META.map((friction) => {
              const selected = frictions.includes(friction.id);
              return (
                <button
                  key={friction.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() =>
                    setFrictions((prev) =>
                      prev.includes(friction.id)
                        ? prev.filter((f) => f !== friction.id)
                        : [...prev, friction.id],
                    )
                  }
                  className={cn(
                    "min-h-11 rounded-lg border px-3.5 text-sm transition-colors",
                    selected
                      ? "border-brand-500 bg-brand-50 font-medium text-brand-700"
                      : "border-line bg-surface text-ink-soft hover:border-brand-200",
                  )}
                >
                  {friction.label}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="grid gap-6 sm:grid-cols-2">
          <FieldWrap label="Year" htmlFor="year">
            <select
              id="year"
              className={inputClass}
              value={context.year}
              onChange={(e) =>
                setContext({ ...context, year: e.target.value as YearLevel })
              }
            >
              {YEAR_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </FieldWrap>

          <FieldWrap label="Field" htmlFor="field">
            <select
              id="field"
              className={inputClass}
              value={context.field}
              onChange={(e) =>
                setContext({ ...context, field: e.target.value as Field })
              }
            >
              {FIELD_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </FieldWrap>
        </div>

        <FieldWrap label={`Courses this term: ${context.courseLoad}`} htmlFor="load">
          <input
            id="load"
            type="range"
            min={1}
            max={8}
            value={context.courseLoad}
            onChange={(e) =>
              setContext({ ...context, courseLoad: Number(e.target.value) })
            }
            className="w-full accent-brand-600"
          />
        </FieldWrap>

        <FieldWrap
          label={`Study hours per week: ${context.hoursPerWeek}`}
          hint="Outside class. Be honest rather than aspirational."
          htmlFor="hours"
        >
          <input
            id="hours"
            type="range"
            min={2}
            max={40}
            value={context.hoursPerWeek}
            onChange={(e) =>
              setContext({ ...context, hoursPerWeek: Number(e.target.value) })
            }
            className="w-full accent-brand-600"
          />
        </FieldWrap>

        <label className="flex cursor-pointer items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={context.hasOutsideObligations}
            onChange={(e) =>
              setContext({
                ...context,
                hasOutsideObligations: e.target.checked,
              })
            }
            className="size-4 accent-brand-600"
          />
          I work a job or have caregiving responsibilities
        </label>
      </div>

      <Button size="lg" className="mt-10 w-full sm:w-auto" onClick={submit}>
        Generate my plan
        <ArrowRight className="size-4" aria-hidden />
      </Button>
    </div>
  );
}
