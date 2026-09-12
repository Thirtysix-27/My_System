import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import { addDays, formatDate } from '../common/date.util';
import { RevisionResult } from '../common/enums';
import { Topic } from '../topics/entities/topic.entity';
import { RevisionRecord } from './entities/revision-record.entity';

const INITIAL_INTERVAL = 3;

@Injectable()
export class RevisionService {
  constructor(
    @InjectRepository(RevisionRecord)
    private readonly revisions: Repository<RevisionRecord>,
    @InjectRepository(Topic) private readonly topics: Repository<Topic>,
  ) {}

  async ensureScheduled(userId: string, topicId: string) {
    await this.assertTopicOwned(userId, topicId);
    let row = await this.revisions.findOne({ where: { userId, topicId } });
    if (!row) {
      const next = new Date(`${addDays(formatDate(new Date()), INITIAL_INTERVAL)}T12:00:00`);
      row = await this.revisions.save(
        this.revisions.create({
          userId,
          topicId,
          intervalDays: INITIAL_INTERVAL,
          nextReviewAt: next,
          lastResult: null,
        }),
      );
    }
    return row;
  }

  async listDue(userId: string) {
    const now = new Date();
    return this.revisions.find({
      where: { userId, nextReviewAt: LessThanOrEqual(now) },
      relations: ['topic', 'topic.course'],
      order: { nextReviewAt: 'ASC' },
    });
  }

  async listAll(userId: string) {
    return this.revisions.find({
      where: { userId },
      relations: ['topic', 'topic.course'],
      order: { nextReviewAt: 'ASC' },
    });
  }

  async markReviewed(
    userId: string,
    topicId: string,
    result: RevisionResult,
  ) {
    await this.assertTopicOwned(userId, topicId);
    let row = await this.revisions.findOne({ where: { userId, topicId } });
    if (!row) {
      row = this.revisions.create({
        userId,
        topicId,
        intervalDays: INITIAL_INTERVAL,
        nextReviewAt: new Date(),
      });
    }

    const current = Math.max(1, row.intervalDays || INITIAL_INTERVAL);
    let nextInterval: number;
    switch (result) {
      case RevisionResult.HARD:
        nextInterval = Math.max(1, Math.ceil(current * 0.75));
        break;
      case RevisionResult.GOOD:
        nextInterval = Math.max(INITIAL_INTERVAL, Math.ceil(current * 1.8));
        break;
      case RevisionResult.EASY:
        nextInterval = Math.max(INITIAL_INTERVAL, Math.ceil(current * 2.5));
        break;
      default:
        nextInterval = current;
    }

    row.intervalDays = nextInterval;
    row.lastResult = result;
    row.nextReviewAt = new Date(
      `${addDays(formatDate(new Date()), nextInterval)}T12:00:00`,
    );
    return this.revisions.save(row);
  }

  private async assertTopicOwned(userId: string, topicId: string) {
    const topic = await this.topics.findOne({
      where: { id: topicId },
      relations: ['course'],
    });
    if (!topic) throw new NotFoundException('Topic not found');
    if (topic.course.userId !== userId) {
      throw new ForbiddenException('Topic does not belong to you');
    }
    return topic;
  }
}
