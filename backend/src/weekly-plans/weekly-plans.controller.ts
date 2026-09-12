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
  CreateWeeklyReviewDto,
  CreateWeeklyTargetDto,
  GenerateWeeklyTargetsDto,
  RollForwardDto,
  UpdateWeeklyTargetDto,
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
    return this.plans.listByWeek(user.userId, week);
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
    @Body() dto: GenerateWeeklyTargetsDto,
  ) {
    return this.plans.generate(user.userId, dto);
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
  rollForward(
    @CurrentUser() user: { userId: string },
    @Body() dto: RollForwardDto,
  ) {
    return this.plans.rollForward(user.userId, dto);
  }

  @Get('recovery/plan')
  recovery(
    @CurrentUser() user: { userId: string },
    @Query('week') week?: string,
  ) {
    return this.plans.recoveryPlan(user.userId, week);
  }

  @Post('weekly-reviews')
  createReview(
    @CurrentUser() user: { userId: string },
    @Body() dto: CreateWeeklyReviewDto,
  ) {
    return this.plans.createReview(user.userId, dto);
  }

  @Get('weekly-reviews/latest')
  latestReview(@CurrentUser() user: { userId: string }) {
    return this.plans.latestReview(user.userId);
  }
}
