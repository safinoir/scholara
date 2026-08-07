"use client";

import { useState } from "react";
import { CalendarCog, RotateCcw } from "lucide-react";
import { FRICTION_META } from "@/lib/data/axes";
import {
  DAYS,
  type Day,
  type EnergyLevel,
  type Friction,
  type WeekContext,
  type WeekLoad,
} from "@/lib/types";
import { Button, Card, cn } from "@/components/ui";

const DEFAULT_WEEK: WeekContext = {
  unavailableDays: [],
  load: "normal",
  energy: "steady",
  focusFrictions: [],
};

const LOADS: { value: WeekLoad; label: string; hint: string }[] = [
  { value: "light", label: "Light", hint: "Nothing major due" },
  { value: "normal", label: "Normal", hint: "The usual load" },
  { value: "crunch", label: "Crunch", hint: "Several things due" },
];

const ENERGIES: { value: EnergyLevel; label: string; hint: string }[] = [
  { value: "depleted", label: "Running on empty", hint: "Plan gets smaller" },
  { value: "steady", label: "Steady", hint: "Normal plan" },
  { value: "strong", label: "Strong", hint: "Room for a bit more" },
];

/** Short day labels keep all seven toggles on one row at 390px. */
const DAY_SHORT: Record<Day, string> = {
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
  Saturday: "Sat",
  Sunday: "Sun",
};

const chip = (active: boolean) =>
  cn(
    "inline-flex min-h-11 items-center justify-center rounded-xl border px-3 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40",
    active
      ? "border-brand-500 bg-brand-50 font-medium text-brand-700"
      : "border-line bg-surface text-ink-soft hover:bg-line-soft",
  );

export function WeekTuner({
  week,
  onApply,
  onClear,
  busy,
}: {
  week?: WeekContext;
  onApply: (week: WeekContext) => void;
  onClear: () => void;
  busy: boolean;
}) {
  const [draft, setDraft] = useState<WeekContext>(week ?? DEFAULT_WEEK);

  const toggleDay = (day: Day) =>
    setDraft((d) => ({
      ...d,
      unavailableDays: d.unavailableDays.includes(day)
        ? d.unavailableDays.filter((x) => x !== day)
        : [...d.unavailableDays, day],
    }));

  const toggleFriction = (friction: Friction) =>
    setDraft((d) => ({
      ...d,
      focusFrictions: d.focusFrictions.includes(friction)
        ? d.focusFrictions.filter((x) => x !== friction)
        : [...d.focusFrictions, friction],
    }));

  return (
    <Card className="no-print mt-6">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <CalendarCog className="size-4.5 text-brand-600" aria-hidden />
        Tune this week
      </h2>
      <p className="mt-1.5 text-sm text-ink-soft">
        Weeks aren&rsquo;t identical. Tell us about this one and we&rsquo;ll
        reshape the plan, then have your coach walk you through it.
      </p>

      <div className="mt-6 space-y-6">
        <fieldset>
          <legend className="text-sm font-medium">
            Days that are already gone
          </legend>
          <p className="mt-1 text-sm text-ink-faint">
            Class-heavy days, shifts, caregiving. Leave at least one day open.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {DAYS.map((day) => {
              const active = draft.unavailableDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleDay(day)}
                  disabled={!active && draft.unavailableDays.length >= DAYS.length - 1}
                  className={chip(active)}
                >
                  {DAY_SHORT[day]}
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-sm font-medium">What&rsquo;s due</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {LOADS.map((option) => {
              const active = draft.load === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setDraft((d) => ({ ...d, load: option.value }))}
                  className={chip(active)}
                >
                  {option.label}
                  <span className="ml-2 text-xs text-ink-faint">{option.hint}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-sm font-medium">
            How much do you actually have in the tank?
          </legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {ENERGIES.map((option) => {
              const active = draft.energy === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() =>
                    setDraft((d) => ({ ...d, energy: option.value }))
                  }
                  className={chip(active)}
                >
                  {option.label}
                  <span className="ml-2 text-xs text-ink-faint">{option.hint}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-sm font-medium">
            Anything hitting harder this week?
          </legend>
          <p className="mt-1 text-sm text-ink-faint">Optional. Pick any that apply.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {FRICTION_META.map((friction) => {
              const active = draft.focusFrictions.includes(friction.id);
              return (
                <button
                  key={friction.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleFriction(friction.id)}
                  className={chip(active)}
                >
                  {friction.label}
                </button>
              );
            })}
          </div>
        </fieldset>
      </div>

      <div className="mt-7 flex flex-wrap gap-3">
        <Button onClick={() => onApply(draft)} disabled={busy}>
          {busy ? "Reshaping your week…" : "Reshape my week"}
        </Button>
        {week && (
          <Button
            variant="secondary"
            onClick={() => {
              setDraft(DEFAULT_WEEK);
              onClear();
            }}
            disabled={busy}
          >
            <RotateCcw className="size-4" aria-hidden />
            Back to a normal week
          </Button>
        )}
      </div>
    </Card>
  );
}
