import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PriorityService } from './priority.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class PriorityController {
  constructor(private readonly priority: PriorityService) {}

  @Get('study/next')
  studyNext(
    @CurrentUser() user: { userId: string },
    @Query('limit') limit?: string,
  ) {
    return this.priority.studyNext(user.userId, limit ? Number(limit) : 10);
  }

  @Get('study/allocation')
  allocation(@CurrentUser() user: { userId: string }) {
    return this.priority.allocation(user.userId);
  }

  @Get('courses/:courseId/gaps')
  gaps(
    @CurrentUser() user: { userId: string },
    @Param('courseId') courseId: string,
  ) {
    return this.priority.courseGaps(user.userId, courseId);
  }
}
