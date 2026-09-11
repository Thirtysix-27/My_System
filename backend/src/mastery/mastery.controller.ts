import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UpdateMasteryDto } from './dto/mastery.dto';
import { MasteryService } from './mastery.service';

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
}
