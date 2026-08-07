"use client";

import type { RefObject } from "react";
import { FIELD_OPTIONS, YEAR_OPTIONS } from "@/lib/data/questions";
import type { Field, LearnerContext, YearLevel } from "@/lib/types";
import { Field as FieldWrap, cn, inputClass } from "@/components/ui";

export function ContextStep({
  headingRef,
  context,
  onChange,
}: {
  headingRef: RefObject<HTMLHeadingElement | null>;
  context: LearnerContext;
  onChange: (next: LearnerContext) => void;
}) {
  const set = <K extends keyof LearnerContext>(
    key: K,
    value: LearnerContext[K],
  ) => onChange({ ...context, [key]: value });

  return (
    <div>
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="text-2xl font-semibold sm:text-3xl"
      >
        Last thing: your actual situation.
      </h1>
      <p className="mt-2 text-ink-soft">
        Be honest about the hours. An accurate small number produces a plan that
        works; an optimistic big one produces a plan you&rsquo;ll quit.
      </p>

      <div className="mt-8 space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <FieldWrap label="Where are you right now?" htmlFor="year">
            <select
              id="year"
              className={inputClass}
              value={context.year}
              onChange={(e) => set("year", e.target.value as YearLevel)}
            >
              {YEAR_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FieldWrap>

          <FieldWrap label="Field of study" htmlFor="field">
            <select
              id="field"
              className={inputClass}
              value={context.field}
              onChange={(e) => set("field", e.target.value as Field)}
            >
              {FIELD_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FieldWrap>
        </div>

        <FieldWrap
          label={`Courses this term: ${context.courseLoad}`}
          htmlFor="courseLoad"
        >
          <input
            id="courseLoad"
            type="range"
            min={1}
            max={8}
            step={1}
            value={context.courseLoad}
            onChange={(e) => set("courseLoad", Number(e.target.value))}
            className="w-full accent-brand-600"
          />
        </FieldWrap>

        <FieldWrap
          label={`Study hours you realistically have per week: ${context.hoursPerWeek}`}
          hint="Outside of class time. Most students overestimate this."
          htmlFor="hoursPerWeek"
        >
          <input
            id="hoursPerWeek"
            type="range"
            min={2}
            max={40}
            step={1}
            value={context.hoursPerWeek}
            onChange={(e) => set("hoursPerWeek", Number(e.target.value))}
            className="w-full accent-brand-600"
          />
          <div className="mt-1 flex justify-between text-xs text-ink-faint">
            <span>2 hrs</span>
            <span>40 hrs</span>
          </div>
        </FieldWrap>

        <button
          type="button"
          aria-pressed={context.hasOutsideObligations}
          onClick={() =>
            set("hasOutsideObligations", !context.hasOutsideObligations)
          }
          className={cn(
            "w-full rounded-xl border p-4 text-left transition-colors",
            context.hasOutsideObligations
              ? "border-brand-500 bg-brand-50"
              : "border-line bg-surface hover:border-brand-200",
          )}
        >
          <span className="block text-sm font-medium">
            I work a job or have caregiving responsibilities
          </span>
          <span className="mt-0.5 block text-sm text-ink-faint">
            This makes your plan leaner and more forgiving.
          </span>
        </button>
      </div>
    </div>
  );
}
