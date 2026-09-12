import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Course } from '../courses/entities/course.entity';
import { UserPreferences } from '../users/entities/user-preferences.entity';
import { User } from '../users/entities/user.entity';
import { Grade } from './entities/grade.entity';
import { GpaController } from './gpa.controller';
import { GpaService } from './gpa.service';

@Module({
  imports: [TypeOrmModule.forFeature([Grade, Course, User, UserPreferences])],
  controllers: [GpaController],
  providers: [GpaService],
  exports: [GpaService],
})
export class GpaModule {}
