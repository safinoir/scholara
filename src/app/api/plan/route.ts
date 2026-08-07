import { NextResponse } from "next/server";
import { generateCoaching } from "@/lib/ai/coaching";
import { coachingRequestSchema } from "@/lib/ai/schema";

/**
 * Coaching prose for an already-built plan. The plan itself is generated
 * client-side by the deterministic engine and posted here only so the model has
 * something concrete to talk about. This route can never change the schedule.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = coachingRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const coaching = await generateCoaching(parsed.data);
  return NextResponse.json(coaching);
}
