import { NextResponse } from "next/server";
import {
  interpretWeekNote,
  weekTuningRequestSchema,
  type WeekTuningResult,
} from "@/lib/ai/tuning";

export const MAX_TUNING_REQUEST_BYTES = 32_768;

const invalidRequest = () =>
  NextResponse.json({ error: "Invalid request" }, { status: 400 });

export async function POST(request: Request) {
  const lengthHeader = request.headers.get("content-length");
  if (lengthHeader !== null) {
    const contentLength = Number(lengthHeader);
    if (
      !Number.isInteger(contentLength) ||
      contentLength < 0 ||
      contentLength > MAX_TUNING_REQUEST_BYTES
    ) {
      return invalidRequest();
    }
  }

  let body: unknown;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > MAX_TUNING_REQUEST_BYTES) {
      return invalidRequest();
    }
    body = JSON.parse(raw);
  } catch {
    return invalidRequest();
  }

  const parsed = weekTuningRequestSchema.safeParse(body);
  if (!parsed.success) return invalidRequest();

  let result: WeekTuningResult;
  try {
    result = await interpretWeekNote(parsed.data);
  } catch {
    result = { source: "unavailable", proposal: null };
  }

  return NextResponse.json(result);
}
