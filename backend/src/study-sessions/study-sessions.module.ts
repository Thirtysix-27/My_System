import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Course } from '../courses/entities/course.entity';
import { MasteryModule } from '../mastery/mastery.module';
import { RevisionModule } from '../revision/revision.module';
import { Topic } from '../topics/entities/topic.entity';
import { StudySession } from './entities/study-session.entity';
import { StudySessionsController } from './study-sessions.controller';
import { StudySessionsService } from './study-sessions.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([StudySession, Course, Topic]),
    MasteryModule,
    forwardRef(() => RevisionModule),
  ],
  controllers: [StudySessionsController],
  providers: [StudySessionsService],
  exports: [StudySessionsService],
})
export class StudySessionsModule {}
