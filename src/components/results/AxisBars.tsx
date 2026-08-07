import { AXIS_META } from "@/lib/data/axes";
import type { AxisScores } from "@/lib/types";

/**
 * Each axis is a bar growing from center. Position is stated in text too,
 * so meaning never depends on seeing the graphic.
 */
export function AxisBars({ axes }: { axes: AxisScores }) {
  return (
    <ul className="space-y-6">
      {AXIS_META.map((meta) => {
        const value = axes[meta.id];
        const magnitude = Math.abs(value);
        const leaning = value > 0 ? meta.highLabel : meta.lowLabel;
        const strength =
          magnitude < 18 ? "balanced" : magnitude < 55 ? "leans" : "strongly";

        return (
          <li key={meta.id}>
            <div className="mb-2 flex items-baseline justify-between gap-4">
              <span className="text-sm font-medium">{meta.label}</span>
              <span className="text-sm text-ink-soft">
                {strength === "balanced" ? (
                  <>Balanced</>
                ) : (
                  <>
                    {strength === "strongly" ? "Strongly " : "Leans "}
                    <span className="font-medium text-ink">{leaning}</span>
                  </>
                )}
              </span>
            </div>

            <div className="relative h-2.5 rounded-full bg-line-soft">
              <div
                className="absolute top-0 bottom-0 left-1/2 w-px bg-line"
                aria-hidden
              />
              <div
                className="absolute top-0 bottom-0 rounded-full bg-brand-500"
                style={{
                  width: `${Math.max(2, magnitude / 2)}%`,
                  left: value >= 0 ? "50%" : undefined,
                  right: value < 0 ? "50%" : undefined,
                }}
                aria-hidden
              />
            </div>

            <div className="mt-1.5 flex justify-between text-xs text-ink-faint">
              <span>{meta.lowLabel}</span>
              <span>{meta.highLabel}</span>
            </div>

            <p className="mt-2 text-sm text-ink-soft">
              {magnitude < 18
                ? `You sit in the middle here, so we won't force either extreme. ${meta.drives}`
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
