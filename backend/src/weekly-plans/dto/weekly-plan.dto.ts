import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { StudyCategory, TargetStatus } from '../../common/enums';

export class CreateWeeklyTargetDto {
  @IsUUID()
  courseId: string;

  @IsUUID()
  topicId: string;

  @IsOptional()
  @IsDateString()
  weekStart?: string;

  @IsOptional()
  @IsEnum(StudyCategory)
  category?: StudyCategory;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  targetMastery?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  targetQuestions?: number;

  @IsOptional()
  @IsNumber()
  priority?: number;

  @IsOptional()
  @IsDateString()
  deadline?: string;
}

export class UpdateWeeklyTargetDto {
  @IsOptional()
  @IsEnum(TargetStatus)
  status?: TargetStatus;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  targetMastery?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  targetQuestions?: number;

  @IsOptional()
  @IsNumber()
  priority?: number;

  @IsOptional()
  @IsEnum(StudyCategory)
  category?: StudyCategory;
}

export class GenerateWeeklyTargetsDto {
  @IsOptional()
  @IsDateString()
  weekStart?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(30)
  limit?: number;
}

export class RollForwardDto {
  @IsOptional()
  @IsDateString()
  fromWeek?: string;

  @IsOptional()
  @IsDateString()
  toWeek?: string;
}

export class CreateWeeklyReviewDto {
  @IsOptional()
  @IsDateString()
  weekStart?: string;

  @IsOptional()
  @IsString()
  whatWorked?: string;

  @IsOptional()
  @IsString()
  whatDidntWork?: string;

  @IsOptional()
  @IsString()
  stillWeak?: string;

  @IsOptional()
  @IsString()
  whyMissed?: string;

  @IsOptional()
  @IsString()
  nextWeekChange?: string;
}
