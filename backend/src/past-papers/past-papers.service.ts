import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Course } from '../courses/entities/course.entity';
import { Topic } from '../topics/entities/topic.entity';
import {
  CreateExamQuestionDto,
  CreatePastPaperDto,
  UpdatePastPaperDto,
} from './dto/past-paper.dto';
import { ExamQuestion } from './entities/exam-question.entity';
import { PastPaper } from './entities/past-paper.entity';

@Injectable()
export class PastPapersService {
  constructor(
    @InjectRepository(PastPaper)
    private readonly papers: Repository<PastPaper>,
    @InjectRepository(ExamQuestion)
    private readonly questions: Repository<ExamQuestion>,
    @InjectRepository(Course) private readonly courses: Repository<Course>,
    @InjectRepository(Topic) private readonly topics: Repository<Topic>,
  ) {}

  async create(userId: string, dto: CreatePastPaperDto) {
    await this.assertCourse(userId, dto.courseId);
    return this.papers.save(
      this.papers.create({
        userId,
        courseId: dto.courseId,
        year: dto.year,
        title: dto.title ?? `${dto.year} Paper`,
        notes: dto.notes ?? '',
      }),
    );
  }

  async findAll(userId: string, courseId?: string) {
    return this.papers.find({
      where: courseId ? { userId, courseId } : { userId },
      relations: ['questions', 'questions.topics', 'course'],
      order: { year: 'DESC' },
    });
  }

  async findOne(userId: string, id: string) {
    const paper = await this.papers.findOne({
      where: { id },
      relations: ['questions', 'questions.topics', 'course'],
    });
    if (!paper) throw new NotFoundException('Past paper not found');
    if (paper.userId !== userId) throw new ForbiddenException();
    return paper;
  }

  async update(userId: string, id: string, dto: UpdatePastPaperDto) {
    const paper = await this.findOne(userId, id);
    Object.assign(paper, dto);
    await this.papers.save(paper);
    return this.findOne(userId, id);
  }

  async remove(userId: string, id: string) {
    const paper = await this.findOne(userId, id);
    await this.papers.remove(paper);
    return { deleted: true };
  }

  async addQuestion(
    userId: string,
    paperId: string,
    dto: CreateExamQuestionDto,
  ) {
    const paper = await this.findOne(userId, paperId);
    const topics =
      dto.topicIds.length === 0
        ? []
        : await this.topics.find({
            where: { id: In(dto.topicIds), courseId: paper.courseId },
          });

    if (topics.length !== dto.topicIds.length) {
      throw new NotFoundException(
        'One or more topics not found in this course',
      );
    }

    const question = await this.questions.save(
      this.questions.create({
        pastPaperId: paper.id,
        questionText: dto.questionText,
        marks: dto.marks ?? 0,
        questionType: dto.questionType,
        topics,
      }),
    );

    return this.questions.findOne({
      where: { id: question.id },
      relations: ['topics'],
    });
  }

  async topicFrequency(userId: string, courseId: string) {
    await this.assertCourse(userId, courseId);
    const topics = await this.topics.find({
      where: { courseId },
      order: { orderIndex: 'ASC' },
    });

    const counts = new Map<string, number>();
    try {
      const rows = await this.questions
        .createQueryBuilder('q')
        .innerJoin('q.topics', 't')
        .innerJoin('q.pastPaper', 'p')
        .select('t.id', 'topicId')
        .addSelect('COUNT(*)', 'cnt')
        .where('p.courseId = :courseId', { courseId })
        .andWhere('p.userId = :userId', { userId })
        .groupBy('t.id')
        .getRawMany<{ topicId: string; cnt: string }>();
      for (const r of rows) counts.set(r.topicId, Number(r.cnt));
    } catch {
      // empty join table
    }

    return {
      evidenceType: 'historical' as const,
      disclaimer:
        'Counts reflect tagged past-paper questions only — historical evidence, not prediction.',
      courseId,
      topics: topics.map((t) => ({
        topicId: t.id,
        title: t.title,
        orderIndex: t.orderIndex,
        historicalCount: counts.get(t.id) ?? 0,
      })),
    };
  }

  private async assertCourse(userId: string, courseId: string) {
    const course = await this.courses.findOne({
      where: { id: courseId, userId },
    });
    if (!course) throw new NotFoundException('Course not found');
    return course;
  }
}
