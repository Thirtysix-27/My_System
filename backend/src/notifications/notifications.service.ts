import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import { Assessment } from '../assessments/entities/assessment.entity';
import { addDays, daysBetween, formatDate } from '../common/date.util';
import { AssessmentStatus } from '../common/enums';
import { Course } from '../courses/entities/course.entity';
import { RevisionRecord } from '../revision/entities/revision-record.entity';
import { Notification } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notifications: Repository<Notification>,
    @InjectRepository(Assessment)
    private readonly assessments: Repository<Assessment>,
    @InjectRepository(Course) private readonly courses: Repository<Course>,
    @InjectRepository(RevisionRecord)
    private readonly revisions: Repository<RevisionRecord>,
  ) {}

  async list(userId: string) {
    await this.generate(userId);
    return this.notifications.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async markRead(userId: string, id: string) {
    const row = await this.notifications.findOne({ where: { id, userId } });
    if (!row) return { updated: false };
    row.isRead = true;
    await this.notifications.save(row);
    return row;
  }

  /** Compute useful alerts and upsert unread ones (dedupe by title+body today). */
  async generate(userId: string) {
    const today = formatDate(new Date());
    const existing = await this.notifications.find({
      where: { userId, isRead: false },
    });
    const seen = new Set(existing.map((n) => `${n.type}|${n.title}`));

    const toCreate: Partial<Notification>[] = [];

    // Upcoming assessments within 7 days
    const until = addDays(today, 7);
    const upcoming = await this.assessments.find({
      where: { userId, status: AssessmentStatus.UPCOMING },
      relations: ['course'],
    });
    for (const a of upcoming) {
      if (a.date < today || a.date > until) continue;
      const days = daysBetween(today, a.date);
      const title = `Assessment in ${days} day${days === 1 ? '' : 's'}`;
      const key = `assessment|${title}`;
      if (seen.has(key)) continue;
      toCreate.push({
        userId,
        title,
        body: `${a.title} (${a.course?.code ?? 'course'}) on ${a.date}`,
        type: 'assessment',
      });
      seen.add(key);
    }

    // Revision due
    const due = await this.revisions.find({
      where: { userId, nextReviewAt: LessThanOrEqual(new Date()) },
      relations: ['topic'],
      take: 5,
    });
    if (due.length > 0) {
      const title = 'Revision due';
      const key = `revision|${title}`;
      if (!seen.has(key)) {
        toCreate.push({
          userId,
          title,
          body: `${due.length} topic(s) ready for spaced review (e.g. ${due[0].topic?.title ?? 'topic'})`,
          type: 'revision',
        });
        seen.add(key);
      }
    }

    // Low mastery / behind lecturer
    const courses = await this.courses.find({
      where: { userId },
      relations: [
        'topics',
        'topics.mastery',
        'lecturerProgress',
        'lecturerProgress.currentTopic',
      ],
    });

    for (const course of courses) {
      const lecturerOrder =
        course.lecturerProgress?.currentTopic?.orderIndex ?? null;
      if (lecturerOrder === null) continue;

      let weakBehind = 0;
      let sum = 0;
      let n = 0;
      for (const topic of course.topics ?? []) {
        if (topic.orderIndex > lecturerOrder) continue;
        const m = topic.mastery?.overallScore ?? 0;
        sum += m;
        n += 1;
        if (m < 50) weakBehind += 1;
      }
      const avg = n === 0 ? 100 : sum / n;

      if (weakBehind >= 3 || avg < 50) {
        const title = `Behind in ${course.code}`;
        const key = `behind|${title}`;
        if (!seen.has(key)) {
          toCreate.push({
            userId,
            title,
            body: `Average mastery up to lecturer is ${avg.toFixed(0)}% with ${weakBehind} weak topic(s). Prioritize catch-up.`,
            type: 'behind',
          });
          seen.add(key);
        }
      }

      // Low mastery on current lecturer topic
      const current = (course.topics ?? []).find(
        (t) => t.orderIndex === lecturerOrder,
      );
      if (current && (current.mastery?.overallScore ?? 0) < 40) {
        const title = `Low mastery: ${course.code}`;
        const key = `mastery|${title}`;
        if (!seen.has(key)) {
          toCreate.push({
            userId,
            title,
            body: `${current.title} is the current lecture topic but mastery is ${Math.round(current.mastery?.overallScore ?? 0)}%.`,
            type: 'mastery',
          });
          seen.add(key);
        }
      }
    }

    if (toCreate.length) {
      await this.notifications.save(
        toCreate.map((n) => this.notifications.create(n)),
      );
    }

    return { generated: toCreate.length };
  }
}
