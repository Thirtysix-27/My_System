import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { StudyCategory, TargetStatus } from '../common/enums';

export class CreateWeeklyTargetDto {
  @IsUUID()
  courseId: string;

  @IsUUID()
  topicId: string;

  @IsOptional()
  @IsString()
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
  @IsInt()
  priority?: number;

  @IsOptional()
  @IsString()
  deadline?: string;
}

export class UpdateWeeklyTargetDto {
  @IsOptional()
  @IsEnum(TargetStatus)
  status?: TargetStatus;

  @IsOptional()
  @IsNumber()
  targetMastery?: number;

  @IsOptional()
  @IsInt()
  targetQuestions?: number;
}

export class WeeklyReviewDto {
  @IsOptional()
  @IsString()
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
