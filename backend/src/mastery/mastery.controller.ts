import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { IsNumber, IsOptional, Max, Min } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UpdateMasteryDto } from './dto/mastery.dto';
import { MasteryService } from './mastery.service';

class QuizResultDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  accuracy: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  recallSelfScore?: number;
}

@Controller()
@UseGuards(JwtAuthGuard)
export class MasteryController {
  constructor(private readonly mastery: MasteryService) {}

  @Get('topics/:id/mastery')
  get(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.mastery.getOrCreate(user.userId, id);
  }

  @Put('topics/:id/mastery')
  update(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() dto: UpdateMasteryDto,
  ) {
    return this.mastery.update(user.userId, id, dto);
  }

  @Post('topics/:id/mastery/from-quiz')
  fromQuiz(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() dto: QuizResultDto,
  ) {
    return this.mastery.applyFromSession(
      user.userId,
      id,
      dto.accuracy,
      dto.recallSelfScore,
    );
  }
}
