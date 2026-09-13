import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssessmentsModule } from '../assessments/assessments.module';
import { Course } from '../courses/entities/course.entity';
import { GpaModule } from '../gpa/gpa.module';
import { PastPapersModule } from '../past-papers/past-papers.module';
import { PriorityModule } from '../priority/priority.module';
import { WeeklyPlansModule } from '../weekly-plans/weekly-plans.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Course]),
    GpaModule,
    PriorityModule,
    WeeklyPlansModule,
    AssessmentsModule,
    PastPapersModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
