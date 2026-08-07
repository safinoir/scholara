import type { Technique } from "@/lib/types";

/**
 * Every technique here is drawn from cognitive-science research on learning.
 * The `evidence` field grades how strong that support is — this is deliberate.
 * The persona decides *delivery* (when, how long, with whom, in what format);
 * the evidence decides *what* gets recommended in the first place.
 */
export const TECHNIQUES: Technique[] = [
  // -------------------------------------------------------------------------
  // Encoding & retention
  // -------------------------------------------------------------------------
  {
    id: "retrieval-practice",
    name: "Retrieval Practice",
    category: "encoding",
    blurb:
      "Close the book and pull the information out of your head instead of reading it again.",
    steps: [
      "Read or review a section once, then close everything.",
      "On a blank page, write down everything you can remember.",
      "Only then open your notes and mark what you missed.",
      "Focus your next pass exclusively on the gaps you found.",
    ],
    timeCost: "low",
    evidence: "strong",
    evidenceNote:
      "One of the most consistently supported findings in learning research. Testing yourself beats re-reading in nearly every controlled comparison.",
    axisWeights: { drive: -10 },
    fixes: ["retention", "test-anxiety", "time-scarcity"],
    archetypeBoost: { sprinter: 12, anchor: 8 },
    toolIds: ["anki", "quizlet"],
    sessionMinutes: 25,
  },
  {
    id: "spaced-repetition",
    name: "Spaced Repetition",
    category: "encoding",
    blurb:
      "Review material at widening intervals so you revisit it right as you're about to forget it.",
    steps: [
      "After learning something new, review it the next day.",
      "Review again three days later, then a week later.",
      "Anything you get wrong resets to a short interval.",
      "Let software handle the scheduling if you can — it's better at it than you.",
    ],
    timeCost: "low",
    evidence: "strong",
    evidenceNote:
      "The spacing effect is over a century old and has held up across ages, subjects, and study designs.",
    axisWeights: { structure: 25 },
    fixes: ["retention", "time-scarcity", "math-heavy"],
    archetypeBoost: { architect: 12, anchor: 12 },
    toolIds: ["anki", "quizlet"],
    sessionMinutes: 20,
  },
  {
    id: "interleaving",
    name: "Interleaving",
    category: "encoding",
    blurb:
      "Mix problem types within one session instead of doing thirty of the same kind in a row.",
    steps: [
      "Gather problems from two or three related topics.",
      "Shuffle them so you can't predict what comes next.",
      "Force yourself to identify which method applies before solving.",
      "Expect this to feel harder than blocked practice. That's the point.",
    ],
    timeCost: "medium",
    evidence: "strong",
    evidenceNote:
      "Especially well supported in math and problem-based subjects. It feels worse during practice and produces better test performance.",
    axisWeights: { rhythm: 15 },
    fixes: ["math-heavy", "test-anxiety"],
    archetypeBoost: { cartographer: 8 },
    toolIds: ["khan-academy", "paul-notes"],
    sessionMinutes: 45,
  },
  {
    id: "feynman",
    name: "The Feynman Technique",
    category: "encoding",
    blurb:
      "Explain the concept in plain language, as if to someone who's never heard of it.",
    steps: [
      "Write the concept's name at the top of a blank page.",
      "Explain it in ordinary words, no jargon, as if to a twelve-year-old.",
      "Wherever you get stuck or reach for jargon, that's a real gap — go back to the source.",
      "Rewrite the explanation until it flows without any borrowed vocabulary.",
    ],
    timeCost: "medium",
    evidence: "strong",
    evidenceNote:
      "A practical form of self-explanation, which has robust support for building conceptual understanding and exposing illusions of knowing.",
    axisWeights: { input: -25, drive: 20 },
    fixes: ["retention", "motivation"],
    archetypeBoost: { connector: 15, explorer: 10 },
    toolIds: ["obsidian", "campus-tutoring"],
    sessionMinutes: 30,
  },
  {
    id: "elaborative-interrogation",
    name: "Ask Why Relentlessly",
    category: "encoding",
    blurb:
      "For every fact you meet, ask why it's true and how it fits what you already know.",
    steps: [
      "For each claim in your notes, write the question 'why is this true?'",
      "Answer it in your own words, using something you already understand.",
      "Then ask how it connects to the topic you covered last week.",
      "Flag anything you can't explain — that's your study list.",
    ],
    timeCost: "medium",
    evidence: "moderate",
    evidenceNote:
      "Elaborative interrogation shows reliable benefits, strongest when you already have some background knowledge in the subject.",
    axisWeights: { drive: 30, input: -15 },
    fixes: ["retention", "motivation", "reading-load"],
    archetypeBoost: { explorer: 15, cartographer: 8 },
    toolIds: ["obsidian", "notion"],
    sessionMinutes: 30,
  },
  {
    id: "dual-coding",
    name: "Dual Coding & Concept Maps",
    category: "encoding",
    blurb:
      "Pair words with visuals — diagram the relationships, don't just list the facts.",
    steps: [
      "Put the central concept in the middle of a blank page.",
      "Branch out to the major sub-ideas and label every connecting line.",
      "Redraw it from memory the next day without looking.",
      "Compare the two versions — the differences are your weak spots.",
    ],
    timeCost: "medium",
    evidence: "moderate",
    evidenceNote:
      "Combining verbal and visual representations aids understanding. Note: this is about representing information two ways, not about being a 'visual learner'.",
    axisWeights: { input: 55 },
    fixes: ["overwhelm", "retention", "reading-load"],
    archetypeBoost: { cartographer: 20 },
    toolIds: ["excalidraw", "obsidian"],
    sessionMinutes: 35,
  },
  {
    id: "cornell-notes",
    name: "Cornell Notes",
    category: "encoding",
    blurb:
      "Split the page into notes, cues, and a summary so your notes double as a self-quiz.",
    steps: [
      "Divide the page: narrow left column, wide right column, summary strip at the bottom.",
      "Take lecture notes in the right column only.",
      "Within a day, write questions in the left column that your notes answer.",
      "Cover the right side and answer your own questions from memory.",
    ],
    timeCost: "low",
    evidence: "moderate",
    evidenceNote:
      "The format itself is a convention, but it works because it builds in retrieval practice and summarizing, both of which are well supported.",
    axisWeights: { structure: 35, input: -30 },
    fixes: ["retention", "overwhelm", "reading-load"],
    archetypeBoost: { anchor: 15, architect: 10 },
    toolIds: ["notion", "onenote"],
    sessionMinutes: 20,
  },

  // -------------------------------------------------------------------------
  // Focus & initiation
  // -------------------------------------------------------------------------
  {
    id: "pomodoro",
    name: "Pomodoro (25/5)",
    category: "focus",
    blurb:
      "Twenty-five minutes of work, five minutes off, repeated. Short enough that starting isn't scary.",
    steps: [
      "Pick one specific task — not a subject, a task.",
      "Set a timer for 25 minutes and work only on that.",
      "When it rings, stop and take five minutes fully away from the desk.",
      "After four rounds, take a longer 20–30 minute break.",
    ],
    timeCost: "low",
    evidence: "promising",
    evidenceNote:
      "The specific 25/5 split isn't magic, but breaking work into timed blocks with real breaks has solid support for sustaining attention and reducing avoidance.",
    axisWeights: { rhythm: -55 },
    fixes: ["procrastination", "distraction", "overwhelm"],
    archetypeBoost: { sprinter: 20, anchor: 10 },
    toolIds: ["pomofocus", "forest"],
    sessionMinutes: 25,
  },
  {
    id: "deep-block",
    name: "90-Minute Deep Block",
    category: "focus",
    blurb:
      "One long protected stretch for the work that needs real runway to get into.",
    steps: [
      "Reserve 90 minutes with a defined outcome, not just a subject.",
      "Phone in another room. Not face down — another room.",
      "Work in one pass without checking anything.",
      "Take a full 20 minutes off afterward. This isn't optional if you want a second block.",
    ],
    timeCost: "high",
    evidence: "moderate",
    evidenceNote:
      "Sustained uninterrupted work reduces the cost of task-switching, which measurably degrades performance on complex cognitive work.",
    axisWeights: { rhythm: 60, structure: 20 },
    fixes: ["distraction", "math-heavy"],
    archetypeBoost: { architect: 18, cartographer: 15 },
    toolIds: ["cold-turkey", "forest"],
    sessionMinutes: 90,
  },
  {
    id: "five-minute-rule",
    name: "The Five-Minute Rule",
    category: "focus",
    blurb:
      "Commit to five minutes only. Permission to stop is what makes starting possible.",
    steps: [
      "Pick the task you're avoiding most.",
      "Promise yourself five minutes and genuinely mean it.",
      "Start on the easiest visible piece — open the doc, write one line.",
      "At five minutes, decide freely. Most of the time you'll keep going.",
    ],
    timeCost: "low",
    evidence: "promising",
    evidenceNote:
      "Lowering the activation cost of starting is well-established in behavior-change research, though the specific five-minute framing is practical rather than experimental.",
    axisWeights: { structure: -25, drive: -20 },
    fixes: ["procrastination", "overwhelm", "motivation"],
    archetypeBoost: { sprinter: 15, explorer: 12 },
    toolIds: ["pomofocus"],
    sessionMinutes: 15,
  },
  {
    id: "body-doubling",
    name: "Body Doubling",
    category: "focus",
    blurb:
      "Work alongside someone else, silently. Their presence is the whole mechanism.",
    steps: [
      "Find one person and agree on a time — in person or on a video call.",
      "State out loud what each of you will work on.",
      "Work in silence. This isn't a study group, and you aren't helping each other.",
      "Check in briefly at the end on what actually got done.",
    ],
    timeCost: "low",
    evidence: "promising",
    evidenceNote:
      "Widely reported to help with task initiation, particularly for people with ADHD. Evidence is largely practice-based rather than from large controlled trials.",
    axisWeights: { social: 65 },
    fixes: ["procrastination", "distraction", "motivation", "no-quiet-space"],
    archetypeBoost: { connector: 20 },
    toolIds: ["focusmate", "campus-library"],
    sessionMinutes: 50,
  },
  {
    id: "implementation-intentions",
    name: "If-Then Planning",
    category: "focus",
    blurb:
      "Decide in advance exactly when and where, so the decision isn't yours in the moment.",
    steps: [
      "Write it as a sentence: 'If it is Tuesday at 4pm, then I will review chapter 6 at the library.'",
      "Be specific about time and place. Vague intentions don't work.",
      "Add a recovery clause: 'If I miss it, then I do it Wednesday at 4pm.'",
      "Put the sentence somewhere you'll physically see it.",
    ],
    timeCost: "low",
    evidence: "strong",
    evidenceNote:
      "Implementation intentions have a large body of supporting research across health, academic, and behavioral goals.",
    axisWeights: { structure: 30, drive: -25 },
    fixes: ["procrastination", "motivation", "time-scarcity"],
    archetypeBoost: { anchor: 15, sprinter: 10, explorer: 8 },
    toolIds: ["google-calendar", "todoist"],
    sessionMinutes: 15,
  },

  // -------------------------------------------------------------------------
  // Planning & load
  // -------------------------------------------------------------------------
  {
    id: "time-blocking",
    name: "Time Blocking",
    category: "planning",
    blurb:
      "Give every study task a specific slot on the calendar instead of a spot on a list.",
    steps: [
      "List what has to happen this week and estimate each honestly.",
      "Place each one in a real calendar slot, around your fixed commitments.",
      "Add 25% buffer to every estimate. You are optimistic; the calendar shouldn't be.",
      "Leave at least one empty block for whatever goes wrong.",
    ],
    timeCost: "medium",
    evidence: "moderate",
    evidenceNote:
      "Specific, scheduled plans outperform to-do lists in follow-through research, largely by removing in-the-moment decisions.",
    axisWeights: { structure: 60 },
    fixes: ["overwhelm", "time-scarcity", "procrastination"],
    archetypeBoost: { architect: 20, anchor: 12 },
    toolIds: ["google-calendar", "notion"],
    sessionMinutes: 30,
  },
  {
    id: "eisenhower",
    name: "Urgent / Important Sort",
    category: "planning",
    blurb:
      "Sort work by urgency against importance so the loudest task stops winning by default.",
    steps: [
      "Draw a 2x2: urgent or not, important or not.",
      "Put every open task in a box.",
      "Do the urgent-and-important now; schedule important-but-not-urgent today.",
      "Be honest about what's genuinely neither, and drop it.",
    ],
    timeCost: "low",
    evidence: "promising",
    evidenceNote:
      "A practical prioritization heuristic rather than an experimental finding, but it reliably surfaces the important-not-urgent work that gets crowded out.",
    axisWeights: { structure: 30 },
    fixes: ["overwhelm", "time-scarcity"],
    archetypeBoost: { architect: 10 },
    toolIds: ["todoist", "notion"],
    sessionMinutes: 20,
  },
  {
    id: "weekly-review",
    name: "The Weekly Review",
    category: "planning",
    blurb:
      "Thirty minutes once a week to look back, look forward, and reset. The keystone habit.",
    steps: [
      "Same time every week. Sunday evening works for most people.",
      "Check every syllabus for what's due in the next fourteen days.",
      "Ask what actually worked this week and what you're going to change.",
      "Block next week's study sessions before you close the laptop.",
    ],
    timeCost: "low",
    evidence: "moderate",
    evidenceNote:
      "Regular self-monitoring and reflection are core components of self-regulated learning, which correlates strongly with academic achievement.",
    axisWeights: { structure: 40 },
    fixes: ["overwhelm", "time-scarcity", "procrastination"],
    archetypeBoost: { architect: 12, anchor: 15, explorer: 10 },
    toolIds: ["notion", "google-calendar"],
    sessionMinutes: 30,
  },
  {
    id: "backwards-planning",
    name: "Backwards Planning",
    category: "planning",
    blurb:
      "Start at the due date and work backwards to today, so the first step is obvious.",
    steps: [
      "Write the deadline and what has to be finished by then.",
      "Work backwards in stages: final edit, full draft, outline, research, topic.",
      "Give each stage its own earlier deadline.",
      "Treat the first stage's deadline as the real one.",
    ],
    timeCost: "low",
    evidence: "moderate",
    evidenceNote:
      "Breaking distant goals into proximal sub-goals with their own deadlines improves completion rates and reduces procrastination in studies of student work.",
    axisWeights: { structure: 25, drive: -20 },
    fixes: ["procrastination", "overwhelm", "reading-load"],
    archetypeBoost: { sprinter: 15 },
    toolIds: ["todoist", "google-calendar"],
    sessionMinutes: 25,
  },

  // -------------------------------------------------------------------------
  // Exam & anxiety
  // -------------------------------------------------------------------------
  {
    id: "practice-testing",
    name: "Practice Under Real Conditions",
    category: "exam",
    blurb:
      "Take a full practice test the way you'll take the real one — timed, closed-book, no pausing.",
    steps: [
      "Find or build a full-length practice test.",
      "Match the real conditions: same time limit, no notes, no phone, one sitting.",
      "Grade it honestly and without stopping partway.",
      "Spend your study time only on what you got wrong.",
    ],
    timeCost: "high",
    evidence: "strong",
    evidenceNote:
      "Practice testing is among the highest-utility study techniques identified in reviews of learning research, and rehearsing under realistic conditions also reduces test anxiety.",
    axisWeights: { rhythm: 30 },
    fixes: ["test-anxiety", "retention", "math-heavy"],
    archetypeBoost: { architect: 10, cartographer: 8 },
    toolIds: ["khan-academy", "campus-tutoring"],
    sessionMinutes: 90,
  },
  {
    id: "brain-dump",
    name: "Pre-Exam Brain Dump",
    category: "exam",
    blurb:
      "Write out everything crowding your head right before the test to free up working memory.",
    steps: [
      "Ten minutes before the exam, take a blank page.",
      "Write every formula, date, and mnemonic you're afraid of losing.",
      "Then write, in a sentence, what you're anxious about. Yes, actually write it.",
      "Set the page aside. You've offloaded it.",
    ],
    timeCost: "low",
    evidence: "moderate",
    evidenceNote:
      "Brief expressive writing before a high-stakes test has been shown to improve performance for test-anxious students by freeing up working memory.",
    axisWeights: {},
    fixes: ["test-anxiety", "overwhelm"],
    toolIds: ["campus-counseling"],
    sessionMinutes: 10,
  },
  {
    id: "error-log",
    name: "Keep an Error Log",
    category: "exam",
    blurb:
      "Record every mistake and why you made it. Patterns show up within two weeks.",
    steps: [
      "Keep one running document per course.",
      "For each mistake, log the problem, your answer, the right answer, and the cause.",
      "Sort causes into: didn't know it, misread it, careless slip.",
      "Review the log before every exam. Your top pattern is your study plan.",
    ],
    timeCost: "low",
    evidence: "moderate",
    evidenceNote:
      "Error analysis and self-monitoring are well supported components of deliberate practice, particularly in problem-based subjects.",
    axisWeights: { structure: 30, input: -15 },
    fixes: ["math-heavy", "test-anxiety", "retention"],
    archetypeBoost: { architect: 12, anchor: 10 },
    toolIds: ["notion", "obsidian"],
    sessionMinutes: 20,
  },
];

export const TECHNIQUE_BY_ID = Object.fromEntries(
  TECHNIQUES.map((t) => [t.id, t]),
) as Record<string, Technique>;
