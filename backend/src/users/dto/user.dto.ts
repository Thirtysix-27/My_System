import {
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(4)
  targetGpa?: number;
}

export class UpdatePreferencesDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  allocationNormalCurrent?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  allocationNormalCatchUp?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  allocationNormalRevision?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  allocationBehindCurrent?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  allocationBehindCatchUp?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  allocationBehindRevision?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  behindThresholdTopics?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  behindMasteryAvg?: number;

  @IsOptional()
  @IsObject()
  priorityWeights?: {
    weakness?: number;
    examImportance?: number;
    lecturerRelevance?: number;
    assessmentUrgency?: number;
    forgettingRisk?: number;
  };
}
