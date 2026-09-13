import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssessmentsModule } from './assessments/assessments.module';
import { AuthModule } from './auth/auth.module';
import { CoursesModule } from './courses/courses.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { GpaModule } from './gpa/gpa.module';
import { LecturesModule } from './lectures/lectures.module';
import { MasteryModule } from './mastery/mastery.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PastPapersModule } from './past-papers/past-papers.module';
import { PriorityModule } from './priority/priority.module';
import { RevisionModule } from './revision/revision.module';
import { StudySessionsModule } from './study-sessions/study-sessions.module';
import { TopicsModule } from './topics/topics.module';
import { UsersModule } from './users/users.module';
import { WeeklyPlansModule } from './weekly-plans/weekly-plans.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const type = config.get<string>('DATABASE_TYPE', 'sqlite');
        if (type === 'postgres') {
          return {
            type: 'postgres' as const,
            url: config.get<string>('DATABASE_URL'),
            host: config.get<string>('DATABASE_HOST', 'localhost'),
            port: Number(config.get('DATABASE_PORT', 5432)),
            username: config.get<string>('DATABASE_USER', 'study'),
            password: config.get<string>('DATABASE_PASSWORD', 'study_secret'),
            database: config.get<string>('DATABASE_NAME', 'study_system'),
            autoLoadEntities: true,
            synchronize: true,
          };
        }
        return {
          type: 'better-sqlite3' as const,
          database: config.get<string>('SQLITE_PATH', './data/study.sqlite'),
          autoLoadEntities: true,
          synchronize: true,
        };
      },
    }),
    AuthModule,
    UsersModule,
    CoursesModule,
    TopicsModule,
    LecturesModule,
    MasteryModule,
    StudySessionsModule,
    PriorityModule,
    RevisionModule,
    WeeklyPlansModule,
    AssessmentsModule,
    GpaModule,
    PastPapersModule,
    DashboardModule,
    NotificationsModule,
  ],
})
export class AppModule {}
