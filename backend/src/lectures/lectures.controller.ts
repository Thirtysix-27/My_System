import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UpdateLecturerProgressDto } from './dto/lecture.dto';
import { LecturesService } from './lectures.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class LecturesController {
  constructor(private readonly lectures: LecturesService) {}

  @Get('courses/:courseId/lecturer-progress')
  get(
    @CurrentUser() user: { userId: string },
    @Param('courseId') courseId: string,
  ) {
    return this.lectures.get(user.userId, courseId);
  }

  @Put('courses/:courseId/lecturer-progress')
  upsert(
    @CurrentUser() user: { userId: string },
    @Param('courseId') courseId: string,
    @Body() dto: UpdateLecturerProgressDto,
  ) {
    return this.lectures.upsert(user.userId, courseId, dto);
  }
}
