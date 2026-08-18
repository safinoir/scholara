import type { ReactNode } from "react";
import type { Archetype } from "@/lib/types";
import { ArchetypeIcon } from "@/components/ArchetypeIcon";
import { cn } from "@/components/ui";

type HeadingLevel = "h1" | "h2" | "h3";

type PersonaSelection = {
  inputId: string;
  name: string;
  checked: boolean;
  onChange: () => void;
};

export function PersonaDetailsCard({
  archetype,
  headingLevel = "h2",
  className,
  compact = false,
  notice,
  footer,
  selection,
}: {
  archetype: Archetype;
  headingLevel?: HeadingLevel;
  className?: string;
  compact?: boolean;
  notice?: ReactNode;
  footer?: ReactNode;
  selection?: PersonaSelection;
}) {
  const Heading = headingLevel;
  const Subheading =
    headingLevel === "h1" ? "h2" : headingLevel === "h2" ? "h3" : "h4";
  const detailsId = selection ? `${selection.inputId}-details` : undefined;

  return (
    <article
      className={cn(
        "overflow-hidden border",
        compact ? "rounded-2xl p-5 sm:p-6" : "rounded-3xl p-7 sm:p-9",
        selection?.checked && "ring-2 ring-brand-500 ring-offset-2",
        className,
      )}
      style={{
        borderColor: `${archetype.accent}33`,
        backgroundColor: `${archetype.accent}0a`,
      }}
    >
      <div className={cn("flex items-start", compact ? "gap-3.5" : "gap-5")}>
        {selection && (
          <input
            id={selection.inputId}
            type="radio"
            name={selection.name}
            checked={selection.checked}
            onChange={selection.onChange}
            aria-describedby={detailsId}
            className="mt-3 size-5 shrink-0 accent-brand-600"
          />
        )}
        <span
          className={cn(
            "flex shrink-0 items-center justify-center rounded-2xl text-white",
            compact ? "size-12" : "size-14",
          )}
          style={{ backgroundColor: archetype.accent }}
          aria-hidden="true"
        >
          <ArchetypeIcon
            name={archetype.icon}
            className={compact ? "size-6" : "size-7"}
          />
        </span>
        <div className="min-w-0">
          <Heading
            className={cn(
              "font-semibold",
              compact ? "text-xl sm:text-2xl" : "text-3xl sm:text-4xl",
            )}
          >
            {selection ? (
              <label htmlFor={selection.inputId} className="cursor-pointer">
                {archetype.name}
              </label>
            ) : (
              archetype.name
            )}
          </Heading>
          <p
            className={cn(
              "text-ink-soft",
              compact ? "mt-1 text-sm" : "mt-1 text-lg",
            )}
          >
            {archetype.tagline}
          </p>
        </div>
      </div>

      <div>
        <p
          id={detailsId}
          className={cn(
            "max-w-2xl leading-relaxed",
            compact ? "mt-5 text-sm" : "mt-6",
          )}
        >
          {archetype.description}
        </p>

        {notice}

        <div
          className={cn(
            "grid sm:grid-cols-2",
            compact ? "mt-6 gap-5" : "mt-7 gap-6",
          )}
        >
          <div>
            <Subheading className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-faint">
              What works for you
            </Subheading>
            <ul className="mt-3 space-y-2">
              {archetype.strengths.map((item) => (
                <li key={item} className="flex gap-2.5 text-sm text-ink-soft">
                  <span
                    className="mt-1.5 size-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: archetype.accent }}
                    aria-hidden="true"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <Subheading className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-faint">
              Where you tend to slip
            </Subheading>
            <ul className="mt-3 space-y-2">
              {archetype.watchOuts.map((item) => (
                <li key={item} className="flex gap-2.5 text-sm text-ink-soft">
                  <span
                    className="mt-1.5 size-1.5 shrink-0 rounded-full bg-ink-faint"
                    aria-hidden="true"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {footer && <div className="mt-7 border-t border-line/70 pt-5">{footer}</div>}
    </article>
  );
}
