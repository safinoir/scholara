import type { AxisMeta, FrictionMeta } from "@/lib/types";

export const AXIS_META: AxisMeta[] = [
  {
    id: "rhythm",
    label: "Rhythm",
    lowLabel: "Sprinter",
    highLabel: "Marathoner",
    lowBlurb: "You do your best work in short, intense bursts.",
    highBlurb: "You need runway. Long uninterrupted blocks are where you click.",
    drives: "How long each study block is, and how often you break.",
  },
  {
    id: "structure",
    label: "Structure",
    lowLabel: "Improviser",
    highLabel: "Architect",
    lowBlurb: "Rigid schedules feel like a cage, and you abandon them.",
    highBlurb: "A plan on paper is what makes the work actually happen.",
    drives: "Whether your week is a fixed grid or a flexible menu.",
  },
  {
    id: "social",
    label: "Company",
    lowLabel: "Solo",
    highLabel: "Collaborative",
    lowBlurb: "Other people are noise. You focus best alone.",
    highBlurb: "You think out loud, and other people keep you honest.",
    drives: "Group study, body doubling, and accountability partners.",
  },
  {
    id: "input",
    label: "Format",
    lowLabel: "Verbal",
    highLabel: "Spatial",
    lowBlurb: "You process ideas through words — writing them, saying them.",
    highBlurb: "You need to see the shape of it: diagrams, maps, relationships.",
    drives: "The format your notes and study materials take.",
  },
  {
    id: "drive",
    label: "Fuel",
    lowLabel: "Pressure",
    highLabel: "Curiosity",
    lowBlurb: "Deadlines are what get you moving. Nothing else quite does.",
    highBlurb: "Interest drives you. Forced work stalls out fast.",
    drives: "Whether we build in artificial deadlines or follow your interest.",
  },
  {
    id: "clock",
    label: "Peak hours",
    lowLabel: "Early bird",
    highLabel: "Night owl",
    lowBlurb: "Your sharpest thinking happens before noon.",
    highBlurb: "You come alive after dark.",
    drives: "Which hours get your hardest material.",
  },
];

export const AXIS_BY_ID = Object.fromEntries(
  AXIS_META.map((a) => [a.id, a]),
) as Record<AxisMeta["id"], AxisMeta>;

export const FRICTION_META: FrictionMeta[] = [
  {
    id: "procrastination",
    label: "I put things off until the last minute",
    blurb: "Starting is the hard part, not the work itself.",
  },
  {
    id: "distraction",
    label: "I can't stay focused",
    blurb: "Your phone, tabs, or your own thoughts pull you away.",
  },
  {
    id: "retention",
    label: "I forget what I studied",
    blurb: "It made sense last night and it's gone by the exam.",
  },
  {
    id: "test-anxiety",
    label: "I blank out on tests",
    blurb: "You know the material until the paper is in front of you.",
  },
  {
    id: "overwhelm",
    label: "There's too much and I don't know where to start",
    blurb: "The workload is a wall instead of a list.",
  },
  {
    id: "time-scarcity",
    label: "I genuinely don't have enough hours",
    blurb: "Work, family, or commuting eats the day.",
  },
  {
    id: "no-quiet-space",
    label: "I don't have a quiet place to study",
    blurb: "Roommates, family, or a loud home make focus hard.",
  },
  {
    id: "motivation",
    label: "I've lost motivation",
    blurb: "You can't find a reason to care about the material.",
  },
  {
    id: "reading-load",
    label: "The reading load is crushing me",
    blurb: "Hundreds of pages a week and no system for them.",
  },
  {
    id: "math-heavy",
    label: "My hardest courses are problem-based",
    blurb: "Math, physics, engineering, or coding-heavy work.",
  },
];

export const FRICTION_BY_ID = Object.fromEntries(
  FRICTION_META.map((f) => [f.id, f]),
) as Record<FrictionMeta["id"], FrictionMeta>;
