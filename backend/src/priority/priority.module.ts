import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Assessment } from '../assessments/entities/assessment.entity';
import { Course } from '../courses/entities/course.entity';
import { ExamQuestion } from '../past-papers/entities/exam-question.entity';
import { RevisionRecord } from '../revision/entities/revision-record.entity';
import { Topic } from '../topics/entities/topic.entity';
import { User } from '../users/entities/user.entity';
import { UserPreferences } from '../users/entities/user-preferences.entity';
import { PriorityController } from './priority.controller';
import { PriorityService } from './priority.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Course,
      Topic,
      Assessment,
      ExamQuestion,
      RevisionRecord,
      UserPreferences,
      User,
    ]),
  ],
  controllers: [PriorityController],
  providers: [PriorityService],
  exports: [PriorityService],
})
export class PriorityModule {}
