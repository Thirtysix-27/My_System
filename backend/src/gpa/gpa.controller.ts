import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { GpaService } from './gpa.service';

class UpsertGradeDto {
  @IsUUID()
  courseId: string;

  @IsOptional()
  @IsString()
  letterGrade?: string | null;

  @IsOptional()
  @IsNumber()
  gradePoints?: number | null;

  @IsOptional()
  @IsNumber()
  currentMarks?: number | null;

  @IsOptional()
  @IsBoolean()
  isFinal?: boolean;

  @IsOptional()
  @IsString()
  semester?: string;
}

class ScaleBandDto {
  @IsString()
  letter: string;

  @IsNumber()
  min: number;

  @IsNumber()
  points: number;
}

class ScaleDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScaleBandDto)
  scale: ScaleBandDto[];
}

class TargetDto {
  @IsNumber()
  @Min(0)
  @Max(4)
  targetGpa: number;
}

@Controller('gpa')
@UseGuards(JwtAuthGuard)
export class GpaController {
  constructor(private readonly gpa: GpaService) {}

  @Get('dashboard')
  dashboard(@CurrentUser() user: { userId: string }) {
    return this.gpa.dashboard(user.userId);
  }

  @Put('grades')
  upsert(
    @CurrentUser() user: { userId: string },
    @Body() dto: UpsertGradeDto,
  ) {
    return this.gpa.upsertGrade(user.userId, dto);
  }

  @Get('scale')
  scale(@CurrentUser() user: { userId: string }) {
    return this.gpa.getScale(user.userId);
  }

  @Put('scale')
  setScale(@CurrentUser() user: { userId: string }, @Body() dto: ScaleDto) {
    return this.gpa.setScale(user.userId, dto.scale);
  }

  @Put('target')
  target(@CurrentUser() user: { userId: string }, @Body() dto: TargetDto) {
    return this.gpa.setTarget(user.userId, dto.targetGpa);
  }
}
