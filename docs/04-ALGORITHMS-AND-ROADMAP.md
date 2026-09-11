# Algorithms: Priority, Mastery, GPA & MVP Roadmap

## 8. Priority Algorithm

Configurable weights stored in `UserPreferences.priorityWeights`:

```text
defaults:
  weakness:         0.30
  examImportance:   0.25
  lecturerRelevance:0.20
  assessmentUrgency:0.15
  forgettingRisk:   0.10
```

### Component scores (each 0–100)

**Weakness** = `100 - overallMastery`

**Exam Importance** = `min(100, pastPaperFrequency * 12 + importanceWeight * 20)`  
Presented as historical evidence, not prediction.

**Lecturer Relevance**
- Current lecturer topic → 100  
- Within 1 topic of lecturer → 70  
- Within 2 topics → 40  
- Else → 10  
- Topic beyond lecturer (not yet taught) → 5 (deprioritize unless assessment forces it)

**Assessment Urgency**
- Linked assessment within 3 days → 100  
- Within 7 days → 75  
- Within 14 days → 45  
- Else → 0  
(Topics tagged via course assessments + past-paper topic tags)

**Forgetting Risk**
- Never reviewed & mastery ≥ 76 → based on days since last review  
- Spaced schedule overdue → 100  
- Formula: `min(100, daysSinceReview / expectedInterval * 100)`

### Final priority

```text
Priority =
  weakness         * w.weakness +
  examImportance   * w.examImportance +
  lecturerRelevance* w.lecturerRelevance +
  assessmentUrgency* w.assessmentUrgency +
  forgettingRisk   * w.forgettingRisk
```

Sort descending. Categorize recommendation as CURRENT / CATCH_UP / REVISION based on lecturer position and mastery band.

### Gap detection (not “N topics behind”)

For each topic with `orderIndex <= lecturer.orderIndex`:
- Classify: Exam-ready / Strong / Developing / Weak / Newly introduced
- Newly introduced = lecturer topic and mastery < 30
- Surface top gaps by `(100 - mastery) * importanceWeight`

---

## 9. Mastery Calculation

### Manual update
Student sets components; overall:

```text
overall =
  understanding * 0.25 +
  recall        * 0.25 +
  application   * 0.25 +
  examQuestions * 0.25
```

Weights configurable later.

### Quiz / session influence

After a completed study session with test accuracy `A` (0–100):

```text
delta = (A - overall) * 0.35   # pull toward evidence, dampened
newOverall = clamp(overall + delta, 0, 100)

# Component nudges:
examQuestions ← blend(examQuestions, A, 0.4)
recall        ← blend(recall, session.recallSelfScore ?? A*0.9, 0.3)
application   ← blend(application, A, 0.3)
understanding ← blend(understanding, max(understanding, A*0.8), 0.25)
```

`blend(old, new, rate) = old*(1-rate) + new*rate`

Levels displayed from overall score bands (see ERD).

---

## 10. GPA Calculation Design

### Configurable scale (example 4.0)

```json
[
  { "letter": "A",  "min": 80, "points": 4.0 },
  { "letter": "A-", "min": 75, "points": 3.7 },
  { "letter": "B+", "min": 70, "points": 3.3 },
  { "letter": "B",  "min": 65, "points": 3.0 },
  { "letter": "B-", "min": 60, "points": 2.7 },
  { "letter": "C+", "min": 55, "points": 2.3 },
  { "letter": "C",  "min": 50, "points": 2.0 },
  { "letter": "F",  "min": 0,  "points": 0.0 }
]
```

### Semester GPA

```text
SGPA = Σ(gradePoints_i × creditHours_i) / Σ(creditHours_i)
```

### Cumulative GPA
Same across all completed graded courses.

### Target tracking (no guarantees)

```text
progressTowardTarget = min(100, (currentGpa / targetGpa) * 100)
```

**Required performance** (remaining ungraded courses):
Solve for average grade points `R` needed on remaining credits `Cr` given completed quality points `Q` and credits `Cc`:

```text
target = (Q + R*Cr) / (Cc + Cr)
R = (target*(Cc+Cr) - Q) / Cr
```

Map `R` to nearest letter band and show advisory text, e.g.  
“Aim for A grades in remaining courses.”  
If `R > max scale`, state that target may be unreachable with remaining credits alone.

### Link to mastery
Dashboard can show risk flags when low mastery correlates with high-weight upcoming assessments — advisory only.

---

## 11. Recovery Logic

When weekly completion rate < 70% or sessions missed ≥ 2:

1. Do **not** dump all remaining targets onto tomorrow.
2. Re-score unfinished targets with priority engine.
3. Keep at most `ceil(remaining * 0.4)` as “tomorrow focus”.
4. Roll the rest into week with adjusted deadlines.
5. Shift allocation toward catch-up if behind mode triggers.

---

## 12. MVP Development Roadmap

### Phase 1 — MVP (this implementation pass)
- [x] Design docs
- [ ] Auth (JWT)
- [ ] Courses + Topics + Subtopics
- [ ] Lecturer progress (Track A)
- [ ] Topic mastery (Track B)
- [ ] Gap tracking API + UI
- [ ] Weekly targets (CRUD + generate + roll)
- [ ] Study sessions (5-step workflow)
- [ ] Dashboard (Study Next, GPA placeholder, gaps)
- [ ] Priority engine (core formula without past papers)

### Phase 2
- Assessments, GPA calculator, revision tracking
- Notifications, analytics charts

### Phase 3
- Past papers, question bank, topic frequency
- Full prioritization with exam importance

### Phase 4
- Advanced recommendations, richer analytics, smarter recovery

---

## Implementation Order (per module)

1. Explain purpose  
2. Entity  
3. DTOs  
4. Service  
5. Controller  
6. Validation  
7. API endpoints  
8. Frontend store + API  
9. UI  
10. End-to-end workflow test  

No dead buttons. Every control must hit a real endpoint.
