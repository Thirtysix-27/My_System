import {
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { QuestionType } from '../common/enums';

export class CreatePastPaperDto {
  @IsUUID()
  courseId: string;

  @IsInt()
  year: number;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateQuestionDto {
  @IsString()
  questionText: string;

  @IsOptional()
  @IsNumber()
  marks?: number;

  @IsOptional()
  @IsEnum(QuestionType)
  questionType?: QuestionType;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  topicIds?: string[];
}
