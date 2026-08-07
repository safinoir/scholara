# 📚 Study Habit Builder — Project Plan

## Overview

A personalized study habit tool that helps students identify and build effective academic routines. Users either complete a personality/learning style quiz or input their existing academic habits, and the app responds with tailored study tips, techniques, and resources for college and career readiness.

* * *

## Goals

*   Help students understand their learning style and current habits
    
*   Deliver personalized, actionable study strategies
    
*   Bridge academic skill-building with long-term career preparedness
    
*   Be accessible to incoming college students and working learners alike
    

* * *

## Core Features

### 1. User Intake (Two Paths)

#### Path A — Personality & Learning Style Quiz

A short, guided quiz to identify the user's profile. Sample dimensions:

*   Learning style: Visual / Auditory / Reading-Writing / Kinesthetic (VARK)
    
*   Work style: Solo vs. collaborative
    
*   Time preference: Morning vs. evening
    
*   Focus style: Deep work sessions vs. short bursts (Pomodoro-friendly)
    
*   Stress/pressure response: Deadline-driven vs. planner
    

#### Path B — Existing Habit Intake

Users self-report their current habits via a structured form:

*   Current GPA range or academic confidence level
    
*   Subjects/majors they're pursuing
    
*   How they currently study (flashcards, re-reading, group study, etc.)
    
*   Pain points (procrastination, retention, time management, test anxiety)
    
*   Tools they already use (Notion, Anki, Google Calendar, etc.)
    

* * *

### 2. Personalized Recommendation Engine

Based on quiz/intake results, generate a customized profile with:

#### Study Technique Recommendations

*   **Spaced Repetition** — for memorization-heavy subjects
    
*   **Active Recall** — quizzing yourself instead of re-reading
    
*   **Pomodoro Technique** — for focus and procrastination issues
    
*   **Mind Mapping** — for visual learners and concept-heavy material
    
*   **Cornell Notes** — for lecture-heavy courses
    
*   **Feynman Technique** — for deep conceptual understanding
    
*   **Body Doubling / Group Study** — for social learners
    

#### Time Management Tips

*   Weekly planning templates
    
*   Time-blocking strategies
    
*   Prioritization frameworks (Eisenhower Matrix, 1-3-5 rule)
    

#### Environment & Wellness Habits

*   Optimal study environment setup
    
*   Sleep, nutrition, and focus connection
    
*   Digital distraction management
    

* * *

### 3. Resource Library

#### Academic Resources

*   Khan Academy, Coursera, YouTube EDU channels
    
*   Subject-specific tutoring platforms (Chegg, Wolfram Alpha, Quizlet)
    
*   University resources (office hours, writing centers, tutoring centers)
    

#### Productivity Tools

*   **Note-taking**: Notion, Obsidian, OneNote
    
*   **Flashcards/Recall**: Anki, Quizlet
    
*   **Scheduling**: Google Calendar, Todoist, Motion
    
*   **Focus**: Forest app, Be Focused, Focusmate
    

#### Career Preparedness

*   LinkedIn Learning courses tied to the user's major/field
    
*   Resume and cover letter writing guides
    
*   Internship and networking tips
    
*   Professional skill-building (communication, time management, project management)
    
*   Interview prep resources (Big Interview, Glassdoor, STAR method guides)
    

* * *

### 4. Progress Tracking (Optional / Future Feature)

*   Users set weekly study goals
    
*   Check-ins to monitor habit consistency
    
*   Habit streaks and lightweight gamification
    
*   Periodic re-assessment to update recommendations
    

* * *

## User Flow

```
Start
  ├── New User?
  │     ├── Take Quiz (Path A)
  │     └── Enter Habits (Path B)
  │
  ├── Generate Learner Profile
  │
  ├── Display Personalized Dashboard
  │     ├── Top 3 Recommended Study Techniques
  │     ├── Time Management Tips
  │     ├── Curated Resource Links
  │     └── Career Readiness Roadmap
  │
  └── (Optional) Set Goals → Track Progress → Re-assess
```

* * *

## Tech Considerations

| Layer | Options |
| --- | --- |
| Frontend | React, Vue, or simple HTML/CSS/JS |
| Backend | Node.js / Python (FastAPI or Flask) |
| Database | Firebase, Supabase, or SQLite |
| Auth | Google OAuth or email/password |
| AI Layer (optional) | NaviGator API / OpenAI for dynamic recommendations |

* * *

## Milestones

- [ ] [ ] 

**Phase 1** — Define quiz questions and intake form fields

- [ ] [ ] 

**Phase 2** — Build recommendation logic / matching engine

- [ ] [ ] 

**Phase 3** — Design and develop frontend UI

- [ ] [ ] 

**Phase 4** — Populate resource library

- [ ] [ ] 

**Phase 5** — User testing and feedback iteration

- [ ] [ ] 

**Phase 6** — Add progress tracking and gamification (stretch goal)

* * *

## Target Users

*   Incoming college freshmen
    
*   Current college students struggling with academic performance
    
*   Career changers building new learning habits
    
*   Anyone preparing for professional development
    

* * *

_Last updated: 2025_