import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { masteryLevel } from '../common/enums';
import { Course } from '../courses/entities/course.entity';
import { TopicMastery } from '../mastery/entities/topic-mastery.entity';
import {
  CreateSubtopicDto,
  CreateTopicDto,
  UpdateTopicDto,
} from './dto/topic.dto';
import { Subtopic } from './entities/subtopic.entity';
import { Topic } from './entities/topic.entity';

@Injectable()
export class TopicsService {
  constructor(
    @InjectRepository(Topic) private readonly topics: Repository<Topic>,
    @InjectRepository(Subtopic) private readonly subtopics: Repository<Subtopic>,
    @InjectRepository(Course) private readonly courses: Repository<Course>,
    @InjectRepository(TopicMastery)
    private readonly mastery: Repository<TopicMastery>,
  ) {}

  private async ownedCourse(userId: string, courseId: string) {
    const course = await this.courses.findOne({ where: { id: courseId, userId } });
    if (!course) throw new NotFoundException('Course not found');
    return course;
  }

  private async ownedTopic(userId: string, topicId: string) {
    const topic = await this.topics.findOne({
      where: { id: topicId },
      relations: ['course', 'mastery', 'subtopics'],
    });
    if (!topic) throw new NotFoundException('Topic not found');
    if (topic.course.userId !== userId) {
      throw new ForbiddenException('Topic does not belong to you');
    }
    return topic;
  }

  async getOne(userId: string, topicId: string) {
    const topic = await this.ownedTopic(userId, topicId);
    return {
      ...topic,
      masteryLevel: masteryLevel(topic.mastery?.overallScore ?? 0),
    };
  }

  async listByCourse(userId: string, courseId: string) {
    await this.ownedCourse(userId, courseId);
    const topics = await this.topics.find({
      where: { courseId },
      relations: ['mastery', 'subtopics'],
      order: { orderIndex: 'ASC', subtopics: { orderIndex: 'ASC' } },
    });
    return topics.map((t) => ({
      ...t,
      masteryLevel: masteryLevel(t.mastery?.overallScore ?? 0),
    }));
  }

  async create(userId: string, courseId: string, dto: CreateTopicDto) {
    await this.ownedCourse(userId, courseId);

    let orderIndex = dto.orderIndex;
    if (orderIndex === undefined) {
      const last = await this.topics.findOne({
        where: { courseId },
        order: { orderIndex: 'DESC' },
      });
      orderIndex = (last?.orderIndex ?? -1) + 1;
    }

    const topic = await this.topics.save(
      this.topics.create({
        courseId,
        title: dto.title,
        orderIndex,
        importanceWeight: dto.importanceWeight ?? 1,
        description: dto.description ?? '',
      }),
    );

    await this.mastery.save(
      this.mastery.create({
        topicId: topic.id,
        userId,
        overallScore: 0,
        understanding: 0,
        recall: 0,
        application: 0,
        examQuestions: 0,
      }),
    );

    return this.ownedTopic(userId, topic.id);
  }

  async update(userId: string, id: string, dto: UpdateTopicDto) {
    const topic = await this.ownedTopic(userId, id);
    Object.assign(topic, dto);
    await this.topics.save(topic);
    return this.ownedTopic(userId, id);
  }

  async remove(userId: string, id: string) {
    const topic = await this.ownedTopic(userId, id);
    await this.topics.remove(topic);
    return { deleted: true };
  }

  async addSubtopic(userId: string, topicId: string, dto: CreateSubtopicDto) {
    await this.ownedTopic(userId, topicId);
    let orderIndex = dto.orderIndex;
    if (orderIndex === undefined) {
      const last = await this.subtopics.findOne({
        where: { topicId },
        order: { orderIndex: 'DESC' },
      });
      orderIndex = (last?.orderIndex ?? -1) + 1;
    }
    return this.subtopics.save(
      this.subtopics.create({
        topicId,
        title: dto.title,
        orderIndex,
      }),
    );
  }
}
