import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
  CreateSubtopicDto,
  CreateTopicDto,
  UpdateTopicDto,
} from './dto/topic.dto';
import { TopicsService } from './topics.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class TopicsController {
  constructor(private readonly topics: TopicsService) {}

  @Get('courses/:courseId/topics')
  list(
    @CurrentUser() user: { userId: string },
    @Param('courseId') courseId: string,
  ) {
    return this.topics.listByCourse(user.userId, courseId);
  }

  @Post('courses/:courseId/topics')
  create(
    @CurrentUser() user: { userId: string },
    @Param('courseId') courseId: string,
    @Body() dto: CreateTopicDto,
  ) {
    return this.topics.create(user.userId, courseId, dto);
  }

  @Patch('topics/:id')
  update(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() dto: UpdateTopicDto,
  ) {
    return this.topics.update(user.userId, id, dto);
  }

  @Delete('topics/:id')
  remove(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.topics.remove(user.userId, id);
  }

  @Post('topics/:id/subtopics')
  addSubtopic(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() dto: CreateSubtopicDto,
  ) {
    return this.topics.addSubtopic(user.userId, id, dto);
  }
}
