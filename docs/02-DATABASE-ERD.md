# Database ERD & Entity Relationships

## 3. Entity Relationship Diagram (logical)

```text
User 1──* Course
User 1──* StudySession
User 1──* WeeklyTarget
User 1──* Assessment
User 1──* Grade
User 1──* Notification
User 1──1 UserPreferences
User 1──* WeeklyReview

Course 1──* Topic
Course 1──1 LecturerProgress
Course 1──* Assessment
Course 1──* PastPaper
Course 1──* Grade

Topic 1──* Subtopic
Topic 1──1 TopicMastery
Topic 1──* StudySession
Topic 1──* WeeklyTarget
Topic 1──* RevisionRecord
Topic 1──* QuestionTopic

PastPaper 1──* Question
Question *──* Topic (via QuestionTopic)

Semester 1──* Course
Semester 1──* Grade
```

## 4. Entity Details

### User
| Field | Type | Notes |
|-------|------|-------|
| id | uuid PK | |
| email | varchar unique | |
| passwordHash | varchar | bcrypt |
| fullName | varchar | |
| targetGpa | decimal(3,2) | default 4.00 |
| createdAt / updatedAt | timestamptz | |

### UserPreferences
| Field | Type | Notes |
|-------|------|-------|
| userId | uuid FK | |
| allocationNormalCurrent | int | default 40 |
| allocationNormalCatchUp | int | default 40 |
| allocationNormalRevision | int | default 20 |
| allocationBehindCurrent | int | default 30 |
| allocationBehindCatchUp | int | default 50 |
| allocationBehindRevision | int | default 20 |
| behindThresholdTopics | int | default 3 |
| behindMasteryAvg | int | default 50 |
| priorityWeights (JSON) | jsonb | weakness, examImportance, etc. |
| gradingScale (JSON) | jsonb | configurable grade → points |

### Semester
| Field | Type |
|-------|------|
| id | uuid PK |
| userId | uuid FK |
| name | varchar |
| startDate / endDate | date |
| isActive | boolean |

### Course
| Field | Type | Notes |
|-------|------|-------|
| id | uuid PK | |
| userId | uuid FK | |
| semesterId | uuid FK nullable | |
| name | varchar | |
| code | varchar | |
| creditHours | decimal(3,1) | |
| lecturer | varchar | |
| description | text | |
| objectives | text | |
| color | varchar | UI accent |

### Topic
| Field | Type | Notes |
|-------|------|-------|
| id | uuid PK | |
| courseId | uuid FK | |
| title | varchar | |
| orderIndex | int | sequence in syllabus |
| importanceWeight | decimal(4,2) | default 1.0 |
| description | text | |

### Subtopic
| Field | Type |
|-------|------|
| id | uuid PK |
| topicId | uuid FK |
| title | varchar |
| orderIndex | int |

### LecturerProgress (Track A)
| Field | Type | Notes |
|-------|------|-------|
| id | uuid PK | |
| courseId | uuid FK unique | one per course |
| currentTopicId | uuid FK nullable | |
| notes | text | |
| updatedAt | timestamptz | |

### TopicMastery (Track B)
| Field | Type | Notes |
|-------|------|-------|
| id | uuid PK | |
| topicId | uuid FK unique | |
| userId | uuid FK | |
| overallScore | decimal(5,2) | 0–100 |
| understanding | decimal(5,2) | component |
| recall | decimal(5,2) | |
| application | decimal(5,2) | |
| examQuestions | decimal(5,2) | |
| lastReviewedAt | timestamptz | |
| updatedAt | timestamptz | |

**Mastery level bands:** 0 Not started · 1–25 Familiar · 26–50 Basic · 51–75 Developing · 76–89 Strong · 90–100 Exam ready

### StudySession
| Field | Type | Notes |
|-------|------|-------|
| id | uuid PK | |
| userId / courseId / topicId | uuid FK | |
| category | enum | CURRENT, CATCH_UP, REVISION |
| status | enum | IN_PROGRESS, COMPLETED, ABANDONED |
| recallNotes | text | Step 1 |
| learnNotes | text | Step 2 |
| practiceNotes | text | Step 3 |
| testScore | decimal | Step 4 accuracy % |
| questionsAttempted | int | |
| questionsCorrect | int | |
| understood | text | Step 5 |
| confused | text | |
| needReview | text | |
| masteryBefore / masteryAfter | decimal | |
| durationMinutes | int | secondary metric |
| startedAt / completedAt | timestamptz | |

### WeeklyTarget
| Field | Type | Notes |
|-------|------|-------|
| id | uuid PK | |
| userId / courseId / topicId | uuid FK | |
| weekStart | date | Monday of week |
| category | enum | CURRENT, CATCH_UP, REVISION |
| targetMastery | decimal | outcome goal |
| currentMasterySnapshot | decimal | at creation |
| targetQuestions | int | |
| priority | int | |
| status | enum | PENDING, IN_PROGRESS, COMPLETED, ROLLED |
| deadline | date | |
| rolledFromId | uuid nullable | prior target |

### Assessment
| Field | Type |
|-------|------|
| id | uuid PK |
| userId / courseId | uuid FK |
| title | varchar |
| type | enum | ASSIGNMENT, TEST, MIDTERM, PRACTICAL, PRESENTATION, FINAL |
| date | date |
| weight | decimal(5,2) |
| expectedMark | decimal nullable |
| actualMark | decimal nullable |
| status | enum | UPCOMING, COMPLETED, MISSED |

### PastPaper / Question / QuestionTopic
Standard normalized exam-paper model with marks, year, question type, and many-to-many topic links for frequency analysis.

### RevisionRecord
| Field | Type | Notes |
|-------|------|-------|
| topicId / userId | uuid FK | |
| nextReviewAt | timestamptz | spaced interval |
| intervalDays | int | grows on success |
| lastResult | enum | HARD, GOOD, EASY |

### Grade
| Field | Type | Notes |
|-------|------|-------|
| userId / courseId / semesterId | uuid FK | |
| letterGrade | varchar | |
| gradePoints | decimal | from scale |
| currentMarks | decimal nullable | in-progress |

### Notification / WeeklyReview
Alerts and end-of-week reflective reviews with free-text answers.

## Indexes

- `topic(courseId, orderIndex)`
- `weekly_target(userId, weekStart, status)`
- `assessment(userId, date, status)`
- `topic_mastery(userId, overallScore)`
- `revision_record(userId, nextReviewAt)`
- `question_topic(topicId)` for frequency counts
