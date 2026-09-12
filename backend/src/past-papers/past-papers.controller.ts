import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
  CreateExamQuestionDto,
  CreatePastPaperDto,
  UpdatePastPaperDto,
} from './dto/past-paper.dto';
import { PastPapersService } from './past-papers.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class PastPapersController {
  constructor(private readonly papers: PastPapersService) {}

  @Get('past-papers')
  list(
    @CurrentUser() user: { userId: string },
    @Query('courseId') courseId?: string,
  ) {
    return this.papers.findAll(user.userId, courseId);
  }

  @Post('past-papers')
  create(
    @CurrentUser() user: { userId: string },
    @Body() dto: CreatePastPaperDto,
  ) {
    return this.papers.create(user.userId, dto);
  }

  @Get('past-papers/:id')
  one(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.papers.findOne(user.userId, id);
  }

  @Patch('past-papers/:id')
  update(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() dto: UpdatePastPaperDto,
  ) {
    return this.papers.update(user.userId, id, dto);
  }

  @Delete('past-papers/:id')
  remove(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.papers.remove(user.userId, id);
  }

  @Post('past-papers/:id/questions')
  addQuestion(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() dto: CreateExamQuestionDto,
  ) {
    return this.papers.addQuestion(user.userId, id, dto);
  }

  @Get('courses/:id/topic-frequency')
  topicFrequency(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
  ) {
    return this.papers.topicFrequency(user.userId, id);
  }
}
