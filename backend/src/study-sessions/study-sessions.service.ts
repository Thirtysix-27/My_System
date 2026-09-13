import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SessionStatus, StudyCategory } from '../common/enums';
import { Course } from '../courses/entities/course.entity';
import { MasteryService } from '../mastery/mastery.service';
import { RevisionService } from '../revision/revision.service';
import { Topic } from '../topics/entities/topic.entity';
import {
  CompleteSessionDto,
  StartSessionDto,
  UpdateSessionDto,
} from './dto/session.dto';
import { StudySession } from './entities/study-session.entity';

@Injectable()
export class StudySessionsService {
  constructor(
    @InjectRepository(StudySession)
    private readonly sessions: Repository<StudySession>,
    @InjectRepository(Course) private readonly courses: Repository<Course>,
    @InjectRepository(Topic) private readonly topics: Repository<Topic>,
    private readonly mastery: MasteryService,
    private readonly revision: RevisionService,
  ) {}

  async start(userId: string, dto: StartSessionDto) {
    const course = await this.courses.findOne({
      where: { id: dto.courseId, userId },
    });
    if (!course) throw new NotFoundException('Course not found');

    const topic = await this.topics.findOne({
      where: { id: dto.topicId },
      relations: ['mastery'],
    });
    if (!topic || topic.courseId !== dto.courseId) {
      throw new BadRequestException('Topic does not belong to course');
    }

    const masteryBefore = topic.mastery?.overallScore ?? 0;
    return this.sessions.save(
      this.sessions.create({
        userId,
        courseId: dto.courseId,
        topicId: dto.topicId,
        category: dto.category ?? StudyCategory.CURRENT,
        status: SessionStatus.IN_PROGRESS,
        masteryBefore,
      }),
    );
  }

  async update(userId: string, id: string, dto: UpdateSessionDto) {
    const session = await this.findOwned(userId, id);
    if (session.status !== SessionStatus.IN_PROGRESS) {
      throw new BadRequestException('Session is not in progress');
    }
    const { recallSelfScore: _, ...rest } = dto;
    Object.assign(session, rest);
    return this.sessions.save(session);
  }

  async complete(userId: string, id: string, dto: CompleteSessionDto = {}) {
    const session = await this.findOwned(userId, id);
    if (session.status !== SessionStatus.IN_PROGRESS) {
      throw new BadRequestException('Session is not in progress');
    }

    if (dto.testScore !== undefined) session.testScore = dto.testScore;
    if (dto.durationMinutes !== undefined)
      session.durationMinutes = dto.durationMinutes;
    if (dto.understood !== undefined) session.understood = dto.understood;
    if (dto.confused !== undefined) session.confused = dto.confused;
    if (dto.needReview !== undefined) session.needReview = dto.needReview;

    const accuracy =
      session.testScore ??
      (session.questionsAttempted > 0
        ? (session.questionsCorrect / session.questionsAttempted) * 100
        : session.masteryBefore);

    const updated = await this.mastery.applyFromSession(
      userId,
      session.topicId,
      accuracy,
      dto.recallSelfScore,
    );

    session.masteryAfter = updated.overallScore;
    session.status = SessionStatus.COMPLETED;
    session.completedAt = new Date();
    await this.sessions.save(session);

    if (updated.overallScore >= 76) {
      await this.revision.ensureScheduled(userId, session.topicId);
    }

    return this.sessions.findOne({
      where: { id: session.id },
      relations: ['topic', 'course'],
    });
  }

  async listRecent(userId: string, limit = 20) {
    return this.sessions.find({
      where: { userId },
      relations: ['topic', 'course'],
      order: { startedAt: 'DESC' },
      take: Math.min(limit, 100),
    });
  }

  async findOne(userId: string, id: string) {
    const session = await this.sessions.findOne({
      where: { id },
      relations: ['topic', 'course', 'topic.mastery'],
    });
    if (!session) throw new NotFoundException('Session not found');
    if (session.userId !== userId) throw new ForbiddenException();
    return session;
  }

  private async findOwned(userId: string, id: string) {
    const session = await this.sessions.findOne({ where: { id } });
    if (!session) throw new NotFoundException('Session not found');
    if (session.userId !== userId) throw new ForbiddenException();
    return session;
  }
}
