import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { QuestionType } from '../../common/enums';

export class CreatePastPaperDto {
  @IsUUID()
  courseId: string;

  @IsInt()
  @Min(1990)
  year: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdatePastPaperDto {
  @IsOptional()
  @IsInt()
  @Min(1990)
  year?: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateExamQuestionDto {
  @IsString()
  questionText: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  marks?: number;

  @IsOptional()
  @IsEnum(QuestionType)
  questionType?: QuestionType;

  @IsArray()
  @ArrayMinSize(0)
  @IsUUID('4', { each: true })
  topicIds: string[];
}
