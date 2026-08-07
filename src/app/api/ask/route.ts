import { NextResponse } from "next/server";
import { generateAnswer } from "@/lib/ai/ask";
import { askRequestSchema } from "@/lib/ai/schema";

/**
 * Answers one of a fixed set of questions about the student's own plan.
 * The topic is an enum, not free text, so there is no prompt-injection surface
 * and no path for a student to send personal information to the provider.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = askRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const answer = await generateAnswer(parsed.data);
  return NextResponse.json(answer);
}
