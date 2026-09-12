import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { MarkReviewedDto } from './dto/revision.dto';
import { RevisionService } from './revision.service';

@Controller('revision')
@UseGuards(JwtAuthGuard)
export class RevisionController {
  constructor(private readonly revision: RevisionService) {}

  @Get('due')
  listDue(@CurrentUser() user: { userId: string }) {
    return this.revision.listDue(user.userId);
  }

  @Get()
  listAll(@CurrentUser() user: { userId: string }) {
    return this.revision.listAll(user.userId);
  }

  @Post('reviewed')
  markReviewed(
    @CurrentUser() user: { userId: string },
    @Body() dto: MarkReviewedDto,
  ) {
    return this.revision.markReviewed(user.userId, dto.topicId, dto.result);
  }
}
