import type { Resource, ResourceCategory } from "@/lib/types";

/**
 * Every resource carries an explicit cost tag. This catalog includes only
 * resources a student can begin using without paying.
 */
export const RESOURCE_CATALOG_REVIEWED = "August 2026";

export const RESOURCES: Resource[] = [
  // -------------------------------------------------------------------------
  // Study skills
  // -------------------------------------------------------------------------
  {
    id: "cornell-learning-strategies",
    name: "Cornell Learning Strategies Center",
    category: "study-skills",
    cost: "free",
    blurb:
      "College-focused guides to retrieval practice, note-taking, reading, exam preparation, and building a study schedule.",
    url: "https://lsc.cornell.edu/how-to-study/",
    frictionFit: [
      "retention",
      "test-anxiety",
      "overwhelm",
      "time-scarcity",
      "reading-load",
    ],
  },
  {
    id: "learning-scientists",
    name: "The Learning Scientists",
    category: "study-skills",
    cost: "free",
    blurb:
      "Research-informed posters and guides to retrieval practice, spacing, interleaving, elaboration, and dual coding.",
    url: "https://www.learningscientists.org/downloadable-materials",
    frictionFit: ["retention", "time-scarcity", "math-heavy"],
  },

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
      "Notes, databases, and trackers in one workspace. Eligible college students can use a school email to get a free Plus plan for a one-member workspace.",
    url: "https://www.notion.com/help/notion-for-education",
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
    cost: "free-tier",
    blurb:
      "Spaced-repetition flashcards with automatic review scheduling. The desktop app and AnkiDroid are free; the official iOS app is paid.",
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
      "A free personal calendar for time-blocking classes, deadlines, and study sessions. Some schools also provide it through Google Workspace.",
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
      "Task capture, priorities, and recurring dates. The free Beginner plan supports up to five active personal projects; calendar layout and deadlines require Pro.",
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
    cost: "free-tier",
    blurb:
      "A customizable browser Pomodoro timer with free timing and task features. Projects, exports, integrations, and ad removal are premium.",
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
      "A gamified focus timer that grows a virtual forest while you stay on task. Access, pricing, and optional upgrades vary by platform.",
    url: "https://www.forestapp.cc",
    frictionFit: ["distraction"],
  },
  {
    id: "cold-turkey",
    name: "Cold Turkey Blocker",
    category: "focus",
    cost: "free-tier",
    blurb:
      "A desktop distraction blocker. The free edition blocks websites for timed sessions; app blocking, schedules, and advanced locks require Pro.",
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
      "Virtual body-doubling sessions with a matched partner. The free plan includes three sessions per week.",
    url: "https://www.focusmate.com",
    axisFit: { social: 60 },
    frictionFit: ["procrastination", "motivation", "no-quiet-space"],
  },
  {
    id: "study-together",
    name: "StudyStream",
    category: "focus",
    cost: "free-tier",
    blurb:
      "Live virtual focus rooms for studying alongside other students. Free access is available, with optional subscriptions for additional features.",
    url: "https://www.studystream.live",
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
      "Free materials from thousands of MIT courses. What is included varies by course, and OCW does not provide enrollment, credit, or certificates.",
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
      "Free notes, examples, and practice problems for algebra, Calculus I-III, and differential equations.",
    url: "https://tutorial.math.lamar.edu",
    frictionFit: ["math-heavy"],
    fieldFit: ["stem", "business"],
  },
  {
    id: "osmosis-anatomy",
    name: "Ninja Nerd",
    category: "subject",
    cost: "free-tier",
    blurb:
      "Detailed health-science video lectures and podcasts are available free; premium notes, illustrations, quizzes, and flashcards cost extra.",
    url: "https://ninjanerd.org/",
    fieldFit: ["health"],
    frictionFit: ["retention"],
  },
  {
    id: "openstax",
    name: "OpenStax",
    category: "subject",
    cost: "free",
    blurb:
      "Peer-reviewed, openly licensed textbooks are free online. Printed copies are available separately at low cost.",
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
      "Paste in a draft to get a free readability score and highlights for hard-to-read sentences. AI rewriting is a separate trial or paid feature.",
    url: "https://hemingwayapp.com/readability-checker",
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
      "Evidence-informed guidance on learning differences and the accommodations and services that may be available in college.",
    url: "https://www.understood.org/en/articles/types-of-college-accommodations-and-services",
    frictionFit: ["distraction", "procrastination", "overwhelm"],
  },
  {
    id: "otter",
    name: "Otter.ai",
    category: "accessibility",
    cost: "free-tier",
    blurb:
      "Live transcription with limited file imports. The free Basic plan includes 300 minutes per month plus conversation and history limits; follow class recording rules.",
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
      "Browse its campus partner directory, then ask your school's basic-needs office about local pantry or meal-swipe support.",
    url: "https://swipehunger.org/campus-partners/",
    frictionFit: ["time-scarcity", "motivation"],
  },
  {
    id: "fafsa",
    name: "FAFSA & your financial aid office",
    category: "basic-needs",
    cost: "free",
    blurb:
      "Use the official federal site to apply for and manage aid. If your finances change, ask your school's aid office whether its policy allows an adjustment.",
    url: "https://studentaid.gov/h/apply-for-aid/fafsa",
    frictionFit: ["time-scarcity"],
  },
  {
    id: "library-textbooks",
    name: "Course reserves at your library",
    category: "basic-needs",
    cost: "free",
    blurb:
      "Many campus libraries lend some required texts through course reserves. Check the catalog early because titles, loan periods, and availability vary.",
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
      "Sleep supports learning, attention, and memory formation. Protecting sleep is part of studying, especially before high-stakes work.",
    url: "https://www.nhlbi.nih.gov/health/sleep-deprivation/health-effects",
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
      "Use Situation, Task, Action, and Result to structure a specific response to a behavioral interview question.",
    url: "https://www.careercenter.illinois.edu/interviewingtips",
  },
  {
    id: "handshake",
    name: "Handshake",
    category: "career",
    cost: "free",
    blurb:
      "Search jobs, internships, fairs, and career-center offerings. Available features depend on your school's connection and partnership with Handshake.",
    url: "https://joinhandshake.com/students/",
  },
  {
    id: "linkedin-basics",
    name: "LinkedIn profile basics",
    category: "career",
    cost: "free",
    blurb:
      "LinkedIn's official guide to presenting your education, experience, skills, headline, and profile visibility.",
    url: "https://www.linkedin.com/help/linkedin/answer/a554351/how-do-i-create-a-good-linkedin-profile-?lang=en",
  },
  {
    id: "levels-fyi",
    name: "Levels.fyi",
    category: "career",
    cost: "free",
    blurb:
      "User-submitted compensation data by company, role, level, and location. Coverage varies, so compare more than one source before negotiating.",
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
      "Many colleges include peer or professional tutoring at no extra charge. Course coverage, eligibility, and appointment formats vary by school.",
    campus: true,
    frictionFit: ["math-heavy", "retention", "motivation"],
  },
  {
    id: "campus-writing",
    name: "The writing center",
    category: "campus",
    cost: "free",
    blurb:
      "Many campuses offer writing consultations at no extra charge. Availability and policies vary; an outline or early draft is enough to bring.",
    campus: true,
    frictionFit: ["reading-load", "overwhelm"],
  },
  {
    id: "campus-office-hours",
    name: "Office hours",
    category: "campus",
    cost: "free",
    blurb:
      "Instructor or teaching-assistant office hours are course support you can use for clarification and feedback. Bring one specific question.",
    campus: true,
    frictionFit: ["retention", "motivation", "math-heavy"],
  },
  {
    id: "campus-accessibility",
    name: "Disability & accessibility services",
    category: "campus",
    cost: "free",
    blurb:
      "Ask about reasonable accommodations for disability or health-related barriers. Eligibility, documentation, and available services vary, so start early.",
    campus: true,
    frictionFit: ["distraction", "test-anxiety", "no-quiet-space", "reading-load"],
  },
  {
    id: "campus-library",
    name: "Library study rooms & databases",
    category: "campus",
    cost: "free",
    blurb:
      "Your campus library may provide reservable study spaces, research help, databases, and course materials. Access and booking policies vary.",
    campus: true,
    frictionFit: ["no-quiet-space", "distraction", "reading-load"],
  },
  {
    id: "campus-counseling",
    name: "Counseling services",
    category: "campus",
    cost: "free",
    blurb:
      "Many colleges provide short-term counseling or referrals. Session limits, fees, scope, and urgent-care options vary by institution.",
    campus: true,
    frictionFit: ["test-anxiety", "motivation", "overwhelm"],
  },
  {
    id: "campus-career",
    name: "The career center",
    category: "campus",
    cost: "free",
    blurb:
      "Your career center may offer résumé reviews, mock interviews, job-search support, and employer events. Services and alumni access vary.",
    campus: true,
  },
  {
    id: "campus-advising",
    name: "Academic advising",
    category: "campus",
    cost: "free",
    blurb:
      "Advising can help interpret degree requirements, course sequencing, academic policies, and registration choices. Book early around registration.",
    campus: true,
    frictionFit: ["overwhelm"],
  },
];

export const RESOURCE_BY_ID = Object.fromEntries(
  RESOURCES.map((r) => [r.id, r]),
) as Record<string, Resource>;

export const CATEGORY_LABELS: Record<ResourceCategory, string> = {
  "study-skills": "Study skills guides",
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
