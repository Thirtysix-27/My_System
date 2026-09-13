import { Controller, Get, UseGuards } from '@nestjs/common';
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

  @Get('analytics/charts')
  charts(@CurrentUser() user: { userId: string }) {
    return this.dashboard.charts(user.userId);
  }
}
