import { IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateLecturerProgressDto {
  @IsUUID()
  currentTopicId: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
