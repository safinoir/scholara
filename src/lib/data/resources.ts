import type { Resource, ResourceCategory } from "@/lib/types";

/**
 * Every resource carries an explicit cost tag. Paid options are hidden by
 * default in the UI — students shouldn't have to pay to study effectively.
 */
export const RESOURCES: Resource[] = [
  // -------------------------------------------------------------------------
  // Notes
  // -------------------------------------------------------------------------
  {
    id: "obsidian",
    name: "Obsidian",
    category: "notes",
    cost: "free",
    blurb:
      "Local, plain-text notes with links between them. Free for personal use, and your notes stay on your machine.",
    url: "https://obsidian.md",
    axisFit: { input: 40, structure: 30 },
    frictionFit: ["retention", "overwhelm"],
  },
  {
    id: "notion",
    name: "Notion",
    category: "notes",
    cost: "free-tier",
    blurb:
      "All-in-one notes, databases, and trackers. The free plan is generous, and students can verify for more.",
    url: "https://www.notion.so",
    axisFit: { structure: 45 },
    frictionFit: ["overwhelm", "time-scarcity"],
  },
  {
    id: "onenote",
    name: "Microsoft OneNote",
    category: "notes",
    cost: "free",
    blurb:
      "Free, syncs everywhere, and handles handwriting and diagrams well. Often already included with your school account.",
    url: "https://www.onenote.com",
    axisFit: { input: 25 },
    frictionFit: ["reading-load"],
  },
  {
    id: "excalidraw",
    name: "Excalidraw",
    category: "notes",
    cost: "free",
    blurb:
      "Open a tab and start diagramming. No account needed, nothing to install, ideal for concept maps.",
    url: "https://excalidraw.com",
    axisFit: { input: 70 },
    frictionFit: ["overwhelm", "retention"],
  },

  // -------------------------------------------------------------------------
  // Recall
  // -------------------------------------------------------------------------
  {
    id: "anki",
    name: "Anki",
    category: "recall",
    cost: "free",
    blurb:
      "The serious spaced-repetition tool. Free on desktop and Android, and it handles the review scheduling for you.",
    url: "https://apps.ankiweb.net",
    axisFit: { structure: 35 },
    frictionFit: ["retention", "time-scarcity", "math-heavy"],
  },
  {
    id: "quizlet",
    name: "Quizlet",
    category: "recall",
    cost: "free-tier",
    blurb:
      "Fast flashcard creation with a large library of existing sets. Core studying is free.",
    url: "https://quizlet.com",
    frictionFit: ["retention", "test-anxiety"],
  },

  // -------------------------------------------------------------------------
  // Scheduling
  // -------------------------------------------------------------------------
  {
    id: "google-calendar",
    name: "Google Calendar",
    category: "scheduling",
    cost: "free",
    blurb:
      "The simplest way to time-block. Free, and you almost certainly already have it through your school.",
    url: "https://calendar.google.com",
    axisFit: { structure: 50 },
    frictionFit: ["time-scarcity", "overwhelm", "procrastination"],
  },
  {
    id: "todoist",
    name: "Todoist",
    category: "scheduling",
    cost: "free-tier",
    blurb:
      "Clean task capture with recurring due dates. The free tier covers everything a student needs.",
    url: "https://todoist.com",
    axisFit: { structure: 40 },
    frictionFit: ["overwhelm", "procrastination"],
  },
  {
    id: "syllabus-sync",
    name: "Put every syllabus date in one calendar",
    category: "scheduling",
    cost: "free",
    blurb:
      "Not an app — a 45-minute task in week one. Every due date, exam, and drop deadline in one place ends most scheduling panic for the term.",
    axisFit: { structure: 35 },
    frictionFit: ["overwhelm", "time-scarcity", "procrastination"],
  },

  // -------------------------------------------------------------------------
  // Focus
  // -------------------------------------------------------------------------
  {
    id: "pomofocus",
    name: "Pomofocus",
    category: "focus",
    cost: "free",
    blurb: "A browser Pomodoro timer with task tracking. No signup, no install.",
    url: "https://pomofocus.io",
    axisFit: { rhythm: -50 },
    frictionFit: ["procrastination", "distraction"],
  },
  {
    id: "forest",
    name: "Forest",
    category: "focus",
    cost: "free-tier",
    blurb:
      "Plant a tree that dies if you leave your phone. Silly, and it works on a lot of people.",
    url: "https://www.forestapp.cc",
    frictionFit: ["distraction"],
  },
  {
    id: "cold-turkey",
    name: "Cold Turkey Blocker",
    category: "focus",
    cost: "free-tier",
    blurb:
      "Blocks sites and apps hard enough that you can't easily talk yourself out of it. Free version is sufficient.",
    url: "https://getcoldturkey.com",
    axisFit: { rhythm: 30 },
    frictionFit: ["distraction", "procrastination"],
  },
  {
    id: "focusmate",
    name: "Focusmate",
    category: "focus",
    cost: "free-tier",
    blurb:
      "Pairs you with a stranger for a silent 50-minute video work session. Free tier includes a few sessions per week.",
    url: "https://www.focusmate.com",
    axisFit: { social: 60 },
    frictionFit: ["procrastination", "motivation", "no-quiet-space"],
  },
  {
    id: "study-together",
    name: "Study Together",
    category: "focus",
    cost: "free",
    blurb:
      "Free Discord-based study rooms with timers, running around the clock. Good body-doubling at 2am.",
    url: "https://www.studytogether.com",
    axisFit: { social: 55 },
    frictionFit: ["motivation", "no-quiet-space", "procrastination"],
  },

  // -------------------------------------------------------------------------
  // Subject help
  // -------------------------------------------------------------------------
  {
    id: "khan-academy",
    name: "Khan Academy",
    category: "subject",
    cost: "free",
    blurb:
      "Completely free lessons and practice problems, strongest in math and science fundamentals.",
    url: "https://www.khanacademy.org",
    frictionFit: ["math-heavy", "retention"],
    fieldFit: ["stem", "health", "business", "undecided"],
  },
  {
    id: "mit-ocw",
    name: "MIT OpenCourseWare",
    category: "subject",
    cost: "free",
    blurb:
      "Real MIT course materials, lectures, and problem sets with solutions. Free, no registration.",
    url: "https://ocw.mit.edu",
    frictionFit: ["math-heavy"],
    fieldFit: ["stem", "business"],
  },
  {
    id: "paul-notes",
    name: "Paul's Online Math Notes",
    category: "subject",
    cost: "free",
    blurb:
      "The clearest free calculus and algebra notes on the internet, with worked practice problems.",
    url: "https://tutorial.math.lamar.edu",
    frictionFit: ["math-heavy"],
    fieldFit: ["stem", "business"],
  },
  {
    id: "osmosis-anatomy",
    name: "Osmosis / Ninja Nerd (YouTube)",
    category: "subject",
    cost: "free",
    blurb:
      "Free video explanations of physiology and pathology that health students consistently rate highly.",
    url: "https://www.youtube.com/@NinjaNerdOfficial",
    fieldFit: ["health"],
    frictionFit: ["retention"],
  },
  {
    id: "openstax",
    name: "OpenStax",
    category: "subject",
    cost: "free",
    blurb:
      "Peer-reviewed college textbooks, genuinely free. Check here before buying any required text.",
    url: "https://openstax.org",
    frictionFit: ["reading-load"],
    fieldFit: ["stem", "health", "business", "humanities", "undecided"],
  },
  {
    id: "wolfram-alpha",
    name: "Wolfram Alpha",
    category: "subject",
    cost: "free-tier",
    blurb:
      "Checks your answers and shows steps on the paid tier. The free version still verifies results.",
    url: "https://www.wolframalpha.com",
    frictionFit: ["math-heavy"],
    fieldFit: ["stem", "business"],
  },

  // -------------------------------------------------------------------------
  // Writing
  // -------------------------------------------------------------------------
  {
    id: "purdue-owl",
    name: "Purdue OWL",
    category: "writing",
    cost: "free",
    blurb:
      "The reference for MLA, APA, and Chicago formatting, plus solid guides on academic writing.",
    url: "https://owl.purdue.edu",
    frictionFit: ["reading-load"],
    fieldFit: ["humanities", "arts", "business", "undecided"],
  },
  {
    id: "zotero",
    name: "Zotero",
    category: "writing",
    cost: "free",
    blurb:
      "Free, open-source citation manager. Saves hours on any paper with a bibliography.",
    url: "https://www.zotero.org",
    axisFit: { structure: 30 },
    frictionFit: ["overwhelm", "reading-load"],
    fieldFit: ["humanities", "health", "stem", "arts"],
  },
  {
    id: "hemingway",
    name: "Hemingway Editor",
    category: "writing",
    cost: "free",
    blurb:
      "Paste a draft in the browser and it flags dense, unclear sentences. Free, nothing to install.",
    url: "https://hemingwayapp.com",
    fieldFit: ["humanities", "business", "arts"],
  },

  // -------------------------------------------------------------------------
  // Accessibility
  // -------------------------------------------------------------------------
  {
    id: "speechify-alt",
    name: "Built-in text-to-speech",
    category: "accessibility",
    cost: "free",
    blurb:
      "Your phone and laptop already read text aloud (iOS Speak Screen, Android Select to Speak, Edge Read Aloud). Useful for large reading loads.",
    frictionFit: ["reading-load", "distraction"],
  },
  {
    id: "adhd-understood",
    name: "Understood.org",
    category: "accessibility",
    cost: "free",
    blurb:
      "Free, evidence-informed guidance on ADHD and learning differences, including how to ask for accommodations.",
    url: "https://www.understood.org",
    frictionFit: ["distraction", "procrastination", "overwhelm"],
  },
  {
    id: "otter",
    name: "Otter.ai",
    category: "accessibility",
    cost: "free-tier",
    blurb:
      "Transcribes lectures so you can listen instead of frantically writing. Free tier covers several hours a month.",
    url: "https://otter.ai",
    frictionFit: ["reading-load", "distraction"],
  },

  // -------------------------------------------------------------------------
  // Basic needs & money
  // -------------------------------------------------------------------------
  {
    id: "swipe-out-hunger",
    name: "Swipe Out Hunger",
    category: "basic-needs",
    cost: "free",
    blurb:
      "Find campus food pantries and meal-swipe programs. Studying badly on an empty stomach isn't a discipline problem.",
    url: "https://www.swipehunger.org",
    frictionFit: ["time-scarcity", "motivation"],
  },
  {
    id: "fafsa",
    name: "FAFSA & your financial aid office",
    category: "basic-needs",
    cost: "free",
    blurb:
      "Filing is free, and aid offices can adjust awards mid-year if your circumstances change. Most students never ask.",
    url: "https://studentaid.gov",
    frictionFit: ["time-scarcity"],
  },
  {
    id: "library-textbooks",
    name: "Course reserves at your library",
    category: "basic-needs",
    cost: "free",
    blurb:
      "Most required textbooks are on reserve at your library for free. Check before spending $300.",
    frictionFit: ["time-scarcity", "reading-load"],
  },

  // -------------------------------------------------------------------------
  // Wellbeing
  // -------------------------------------------------------------------------
  {
    id: "sleep-basics",
    name: "Sleep is a study technique",
    category: "wellbeing",
    cost: "free",
    blurb:
      "Memory consolidation happens during sleep. An all-nighter trades away the exact process that stores what you studied.",
    frictionFit: ["retention", "motivation", "test-anxiety"],
  },
  {
    id: "988",
    name: "988 Suicide & Crisis Lifeline (US)",
    category: "wellbeing",
    cost: "free",
    blurb:
      "Call or text 988, any time, free and confidential. If things are bad, this comes before any study plan.",
    url: "https://988lifeline.org",
    frictionFit: ["motivation", "test-anxiety", "overwhelm"],
  },
  {
    id: "insight-timer",
    name: "Insight Timer",
    category: "wellbeing",
    cost: "free-tier",
    blurb:
      "Thousands of free guided meditations, including short ones for pre-exam anxiety.",
    url: "https://insighttimer.com",
    frictionFit: ["test-anxiety", "overwhelm"],
  },

  // -------------------------------------------------------------------------
  // Career
  // -------------------------------------------------------------------------
  {
    id: "star-method",
    name: "The STAR interview method",
    category: "career",
    cost: "free",
    blurb:
      "Situation, Task, Action, Result. The structure behind almost every behavioral interview answer.",
    url: "https://www.themuse.com/advice/star-interview-method",
  },
  {
    id: "handshake",
    name: "Handshake",
    category: "career",
    cost: "free",
    blurb:
      "Free through most schools, and where a large share of internship postings actually live.",
    url: "https://joinhandshake.com",
  },
  {
    id: "linkedin-basics",
    name: "LinkedIn profile basics",
    category: "career",
    cost: "free",
    blurb:
      "A photo, a real headline, and your coursework. Takes an hour and recruiters do search it.",
    url: "https://www.linkedin.com",
  },
  {
    id: "levels-fyi",
    name: "Levels.fyi / Glassdoor salary data",
    category: "career",
    cost: "free",
    blurb:
      "Know the number before you're asked. Free salary data by role and location.",
    url: "https://www.levels.fyi",
    fieldFit: ["stem", "business"],
  },

  // -------------------------------------------------------------------------
  // Campus — things the student already pays for via tuition
  // -------------------------------------------------------------------------
  {
    id: "campus-tutoring",
    name: "The tutoring center",
    category: "campus",
    cost: "free",
    blurb:
      "Already included in your tuition. Peer and professional tutoring for exactly the courses that are hardest.",
    campus: true,
    frictionFit: ["math-heavy", "retention", "motivation"],
  },
  {
    id: "campus-writing",
    name: "The writing center",
    category: "campus",
    cost: "free",
    blurb:
      "Free appointments to work through a draft with a trained reader. Bring an outline, not just a finished paper.",
    campus: true,
    frictionFit: ["reading-load", "overwhelm"],
  },
  {
    id: "campus-office-hours",
    name: "Office hours",
    category: "campus",
    cost: "free",
    blurb:
      "The most underused resource in higher education. Most professors sit alone during them. Go with one specific question.",
    campus: true,
    frictionFit: ["retention", "motivation", "math-heavy"],
  },
  {
    id: "campus-accessibility",
    name: "Disability & accessibility services",
    category: "campus",
    cost: "free",
    blurb:
      "Formal accommodations — extra time, quiet rooms, note-takers — for ADHD, anxiety, learning disabilities, and chronic illness. You do not need a perfect diagnosis to start the conversation.",
    campus: true,
    frictionFit: ["distraction", "test-anxiety", "no-quiet-space", "reading-load"],
  },
  {
    id: "campus-library",
    name: "Library study rooms & databases",
    category: "campus",
    cost: "free",
    blurb:
      "Bookable quiet rooms, plus journal access worth thousands a year that you already paid for.",
    campus: true,
    frictionFit: ["no-quiet-space", "distraction", "reading-load"],
  },
  {
    id: "campus-counseling",
    name: "Counseling services",
    category: "campus",
    cost: "free",
    blurb:
      "Usually a set number of free sessions per year. Test anxiety and burnout are squarely within what they handle.",
    campus: true,
    frictionFit: ["test-anxiety", "motivation", "overwhelm"],
  },
  {
    id: "campus-career",
    name: "The career center",
    category: "campus",
    cost: "free",
    blurb:
      "Free résumé reviews, mock interviews, and employer connections — and they're least busy in the fall.",
    campus: true,
  },
  {
    id: "campus-advising",
    name: "Academic advising",
    category: "campus",
    cost: "free",
    blurb:
      "For degree requirements, course sequencing, and the paperwork nobody explains. Go before registration opens, not after.",
    campus: true,
    frictionFit: ["overwhelm"],
  },
];

export const RESOURCE_BY_ID = Object.fromEntries(
  RESOURCES.map((r) => [r.id, r]),
) as Record<string, Resource>;

export const CATEGORY_LABELS: Record<ResourceCategory, string> = {
  notes: "Note-taking",
  recall: "Flashcards & recall",
  scheduling: "Scheduling",
  focus: "Focus & blocking",
  subject: "Subject help",
  writing: "Writing & citation",
  accessibility: "Accessibility",
  "basic-needs": "Money & basic needs",
  wellbeing: "Wellbeing",
  career: "Career",
  campus: "On campus",
};

export const COST_LABELS: Record<Resource["cost"], string> = {
  free: "Free",
  "free-tier": "Free tier",
  paid: "Paid",
};
