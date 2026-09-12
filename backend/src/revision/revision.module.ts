import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Topic } from '../topics/entities/topic.entity';
import { RevisionRecord } from './entities/revision-record.entity';
import { RevisionController } from './revision.controller';
import { RevisionService } from './revision.service';

@Module({
  imports: [TypeOrmModule.forFeature([RevisionRecord, Topic])],
  controllers: [RevisionController],
  providers: [RevisionService],
  exports: [RevisionService],
})
export class RevisionModule {}
