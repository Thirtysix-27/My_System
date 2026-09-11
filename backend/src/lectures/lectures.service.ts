import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from '../courses/entities/course.entity';
import { Topic } from '../topics/entities/topic.entity';
import { UpdateLecturerProgressDto } from './dto/lecture.dto';
import { LecturerProgress } from './entities/lecturer-progress.entity';

@Injectable()
export class LecturesService {
  constructor(
    @InjectRepository(LecturerProgress)
    private readonly progress: Repository<LecturerProgress>,
    @InjectRepository(Course) private readonly courses: Repository<Course>,
    @InjectRepository(Topic) private readonly topics: Repository<Topic>,
  ) {}

  private async ownedCourse(userId: string, courseId: string) {
    const course = await this.courses.findOne({ where: { id: courseId, userId } });
    if (!course) throw new NotFoundException('Course not found');
    return course;
  }

  async get(userId: string, courseId: string) {
    await this.ownedCourse(userId, courseId);
    let row = await this.progress.findOne({
      where: { courseId },
      relations: ['currentTopic'],
    });
    if (!row) {
      row = await this.progress.save(
        this.progress.create({ courseId, currentTopicId: null }),
      );
    }
    return row;
  }

  async upsert(userId: string, courseId: string, dto: UpdateLecturerProgressDto) {
    await this.ownedCourse(userId, courseId);
    const topic = await this.topics.findOne({ where: { id: dto.currentTopicId } });
    if (!topic || topic.courseId !== courseId) {
      throw new BadRequestException('Topic does not belong to this course');
    }

    let row = await this.progress.findOne({ where: { courseId } });
    if (!row) {
      row = this.progress.create({ courseId });
    }
    row.currentTopicId = dto.currentTopicId;
    if (dto.notes !== undefined) row.notes = dto.notes;
    await this.progress.save(row);
    return this.get(userId, courseId);
  }
}
