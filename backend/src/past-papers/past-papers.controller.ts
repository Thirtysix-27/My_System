import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreatePastPaperDto, CreateQuestionDto } from './dto/past-paper.dto';
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
    return this.papers.list(user.userId, courseId);
  }

  @Post('past-papers')
  create(
    @CurrentUser() user: { userId: string },
    @Body() dto: CreatePastPaperDto,
  ) {
    return this.papers.create(user.userId, dto);
  }

  @Post('past-papers/:id/questions')
  addQuestion(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() dto: CreateQuestionDto,
  ) {
    return this.papers.addQuestion(user.userId, id, dto);
  }

  @Delete('past-papers/:id')
  remove(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.papers.remove(user.userId, id);
  }

  @Get('courses/:courseId/topic-frequency')
  frequency(
    @CurrentUser() user: { userId: string },
    @Param('courseId') courseId: string,
  ) {
    return this.papers.topicFrequency(user.userId, courseId);
  }
}
