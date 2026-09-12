import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UpdatePreferencesDto, UpdateProfileDto } from './dto/user.dto';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  profile(@CurrentUser() user: { userId: string }) {
    return this.users.getProfile(user.userId);
  }

  @Patch('me')
  updateProfile(
    @CurrentUser() user: { userId: string },
    @Body() dto: UpdateProfileDto,
  ) {
    return this.users.updateProfile(user.userId, dto);
  }

  @Get('me/preferences')
  preferences(@CurrentUser() user: { userId: string }) {
    return this.users.getPreferences(user.userId);
  }

  @Patch('me/preferences')
  updatePreferences(
    @CurrentUser() user: { userId: string },
    @Body() dto: UpdatePreferencesDto,
  ) {
    return this.users.updatePreferences(user.userId, dto);
  }
}
