import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LecturerProgress } from '../lectures/entities/lecturer-progress.entity';
import { TopicMastery } from '../mastery/entities/topic-mastery.entity';
import { CreateCourseDto, UpdateCourseDto } from './dto/course.dto';
import { Course } from './entities/course.entity';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course) private readonly courses: Repository<Course>,
    @InjectRepository(LecturerProgress)
    private readonly progress: Repository<LecturerProgress>,
    @InjectRepository(TopicMastery)
    private readonly mastery: Repository<TopicMastery>,
  ) {}

  async create(userId: string, dto: CreateCourseDto) {
    const course = await this.courses.save(
      this.courses.create({
        userId,
        name: dto.name,
        code: dto.code,
        creditHours: dto.creditHours ?? 3,
        lecturer: dto.lecturer ?? '',
        semester: dto.semester ?? '',
        description: dto.description ?? '',
        objectives: dto.objectives ?? '',
        color: dto.color ?? '#0f766e',
      }),
    );
    await this.progress.save(
      this.progress.create({ courseId: course.id, currentTopicId: null }),
    );
    return this.findOne(userId, course.id);
  }

  async findAll(userId: string) {
    const courses = await this.courses.find({
      where: { userId },
      relations: ['topics', 'topics.mastery', 'lecturerProgress', 'lecturerProgress.currentTopic'],
      order: { name: 'ASC' },
    });

    return courses.map((c) => this.withStats(c));
  }

  async findOne(userId: string, id: string) {
    const course = await this.courses.findOne({
      where: { id, userId },
      relations: [
        'topics',
        'topics.mastery',
        'topics.subtopics',
        'lecturerProgress',
        'lecturerProgress.currentTopic',
      ],
      order: { topics: { orderIndex: 'ASC' } },
    });
    if (!course) throw new NotFoundException('Course not found');
    course.topics = (course.topics ?? []).sort(
      (a, b) => a.orderIndex - b.orderIndex,
    );
    return this.withStats(course);
  }

  async update(userId: string, id: string, dto: UpdateCourseDto) {
    const course = await this.courses.findOne({ where: { id, userId } });
    if (!course) throw new NotFoundException('Course not found');
    Object.assign(course, dto);
    await this.courses.save(course);
    return this.findOne(userId, id);
  }

  async remove(userId: string, id: string) {
    const course = await this.courses.findOne({ where: { id, userId } });
    if (!course) throw new NotFoundException('Course not found');
    await this.courses.remove(course);
    return { deleted: true };
  }

  private withStats(course: Course) {
    const topics = course.topics ?? [];
    const scores = topics.map((t) => t.mastery?.overallScore ?? 0);
    const overallMastery =
      scores.length === 0
        ? 0
        : Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) /
          10;

    return {
      ...course,
      topicCount: topics.length,
      overallMastery,
      lecturerTopic: course.lecturerProgress?.currentTopic
        ? {
            id: course.lecturerProgress.currentTopic.id,
            title: course.lecturerProgress.currentTopic.title,
            orderIndex: course.lecturerProgress.currentTopic.orderIndex,
          }
        : null,
    };
  }
}
