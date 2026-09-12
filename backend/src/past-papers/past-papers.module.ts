import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Course } from '../courses/entities/course.entity';
import { Topic } from '../topics/entities/topic.entity';
import { ExamQuestion } from './entities/exam-question.entity';
import { PastPaper } from './entities/past-paper.entity';
import { PastPapersController } from './past-papers.controller';
import { PastPapersService } from './past-papers.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([PastPaper, ExamQuestion, Course, Topic]),
  ],
  controllers: [PastPapersController],
  providers: [PastPapersService],
  exports: [PastPapersService],
})
export class PastPapersModule {}
