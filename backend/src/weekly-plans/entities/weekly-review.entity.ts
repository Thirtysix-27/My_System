import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('weekly_reviews')
export class WeeklyReview {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'date' })
  weekStart: string;

  @Column({ type: 'simple-json', nullable: true })
  summary: Record<string, unknown> | null;

  @Column({ type: 'text', default: '' })
  whatWorked: string;

  @Column({ type: 'text', default: '' })
  whatDidntWork: string;

  @Column({ type: 'text', default: '' })
  stillWeak: string;

  @Column({ type: 'text', default: '' })
  whyMissed: string;

  @Column({ type: 'text', default: '' })
  nextWeekChange: string;

  @CreateDateColumn()
  createdAt: Date;
}
