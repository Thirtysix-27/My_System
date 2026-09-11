import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RevisionResult } from '../../common/enums';
import { Topic } from '../../topics/entities/topic.entity';
import { User } from '../../users/entities/user.entity';

@Entity('revision_records')
export class RevisionRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  topicId: string;

  @ManyToOne(() => Topic, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'topicId' })
  topic: Topic;

  @Column({ type: 'datetime' })
  nextReviewAt: Date;

  @Column({ type: 'int', default: 1 })
  intervalDays: number;

  @Column({ type: 'varchar', nullable: true })
  lastResult: RevisionResult | null;

  @UpdateDateColumn()
  updatedAt: Date;
}
