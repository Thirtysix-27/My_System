import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Course } from '../courses/entities/course.entity';
import { Topic } from '../topics/entities/topic.entity';
import { CreatePastPaperDto, CreateQuestionDto } from './dto/past-paper.dto';
import { ExamQuestion } from './entities/exam-question.entity';
import { PastPaper } from './entities/past-paper.entity';

@Injectable()
export class PastPapersService {
  constructor(
    @InjectRepository(PastPaper) private readonly papers: Repository<PastPaper>,
    @InjectRepository(ExamQuestion)
    private readonly questions: Repository<ExamQuestion>,
    @InjectRepository(Course) private readonly courses: Repository<Course>,
    @InjectRepository(Topic) private readonly topics: Repository<Topic>,
  ) {}

  async create(userId: string, dto: CreatePastPaperDto) {
    const course = await this.courses.findOne({
      where: { id: dto.courseId, userId },
    });
    if (!course) throw new NotFoundException('Course not found');
    return this.papers.save(
      this.papers.create({
        userId,
        courseId: dto.courseId,
        year: dto.year,
        title: dto.title ?? `${course.code} ${dto.year}`,
        notes: dto.notes ?? '',
      }),
    );
  }

  async list(userId: string, courseId?: string) {
    return this.papers.find({
      where: courseId ? { userId, courseId } : { userId },
      relations: ['course', 'questions', 'questions.topics'],
      order: { year: 'DESC' },
    });
  }

  async addQuestion(userId: string, paperId: string, dto: CreateQuestionDto) {
    const paper = await this.papers.findOne({ where: { id: paperId, userId } });
    if (!paper) throw new NotFoundException('Past paper not found');
    const topics =
      dto.topicIds && dto.topicIds.length
        ? await this.topics.find({ where: { id: In(dto.topicIds) } })
        : [];
    const q = this.questions.create({
      pastPaperId: paperId,
      questionText: dto.questionText,
      marks: dto.marks ?? 0,
      questionType: dto.questionType,
      topics,
    });
    return this.questions.save(q);
  }

  async topicFrequency(userId: string, courseId: string) {
    const course = await this.courses.findOne({
      where: { id: courseId, userId },
      relations: ['topics'],
    });
    if (!course) throw new NotFoundException('Course not found');

    const papers = await this.papers.find({
      where: { userId, courseId },
      relations: ['questions', 'questions.topics'],
    });

    const counts = new Map<string, { title: string; appearances: number }>();
    for (const t of course.topics ?? []) {
      counts.set(t.id, { title: t.title, appearances: 0 });
    }
    for (const paper of papers) {
      for (const q of paper.questions ?? []) {
        for (const t of q.topics ?? []) {
          const cur = counts.get(t.id) ?? { title: t.title, appearances: 0 };
          cur.appearances += 1;
          counts.set(t.id, cur);
        }
      }
    }

    return {
      disclaimer:
        'Counts are historical evidence from entered papers. Frequent topics are not guaranteed to appear again.',
      courseId,
      topics: [...counts.entries()]
        .map(([topicId, v]) => ({ topicId, ...v }))
        .sort((a, b) => b.appearances - a.appearances),
    };
  }

  async remove(userId: string, id: string) {
    const paper = await this.papers.findOne({ where: { id, userId } });
    if (!paper) throw new NotFoundException('Past paper not found');
    await this.papers.remove(paper);
    return { deleted: true };
  }
}
