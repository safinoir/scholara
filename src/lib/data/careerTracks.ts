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
    id: "resume",
    title: "Build a one-page résumé now, not later",
    detail:
      "Coursework, projects, and any job counts. The career center reviews it for free, and they're least busy early in the fall.",
    from: "hs-senior",
    resourceIds: ["campus-career"],
  },
  {
    id: "office-hours-relationship",
    title: "Become known to two professors",
    detail:
      "Go to office hours with a specific question, three times. Those two people write your recommendation letters in two years.",
    from: "freshman",
    resourceIds: ["campus-office-hours"],
  },
  {
    id: "linkedin",
    title: "Set up a real LinkedIn profile",
    detail:
      "Photo, honest headline, coursework, and any project. Recruiters do search it, and it takes an hour once.",
    from: "freshman",
    resourceIds: ["linkedin-basics", "handshake"],
  },
  {
    id: "first-internship",
    title: "Apply to more things than feels reasonable",
    detail:
      "Most internship listings for your school are on Handshake. Applying to twenty is normal; applying to three is why it feels impossible.",
    from: "sophomore",
    resourceIds: ["handshake", "campus-career"],
  },
  {
    id: "interviews",
    title: "Learn the STAR format and rehearse out loud",
    detail:
      "Situation, Task, Action, Result. Write five stories from coursework or work, then say them out loud. Free mock interviews at the career center.",
    from: "sophomore",
    resourceIds: ["star-method", "campus-career"],
  },
  {
    id: "negotiate",
    title: "Know the salary number before you're asked",
    detail:
      "Free public data exists for nearly every role and city. Not knowing it is the most expensive hour you'll ever skip.",
    from: "junior",
    resourceIds: ["levels-fyi"],
  },
];

const FIELD_STEPS: Record<Field, CareerStep[]> = {
  stem: [
    {
      id: "stem-portfolio",
      title: "Put two projects somewhere public",
      detail:
        "A GitHub repo with a readable README beats a line on a résumé. Two finished small things beat one unfinished big thing.",
      from: "freshman",
      resourceIds: ["mit-ocw"],
    },
    {
      id: "stem-research",
      title: "Ask a professor about research",
      detail:
        "Undergrad research positions are frequently unfilled because nobody asks. Email three professors whose work you actually read.",
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
      title: "Shadow someone in the role you want",
      detail:
        "One day of shadowing tells you more than a year of coursework about whether you want the job.",
      from: "sophomore",
      resourceIds: ["campus-advising"],
    },
  ],
  business: [
    {
      id: "business-case",
      title: "Practice case interviews with a person",
      detail:
        "Consulting and finance recruiting starts earlier than you expect — often sophomore year. Case practice only works out loud.",
      from: "sophomore",
      resourceIds: ["campus-career", "star-method"],
    },
    {
      id: "business-excel",
      title: "Get genuinely good at spreadsheets",
      detail:
        "Not impressive, just non-negotiable. Free tutorials cover everything you need in a weekend.",
      from: "freshman",
      resourceIds: ["khan-academy"],
    },
  ],
  humanities: [
    {
      id: "humanities-writing",
      title: "Keep your three best papers",
      detail:
        "Writing samples are requested constantly for jobs, grants, and grad school. Save them now with the professor's feedback.",
      from: "freshman",
      resourceIds: ["campus-writing", "zotero"],
    },
    {
      id: "humanities-translate",
      title: "Learn to translate your skills",
      detail:
        "You can research, synthesize, and write clearly under deadline. Employers want that; they just don't recognize the major names for it.",
      from: "junior",
      resourceIds: ["campus-career"],
    },
  ],
  arts: [
    {
      id: "arts-portfolio",
      title: "Keep a living portfolio, not a graduation project",
      detail:
        "Ten finished pieces you can show today beats one perfect thesis piece nobody has seen.",
      from: "freshman",
      resourceIds: ["campus-career"],
    },
    {
      id: "arts-business",
      title: "Learn invoicing and contracts early",
      detail:
        "Most arts careers are freelance. Knowing how to price work and get paid is the actual skill nobody teaches you.",
      from: "junior",
      resourceIds: ["campus-career"],
    },
  ],
  undecided: [
    {
      id: "undecided-explore",
      title: "Take one course purely out of curiosity",
      detail:
        "Deciding requires data. One elective in an unfamiliar department tells you more than any career quiz.",
      from: "freshman",
      resourceIds: ["campus-advising"],
    },
    {
      id: "undecided-informational",
      title: "Have three informational conversations",
      detail:
        "Twenty minutes each with people doing jobs you're curious about. Most say yes, and it costs nothing.",
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
  stem: "Technical fields reward visible work. The habit that gets you the GPA is the same one that finishes the side project.",
  health: "Health paths are documentation-heavy and start early. Track everything from the beginning and the applications get much easier.",
  business: "Business recruiting runs on a calendar most students discover too late. Knowing the timeline is half the advantage.",
  humanities: "Your skills are real and in demand; the work is learning to name them in language employers already use.",
  arts: "Creative careers are mostly self-managed. Treat the business side as a craft you're also learning.",
  undecided: "Undecided is a normal place to be. Treat it as a research question with a deadline, not a personal failing.",
};

export function getCareerTrack(field: Field): CareerTrack {
  return {
    field,
    title: TITLES[field],
    intro: INTROS[field],
    steps: [...FIELD_STEPS[field], ...SHARED_STEPS],
  };
}

/** True when a step is relevant at or before the student's current year. */
export function isStepDue(step: CareerStep, year: YearLevel): boolean {
  if (year === "returning" || year === "grad") return true;
  return YEAR_ORDER.indexOf(year) >= YEAR_ORDER.indexOf(step.from);
}
