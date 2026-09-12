import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import { addDays, toMonday } from '../common/date.util';
import {
  SessionStatus,
  StudyCategory,
  TargetStatus,
} from '../common/enums';
import { Course } from '../courses/entities/course.entity';
import {
  PriorityService,
  TopicPriorityItem,
} from '../priority/priority.service';
import { StudySession } from '../study-sessions/entities/study-session.entity';
import { Topic } from '../topics/entities/topic.entity';
import {
  CreateWeeklyReviewDto,
  CreateWeeklyTargetDto,
  GenerateWeeklyTargetsDto,
  RollForwardDto,
  UpdateWeeklyTargetDto,
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
    @InjectRepository(Course) private readonly courses: Repository<Course>,
    @InjectRepository(Topic) private readonly topics: Repository<Topic>,
    @InjectRepository(StudySession)
    private readonly sessions: Repository<StudySession>,
    private readonly priority: PriorityService,
  ) {}

  async listByWeek(userId: string, week?: string) {
    const weekStart = toMonday(week);
    return this.targets.find({
      where: { userId, weekStart },
      relations: ['topic', 'course'],
      order: { priority: 'DESC' },
    });
  }

  async create(userId: string, dto: CreateWeeklyTargetDto) {
    await this.assertCourse(userId, dto.courseId);
    const topic = await this.topics.findOne({
      where: { id: dto.topicId },
      relations: ['mastery'],
    });
    if (!topic || topic.courseId !== dto.courseId) {
      throw new NotFoundException('Topic not found for course');
    }
    const weekStart = toMonday(dto.weekStart);
    return this.targets.save(
      this.targets.create({
        userId,
        courseId: dto.courseId,
        topicId: dto.topicId,
        weekStart,
        category: dto.category ?? StudyCategory.CATCH_UP,
        targetMastery: dto.targetMastery ?? 80,
        currentMasterySnapshot: topic.mastery?.overallScore ?? 0,
        targetQuestions: dto.targetQuestions ?? 10,
        priority: dto.priority ?? 50,
        status: TargetStatus.PENDING,
        deadline: dto.deadline ? dto.deadline.slice(0, 10) : addDays(weekStart, 6),
      }),
    );
  }

  async update(userId: string, id: string, dto: UpdateWeeklyTargetDto) {
    const row = await this.targets.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Weekly target not found');
    if (row.userId !== userId) throw new ForbiddenException();
    Object.assign(row, dto);
    return this.targets.save(row);
  }

  async generate(userId: string, dto: GenerateWeeklyTargetsDto = {}) {
    const weekStart = toMonday(dto.weekStart);
    const limit = dto.limit ?? 12;
    const allocation = await this.priority.allocation(userId);
    const ranked = await this.priority.studyNext(userId, 40);

    const currentSlots = Math.max(
      1,
      Math.round((limit * allocation.current) / 100),
    );
    const catchUpSlots = Math.max(
      1,
      Math.round((limit * allocation.catchUp) / 100),
    );
    const revisionSlots = Math.max(
      1,
      Math.round((limit * allocation.revision) / 100),
    );

    const byCat = {
      [StudyCategory.CURRENT]: ranked.filter(
        (r) => r.category === StudyCategory.CURRENT,
      ),
      [StudyCategory.CATCH_UP]: ranked.filter(
        (r) => r.category === StudyCategory.CATCH_UP,
      ),
      [StudyCategory.REVISION]: ranked.filter(
        (r) => r.category === StudyCategory.REVISION,
      ),
    };

    const picked: TopicPriorityItem[] = [];
    const take = (items: TopicPriorityItem[], n: number) => {
      for (const item of items) {
        if (picked.length >= limit) break;
        if (picked.some((p) => p.topicId === item.topicId)) continue;
        if (n <= 0) break;
        picked.push(item);
        n -= 1;
      }
    };

    take(byCat[StudyCategory.CURRENT], currentSlots);
    take(byCat[StudyCategory.CATCH_UP], catchUpSlots);
    take(byCat[StudyCategory.REVISION], revisionSlots);
    // Fill remainder from overall ranking
    take(ranked, limit - picked.length);

    // Clear existing pending for this week (regenerate)
    const existing = await this.targets.find({
      where: {
        userId,
        weekStart,
        status: In([TargetStatus.PENDING, TargetStatus.IN_PROGRESS]),
      },
    });
    if (existing.length) await this.targets.remove(existing);

    const created: WeeklyTarget[] = [];
    for (const item of picked) {
      const targetMastery =
        item.overallMastery >= 76
          ? Math.min(100, Math.max(90, item.overallMastery + 5))
          : Math.min(90, Math.max(70, item.overallMastery + 20));
      const targetQuestions =
        item.category === StudyCategory.REVISION
          ? 8
          : item.category === StudyCategory.CURRENT
            ? 12
            : 15;

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
            targetQuestions,
            priority: Math.round(item.priority),
            status: TargetStatus.PENDING,
            deadline: addDays(weekStart, 6),
          }),
        ),
      );
    }

    return {
      weekStart,
      allocation,
      targets: await this.listByWeek(userId, weekStart),
      generated: created.length,
    };
  }

  async rollForward(userId: string, dto: RollForwardDto = {}) {
    const fromWeek = toMonday(dto.fromWeek);
    const toWeek = toMonday(dto.toWeek ?? addDays(fromWeek, 7));
    const unfinished = await this.targets.find({
      where: {
        userId,
        weekStart: fromWeek,
        status: In([TargetStatus.PENDING, TargetStatus.IN_PROGRESS]),
      },
    });

    if (unfinished.length === 0) {
      return { fromWeek, toWeek, rolled: 0, targets: [] };
    }

    const ranked = await this.priority.studyNext(userId, 50);
    const scoreMap = new Map(ranked.map((r) => [r.topicId, r]));

    const rescored = unfinished
      .map((t) => {
        const item = scoreMap.get(t.topicId);
        return {
          target: t,
          priority: item?.priority ?? t.priority,
          category: item?.category ?? t.category,
          mastery: item?.overallMastery ?? t.currentMasterySnapshot,
        };
      })
      .sort((a, b) => b.priority - a.priority);

    const rolled: WeeklyTarget[] = [];
    for (const entry of rescored) {
      entry.target.status = TargetStatus.ROLLED;
      await this.targets.save(entry.target);

      const targetMastery =
        entry.mastery >= 76
          ? Math.min(100, Math.max(90, entry.mastery + 5))
          : Math.min(90, Math.max(70, entry.mastery + 15));

      rolled.push(
        await this.targets.save(
          this.targets.create({
            userId,
            courseId: entry.target.courseId,
            topicId: entry.target.topicId,
            weekStart: toWeek,
            category: entry.category,
            targetMastery,
            currentMasterySnapshot: entry.mastery,
            targetQuestions: entry.target.targetQuestions,
            priority: Math.round(entry.priority),
            status: TargetStatus.PENDING,
            deadline: addDays(toWeek, 6),
            rolledFromId: entry.target.id,
          }),
        ),
      );
    }

    return {
      fromWeek,
      toWeek,
      rolled: rolled.length,
      targets: await this.listByWeek(userId, toWeek),
    };
  }

  async recoveryPlan(userId: string, week?: string) {
    const weekStart = toMonday(week);
    const targets = await this.listByWeek(userId, weekStart);
    const total = targets.length;
    const completed = targets.filter(
      (t) => t.status === TargetStatus.COMPLETED,
    ).length;
    const completionRate = total === 0 ? 100 : (completed / total) * 100;

    const unfinished = targets.filter(
      (t) =>
        t.status === TargetStatus.PENDING ||
        t.status === TargetStatus.IN_PROGRESS,
    );

    if (completionRate >= 70 || unfinished.length === 0) {
      return {
        weekStart,
        completionRate: Math.round(completionRate * 10) / 10,
        needsRecovery: false,
        message:
          completionRate >= 70
            ? 'Completion is at or above 70% — no recovery redistribution needed'
            : 'No unfinished targets',
        tomorrowFocus: [],
        rollCandidates: [],
        allocation: await this.priority.allocation(userId),
      };
    }

    const ranked = await this.priority.studyNext(userId, 50);
    const scoreMap = new Map(ranked.map((r) => [r.topicId, r.priority]));
    const sorted = [...unfinished].sort(
      (a, b) =>
        (scoreMap.get(b.topicId) ?? b.priority) -
        (scoreMap.get(a.topicId) ?? a.priority),
    );

    const tomorrowCount = Math.max(1, Math.ceil(sorted.length * 0.4));
    const tomorrowFocus = sorted.slice(0, tomorrowCount);
    const rollCandidates = sorted.slice(tomorrowCount);
    const allocation = await this.priority.allocation(userId);

    return {
      weekStart,
      completionRate: Math.round(completionRate * 10) / 10,
      needsRecovery: true,
      message:
        'Redistribute unfinished work: focus tomorrow on top-priority items; roll the rest',
      tomorrowFocus,
      rollCandidates,
      allocation,
      suggestedAction:
        allocation.mode === 'behind'
          ? 'Shift more time to catch-up this week'
          : 'Keep allocation; re-prioritize unfinished targets',
    };
  }

  async createReview(userId: string, dto: CreateWeeklyReviewDto) {
    const weekStart = toMonday(dto.weekStart);
    const weekEnd = addDays(weekStart, 6);
    const sessions = await this.sessions.find({
      where: {
        userId,
        status: SessionStatus.COMPLETED,
        startedAt: Between(
          new Date(`${weekStart}T00:00:00`),
          new Date(`${weekEnd}T23:59:59`),
        ),
      },
    });

    const targets = await this.listByWeek(userId, weekStart);
    const completedTargets = targets.filter(
      (t) => t.status === TargetStatus.COMPLETED,
    ).length;
    const totalMinutes = sessions.reduce(
      (s, x) => s + (x.durationMinutes ?? 0),
      0,
    );
    const masteryGains = sessions
      .filter((s) => s.masteryAfter != null)
      .map((s) => (s.masteryAfter ?? 0) - (s.masteryBefore ?? 0));
    const avgGain =
      masteryGains.length === 0
        ? 0
        : masteryGains.reduce((a, b) => a + b, 0) / masteryGains.length;

    const summary = {
      sessionsCompleted: sessions.length,
      totalMinutes,
      targetsTotal: targets.length,
      targetsCompleted: completedTargets,
      completionRate:
        targets.length === 0
          ? 100
          : Math.round((completedTargets / targets.length) * 1000) / 10,
      averageMasteryGain: Math.round(avgGain * 10) / 10,
    };

    const review = await this.reviews.save(
      this.reviews.create({
        userId,
        weekStart,
        summary,
        whatWorked: dto.whatWorked ?? '',
        whatDidntWork: dto.whatDidntWork ?? '',
        stillWeak: dto.stillWeak ?? '',
        whyMissed: dto.whyMissed ?? '',
        nextWeekChange: dto.nextWeekChange ?? '',
      }),
    );
    return review;
  }

  async latestReview(userId: string) {
    const review = await this.reviews.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return review ?? null;
  }

  private async assertCourse(userId: string, courseId: string) {
    const course = await this.courses.findOne({ where: { id: courseId, userId } });
    if (!course) throw new NotFoundException('Course not found');
    return course;
  }
}
