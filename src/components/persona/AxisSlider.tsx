"use client";

import type { AxisMeta } from "@/lib/types";

export function AxisSlider({
  meta,
  value,
  onChange,
}: {
  meta: AxisMeta;
  value: number;
  onChange: (value: number) => void;
}) {
  const magnitude = Math.abs(value);
  const leaning = value > 0 ? meta.highLabel : meta.lowLabel;
  const strength =
    magnitude < 18 ? "balanced" : magnitude < 55 ? "leans" : "strongly";
  const leanSummary =
    strength === "balanced"
      ? "Balanced"
      : `${strength === "strongly" ? "Strongly" : "Leans"} ${leaning}`;
  const valueText =
    strength === "balanced"
      ? `Balanced between ${meta.lowLabel} and ${meta.highLabel}`
      : `${leanSummary}, ${magnitude} out of 100 toward ${leaning}`;
  const inputId = `axis-${meta.id}`;
  const drivesId = `${inputId}-drives`;
  const blurbId = `${inputId}-blurb`;

  return (
    <div>
      <h3 className="text-base font-semibold text-ink sm:text-lg">
        <label htmlFor={inputId}>{meta.label}</label>
      </h3>
      <p id={drivesId} className="mt-2 text-sm leading-relaxed text-ink-faint">
        {meta.drives}
      </p>

      <div className="relative mt-5 h-11">
        <div
          className="pointer-events-none absolute inset-x-0 top-1/2 h-3 -translate-y-1/2 rounded-full bg-line-soft"
          aria-hidden="true"
        >
          <div
            className="absolute inset-y-0 rounded-full bg-brand-500"
            style={{
              width: `${magnitude / 2}%`,
              left: value >= 0 ? "50%" : undefined,
              right: value < 0 ? "50%" : undefined,
            }}
          />
        </div>
        <input
          id={inputId}
          type="range"
          min={-100}
          max={100}
          step={5}
          value={value}
          aria-describedby={`${drivesId} ${blurbId}`}
          aria-valuetext={valueText}
          onChange={(event) => onChange(Number(event.target.value))}
          className="relative z-10 h-11 w-full cursor-pointer appearance-none rounded-full bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 [&::-moz-range-progress]:h-3 [&::-moz-range-progress]:bg-transparent [&::-moz-range-thumb]:size-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-brand-600 [&::-moz-range-thumb]:shadow-md [&::-moz-range-track]:h-3 [&::-moz-range-track]:bg-transparent [&::-webkit-slider-runnable-track]:h-3 [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:-mt-1.5 [&::-webkit-slider-thumb]:size-6 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-brand-600 [&::-webkit-slider-thumb]:shadow-md"
        />
        <div
          className="pointer-events-none absolute top-1/2 left-1/2 z-[5] h-7 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink"
          aria-hidden="true"
        />
      </div>

      <div className="mt-1 flex justify-between gap-4 text-xs font-medium text-ink-soft sm:text-sm">
        <span>{meta.lowLabel}</span>
        <span>{meta.highLabel}</span>
      </div>

      <p className="mt-3 text-center text-sm font-semibold text-ink">
        {leanSummary}
      </p>
      <p id={blurbId} className="mt-2 text-sm leading-relaxed text-ink-soft">
        {magnitude < 18
          ? "You sit in the middle here, so we won't force either extreme."
          : value > 0
            ? meta.highBlurb
            : meta.lowBlurb}
      </p>
    </div>
  );
}
