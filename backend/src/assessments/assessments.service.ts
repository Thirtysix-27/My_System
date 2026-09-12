import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, MoreThanOrEqual, Repository } from 'typeorm';
import { addDays, formatDate } from '../common/date.util';
import { AssessmentStatus } from '../common/enums';
import { Course } from '../courses/entities/course.entity';
import { CreateAssessmentDto, UpdateAssessmentDto } from './dto/assessment.dto';
import { Assessment } from './entities/assessment.entity';

@Injectable()
export class AssessmentsService {
  constructor(
    @InjectRepository(Assessment)
    private readonly assessments: Repository<Assessment>,
    @InjectRepository(Course) private readonly courses: Repository<Course>,
  ) {}

  async create(userId: string, dto: CreateAssessmentDto) {
    await this.assertCourse(userId, dto.courseId);
    return this.assessments.save(
      this.assessments.create({
        userId,
        courseId: dto.courseId,
        title: dto.title,
        type: dto.type,
        date: dto.date.slice(0, 10),
        weight: dto.weight ?? 0,
        expectedMark: dto.expectedMark ?? null,
        status: dto.status ?? AssessmentStatus.UPCOMING,
      }),
    );
  }

  async findAll(userId: string) {
    return this.assessments.find({
      where: { userId },
      relations: ['course'],
      order: { date: 'ASC' },
    });
  }

  async findOne(userId: string, id: string) {
    const row = await this.assessments.findOne({
      where: { id },
      relations: ['course'],
    });
    if (!row) throw new NotFoundException('Assessment not found');
    if (row.userId !== userId) throw new ForbiddenException();
    return row;
  }

  async update(userId: string, id: string, dto: UpdateAssessmentDto) {
    const row = await this.findOne(userId, id);
    if (dto.title !== undefined) row.title = dto.title;
    if (dto.type !== undefined) row.type = dto.type;
    if (dto.date !== undefined) row.date = dto.date.slice(0, 10);
    if (dto.weight !== undefined) row.weight = dto.weight;
    if (dto.expectedMark !== undefined) row.expectedMark = dto.expectedMark;
    if (dto.actualMark !== undefined) row.actualMark = dto.actualMark;
    if (dto.status !== undefined) row.status = dto.status;
    return this.assessments.save(row);
  }

  async remove(userId: string, id: string) {
    const row = await this.findOne(userId, id);
    await this.assessments.remove(row);
    return { deleted: true };
  }

  async upcoming(userId: string, days = 30) {
    const today = formatDate(new Date());
    const until = addDays(today, Math.max(1, days));
    return this.assessments.find({
      where: {
        userId,
        status: AssessmentStatus.UPCOMING,
        date: Between(today, until),
      },
      relations: ['course'],
      order: { date: 'ASC' },
    });
  }

  async upcomingFromToday(userId: string) {
    const today = formatDate(new Date());
    return this.assessments.find({
      where: {
        userId,
        status: AssessmentStatus.UPCOMING,
        date: MoreThanOrEqual(today),
      },
      relations: ['course'],
      order: { date: 'ASC' },
      take: 20,
    });
  }

  private async assertCourse(userId: string, courseId: string) {
    const course = await this.courses.findOne({ where: { id: courseId, userId } });
    if (!course) throw new NotFoundException('Course not found');
    return course;
  }
}
