import type { AxisQuestion, Field, YearLevel } from "@/lib/types";

/**
 * Twelve axis questions, two per axis. Each option carries axis points.
 * Two questions per axis at +/-60 max gives a natural range near +/-100
 * once averaged and clamped, without any single answer pinning an axis.
 */
export const AXIS_QUESTIONS: AxisQuestion[] = [
  {
    id: "rhythm-1",
    kind: "axis",
    prompt: "You've got three hours free and a big assignment. What actually happens?",
    options: [
      {
        label: "I work in short bursts with breaks between them",
        weights: { rhythm: -60 },
      },
      {
        label: "I mostly work straight through, with maybe one break",
        weights: { rhythm: 20 },
      },
      {
        label: "I lock in and lose track of time entirely",
        weights: { rhythm: 60 },
      },
      {
        label: "I bounce between tasks and never really settle",
        weights: { rhythm: -40, structure: -20 },
      },
    ],
  },
  {
    id: "rhythm-2",
    kind: "axis",
    prompt: "How long until your focus starts to fall apart?",
    options: [
      { label: "About 20 minutes", weights: { rhythm: -60 } },
      { label: "Around 45 minutes", weights: { rhythm: -15 } },
      { label: "An hour and a half or so", weights: { rhythm: 35 } },
      { label: "I can go for hours once I've started", weights: { rhythm: 60 } },
    ],
  },
  {
    id: "structure-1",
    kind: "axis",
    prompt: "You make a detailed study schedule on Sunday. By Wednesday...",
    options: [
      {
        label: "I'm following it closely — it's why the week works",
        weights: { structure: 60 },
      },
      {
        label: "I'm loosely on track and adjusting as I go",
        weights: { structure: 15 },
      },
      {
        label: "I've stopped looking at it",
        weights: { structure: -45 },
      },
      {
        label: "I never make one in the first place",
        weights: { structure: -60 },
      },
    ],
  },
  {
    id: "structure-2",
    kind: "axis",
    prompt: "Which sentence sounds more like you?",
    options: [
      {
        label: "A plan calms me down. Not knowing the plan is the stressful part",
        weights: { structure: 55 },
      },
      {
        label: "A plan boxes me in. I'd rather decide in the moment",
        weights: { structure: -55 },
      },
      {
        label: "I want structure but I never manage to keep it",
        weights: { structure: 10, drive: -20 },
      },
    ],
  },
  {
    id: "social-1",
    kind: "axis",
    prompt: "You're stuck on a concept you can't crack. First instinct?",
    options: [
      {
        label: "Keep digging on my own until it clicks",
        weights: { social: -55 },
      },
      {
        label: "Find someone to talk it through with",
        weights: { social: 55, input: -20 },
      },
      {
        label: "Look for a video or explanation online",
        weights: { social: -15 },
      },
      {
        label: "Post in the group chat and keep working meanwhile",
        weights: { social: 25 },
      },
    ],
  },
  {
    id: "social-2",
    kind: "axis",
    prompt: "Studying in the same room as other people, quietly, feels...",
    options: [
      { label: "Motivating — I get more done", weights: { social: 55 } },
      { label: "Fine, no strong feeling either way", weights: { social: 5 } },
      { label: "Distracting. I need to be alone", weights: { social: -55 } },
    ],
  },
  {
    id: "input-1",
    kind: "axis",
    prompt: "You need to understand how a complicated system works. You reach for...",
    options: [
      {
        label: "A diagram or map of how the pieces connect",
        weights: { input: 60 },
      },
      {
        label: "A written explanation I can read and annotate",
        weights: { input: -60 },
      },
      {
        label: "Explaining it out loud to somebody",
        weights: { input: -35, social: 30 },
      },
      {
        label: "Working through an example problem",
        weights: { input: 20 },
      },
    ],
  },
  {
    id: "input-2",
    kind: "axis",
    prompt: "Your notes mostly look like...",
    options: [
      { label: "Sentences and bullet points", weights: { input: -50 } },
      { label: "Arrows, boxes, and sketches", weights: { input: 55 } },
      { label: "A mix, depending on the class", weights: { input: 5 } },
      { label: "Honestly, I don't take many notes", weights: { input: -10, structure: -25 } },
    ],
  },
  {
    id: "drive-1",
    kind: "axis",
    prompt: "Be honest: when does the work actually get done?",
    options: [
      {
        label: "When the deadline is close enough to scare me",
        weights: { drive: -60 },
      },
      {
        label: "When I find the material genuinely interesting",
        weights: { drive: 60 },
      },
      {
        label: "When I've scheduled it and I'm sticking to the schedule",
        weights: { drive: 15, structure: 35 },
      },
      {
        label: "When someone is expecting it from me",
        weights: { drive: -25, social: 30 },
      },
    ],
  },
  {
    id: "drive-2",
    kind: "axis",
    prompt: "A required course you find boring. What's your realistic move?",
    options: [
      {
        label: "Do the minimum, as late as possible",
        weights: { drive: -50 },
      },
      {
        label: "Find an angle in it that I actually care about",
        weights: { drive: 55 },
      },
      {
        label: "Grind it out on a fixed schedule regardless of interest",
        weights: { drive: 5, structure: 40 },
      },
    ],
  },
  {
    id: "clock-1",
    kind: "axis",
    prompt: "Left completely to your own devices, when is your brain sharpest?",
    options: [
      { label: "Early morning", weights: { clock: -60 } },
      { label: "Late morning to midday", weights: { clock: -25 } },
      { label: "Late afternoon and evening", weights: { clock: 30 } },
      { label: "Late at night", weights: { clock: 60 } },
    ],
  },
  {
    id: "clock-2",
    kind: "axis",
    prompt: "An 8am class is...",
    options: [
      { label: "No problem, I'm already up", weights: { clock: -50 } },
      { label: "Survivable but not my best hour", weights: { clock: 10 } },
      { label: "A genuine mistake I regret every week", weights: { clock: 55 } },
    ],
  },
];

export const YEAR_OPTIONS: { value: YearLevel; label: string }[] = [
  { value: "hs-senior", label: "High school senior" },
  { value: "freshman", label: "College freshman" },
  { value: "sophomore", label: "Sophomore" },
  { value: "junior", label: "Junior" },
  { value: "senior", label: "Senior" },
  { value: "grad", label: "Graduate student" },
  { value: "returning", label: "Returning / adult learner" },
];

export const FIELD_OPTIONS: { value: Field; label: string }[] = [
  { value: "stem", label: "STEM / Engineering" },
  { value: "health", label: "Health / Pre-med / Nursing" },
  { value: "business", label: "Business / Economics" },
  { value: "humanities", label: "Humanities / Social science" },
  { value: "arts", label: "Arts / Design" },
  { value: "undecided", label: "Undecided" },
];

/** Total steps in the quiz: axis questions + the obstacle step. */
export const TOTAL_STEPS = AXIS_QUESTIONS.length + 1;
