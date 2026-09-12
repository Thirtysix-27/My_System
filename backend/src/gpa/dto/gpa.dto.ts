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
import { Type } from 'class-transformer';

export class UpsertGradeDto {
  @IsUUID()
  courseId: string;

  @IsOptional()
  @IsString()
  semester?: string;

  @IsOptional()
  @IsString()
  letterGrade?: string | null;

  @IsOptional()
  @IsNumber()
  gradePoints?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  currentMarks?: number | null;

  @IsOptional()
  @IsBoolean()
  isFinal?: boolean;
}

export class ScaleBandDto {
  @IsString()
  letter: string;

  @IsNumber()
  min: number;

  @IsNumber()
  points: number;
}

export class UpdateScaleDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScaleBandDto)
  scale: ScaleBandDto[];
}

export class UpdateTargetGpaDto {
  @IsNumber()
  @Min(0)
  @Max(4)
  targetGpa: number;
}
