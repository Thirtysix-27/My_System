import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { AssessmentStatus, AssessmentType } from '../../common/enums';

export class CreateAssessmentDto {
  @IsUUID()
  courseId: string;

  @IsString()
  @MaxLength(160)
  title: string;

  @IsOptional()
  @IsEnum(AssessmentType)
  type?: AssessmentType;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  weight?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  expectedMark?: number;

  @IsOptional()
  @IsEnum(AssessmentStatus)
  status?: AssessmentStatus;
}

export class UpdateAssessmentDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  title?: string;

  @IsOptional()
  @IsEnum(AssessmentType)
  type?: AssessmentType;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  weight?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  expectedMark?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  actualMark?: number | null;

  @IsOptional()
  @IsEnum(AssessmentStatus)
  status?: AssessmentStatus;
}
