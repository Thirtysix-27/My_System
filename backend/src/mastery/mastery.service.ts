import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { clamp } from '../common/date.util';
import { masteryLevel } from '../common/enums';
import { Topic } from '../topics/entities/topic.entity';
import { UpdateMasteryDto } from './dto/mastery.dto';
import { TopicMastery } from './entities/topic-mastery.entity';

export function blend(oldVal: number, next: number, rate: number): number {
  return clamp(oldVal * (1 - rate) + next * rate);
}

/** Apply quiz/session accuracy A (0–100) to mastery components per algorithm docs. */
export function applySessionMastery(
  mastery: TopicMastery,
  accuracy: number,
  recallSelfScore?: number,
): TopicMastery {
  const A = clamp(accuracy);
  const overall = mastery.overallScore ?? 0;
  const delta = (A - overall) * 0.35;
  mastery.overallScore = clamp(overall + delta);
  mastery.examQuestions = blend(mastery.examQuestions ?? 0, A, 0.4);
  mastery.recall = blend(
    mastery.recall ?? 0,
    recallSelfScore ?? A * 0.9,
    0.3,
  );
  mastery.application = blend(mastery.application ?? 0, A, 0.3);
  mastery.understanding = blend(
    mastery.understanding ?? 0,
    Math.max(mastery.understanding ?? 0, A * 0.8),
    0.25,
  );
  mastery.lastReviewedAt = new Date();
  return mastery;
}

@Injectable()
export class MasteryService {
  constructor(
    @InjectRepository(TopicMastery)
    private readonly mastery: Repository<TopicMastery>,
    @InjectRepository(Topic) private readonly topics: Repository<Topic>,
  ) {}

  private async ownedTopic(userId: string, topicId: string) {
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

  async getOrCreate(userId: string, topicId: string) {
    await this.ownedTopic(userId, topicId);
    let row = await this.mastery.findOne({ where: { topicId, userId } });
    if (!row) {
      row = await this.mastery.save(
        this.mastery.create({
          topicId,
          userId,
          overallScore: 0,
          understanding: 0,
          recall: 0,
          application: 0,
          examQuestions: 0,
        }),
      );
    }
    return {
      ...row,
      masteryLevel: masteryLevel(row.overallScore),
    };
  }

  async update(userId: string, topicId: string, dto: UpdateMasteryDto) {
    await this.ownedTopic(userId, topicId);
    let row = await this.mastery.findOne({ where: { topicId, userId } });
    if (!row) {
      row = this.mastery.create({ topicId, userId });
    }

    if (dto.understanding !== undefined) row.understanding = dto.understanding;
    if (dto.recall !== undefined) row.recall = dto.recall;
    if (dto.application !== undefined) row.application = dto.application;
    if (dto.examQuestions !== undefined) row.examQuestions = dto.examQuestions;

    if (dto.overallScore !== undefined) {
      row.overallScore = dto.overallScore;
    } else if (
      dto.understanding !== undefined ||
      dto.recall !== undefined ||
      dto.application !== undefined ||
      dto.examQuestions !== undefined
    ) {
      row.overallScore = clamp(
        (row.understanding ?? 0) * 0.25 +
          (row.recall ?? 0) * 0.25 +
          (row.application ?? 0) * 0.25 +
          (row.examQuestions ?? 0) * 0.25,
      );
    }

    row.lastReviewedAt = new Date();
    await this.mastery.save(row);
    return this.getOrCreate(userId, topicId);
  }

  async applyFromSession(
    userId: string,
    topicId: string,
    accuracy: number,
    recallSelfScore?: number,
  ) {
    let row = await this.mastery.findOne({ where: { topicId, userId } });
    if (!row) {
      row = this.mastery.create({
        topicId,
        userId,
        overallScore: 0,
        understanding: 0,
        recall: 0,
        application: 0,
        examQuestions: 0,
      });
    }
    applySessionMastery(row, accuracy, recallSelfScore);
    await this.mastery.save(row);
    return row;
  }
}
