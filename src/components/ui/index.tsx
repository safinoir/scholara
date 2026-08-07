import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

// ---------------------------------------------------------------------------

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors disabled:opacity-45 disabled:cursor-not-allowed";

const buttonSizes = {
  // 44px minimum height on every size, for touch targets.
  sm: "min-h-11 px-4 text-sm",
  md: "min-h-12 px-5 text-[0.95rem]",
  lg: "min-h-14 px-7 text-base",
};

const buttonVariants = {
  primary: "bg-brand-600 text-white hover:bg-brand-700",
  secondary: "bg-white text-ink border border-line hover:bg-line-soft",
  ghost: "text-ink-soft hover:text-ink hover:bg-line-soft",
  quiet: "text-brand-600 hover:text-brand-700 hover:bg-brand-50",
};

type ButtonProps = {
  variant?: keyof typeof buttonVariants;
  size?: keyof typeof buttonSizes;
} & ComponentProps<"button">;

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonBase, buttonSizes[size], buttonVariants[variant], className)}
      {...props}
    />
  );
}

type ButtonLinkProps = {
  variant?: keyof typeof buttonVariants;
  size?: keyof typeof buttonSizes;
} & ComponentProps<typeof Link>;

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={cn(buttonBase, buttonSizes[size], buttonVariants[variant], className)}
      {...props}
    />
  );
}

// ---------------------------------------------------------------------------

export function Card({
  className,
  children,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-line bg-surface p-6 sm:p-7",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------

const badgeTones = {
  neutral: "bg-line-soft text-ink-soft border-line",
  brand: "bg-brand-50 text-brand-700 border-brand-100",
  free: "bg-teal-50 text-teal-800 border-teal-100",
  tier: "bg-sky-50 text-sky-800 border-sky-200",
  paid: "bg-slate-100 text-slate-700 border-slate-200",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: keyof typeof badgeTones;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        badgeTones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------

export function Progress({
  value,
  max,
  label,
}: {
  value: number;
  max: number;
  label: string;
}) {
  const pct = Math.round((value / max) * 100);
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
      className="h-1.5 w-full overflow-hidden rounded-full bg-line"
    >
      <div
        className="h-full rounded-full bg-brand-500 transition-[width] duration-300"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------

export function SectionHeading({
  eyebrow,
  title,
  lead,
  className,
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  className?: string;
}) {
  return (
    <div className={cn("max-w-2xl", className)}>
      {eyebrow && (
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">
          {eyebrow}
        </p>
      )}
      <h2 className="text-2xl font-semibold sm:text-3xl">{title}</h2>
      {lead && <p className="mt-3 text-ink-soft">{lead}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------

export function Field({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-ink">
        {label}
      </label>
      {hint && <p className="mt-1 text-sm text-ink-faint">{hint}</p>}
      <div className="mt-2">{children}</div>
    </div>
  );
}

export const inputClass =
  "w-full min-h-12 rounded-xl border border-line bg-surface px-4 text-ink " +
  "placeholder:text-ink-faint focus:border-brand-500";
