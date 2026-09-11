# API Design, Frontend Pages & User Workflows

## 5. API Endpoint Design

Base: `/api/v1` · Auth: `Bearer <JWT>` unless noted.

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Create account |
| POST | `/auth/login` | Returns access token |
| GET | `/auth/me` | Current user + preferences |

### Courses
| Method | Path | Description |
|--------|------|-------------|
| GET | `/courses` | List courses |
| POST | `/courses` | Create course |
| GET | `/courses/:id` | Detail + topics + progress |
| PATCH | `/courses/:id` | Update |
| DELETE | `/courses/:id` | Soft/hard delete |

### Topics
| Method | Path | Description |
|--------|------|-------------|
| GET | `/courses/:id/topics` | Ordered topics + mastery |
| POST | `/courses/:id/topics` | Add topic |
| PATCH | `/topics/:id` | Update |
| DELETE | `/topics/:id` | Delete |
| POST | `/topics/:id/subtopics` | Add subtopic |

### Lecturer Progress (Track A)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/courses/:id/lecturer-progress` | Current position |
| PUT | `/courses/:id/lecturer-progress` | Set current topic |

### Mastery (Track B)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/topics/:id/mastery` | Components + overall |
| PUT | `/topics/:id/mastery` | Manual update |
| POST | `/topics/:id/mastery/from-quiz` | Update from quiz result |

### Gaps & Priority
| Method | Path | Description |
|--------|------|-------------|
| GET | `/courses/:id/gaps` | Gap analysis for course |
| GET | `/study/next` | Global study-next list |
| GET | `/study/allocation` | Suggested weekly split |

### Weekly Plans
| Method | Path | Description |
|--------|------|-------------|
| GET | `/weekly-targets?week=` | Targets for week |
| POST | `/weekly-targets` | Create target |
| POST | `/weekly-targets/generate` | Auto-generate from engine |
| PATCH | `/weekly-targets/:id` | Update status |
| POST | `/weekly-targets/roll-forward` | Intelligent roll |

### Study Sessions
| Method | Path | Description |
|--------|------|-------------|
| POST | `/study-sessions` | Start session |
| PATCH | `/study-sessions/:id` | Update step data |
| POST | `/study-sessions/:id/complete` | Finish + apply mastery |

### Assessments
| Method | Path | Description |
|--------|------|-------------|
| CRUD | `/assessments` | Full CRUD |
| GET | `/assessments/upcoming` | Next N days |

### Past Papers
| Method | Path | Description |
|--------|------|-------------|
| CRUD | `/past-papers` | Papers |
| POST | `/past-papers/:id/questions` | Add question + topics |
| GET | `/courses/:id/topic-frequency` | Historical frequency |

### GPA
| Method | Path | Description |
|--------|------|-------------|
| GET | `/gpa/dashboard` | Current, target, required |
| PUT | `/gpa/grades` | Upsert course grade |
| GET | `/gpa/scale` | Get grading scale |
| PUT | `/gpa/scale` | Configure scale |

### Analytics / Dashboard
| Method | Path | Description |
|--------|------|-------------|
| GET | `/dashboard` | Aggregated home payload |
| GET | `/analytics/mastery-by-course` | Chart data |
| GET | `/analytics/gpa-progression` | Chart data |
| GET | `/analytics/weekly-progress` | Chart data |
| GET | `/analytics/gaps` | Chart data |

### Recovery / Weekly Review / Notifications
| Method | Path | Description |
|--------|------|-------------|
| GET | `/recovery/plan` | Redistribute unfinished work |
| POST | `/weekly-reviews` | Submit review |
| GET | `/weekly-reviews/latest` | Latest review |
| GET | `/notifications` | List |
| PATCH | `/notifications/:id/read` | Mark read |

---

## 6. Frontend Page Structure

```text
/login, /register
/dashboard                 ← Study Next + GPA + gaps
/courses                   ← Course list
/courses/:id               ← Topics, Track A/B, gaps
/courses/:id/topics/:tid   ← Mastery detail, sessions
/study/next                ← Priority recommendations
/study/session/:id         ← 5-step workflow
/weekly-plan               ← Outcome targets
/assessments               ← Upcoming + history
/past-papers               ← Papers + frequency
/gpa                       ← GPA dashboard
/revision                  ← Due reviews
/weekly-review             ← End-of-week reflection
/settings                  ← Target GPA, allocation, scale
```

Primary persistent UI element: **Study Next** panel.

---

## 7. User Workflows

### Onboarding
1. Register → set target GPA (default 4.00)
2. Create semester + courses
3. Add ordered topics per course
4. Set lecturer position after first lecture
5. Seed initial mastery estimates
6. Generate first weekly plan

### After a lecture
1. Update lecturer progress to new topic
2. System recalculates gaps
3. Current-category targets update

### Daily study
1. Open Dashboard → Study Next
2. Start session on recommended topic
3. Recall → Learn → Practice → Test → Reflect
4. Mastery updates; priority engine refreshes

### End of week
1. Weekly review generated
2. Unfinished targets rolled with re-prioritization
3. Recovery plan if behind
4. Next week targets generated
