import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { IsEnum } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RevisionResult } from '../common/enums';
import { RevisionService } from './revision.service';

class MarkRevisionDto {
  @IsEnum(RevisionResult)
  result: RevisionResult;
}

@Controller('revision')
@UseGuards(JwtAuthGuard)
export class RevisionController {
  constructor(private readonly revision: RevisionService) {}

  @Get()
  list(@CurrentUser() user: { userId: string }) {
    return this.revision.listAll(user.userId);
  }

  @Get('due')
  due(@CurrentUser() user: { userId: string }) {
    return this.revision.listDue(user.userId);
  }

  @Post(':topicId')
  mark(
    @CurrentUser() user: { userId: string },
    @Param('topicId') topicId: string,
    @Body() dto: MarkRevisionDto,
  ) {
    return this.revision.markReviewed(user.userId, topicId, dto.result);
  }
}
