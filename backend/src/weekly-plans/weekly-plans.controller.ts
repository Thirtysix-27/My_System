import {
  Body,
  Controller,
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
  CreateWeeklyTargetDto,
  UpdateWeeklyTargetDto,
  WeeklyReviewDto,
} from './dto/weekly-plan.dto';
import { WeeklyPlansService } from './weekly-plans.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class WeeklyPlansController {
  constructor(private readonly plans: WeeklyPlansService) {}

  @Get('weekly-targets')
  list(
    @CurrentUser() user: { userId: string },
    @Query('week') week?: string,
  ) {
    return this.plans.list(user.userId, week);
  }

  @Post('weekly-targets')
  create(
    @CurrentUser() user: { userId: string },
    @Body() dto: CreateWeeklyTargetDto,
  ) {
    return this.plans.create(user.userId, dto);
  }

  @Post('weekly-targets/generate')
  generate(
    @CurrentUser() user: { userId: string },
    @Query('week') week?: string,
  ) {
    return this.plans.generate(user.userId, week);
  }

  @Patch('weekly-targets/:id')
  update(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() dto: UpdateWeeklyTargetDto,
  ) {
    return this.plans.update(user.userId, id, dto);
  }

  @Post('weekly-targets/roll-forward')
  roll(
    @CurrentUser() user: { userId: string },
    @Query('week') week?: string,
  ) {
    return this.plans.rollForward(user.userId, week);
  }

  @Get('recovery/plan')
  recovery(
    @CurrentUser() user: { userId: string },
    @Query('week') week?: string,
  ) {
    return this.plans.recoveryPlan(user.userId, week);
  }

  @Get('weekly-reviews/preview')
  preview(
    @CurrentUser() user: { userId: string },
    @Query('week') week?: string,
  ) {
    return this.plans.previewReview(user.userId, week);
  }

  @Get('weekly-reviews/latest')
  latest(@CurrentUser() user: { userId: string }) {
    return this.plans.latestReview(user.userId);
  }

  @Post('weekly-reviews')
  review(
    @CurrentUser() user: { userId: string },
    @Body() dto: WeeklyReviewDto,
  ) {
    return this.plans.createReview(user.userId, dto);
  }
}
