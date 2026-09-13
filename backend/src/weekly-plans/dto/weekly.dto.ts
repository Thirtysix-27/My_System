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
  targetQuestions?: number;

  @IsOptional()
  @IsInt()
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
  targetMastery?: number;

  @IsOptional()
  @IsInt()
  targetQuestions?: number;

  @IsOptional()
  @IsInt()
  priority?: number;
}

export class WeeklyReviewDto {
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
