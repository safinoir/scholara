"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { ARCHETYPES, ARCHETYPE_BY_ID } from "@/lib/data/archetypes";
import type { ArchetypeId } from "@/lib/types";
import { PersonaDetailsCard } from "@/components/persona/PersonaDetailsCard";
import { Badge, Button } from "@/components/ui";

export function PersonaPickerDialog({
  currentId,
  naturalId,
  onClose,
  onConfirm,
}: {
  currentId: ArchetypeId;
  naturalId: ArchetypeId;
  onClose: () => void;
  onConfirm: (personaId: ArchetypeId) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [selectedId, setSelectedId] = useState<ArchetypeId>(currentId);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previousOverflow = document.documentElement.style.overflow;

    document.documentElement.style.overflow = "hidden";
    if (!dialog.open) {
      previousFocusRef.current = document.activeElement as HTMLElement | null;
      dialog.showModal();
    }

    return () => {
      document.documentElement.style.overflow = previousOverflow;
    };
  }, []);

  const finishClose = () => {
    onClose();
    requestAnimationFrame(() => previousFocusRef.current?.focus());
  };

  const confirmSelection = () => {
    if (selectedId === currentId) return;
    onConfirm(selectedId);
    dialogRef.current?.close();
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="persona-picker-title"
      aria-describedby="persona-picker-description"
      onClose={finishClose}
      onClick={(event) => {
        if (event.target === dialogRef.current) dialogRef.current?.close();
      }}
      className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[min(60rem,calc(100%-2rem))] overflow-hidden rounded-3xl bg-transparent p-0 text-ink shadow-2xl backdrop:bg-black/55"
    >
      <div className="flex max-h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-3xl border border-line bg-paper">
        <header className="flex items-start gap-4 border-b border-line bg-paper px-5 py-5 sm:px-7">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">
              Choose what fits
            </p>
            <h2 id="persona-picker-title" className="mt-1 text-2xl font-semibold">
              Compare the six personas
            </h2>
            <p
              id="persona-picker-description"
              className="mt-2 max-w-2xl text-sm text-ink-soft"
            >
              Your result is a starting point. Choose the description that
              sounds most like the way you actually study.
            </p>
          </div>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="flex size-11 shrink-0 items-center justify-center rounded-xl text-ink-soft hover:bg-line-soft hover:text-ink"
            aria-label="Close persona chooser"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </header>

        <div className="overflow-y-auto px-5 py-6 sm:px-7">
          {currentId !== naturalId && (
            <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-brand-100 bg-brand-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-ink-soft">
                Your original result was{" "}
                <strong className="text-ink">
                  {ARCHETYPE_BY_ID[naturalId].name}
                </strong>
                .
              </p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setSelectedId(naturalId)}
              >
                Use my original result
              </Button>
            </div>
          )}

          <fieldset>
            <legend className="sr-only">Select your persona</legend>
            <div className="space-y-6">
              {ARCHETYPES.map((archetype) => {
                const isNatural = archetype.id === naturalId;
                const isCurrent = archetype.id === currentId;

                return (
                  <PersonaDetailsCard
                    key={archetype.id}
                    archetype={archetype}
                    headingLevel="h3"
                    compact
                    selection={{
                      inputId: `persona-option-${archetype.id}`,
                      name: "persona",
                      checked: selectedId === archetype.id,
                      onChange: () => setSelectedId(archetype.id),
                    }}
                    footer={
                      isNatural || isCurrent ? (
                        <div className="flex flex-wrap gap-2">
                          {isNatural && (
                            <Badge tone="brand">Original result</Badge>
                          )}
                          {isCurrent && <Badge>Current persona</Badge>}
                        </div>
                      ) : undefined
                    }
                  />
                );
              })}
            </div>
          </fieldset>
        </div>

        <footer className="flex flex-col-reverse gap-3 border-t border-line bg-paper px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
          <Button
            type="button"
            variant="ghost"
            onClick={() => dialogRef.current?.close()}
          >
            Keep current persona
          </Button>
          <Button
            type="button"
            onClick={confirmSelection}
            disabled={selectedId === currentId}
          >
            Use {ARCHETYPE_BY_ID[selectedId].name}
          </Button>
        </footer>
      </div>
    </dialog>
  );
}
