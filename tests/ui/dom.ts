import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  document.documentElement.style.overflow = "";
});

if (!HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
}

if (!HTMLDialogElement.prototype.close) {
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
}

window.requestAnimationFrame = (callback: FrameRequestCallback): number =>
  window.setTimeout(() => callback(performance.now()), 0);

window.cancelAnimationFrame = (handle: number): void => {
  window.clearTimeout(handle);
};
