import { Body, Controller, Get, Patch, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
  UpdateScaleDto,
  UpdateTargetGpaDto,
  UpsertGradeDto,
} from './dto/gpa.dto';
import { GpaService } from './gpa.service';

@Controller('gpa')
@UseGuards(JwtAuthGuard)
export class GpaController {
  constructor(private readonly gpa: GpaService) {}

  @Get('dashboard')
  dashboard(@CurrentUser() user: { userId: string }) {
    return this.gpa.dashboard(user.userId);
  }

  @Put('grades')
  upsertGrade(
    @CurrentUser() user: { userId: string },
    @Body() dto: UpsertGradeDto,
  ) {
    return this.gpa.upsertGrade(user.userId, dto);
  }

  @Get('scale')
  scale(@CurrentUser() user: { userId: string }) {
    return this.gpa.getGradingScale(user.userId);
  }

  @Put('scale')
  updateScale(
    @CurrentUser() user: { userId: string },
    @Body() dto: UpdateScaleDto,
  ) {
    return this.gpa.updateScale(user.userId, dto);
  }

  @Patch('target')
  updateTarget(
    @CurrentUser() user: { userId: string },
    @Body() dto: UpdateTargetGpaDto,
  ) {
    return this.gpa.updateTargetGpa(user.userId, dto);
  }
}
