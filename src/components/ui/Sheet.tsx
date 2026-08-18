"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/components/ui";

export function Sheet({
  open,
  onClose,
  title,
  description,
  eyebrow,
  children,
  footer,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  eyebrow?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (!open) {
      if (dialog.open) dialog.close();
      return;
    }

    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    if (!dialog.open) dialog.showModal();

    return () => {
      document.documentElement.style.overflow = previousOverflow;
      requestAnimationFrame(() => previousFocusRef.current?.focus());
    };
  }, [open]);

  const finishClose = () => {
    onClose();
    requestAnimationFrame(() => previousFocusRef.current?.focus());
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onClose={finishClose}
      onClick={(event) => {
        if (event.target === dialogRef.current) dialogRef.current?.close();
      }}
      className={cn(
        "fixed inset-0 m-0 mt-auto h-[min(92dvh,56rem)] max-h-dvh w-full max-w-none overflow-hidden bg-transparent p-0 text-ink shadow-2xl backdrop:bg-black/50 md:ml-auto md:mr-0 md:mt-0 md:h-dvh md:w-[min(38rem,92vw)]",
        className,
      )}
    >
      <div className="flex h-full flex-col overflow-hidden rounded-t-3xl border border-line bg-paper md:rounded-none md:rounded-l-3xl">
        <header className="flex items-start gap-4 border-b border-line bg-paper px-5 py-5 sm:px-7">
          <div className="min-w-0 flex-1">
            {eyebrow && (
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">
                {eyebrow}
              </p>
            )}
            <h2 id={titleId} className={cn("text-2xl font-semibold", eyebrow && "mt-1")}>
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="mt-2 text-sm leading-relaxed text-ink-soft">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="flex size-11 shrink-0 items-center justify-center rounded-xl text-ink-soft hover:bg-line-soft hover:text-ink"
            aria-label={`Close ${title.toLowerCase()}`}
          >
            <X className="size-5" aria-hidden />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-7">
          {children}
        </div>

        {footer && (
          <footer className="border-t border-line bg-paper px-5 py-4 sm:px-7">
            {footer}
          </footer>
        )}
      </div>
    </dialog>
  );
}
