import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TopicMastery } from '../mastery/entities/topic-mastery.entity';
import { PriorityModule } from '../priority/priority.module';
import { StudySession } from '../study-sessions/entities/study-session.entity';
import { WeeklyReview } from './entities/weekly-review.entity';
import { WeeklyTarget } from './entities/weekly-target.entity';
import { WeeklyPlansController } from './weekly-plans.controller';
import { WeeklyPlansService } from './weekly-plans.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WeeklyTarget,
      WeeklyReview,
      StudySession,
      TopicMastery,
    ]),
    PriorityModule,
  ],
  controllers: [WeeklyPlansController],
  providers: [WeeklyPlansService],
  exports: [WeeklyPlansService],
})
export class WeeklyPlansModule {}
