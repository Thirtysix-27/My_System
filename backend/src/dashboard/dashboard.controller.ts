import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { DashboardService } from './dashboard.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get('dashboard')
  home(@CurrentUser() user: { userId: string }) {
    return this.dashboard.home(user.userId);
  }

  @Get('analytics/mastery-by-course')
  masteryByCourse(@CurrentUser() user: { userId: string }) {
    return this.dashboard.masteryByCourse(user.userId);
  }

  @Get('analytics/weekly-progress')
  weeklyProgress(
    @CurrentUser() user: { userId: string },
    @Query('weeks') weeks?: string,
  ) {
    return this.dashboard.weeklyProgressChart(
      user.userId,
      weeks ? Number(weeks) : 6,
    );
  }

  @Get('analytics/gaps')
  gaps(@CurrentUser() user: { userId: string }) {
    return this.dashboard.gapsSummary(user.userId);
  }

  @Get('analytics/topic-frequency')
  topicFrequency(@CurrentUser() user: { userId: string }) {
    return this.dashboard.topicFrequencySample(user.userId);
  }

  @Get('analytics/assessment-performance')
  assessmentPerformance(@CurrentUser() user: { userId: string }) {
    return this.dashboard.assessmentPerformance(user.userId);
  }

  @Get('analytics/gpa-progression')
  async gpaProgression(@CurrentUser() user: { userId: string }) {
    // Lightweight GPA snapshot for charts (current dashboard numbers)
    const home = await this.dashboard.home(user.userId);
    return {
      targetGpa: home.targetGpa,
      currentGpa: home.currentGpa,
      progressPercent: home.gpa.progressPercent,
      advisory: home.gpa.advisory,
    };
  }
}
