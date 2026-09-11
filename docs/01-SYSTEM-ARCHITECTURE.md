# Personal Academic Study Management System — Architecture

## 1. System Architecture

### Purpose

A mastery-first study management platform that continuously answers:

> Given where my lecturers are, what I have mastered, what I am weak at, what assessments are coming, and my goal of a 3.75–4.00 GPA, what should I do next?

### High-Level Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                     Vue 3 SPA (Frontend)                    │
│  Pinia Stores · Vue Router · Tailwind · Chart.js            │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS / JSON REST
┌──────────────────────────▼──────────────────────────────────┐
│                   NestJS API (Backend)                      │
│  Auth (JWT) · Domain Modules · Priority Engine · Analytics  │
└──────────────────────────┬──────────────────────────────────┘
                           │ TypeORM
┌──────────────────────────▼──────────────────────────────────┐
│                     PostgreSQL                              │
│  Users · Courses · Topics · Mastery · Plans · GPA · etc.    │
└─────────────────────────────────────────────────────────────┘
```

### Backend Modules

| Module | Responsibility |
|--------|----------------|
| AuthModule | Register, login, JWT, password hashing |
| UserModule | Profile, target GPA, study preferences |
| CourseModule | Courses, credit hours, lecturer, semester |
| TopicModule | Topics, subtopics, importance weights |
| LectureModule | Lecturer progress track (Track A) |
| MasteryModule | Student mastery scores & components (Track B) |
| GapModule | Lecturer-vs-student gap analysis |
| StudySessionModule | 5-step session workflow |
| WeeklyPlanModule | Outcome-based weekly targets + roll-forward |
| AssessmentModule | Assignments, tests, exams |
| PastPaperModule | Papers, questions, topic frequency |
| QuestionModule | Practice questions linked to topics |
| RevisionModule | Spaced-review scheduling |
| GpaModule | Grades, semester/cumulative GPA, target tracking |
| PriorityModule | Study-next recommendation engine |
| AnalyticsModule | Dashboard aggregates & charts |
| NotificationModule | Optional useful alerts |
| RecoveryModule | Redistribute unfinished work after missed days |

### Frontend Structure

```text
src/
  views/          # Route-level pages
  components/     # Reusable UI
  stores/         # Pinia state
  api/            # Axios/fetch clients
  types/          # Shared TypeScript types
  composables/    # Shared logic hooks
  router/         # Route definitions
```

### Design Principles (enforced in code)

1. Mastery over completion  
2. Current + catch-up run in parallel  
3. Plans are flexible (roll-forward + recovery)  
4. Weakness drives priority  
5. Evidence over guessing  
6. Consistency over perfection  
7. The system adapts weekly  

---

## 2. Two-Track Learning Model

```text
Course
 ├── Track A: LecturerProgress (currentTopicId, updatedAt)
 └── Track B: TopicMastery[] (score 0–100 per topic)

Gap Detector compares A vs B → prioritized gap list
Priority Engine mixes gaps + assessments + past papers + revision
Weekly Plan allocates: CURRENT / CATCH_UP / REVISION
```

Allocation defaults (user-configurable):

| Mode | Current | Catch-up | Revision |
|------|---------|----------|----------|
| Normal | 40% | 40% | 20% |
| Significantly behind | 30% | 50% | 20% |

"Significantly behind" = average mastery of topics up to lecturer position < 50%, or ≥ 3 topics below exam-ready threshold (90%).
