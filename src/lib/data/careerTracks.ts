import type { CareerStep, CareerTrack, Field, YearLevel } from "@/lib/types";

export const YEAR_ORDER: YearLevel[] = [
  "hs-senior",
  "freshman",
  "sophomore",
  "junior",
  "senior",
  "grad",
  "returning",
];

/** Steps every student needs, regardless of field. */
const SHARED_STEPS: CareerStep[] = [
  {
    id: "degree-map",
    title: "Map this semester to your degree requirements",
    detail:
      "Open your degree audit or program map. Mark required sequences, prerequisites, and one flexible choice, then take uncertainties to an academic advisor.",
    from: "hs-senior",
    resourceIds: ["campus-advising"],
  },
  {
    id: "course-evidence",
    title: "Save work that shows what you can do",
    detail:
      "Keep one strong project, paper, lab, or presentation from each term along with useful feedback. You can refine it later for a portfolio, application, or interview.",
    from: "freshman",
    resourceIds: ["campus-career", "notion"],
  },
  {
    id: "office-hours-relationship",
    title: "Use office hours to test your direction",
    detail:
      "Ask instructors how a course connects to later classes, research, or work in the field. Those conversations can clarify both the material and whether the path fits you.",
    from: "freshman",
    resourceIds: ["campus-office-hours"],
  },
  {
    id: "opportunity-test",
    title: "Test one possible next step",
    detail:
      "Choose one low-risk way to explore: a research conversation, internship, volunteer role, student organization, job shadow, or project outside class.",
    from: "sophomore",
    resourceIds: ["handshake", "campus-career"],
  },
  {
    id: "tell-your-story",
    title: "Practice explaining what you learned",
    detail:
      "Turn a class, work, or project example into a short story about the problem, your choices, and the result. This makes academic work useful in applications and interviews.",
    from: "sophomore",
    resourceIds: ["star-method", "campus-career"],
  },
  {
    id: "compare-options",
    title: "Compare options before committing",
    detail:
      "Compare role expectations, location, compensation, further education, and room to learn. Use several sources and bring questions to people who know the field.",
    from: "junior",
    resourceIds: ["levels-fyi", "campus-career"],
  },
];

const FIELD_STEPS: Record<Field, CareerStep[]> = {
  stem: [
    {
      id: "stem-portfolio",
      title: "Turn one course project into a portfolio piece",
      detail:
        "Choose a finished project that shows a real skill. Add context, explain your decisions, and make the result understandable to someone outside the class.",
      from: "freshman",
      resourceIds: ["mit-ocw"],
    },
    {
      id: "stem-research",
      title: "Explore how undergraduate research works",
      detail:
        "Read about faculty work that connects to a course you enjoyed, then ask what preparation, timing, and entry points are realistic for a student.",
      from: "sophomore",
      resourceIds: ["campus-office-hours"],
    },
  ],
  health: [
    {
      id: "health-hours",
      title: "Start logging clinical and volunteer hours",
      detail:
        "Track dates, hours, and supervisor contacts from day one. Reconstructing this later is miserable and applications require it.",
      from: "freshman",
      resourceIds: ["notion"],
    },
    {
      id: "health-shadow",
      title: "Observe a role before planning around it",
      detail:
        "When permitted, shadow or speak with someone in a role you are considering. Compare the day-to-day work with what you enjoy in your current courses.",
      from: "sophomore",
      resourceIds: ["campus-advising"],
    },
  ],
  business: [
    {
      id: "business-case",
      title: "Use one course project to practice applied analysis",
      detail:
        "Take a case, market, finance, or operations assignment beyond the grade: clarify the question, show the analysis, and explain a recommendation out loud.",
      from: "sophomore",
      resourceIds: ["campus-career", "star-method"],
    },
    {
      id: "business-excel",
      title: "Build practical spreadsheet fluency",
      detail:
        "Use a real class or organization problem to practice clean data, formulas, summaries, and charts instead of learning features without context.",
      from: "freshman",
      resourceIds: ["khan-academy"],
    },
  ],
  humanities: [
    {
      id: "humanities-writing",
      title: "Keep your strongest writing and feedback",
      detail:
        "Save strong papers with the assignment context and instructor feedback. Revise one after the course so it can become a future writing sample.",
      from: "freshman",
      resourceIds: ["campus-writing", "zotero"],
    },
    {
      id: "humanities-translate",
      title: "Name the skills inside your coursework",
      detail:
        "Identify where you researched, interpreted evidence, synthesized viewpoints, or communicated under a deadline, then describe those choices plainly.",
      from: "junior",
      resourceIds: ["campus-career"],
    },
  ],
  arts: [
    {
      id: "arts-portfolio",
      title: "Build a living portfolio across courses",
      detail:
        "Save finished work, process notes, and revisions as you go. A small body of clear work makes growth easier to see than one final project alone.",
      from: "freshman",
      resourceIds: ["campus-career"],
    },
    {
      id: "arts-business",
      title: "Learn the practical side of creative work",
      detail:
        "Ask how people in your area handle scope, pricing, credit, contracts, and payment. Practices vary, so learn before the first opportunity arrives.",
      from: "junior",
      resourceIds: ["campus-career"],
    },
  ],
  undecided: [
    {
      id: "undecided-explore",
      title: "Use one elective as a deliberate experiment",
      detail:
        "Choose an unfamiliar subject you are genuinely curious about, then notice the questions, assignments, and ways of thinking you want more of.",
      from: "freshman",
      resourceIds: ["campus-advising"],
    },
    {
      id: "undecided-informational",
      title: "Ask people how they chose their path",
      detail:
        "Talk with students, faculty, alumni, or professionals connected to areas you are considering. Ask what surprised them and what they would test sooner.",
      from: "freshman",
      resourceIds: ["linkedin-basics", "campus-career"],
    },
  ],
};

const TITLES: Record<Field, string> = {
  stem: "STEM & engineering",
  health: "Health & pre-med",
  business: "Business & economics",
  humanities: "Humanities & social science",
  arts: "Arts & design",
  undecided: "Still deciding",
};

const INTROS: Record<Field, string> = {
  stem: "Use technical courses to build foundations, test specialties, and create visible evidence of what you can make or investigate.",
  health: "Connect prerequisites, experience, and documentation early so each semester supports the programs and roles you are considering.",
  business: "Use coursework and early exploration to test which problems, functions, and working environments fit you before recruiting decisions arrive.",
  humanities: "Your courses build research, interpretation, and communication skills. Keep evidence of that work and learn to describe it clearly.",
  arts: "Let courses develop both your craft and a body of work, while you gradually learn how creative opportunities are structured.",
  undecided: "Undecided is a valid stage of discovery. Use courses and conversations as evidence instead of forcing a label before you have enough information.",
};

export function getCareerTrack(field: Field): CareerTrack {
  return {
    field,
    title: TITLES[field],
    intro: INTROS[field],
    steps: [...FIELD_STEPS[field], ...SHARED_STEPS].sort(
      (left, right) =>
        YEAR_ORDER.indexOf(left.from) - YEAR_ORDER.indexOf(right.from),
    ),
  };
}

/** True when a step is relevant at or before the student's current year. */
export function isStepDue(step: CareerStep, year: YearLevel): boolean {
  if (year === "returning" || year === "grad") return true;
  return YEAR_ORDER.indexOf(year) >= YEAR_ORDER.indexOf(step.from);
}
