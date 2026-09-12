import { IsEnum, IsUUID } from 'class-validator';
import { RevisionResult } from '../../common/enums';

export class MarkReviewedDto {
  @IsUUID()
  topicId: string;

  @IsEnum(RevisionResult)
  result: RevisionResult;
}
