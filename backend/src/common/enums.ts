export enum StudyCategory {
  CURRENT = 'CURRENT',
  CATCH_UP = 'CATCH_UP',
  REVISION = 'REVISION',
}

export enum SessionStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  ABANDONED = 'ABANDONED',
}

export enum TargetStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  ROLLED = 'ROLLED',
}

export enum AssessmentType {
  ASSIGNMENT = 'ASSIGNMENT',
  TEST = 'TEST',
  MIDTERM = 'MIDTERM',
  PRACTICAL = 'PRACTICAL',
  PRESENTATION = 'PRESENTATION',
  FINAL = 'FINAL',
}

export enum AssessmentStatus {
  UPCOMING = 'UPCOMING',
  COMPLETED = 'COMPLETED',
  MISSED = 'MISSED',
}

export enum RevisionResult {
  HARD = 'HARD',
  GOOD = 'GOOD',
  EASY = 'EASY',
}

export enum QuestionType {
  SHORT = 'SHORT',
  ESSAY = 'ESSAY',
  MCQ = 'MCQ',
  PRACTICAL = 'PRACTICAL',
  CALCULATION = 'CALCULATION',
}

export function masteryLevel(score: number): string {
  if (score <= 0) return 'Not started';
  if (score <= 25) return 'Familiar';
  if (score <= 50) return 'Basic understanding';
  if (score <= 75) return 'Developing';
  if (score <= 89) return 'Strong';
  return 'Exam ready';
}

export const DEFAULT_GRADING_SCALE = [
  { letter: 'A', min: 80, points: 4.0 },
  { letter: 'A-', min: 75, points: 3.7 },
  { letter: 'B+', min: 70, points: 3.3 },
  { letter: 'B', min: 65, points: 3.0 },
  { letter: 'B-', min: 60, points: 2.7 },
  { letter: 'C+', min: 55, points: 2.3 },
  { letter: 'C', min: 50, points: 2.0 },
  { letter: 'D', min: 40, points: 1.0 },
  { letter: 'F', min: 0, points: 0.0 },
];

export const DEFAULT_PRIORITY_WEIGHTS = {
  weakness: 0.3,
  examImportance: 0.25,
  lecturerRelevance: 0.2,
  assessmentUrgency: 0.15,
  forgettingRisk: 0.1,
};
