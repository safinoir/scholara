import type { Archetype, ArchetypeId } from "@/lib/types";

/**
 * Archetypes are matched by cosine similarity against the user's axis vector.
 * Presented as a starting point, never a fixed identity.
 */
export const ARCHETYPES: Archetype[] = [
  {
    id: "architect",
    name: "The Architect",
    tagline: "Builds the system, then trusts it",
    description:
      "You do your best work inside a structure you designed yourself. Once the plan exists you can settle into long, focused stretches without renegotiating with yourself every day.",
    strengths: [
      "You follow through on plans you actually made",
      "Long focus blocks come naturally to you",
      "You work well without external accountability",
    ],
    watchOuts: [
      "One disrupted week can make the whole system feel broken",
      "You may over-plan instead of starting",
      "Isolation can hide gaps in your understanding",
    ],
    vector: {
      rhythm: 65,
      structure: 85,
      social: -50,
      input: 10,
      drive: 25,
      clock: -20,
    },
    accent: "#4f46e5",
    icon: "Compass",
  },
  {
    id: "sprinter",
    name: "The Sprinter",
    tagline: "Fast, intense, allergic to long sessions",
    description:
      "You move in bursts and you move fast. Pressure sharpens you, and a two-hour study block is where your attention goes to die. Your plan has to be built out of short reps, not long sittings.",
    strengths: [
      "You produce a lot in a short window",
      "Deadlines focus you instead of paralyzing you",
      "Short sessions mean you can study in gaps others waste",
    ],
    watchOuts: [
      "Cramming feels effective but memory fades fast",
      "Without a deadline nearby, work doesn't start",
      "Burst intensity can tip into burnout",
    ],
    vector: {
      rhythm: -85,
      structure: -45,
      social: 0,
      input: 5,
      drive: -70,
      clock: 35,
    },
    accent: "#e11d48",
    icon: "Zap",
  },
  {
    id: "connector",
    name: "The Connector",
    tagline: "Learns by talking it through",
    description:
      "Ideas don't fully land until you've said them out loud to somebody. You're energized by other people, and the fastest route into a hard concept is usually a conversation about it.",
    strengths: [
      "Explaining material to others locks it in for you",
      "You spot your own gaps quickly in discussion",
      "Accountability from other people genuinely works on you",
    ],
    watchOuts: [
      "Group study can drift into socializing",
      "You may avoid the solo reps that memory actually requires",
      "Depending on others makes your schedule fragile",
    ],
    vector: {
      rhythm: -25,
      structure: 5,
      social: 90,
      input: -55,
      drive: 20,
      clock: 15,
    },
    accent: "#0891b2",
    icon: "Users",
  },
  {
    id: "cartographer",
    name: "The Cartographer",
    tagline: "Needs to see how it all connects",
    description:
      "You can't hold a topic until you can see its shape. Lists of facts slide off you, but a map of how the pieces relate sticks permanently. You'll go deep once the terrain makes sense.",
    strengths: [
      "Strong grasp of how concepts relate, not just what they are",
      "You retain structured knowledge unusually well",
      "You're comfortable in long, deep sessions",
    ],
    watchOuts: [
      "Making beautiful diagrams can replace actual recall practice",
      "You may stall on material until the big picture appears",
      "Detail-heavy memorization needs deliberate extra work",
    ],
    vector: {
      rhythm: 60,
      structure: 35,
      social: -25,
      input: 90,
      drive: 40,
      clock: 0,
    },
    accent: "#059669",
    icon: "Network",
  },
  {
    id: "explorer",
    name: "The Explorer",
    tagline: "Follows interest, resists rigid plans",
    description:
      "Curiosity is your engine. When a topic grabs you, you go far past what was assigned — and when it doesn't, no schedule on earth will make you sit down. Your plan has to leave room to wander.",
    strengths: [
      "Deep, self-directed learning when interest strikes",
      "You make connections outside the syllabus",
      "You learn things nobody assigned you",
    ],
    watchOuts: [
      "Required-but-boring courses quietly slide",
      "Rigid schedules get abandoned within days",
      "Interest-driven work can mean uneven coverage before exams",
    ],
    vector: {
      rhythm: 25,
      structure: -80,
      social: 15,
      input: 40,
      drive: 90,
      clock: 40,
    },
    accent: "#d97706",
    icon: "Telescope",
  },
  {
    id: "anchor",
    name: "The Anchor",
    tagline: "Steady, consistent, thrown off by chaos",
    description:
      "You are the person who shows up. Not in dramatic bursts, but in reliable, moderate sessions that add up. Your risk isn't laziness — it's that a disrupted routine takes real effort to rebuild.",
    strengths: [
      "Consistency over time beats intensity, and you have it",
      "Routine makes starting almost automatic for you",
      "You rarely need a crisis to do the work",
    ],
    watchOuts: [
      "A broken week can take a while to recover from",
      "Steady effort can hide ineffective methods",
      "You may under-push on the hardest material",
    ],
    vector: {
      rhythm: -30,
      structure: 75,
      social: 20,
      input: -20,
      drive: -15,
      clock: -45,
    },
    accent: "#7c3aed",
    icon: "Anchor",
  },
];

export const ARCHETYPE_BY_ID = Object.fromEntries(
  ARCHETYPES.map((a) => [a.id, a]),
) as Record<ArchetypeId, Archetype>;
