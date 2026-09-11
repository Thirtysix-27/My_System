import { IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateTopicDto {
  @IsString()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  orderIndex?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  importanceWeight?: number;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateTopicDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  orderIndex?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  importanceWeight?: number;

  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateSubtopicDto {
  @IsString()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  orderIndex?: number;
}
