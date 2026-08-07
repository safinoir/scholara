import { describe, expect, it } from "vitest";
import { decodeShare, encodeShare } from "@/lib/share";
import type { SharePayload } from "@/lib/share";

const PAYLOAD: SharePayload = {
  primary: "cartographer",
  secondary: "architect",
  axes: {
    rhythm: 60,
    structure: -35,
    social: 0,
    input: 90,
    drive: 45,
    clock: -20,
  },
  frictions: ["retention", "no-quiet-space"],
};

describe("share codes", () => {
  it("round-trips a payload exactly", () => {
    expect(decodeShare(encodeShare(PAYLOAD))).toEqual(PAYLOAD);
  });

  it("handles an empty friction list", () => {
    const payload = { ...PAYLOAD, frictions: [] };
    expect(decodeShare(encodeShare(payload))).toEqual(payload);
  });

  it("produces URL-safe codes", () => {
    expect(encodeShare(PAYLOAD)).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("rejects malformed input instead of throwing", () => {
    expect(decodeShare("not-a-real-code")).toBeNull();
    expect(decodeShare("")).toBeNull();
  });

  it("clamps out-of-range axis values", () => {
    const tampered = encodeShare({
      ...PAYLOAD,
      axes: { ...PAYLOAD.axes, rhythm: 9999 },
    });
    expect(decodeShare(tampered)?.axes.rhythm).toBe(100);
  });
});
