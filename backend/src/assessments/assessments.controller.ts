import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AssessmentsService } from './assessments.service';
import { CreateAssessmentDto, UpdateAssessmentDto } from './dto/assessment.dto';

@Controller('assessments')
@UseGuards(JwtAuthGuard)
export class AssessmentsController {
  constructor(private readonly assessments: AssessmentsService) {}

  @Get()
  list(@CurrentUser() user: { userId: string }) {
    return this.assessments.findAll(user.userId);
  }

  @Get('upcoming')
  upcoming(
    @CurrentUser() user: { userId: string },
    @Query('days') days?: string,
  ) {
    return this.assessments.upcoming(
      user.userId,
      days ? Number(days) : 30,
    );
  }

  @Post()
  create(
    @CurrentUser() user: { userId: string },
    @Body() dto: CreateAssessmentDto,
  ) {
    return this.assessments.create(user.userId, dto);
  }

  @Get(':id')
  one(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.assessments.findOne(user.userId, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() dto: UpdateAssessmentDto,
  ) {
    return this.assessments.update(user.userId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.assessments.remove(user.userId, id);
  }
}
