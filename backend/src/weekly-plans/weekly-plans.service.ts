import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { addDays, toMonday } from '../common/date.util';
import {
  SessionStatus,
  StudyCategory,
  TargetStatus,
} from '../common/enums';
import { PriorityService } from '../priority/priority.service';
import { StudySession } from '../study-sessions/entities/study-session.entity';
import { TopicMastery } from '../mastery/entities/topic-mastery.entity';
import {
  CreateWeeklyTargetDto,
  UpdateWeeklyTargetDto,
  WeeklyReviewDto,
} from './dto/weekly-plan.dto';
import { WeeklyReview } from './entities/weekly-review.entity';
import { WeeklyTarget } from './entities/weekly-target.entity';

@Injectable()
export class WeeklyPlansService {
  constructor(
    @InjectRepository(WeeklyTarget)
    private readonly targets: Repository<WeeklyTarget>,
    @InjectRepository(WeeklyReview)
    private readonly reviews: Repository<WeeklyReview>,
    @InjectRepository(StudySession)
    private readonly sessions: Repository<StudySession>,
    @InjectRepository(TopicMastery)
    private readonly mastery: Repository<TopicMastery>,
    private readonly priority: PriorityService,
  ) {}

  async list(userId: string, week?: string) {
    const weekStart = toMonday(week);
    return this.targets.find({
      where: { userId, weekStart },
      relations: ['course', 'topic', 'topic.mastery'],
      order: { priority: 'DESC' },
    });
  }

  async create(userId: string, dto: CreateWeeklyTargetDto) {
    const weekStart = toMonday(dto.weekStart);
    const mastery = await this.mastery.findOne({
      where: { topicId: dto.topicId, userId },
    });
    return this.targets.save(
      this.targets.create({
        userId,
        courseId: dto.courseId,
        topicId: dto.topicId,
        weekStart,
        category: dto.category ?? StudyCategory.CATCH_UP,
        targetMastery: dto.targetMastery ?? 80,
        currentMasterySnapshot: mastery?.overallScore ?? 0,
        targetQuestions: dto.targetQuestions ?? 10,
        priority: dto.priority ?? 50,
        deadline: dto.deadline ?? addDays(weekStart, 6),
        status: TargetStatus.PENDING,
      }),
    );
  }

  async update(userId: string, id: string, dto: UpdateWeeklyTargetDto) {
    const row = await this.targets.findOne({ where: { id, userId } });
    if (!row) throw new NotFoundException('Target not found');
    Object.assign(row, dto);
    return this.targets.save(row);
  }

  async generate(userId: string, week?: string) {
    const weekStart = toMonday(week);
    const existing = await this.targets.find({ where: { userId, weekStart } });
    if (existing.length > 0) {
      return { weekStart, generated: false, targets: existing };
    }

    const allocation = await this.priority.allocation(userId);
    const ranked = await this.priority.studyNext(userId, 30);
    const total = 10;
    const counts = {
      CURRENT: Math.max(1, Math.round((allocation.current / 100) * total)),
      CATCH_UP: Math.max(1, Math.round((allocation.catchUp / 100) * total)),
      REVISION: Math.max(1, Math.round((allocation.revision / 100) * total)),
    };

    const picked: typeof ranked = [];
    const used = new Set<string>();
    for (const cat of ['CURRENT', 'CATCH_UP', 'REVISION'] as const) {
      const pool = ranked.filter(
        (i) => i.category === cat && !used.has(i.topicId),
      );
      for (const item of pool.slice(0, counts[cat])) {
        picked.push(item);
        used.add(item.topicId);
      }
    }
    for (const item of ranked) {
      if (picked.length >= total) break;
      if (!used.has(item.topicId)) {
        picked.push(item);
        used.add(item.topicId);
      }
    }

    const created: WeeklyTarget[] = [];
    for (const item of picked.slice(0, total)) {
      const targetMastery =
        item.overallMastery >= 76
          ? Math.min(100, item.overallMastery + 5)
          : Math.min(90, Math.max(80, item.overallMastery + 20));
      created.push(
        await this.targets.save(
          this.targets.create({
            userId,
            courseId: item.courseId,
            topicId: item.topicId,
            weekStart,
            category: item.category,
            targetMastery,
            currentMasterySnapshot: item.overallMastery,
            targetQuestions: item.category === StudyCategory.REVISION ? 8 : 15,
            priority: Math.round(item.priority),
            deadline: addDays(weekStart, 6),
            status: TargetStatus.PENDING,
          }),
        ),
      );
    }

    return { weekStart, generated: true, allocation, targets: created };
  }

  async rollForward(userId: string, fromWeek?: string) {
    const weekStart = toMonday(fromWeek);
    const nextWeek = addDays(weekStart, 7);
    const unfinished = await this.targets.find({
      where: {
        userId,
        weekStart,
        status: In([TargetStatus.PENDING, TargetStatus.IN_PROGRESS]),
      },
    });

    const ranked = await this.priority.computeAll(userId);
    const rankMap = new Map(ranked.map((r) => [r.topicId, r]));

    const scored = unfinished
      .map((t) => ({
        target: t,
        score: rankMap.get(t.topicId)?.priority ?? t.priority,
        category: rankMap.get(t.topicId)?.category ?? t.category,
      }))
      .sort((a, b) => b.score - a.score);

    const rolled: WeeklyTarget[] = [];
    for (const item of scored) {
      item.target.status = TargetStatus.ROLLED;
      await this.targets.save(item.target);
      const mastery = rankMap.get(item.target.topicId)?.overallMastery ?? 0;
      rolled.push(
        await this.targets.save(
          this.targets.create({
            userId,
            courseId: item.target.courseId,
            topicId: item.target.topicId,
            weekStart: nextWeek,
            category: item.category,
            targetMastery: item.target.targetMastery,
            currentMasterySnapshot: mastery,
            targetQuestions: item.target.targetQuestions,
            priority: Math.round(item.score),
            deadline: addDays(nextWeek, 6),
            status: TargetStatus.PENDING,
            rolledFromId: item.target.id,
          }),
        ),
      );
    }

    return {
      from: weekStart,
      to: nextWeek,
      rolledCount: rolled.length,
      note: 'Priorities were recalculated; unfinished work was not copied blindly.',
      targets: rolled,
    };
  }

  async recoveryPlan(userId: string, week?: string) {
    const weekStart = toMonday(week);
    const targets = await this.list(userId, weekStart);
    const completed = targets.filter((t) => t.status === TargetStatus.COMPLETED);
    const remaining = targets.filter(
      (t) =>
        t.status === TargetStatus.PENDING || t.status === TargetStatus.IN_PROGRESS,
    );
    const rate = targets.length === 0 ? 1 : completed.length / targets.length;
    const ranked = await this.priority.computeAll(userId);
    const rankMap = new Map(ranked.map((r) => [r.topicId, r]));

    const ordered = remaining
      .map((t) => ({
        ...t,
        livePriority: rankMap.get(t.topicId)?.priority ?? t.priority,
      }))
      .sort((a, b) => b.livePriority - a.livePriority);

    const tomorrowFocusCount = Math.max(1, Math.ceil(remaining.length * 0.4));
    const tomorrowFocus = ordered.slice(0, tomorrowFocusCount);
    const later = ordered.slice(tomorrowFocusCount);

    return {
      missedHint:
        rate < 0.7
          ? `You completed ${completed.length} of ${targets.length} weekly targets. Do not attempt all remaining work tomorrow.`
          : 'Week is on track. Keep the current mix of current + catch-up + revision.',
      original: targets.length,
      completed: completed.length,
      remaining: remaining.length,
      completionRate: Math.round(rate * 100),
      tomorrowFocus: tomorrowFocus.map((t) => ({
        id: t.id,
        courseId: t.courseId,
        topicId: t.topicId,
        topicTitle: t.topic?.title,
        courseName: t.course?.name,
        category: t.category,
        priority: t.livePriority,
      })),
      rollLater: later.map((t) => ({
        id: t.id,
        topicTitle: t.topic?.title,
        courseName: t.course?.name,
        category: t.category,
      })),
      orderHint: [
        'Upcoming assessment',
        'Weak high-value topic',
        'Current lecture',
        'Lower-priority revision',
      ],
    };
  }

  async createReview(userId: string, dto: WeeklyReviewDto) {
    const weekStart = toMonday(dto.weekStart);
    const summary = await this.buildSummary(userId, weekStart);
    const existing = await this.reviews.findOne({ where: { userId, weekStart } });
    const payload = {
      userId,
      weekStart,
      summary,
      whatWorked: dto.whatWorked ?? '',
      whatDidntWork: dto.whatDidntWork ?? '',
      stillWeak: dto.stillWeak ?? '',
      whyMissed: dto.whyMissed ?? '',
      nextWeekChange: dto.nextWeekChange ?? '',
    };
    if (existing) {
      Object.assign(existing, payload);
      return this.reviews.save(existing);
    }
    return this.reviews.save(this.reviews.create(payload));
  }

  async latestReview(userId: string) {
    return this.reviews.findOne({
      where: { userId },
      order: { weekStart: 'DESC' },
    });
  }

  async previewReview(userId: string, week?: string) {
    const weekStart = toMonday(week);
    return this.buildSummary(userId, weekStart);
  }

  private async buildSummary(userId: string, weekStart: string) {
    const weekEnd = addDays(weekStart, 7);
    const sessions = await this.sessions.find({
      where: { userId, status: SessionStatus.COMPLETED },
      relations: ['topic', 'course'],
    });
    const inWeek = sessions.filter((s) => {
      const d = formatLike(s.completedAt ?? s.startedAt);
      return d >= weekStart && d < weekEnd;
    });

    const questions = inWeek.reduce((a, s) => a + (s.questionsAttempted || 0), 0);
    const correct = inWeek.reduce((a, s) => a + (s.questionsCorrect || 0), 0);
    const improved = inWeek.filter(
      (s) => (s.masteryAfter ?? 0) > (s.masteryBefore ?? 0),
    );
    const mastered = inWeek.filter((s) => (s.masteryAfter ?? 0) >= 90);
    const biggestImprovement = [...inWeek].sort(
      (a, b) =>
        (b.masteryAfter ?? 0) -
        (b.masteryBefore ?? 0) -
        ((a.masteryAfter ?? 0) - (a.masteryBefore ?? 0)),
    )[0];
    const weakest = [...inWeek].sort(
      (a, b) => (a.masteryAfter ?? 100) - (b.masteryAfter ?? 100),
    )[0];

    const next = await this.priority.studyNext(userId, 3);
    const targets = await this.list(userId, weekStart);

    return {
      weekStart,
      topicsMastered: mastered.length,
      topicsImproved: improved.length,
      practiceQuestions: questions,
      averageAccuracy:
        questions === 0 ? 0 : Math.round((correct / questions) * 100),
      biggestImprovement: biggestImprovement
        ? `${biggestImprovement.course?.name} — ${biggestImprovement.topic?.title}`
        : null,
      biggestWeakness: weakest
        ? `${weakest.course?.name} — ${weakest.topic?.title}`
        : null,
      weeklyTargetsCompleted: targets.filter(
        (t) => t.status === TargetStatus.COMPLETED,
      ).length,
      weeklyTargetsTotal: targets.length,
      nextWeekPriorities: next.map((n) => ({
        course: n.courseName,
        topic: n.topicTitle,
        mastery: n.overallMastery,
      })),
    };
  }
}

function formatLike(d: Date) {
  const x = new Date(d);
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, '0');
  const day = String(x.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
