import { AXIS_META } from "@/lib/data/axes";
import type { AxisScores } from "@/lib/types";

/**
 * Each axis is a bar growing from center. Position is stated in text too,
 * so meaning never depends on seeing the graphic.
 */
export function AxisBars({ axes }: { axes: AxisScores }) {
  return (
    <ul className="space-y-10">
      {AXIS_META.map((meta) => {
        const value = axes[meta.id];
        const magnitude = Math.abs(value);
        const leaning = value > 0 ? meta.highLabel : meta.lowLabel;
        const strength =
          magnitude < 18 ? "balanced" : magnitude < 55 ? "leans" : "strongly";
        const leanSummary =
          strength === "balanced"
            ? "Balanced"
            : `${strength === "strongly" ? "Strongly" : "Leans"} ${leaning}`;

        return (
          <li key={meta.id}>
            <h3 className="mb-5 text-base font-semibold text-ink sm:text-lg">
              {meta.label}
            </h3>

            <div className="relative h-3 rounded-full bg-line-soft">
              <div
                className="absolute top-0 bottom-0 rounded-full bg-brand-500"
                style={{
                  width: `${magnitude / 2}%`,
                  left: value >= 0 ? "50%" : undefined,
                  right: value < 0 ? "50%" : undefined,
                }}
                aria-hidden
              />
              <div
                className="absolute -top-1 -bottom-1 left-1/2 z-10 w-0.5 -translate-x-1/2 rounded-full bg-ink"
                aria-hidden
              />
            </div>

            <div className="mt-2 flex justify-between gap-4 text-xs font-medium text-ink-soft sm:text-sm">
              <span>{meta.lowLabel}</span>
              <span>{meta.highLabel}</span>
            </div>

            <p className="mt-3 text-center text-sm font-semibold text-ink">
              {leanSummary}
            </p>

            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              {magnitude < 18
                ? `${meta.drives} You sit in the middle here, so we won't force either extreme.`
                : value > 0
                  ? meta.highBlurb
                  : meta.lowBlurb}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
