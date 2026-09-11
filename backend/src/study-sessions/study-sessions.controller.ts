import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
  CompleteSessionDto,
  StartSessionDto,
  UpdateSessionDto,
} from './dto/session.dto';
import { StudySessionsService } from './study-sessions.service';

@Controller('study-sessions')
@UseGuards(JwtAuthGuard)
export class StudySessionsController {
  constructor(private readonly sessions: StudySessionsService) {}

  @Get()
  list(
    @CurrentUser() user: { userId: string },
    @Query('limit') limit?: string,
  ) {
    return this.sessions.listRecent(user.userId, limit ? Number(limit) : 20);
  }

  @Post()
  start(
    @CurrentUser() user: { userId: string },
    @Body() dto: StartSessionDto,
  ) {
    return this.sessions.start(user.userId, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() dto: UpdateSessionDto,
  ) {
    return this.sessions.update(user.userId, id, dto);
  }

  @Post(':id/complete')
  complete(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() dto: CompleteSessionDto,
  ) {
    return this.sessions.complete(user.userId, id, dto);
  }
}
