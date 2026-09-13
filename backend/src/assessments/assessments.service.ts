import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { daysBetween, formatDate } from '../common/date.util';
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
    const course = await this.courses.findOne({
      where: { id: dto.courseId, userId },
    });
    if (!course) throw new NotFoundException('Course not found');
    return this.assessments.save(
      this.assessments.create({
        userId,
        ...dto,
        type: dto.type,
        status: dto.status ?? AssessmentStatus.UPCOMING,
      }),
    );
  }

  async list(userId: string) {
    return this.assessments.find({
      where: { userId },
      relations: ['course'],
      order: { date: 'ASC' },
    });
  }

  async upcoming(userId: string) {
    const today = formatDate(new Date());
    const rows = await this.assessments.find({
      where: {
        userId,
        status: AssessmentStatus.UPCOMING,
        date: MoreThanOrEqual(today),
      },
      relations: ['course'],
      order: { date: 'ASC' },
    });
    return rows.map((a) => ({
      ...a,
      daysRemaining: daysBetween(today, a.date),
    }));
  }

  async update(userId: string, id: string, dto: UpdateAssessmentDto) {
    const row = await this.assessments.findOne({ where: { id, userId } });
    if (!row) throw new NotFoundException('Assessment not found');
    Object.assign(row, dto);
    return this.assessments.save(row);
  }

  async remove(userId: string, id: string) {
    const row = await this.assessments.findOne({ where: { id, userId } });
    if (!row) throw new NotFoundException('Assessment not found');
    await this.assessments.remove(row);
    return { deleted: true };
  }
}
