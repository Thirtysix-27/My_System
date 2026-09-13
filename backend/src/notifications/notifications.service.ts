import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssessmentsService } from '../assessments/assessments.service';
import { PriorityService } from '../priority/priority.service';
import { RevisionService } from '../revision/revision.service';
import { Notification } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notes: Repository<Notification>,
    private readonly assessments: AssessmentsService,
    private readonly revision: RevisionService,
    private readonly priority: PriorityService,
  ) {}

  async list(userId: string) {
    await this.refresh(userId);
    return this.notes.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 30,
    });
  }

  async markRead(userId: string, id: string) {
    const row = await this.notes.findOne({ where: { id, userId } });
    if (!row) return { ok: false };
    row.isRead = true;
    await this.notes.save(row);
    return row;
  }

  private async refresh(userId: string) {
    const existing = await this.notes.find({ where: { userId } });
    const titles = new Set(existing.filter((n) => !n.isRead).map((n) => n.title));

    const upcoming = await this.assessments.upcoming(userId);
    for (const a of upcoming.slice(0, 5)) {
      if (a.daysRemaining <= 7) {
        const title = `Assessment in ${a.daysRemaining} days: ${a.title}`;
        if (!titles.has(title)) {
          await this.notes.save(
            this.notes.create({
              userId,
              title,
              body: `${a.course?.name ?? 'Course'} · weight ${a.weight}%`,
              type: 'assessment',
            }),
          );
          titles.add(title);
        }
      }
    }

    const due = await this.revision.listDue(userId);
    if (due.length > 0) {
      const title = `${due.length} topic${due.length === 1 ? '' : 's'} due for revision`;
      if (!titles.has(title)) {
        await this.notes.save(
          this.notes.create({
            userId,
            title,
            body: due
              .slice(0, 3)
              .map((d) => d.topic?.title)
              .join(', '),
            type: 'revision',
          }),
        );
      }
    }

    const next = await this.priority.studyNext(userId, 3);
    const weak = next.filter((n) => n.overallMastery > 0 && n.overallMastery < 40);
    if (weak[0]) {
      const title = `Low mastery: ${weak[0].topicTitle}`;
      if (!titles.has(title)) {
        await this.notes.save(
          this.notes.create({
            userId,
            title,
            body: `${weak[0].courseName} is at ${weak[0].overallMastery}%. Catch-up alongside current lectures.`,
            type: 'mastery',
          }),
        );
      }
    }

    const allocation = await this.priority.allocation(userId);
    if (allocation.mode === 'behind') {
      const title = 'Catch-up allocation increased';
      if (!titles.has(title)) {
        await this.notes.save(
          this.notes.create({
            userId,
            title,
            body: `${allocation.reason}. Current lectures still get ${allocation.current}% of weekly effort.`,
            type: 'gap',
          }),
        );
      }
    }
  }
}
