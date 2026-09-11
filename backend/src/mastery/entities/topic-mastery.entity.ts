import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Topic } from '../../topics/entities/topic.entity';
import { User } from '../../users/entities/user.entity';

@Entity('topic_mastery')
export class TopicMastery {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  topicId: string;

  @OneToOne(() => Topic, (t) => t.mastery, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'topicId' })
  topic: Topic;

  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'real', default: 0 })
  overallScore: number;

  @Column({ type: 'real', default: 0 })
  understanding: number;

  @Column({ type: 'real', default: 0 })
  recall: number;

  @Column({ type: 'real', default: 0 })
  application: number;

  @Column({ type: 'real', default: 0 })
  examQuestions: number;

  @Column({ type: 'datetime', nullable: true })
  lastReviewedAt: Date | null;

  @UpdateDateColumn()
  updatedAt: Date;
}
