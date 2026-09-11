import { IsNumber, IsOptional, Max, Min } from 'class-validator';

export class UpdateMasteryDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  understanding?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  recall?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  application?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  examQuestions?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  overallScore?: number;
}
