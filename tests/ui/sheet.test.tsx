// @vitest-environment jsdom

import { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Sheet } from "@/components/ui/Sheet";
import "./dom";

function SheetHarness({ onClose }: { onClose: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open weekly changes
      </button>
      <Sheet
        open={open}
        onClose={() => {
          onClose();
          setOpen(false);
        }}
        title="Adjust this week"
        description="Review temporary changes before applying them."
      >
        <button type="button">Review changes</button>
      </Sheet>
    </>
  );
}

describe("Sheet", () => {
  it("exposes its accessible name and restores focus to the launcher", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<SheetHarness onClose={onClose} />);

    const launcher = screen.getByRole("button", {
      name: "Open weekly changes",
    });
    launcher.focus();
    await user.click(launcher);

    const dialog = screen.getByRole("dialog", { name: "Adjust this week" });
    expect(dialog.getAttribute("aria-describedby")).toBeTruthy();
    expect(dialog.hasAttribute("open")).toBe(true);
    expect(document.documentElement.style.overflow).toBe("hidden");

    await user.click(
      screen.getByRole("button", { name: "Close adjust this week" }),
    );

    await waitFor(() => expect(document.activeElement).toBe(launcher));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(dialog.hasAttribute("open")).toBe(false);
    expect(document.documentElement.style.overflow).toBe("");
  });
});
