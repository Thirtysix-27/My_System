import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import { addDays, formatDate } from '../common/date.util';
import { RevisionResult } from '../common/enums';
import { RevisionRecord } from './entities/revision-record.entity';

@Injectable()
export class RevisionService {
  constructor(
    @InjectRepository(RevisionRecord)
    private readonly records: Repository<RevisionRecord>,
  ) {}

  async ensureScheduled(userId: string, topicId: string) {
    let row = await this.records.findOne({ where: { userId, topicId } });
    if (!row) {
      row = this.records.create({
        userId,
        topicId,
        intervalDays: 3,
        nextReviewAt: new Date(`${addDays(formatDate(new Date()), 3)}T12:00:00`),
        lastResult: null,
      });
    } else if (row.nextReviewAt < new Date()) {
      row.nextReviewAt = new Date(
        `${addDays(formatDate(new Date()), row.intervalDays)}T12:00:00`,
      );
    }
    return this.records.save(row);
  }

  async listDue(userId: string) {
    return this.records.find({
      where: { userId, nextReviewAt: LessThanOrEqual(new Date()) },
      relations: ['topic', 'topic.course'],
      order: { nextReviewAt: 'ASC' },
    });
  }

  async listAll(userId: string) {
    return this.records.find({
      where: { userId },
      relations: ['topic', 'topic.course'],
      order: { nextReviewAt: 'ASC' },
    });
  }

  async markReviewed(userId: string, topicId: string, result: RevisionResult) {
    let row = await this.records.findOne({ where: { userId, topicId } });
    if (!row) {
      row = this.records.create({
        userId,
        topicId,
        intervalDays: 3,
      });
    }

    let next = row.intervalDays || 3;
    if (result === RevisionResult.EASY) next = Math.min(30, Math.round(next * 2));
    else if (result === RevisionResult.GOOD) next = Math.min(21, Math.round(next * 1.5));
    else next = 1;

    row.intervalDays = next;
    row.lastResult = result;
    row.nextReviewAt = new Date(
      `${addDays(formatDate(new Date()), next)}T12:00:00`,
    );
    return this.records.save(row);
  }
}
