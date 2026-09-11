import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Assessment } from '../assessments/entities/assessment.entity';
import { daysBetween } from '../common/date.util';
import {
  AssessmentStatus,
  DEFAULT_PRIORITY_WEIGHTS,
  StudyCategory,
  masteryLevel,
} from '../common/enums';
import { Course } from '../courses/entities/course.entity';
import { ExamQuestion } from '../past-papers/entities/exam-question.entity';
import { RevisionRecord } from '../revision/entities/revision-record.entity';
import { Topic } from '../topics/entities/topic.entity';
import { User } from '../users/entities/user.entity';
import { UserPreferences } from '../users/entities/user-preferences.entity';

export interface TopicPriorityItem {
  topicId: string;
  topicTitle: string;
  courseId: string;
  courseName: string;
  courseCode: string;
  orderIndex: number;
  importanceWeight: number;
  overallMastery: number;
  masteryLevel: string;
  priority: number;
  category: StudyCategory;
  components: {
    weakness: number;
    examImportance: number;
    lecturerRelevance: number;
    assessmentUrgency: number;
    forgettingRisk: number;
  };
}

export interface GapItem {
  topicId: string;
  title: string;
  orderIndex: number;
  overallMastery: number;
  masteryLevel: string;
  importanceWeight: number;
  gapScore: number;
  classification:
    | 'Exam-ready'
    | 'Strong'
    | 'Developing'
    | 'Weak'
    | 'Newly introduced';
  relativeToLecturer: 'at' | 'before' | 'after';
}

@Injectable()
export class PriorityService {
  constructor(
    @InjectRepository(Course) private readonly courses: Repository<Course>,
    @InjectRepository(Topic) private readonly topics: Repository<Topic>,
    @InjectRepository(Assessment)
    private readonly assessments: Repository<Assessment>,
    @InjectRepository(ExamQuestion)
    private readonly questions: Repository<ExamQuestion>,
    @InjectRepository(RevisionRecord)
    private readonly revisions: Repository<RevisionRecord>,
    @InjectRepository(UserPreferences)
    private readonly prefs: Repository<UserPreferences>,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  private async getPrefs(userId: string) {
    let prefs = await this.prefs.findOne({ where: { userId } });
    if (!prefs) {
      prefs = await this.prefs.save(
        this.prefs.create({
          userId,
          priorityWeights: { ...DEFAULT_PRIORITY_WEIGHTS },
        }),
      );
    }
    return prefs;
  }

  private async pastPaperFrequency(
    topicIds: string[],
  ): Promise<Map<string, number>> {
    const map = new Map<string, number>();
    if (topicIds.length === 0) return map;
    try {
      const rows = await this.questions
        .createQueryBuilder('q')
        .innerJoin('q.topics', 't')
        .select('t.id', 'topicId')
        .addSelect('COUNT(*)', 'cnt')
        .where('t.id IN (:...ids)', { ids: topicIds })
        .groupBy('t.id')
        .getRawMany<{ topicId: string; cnt: string }>();
      for (const r of rows) map.set(r.topicId, Number(r.cnt));
    } catch {
      // question_topics may be empty / unavailable
    }
    return map;
  }

  private lecturerRelevance(
    topicOrder: number,
    lecturerOrder: number | null,
  ): number {
    if (lecturerOrder === null) return 40;
    const delta = topicOrder - lecturerOrder;
    if (delta > 0) return 5; // not yet taught
    if (delta === 0) return 100;
    if (delta === -1) return 70;
    if (delta === -2) return 40;
    return 10;
  }

  private assessmentUrgency(
    topicId: string,
    courseId: string,
    assessments: Assessment[],
    topicFreqLinked: boolean,
  ): number {
    const now = new Date();
    let best = 0;
    for (const a of assessments) {
      if (a.status !== AssessmentStatus.UPCOMING) continue;
      if (a.courseId !== courseId && !topicFreqLinked) continue;
      // Course-level assessments apply to topics in that course;
      // past-paper-tagged topics get extra urgency when linked.
      if (a.courseId !== courseId) continue;
      const days = daysBetween(now, a.date);
      if (days < 0) continue;
      let score = 0;
      if (days <= 3) score = 100;
      else if (days <= 7) score = 75;
      else if (days <= 14) score = 45;
      if (score > best) best = score;
    }
    void topicId;
    void topicFreqLinked;
    return best;
  }

  private forgettingRisk(
    mastery: number,
    lastReviewedAt: Date | null | undefined,
    revision: RevisionRecord | undefined,
  ): number {
    if (revision) {
      const overdueDays = daysBetween(revision.nextReviewAt, new Date());
      if (overdueDays >= 0) {
        return Math.min(
          100,
          (overdueDays / Math.max(1, revision.intervalDays)) * 100,
        );
      }
    }
    if (mastery >= 76) {
      const since = lastReviewedAt
        ? daysBetween(lastReviewedAt, new Date())
        : 30;
      const expected = 7;
      return Math.min(100, (since / expected) * 100);
    }
    return 0;
  }

  private categorize(
    topicOrder: number,
    lecturerOrder: number | null,
    mastery: number,
  ): StudyCategory {
    if (mastery >= 76) return StudyCategory.REVISION;
    if (lecturerOrder === null) return StudyCategory.CATCH_UP;
    if (topicOrder >= lecturerOrder - 1 && topicOrder <= lecturerOrder) {
      return StudyCategory.CURRENT;
    }
    if (topicOrder < lecturerOrder) return StudyCategory.CATCH_UP;
    return StudyCategory.CURRENT;
  }

  async computeAll(userId: string): Promise<TopicPriorityItem[]> {
    const prefs = await this.getPrefs(userId);
    const weights = {
      ...DEFAULT_PRIORITY_WEIGHTS,
      ...(prefs.priorityWeights ?? {}),
    };

    const courses = await this.courses.find({
      where: { userId },
      relations: [
        'topics',
        'topics.mastery',
        'lecturerProgress',
        'lecturerProgress.currentTopic',
      ],
      order: { topics: { orderIndex: 'ASC' } },
    });

    const assessments = await this.assessments.find({
      where: { userId, status: AssessmentStatus.UPCOMING },
    });

    const allTopicIds = courses.flatMap((c) => (c.topics ?? []).map((t) => t.id));
    const freq = await this.pastPaperFrequency(allTopicIds);
    const revisions =
      allTopicIds.length === 0
        ? []
        : await this.revisions.find({
            where: { userId, topicId: In(allTopicIds) },
          });
    const revMap = new Map(revisions.map((r) => [r.topicId, r]));

    const items: TopicPriorityItem[] = [];

    for (const course of courses) {
      const lecturerOrder =
        course.lecturerProgress?.currentTopic?.orderIndex ?? null;

      for (const topic of course.topics ?? []) {
        const mastery = topic.mastery?.overallScore ?? 0;
        const weakness = 100 - mastery;
        const paperCount = freq.get(topic.id) ?? 0;
        const examImportance = Math.min(
          100,
          paperCount * 12 + (topic.importanceWeight ?? 1) * 20,
        );
        const lecturerRelevance = this.lecturerRelevance(
          topic.orderIndex,
          lecturerOrder,
        );
        const assessmentUrgency = this.assessmentUrgency(
          topic.id,
          course.id,
          assessments,
          paperCount > 0,
        );
        const forgettingRisk = this.forgettingRisk(
          mastery,
          topic.mastery?.lastReviewedAt,
          revMap.get(topic.id),
        );

        const priority =
          weakness * weights.weakness +
          examImportance * weights.examImportance +
          lecturerRelevance * weights.lecturerRelevance +
          assessmentUrgency * weights.assessmentUrgency +
          forgettingRisk * weights.forgettingRisk;

        items.push({
          topicId: topic.id,
          topicTitle: topic.title,
          courseId: course.id,
          courseName: course.name,
          courseCode: course.code,
          orderIndex: topic.orderIndex,
          importanceWeight: topic.importanceWeight,
          overallMastery: mastery,
          masteryLevel: masteryLevel(mastery),
          priority: Math.round(priority * 10) / 10,
          category: this.categorize(topic.orderIndex, lecturerOrder, mastery),
          components: {
            weakness,
            examImportance,
            lecturerRelevance,
            assessmentUrgency,
            forgettingRisk,
          },
        });
      }
    }

    return items.sort((a, b) => b.priority - a.priority);
  }

  async studyNext(userId: string, limit = 10) {
    const all = await this.computeAll(userId);
    return all.slice(0, Math.max(1, Math.min(limit, 50)));
  }

  async courseGaps(userId: string, courseId: string): Promise<GapItem[]> {
    const course = await this.courses.findOne({
      where: { id: courseId, userId },
      relations: [
        'topics',
        'topics.mastery',
        'lecturerProgress',
        'lecturerProgress.currentTopic',
      ],
      order: { topics: { orderIndex: 'ASC' } },
    });
    if (!course) throw new NotFoundException('Course not found');

    const lecturerOrder =
      course.lecturerProgress?.currentTopic?.orderIndex ?? null;
    const gaps: GapItem[] = [];

    for (const topic of course.topics ?? []) {
      if (lecturerOrder !== null && topic.orderIndex > lecturerOrder) continue;

      const mastery = topic.mastery?.overallScore ?? 0;
      let classification: GapItem['classification'];
      if (
        lecturerOrder !== null &&
        topic.orderIndex === lecturerOrder &&
        mastery < 30
      ) {
        classification = 'Newly introduced';
      } else if (mastery >= 90) classification = 'Exam-ready';
      else if (mastery >= 76) classification = 'Strong';
      else if (mastery >= 51) classification = 'Developing';
      else classification = 'Weak';

      const relativeToLecturer: GapItem['relativeToLecturer'] =
        lecturerOrder === null
          ? 'before'
          : topic.orderIndex === lecturerOrder
            ? 'at'
            : topic.orderIndex < lecturerOrder
              ? 'before'
              : 'after';

      gaps.push({
        topicId: topic.id,
        title: topic.title,
        orderIndex: topic.orderIndex,
        overallMastery: mastery,
        masteryLevel: masteryLevel(mastery),
        importanceWeight: topic.importanceWeight,
        gapScore:
          Math.round((100 - mastery) * (topic.importanceWeight ?? 1) * 10) /
          10,
        classification,
        relativeToLecturer,
      });
    }

    return gaps.sort((a, b) => b.gapScore - a.gapScore);
  }

  async allocation(userId: string) {
    const prefs = await this.getPrefs(userId);
    const courses = await this.courses.find({
      where: { userId },
      relations: [
        'topics',
        'topics.mastery',
        'lecturerProgress',
        'lecturerProgress.currentTopic',
      ],
    });

    let weakUpToLecturer = 0;
    let scoresUpToLecturer: number[] = [];

    for (const course of courses) {
      const lecturerOrder =
        course.lecturerProgress?.currentTopic?.orderIndex ?? null;
      for (const topic of course.topics ?? []) {
        if (lecturerOrder !== null && topic.orderIndex > lecturerOrder) continue;
        const m = topic.mastery?.overallScore ?? 0;
        scoresUpToLecturer.push(m);
        if (m < 90) weakUpToLecturer += 1;
      }
    }

    const avg =
      scoresUpToLecturer.length === 0
        ? 100
        : scoresUpToLecturer.reduce((a, b) => a + b, 0) /
          scoresUpToLecturer.length;

    const behind =
      avg < (prefs.behindMasteryAvg ?? 50) ||
      weakUpToLecturer >= (prefs.behindThresholdTopics ?? 3);

    if (behind) {
      return {
        mode: 'behind' as const,
        current: prefs.allocationBehindCurrent,
        catchUp: prefs.allocationBehindCatchUp,
        revision: prefs.allocationBehindRevision,
        reason:
          avg < (prefs.behindMasteryAvg ?? 50)
            ? `Average mastery up to lecturer (${avg.toFixed(0)}%) is below threshold`
            : `${weakUpToLecturer} topics below exam-ready threshold`,
      };
    }

    return {
      mode: 'normal' as const,
      current: prefs.allocationNormalCurrent,
      catchUp: prefs.allocationNormalCatchUp,
      revision: prefs.allocationNormalRevision,
      reason: 'On track relative to lecturer progress',
    };
  }

  classifyGapLabel(mastery: number): string {
    return masteryLevel(mastery);
  }
}
