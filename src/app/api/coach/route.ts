import { NextResponse } from "next/server";
import { z } from "zod";
import { ARCHETYPE_BY_ID } from "@/lib/data/archetypes";
import { FRICTION_BY_ID } from "@/lib/data/axes";
import { TECHNIQUE_BY_ID } from "@/lib/data/techniques";
import { ARCHETYPE_IDS, FRICTIONS } from "@/lib/types";
import { chat } from "@/lib/ai/client";

/**
 * The short coaching paragraph on /results. Optional polish only: with no API
 * key, a failed call, or a timeout, the client shows the deterministic fallback.
 * The model rewords a rationale — it never selects techniques.
 */

const requestSchema = z.object({
  primary: z.enum(ARCHETYPE_IDS),
  frictions: z.array(z.enum(FRICTIONS)).max(10),
  techniqueIds: z.array(z.string().max(60)).max(5),
  hoursPerWeek: z.number().min(1).max(80),
  courseLoad: z.number().int().min(1).max(12),
});

function fallbackCoaching(input: z.infer<typeof requestSchema>): string {
  const archetype = ARCHETYPE_BY_ID[input.primary];
  const first = TECHNIQUE_BY_ID[input.techniqueIds[0]];
  const obstacle = input.frictions[0]
    ? FRICTION_BY_ID[input.frictions[0]].label.toLowerCase()
    : null;

  const parts = [
    `You're starting from ${archetype.name.replace("The ", "")} territory: ${archetype.tagline.toLowerCase()}.`,
    first
      ? `Start with ${first.name} this week and nothing else — one new technique at a time is how they stick.`
      : "Pick one technique for this week and ignore the rest.",
  ];

  if (obstacle) {
    parts.push(
      `Since you said "${obstacle}", judge the week on whether that specific thing got easier, not on hours logged.`,
    );
  }

  parts.push(
    `With ${input.hoursPerWeek} hours across ${input.courseLoad} course${input.courseLoad === 1 ? "" : "s"}, protect the sessions you have rather than trying to add more.`,
  );

  return parts.join(" ");
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const input = parsed.data;
  const fallback = fallbackCoaching(input);

  const archetype = ARCHETYPE_BY_ID[input.primary];
  const techniques = input.techniqueIds
    .map((id) => TECHNIQUE_BY_ID[id]?.name)
    .filter(Boolean)
    .join(", ");
  const obstacles = input.frictions
    .map((f) => FRICTION_BY_ID[f].label)
    .join("; ");

  const message = await chat({
    temperature: 0.7,
    maxTokens: 260,
    timeoutMs: 9000,
    messages: [
      {
        role: "system",
        content:
          "You are a study coach writing to a college student. Write one paragraph of 60-90 words. Be direct, warm, and concrete. Never use shame language, never say 'just' do something, and never invent new study techniques beyond the ones provided. Do not use bullet points, headings, markdown, or emojis.",
      },
      {
        role: "user",
        content: [
          `Learner persona: ${archetype.name} — ${archetype.tagline}.`,
          `Recommended techniques: ${techniques || "none"}.`,
          `Stated obstacles: ${obstacles || "none reported"}.`,
          `Available study time: ${input.hoursPerWeek} hours per week across ${input.courseLoad} courses.`,
          "Write encouragement that tells them exactly what to focus on first this week and why it suits them.",
        ].join("\n"),
      },
    ],
  });

  if (!message) {
    return NextResponse.json({ message: fallback, source: "fallback" });
  }

  return NextResponse.json({
    message: message.replace(/[*_`#]/g, "").trim(),
    source: "ai",
  });
}
