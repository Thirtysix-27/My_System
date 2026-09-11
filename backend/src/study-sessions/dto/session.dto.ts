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
import { StudyCategory } from '../common/enums';

export class StartSessionDto {
  @IsUUID()
  courseId: string;

  @IsUUID()
  topicId: string;

  @IsOptional()
  @IsEnum(StudyCategory)
  category?: StudyCategory;
}

export class UpdateSessionDto {
  @IsOptional()
  @IsString()
  recallNotes?: string;

  @IsOptional()
  @IsString()
  learnNotes?: string;

  @IsOptional()
  @IsString()
  practiceNotes?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  testScore?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  questionsAttempted?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  questionsCorrect?: number;

  @IsOptional()
  @IsString()
  understood?: string;

  @IsOptional()
  @IsString()
  confused?: string;

  @IsOptional()
  @IsString()
  needReview?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  durationMinutes?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  recallSelfScore?: number;
}

export class CompleteSessionDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  testScore?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  recallSelfScore?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  durationMinutes?: number;

  @IsOptional()
  @IsString()
  understood?: string;

  @IsOptional()
  @IsString()
  confused?: string;

  @IsOptional()
  @IsString()
  needReview?: string;
}
