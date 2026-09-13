import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { IsNumber, IsObject, IsOptional, IsString, Max, Min } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UsersService } from './users.service';

class ProfileDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(4)
  targetGpa?: number;
}

class PrefsDto {
  @IsOptional()
  @IsNumber()
  allocationNormalCurrent?: number;
  @IsOptional()
  @IsNumber()
  allocationNormalCatchUp?: number;
  @IsOptional()
  @IsNumber()
  allocationNormalRevision?: number;
  @IsOptional()
  @IsNumber()
  allocationBehindCurrent?: number;
  @IsOptional()
  @IsNumber()
  allocationBehindCatchUp?: number;
  @IsOptional()
  @IsNumber()
  allocationBehindRevision?: number;
  @IsOptional()
  @IsNumber()
  behindThresholdTopics?: number;
  @IsOptional()
  @IsNumber()
  behindMasteryAvg?: number;
  @IsOptional()
  @IsObject()
  priorityWeights?: Record<string, number>;
}

@Controller()
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Patch('users/me')
  profile(
    @CurrentUser() user: { userId: string },
    @Body() dto: ProfileDto,
  ) {
    return this.users.updateProfile(user.userId, dto);
  }

  @Get('users/me/preferences')
  getPrefs(@CurrentUser() user: { userId: string }) {
    return this.users.getPreferences(user.userId);
  }

  @Patch('users/me/preferences')
  patchPrefs(
    @CurrentUser() user: { userId: string },
    @Body() dto: PrefsDto,
  ) {
    return this.users.updatePreferences(user.userId, dto);
  }
}
