import { AXES, type ArchetypeId, type AxisScores, type Friction } from "@/lib/types";
import { ARCHETYPE_IDS, FRICTIONS } from "@/lib/types";

/**
 * A shareable card needs only the persona, axes, and reported obstacles.
 * Encoding that bounded profile in the URL keeps this legacy route serverless.
 */
export type SharePayload = {
  primary: ArchetypeId;
  secondary: ArchetypeId;
  axes: AxisScores;
  frictions: Friction[];
};

function toBase64Url(input: string): string {
  const base64 =
    typeof window === "undefined"
      ? Buffer.from(input, "utf8").toString("base64")
      : window.btoa(input);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(input: string): string {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  return typeof window === "undefined"
    ? Buffer.from(padded, "base64").toString("utf8")
    : window.atob(padded);
}

/**
 * Compact positional format: archetype indexes, then axis scores as base-36,
 * then friction indexes. Keeps shared URLs short enough to paste anywhere.
 */
export function encodeShare(payload: SharePayload): string {
  const primary = ARCHETYPE_IDS.indexOf(payload.primary);
  const secondary = ARCHETYPE_IDS.indexOf(payload.secondary);
  const axes = AXES.map((axis) => payload.axes[axis]).join(",");
  const frictions = payload.frictions
    .map((f) => FRICTIONS.indexOf(f))
    .filter((i) => i >= 0)
    .join(".");

  return toBase64Url(`1|${primary}|${secondary}|${axes}|${frictions}`);
}

export function decodeShare(code: string): SharePayload | null {
  try {
    const parts = fromBase64Url(code).split("|");
    if (parts.length !== 5 || parts[0] !== "1") return null;

    const primary = ARCHETYPE_IDS[Number(parts[1])];
    const secondary = ARCHETYPE_IDS[Number(parts[2])];
    if (!primary || !secondary) return null;

    const values = parts[3].split(",").map(Number);
    if (values.length !== AXES.length || values.some(Number.isNaN)) return null;

    const axes = {} as AxisScores;
    AXES.forEach((axis, index) => {
      axes[axis] = Math.max(-100, Math.min(100, values[index]));
    });

    const frictions = parts[4]
      ? parts[4]
          .split(".")
          .map((i) => FRICTIONS[Number(i)])
          .filter((f): f is Friction => Boolean(f))
      : [];

    return { primary, secondary, axes, frictions };
  } catch {
    return null;
  }
}
