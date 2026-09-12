import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Assessment } from '../assessments/entities/assessment.entity';
import { Course } from '../courses/entities/course.entity';
import { GpaModule } from '../gpa/gpa.module';
import { PastPapersModule } from '../past-papers/past-papers.module';
import { PriorityModule } from '../priority/priority.module';
import { StudySession } from '../study-sessions/entities/study-session.entity';
import { User } from '../users/entities/user.entity';
import { WeeklyTarget } from '../weekly-plans/entities/weekly-target.entity';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Course,
      Assessment,
      StudySession,
      WeeklyTarget,
      User,
    ]),
    PriorityModule,
    GpaModule,
    PastPapersModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
