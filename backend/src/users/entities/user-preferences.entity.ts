import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  DEFAULT_GRADING_SCALE,
  DEFAULT_PRIORITY_WEIGHTS,
} from '../../common/enums';
import { User } from './user.entity';

@Entity('user_preferences')
export class UserPreferences {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @OneToOne(() => User, (u) => u.preferences, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'int', default: 40 })
  allocationNormalCurrent: number;

  @Column({ type: 'int', default: 40 })
  allocationNormalCatchUp: number;

  @Column({ type: 'int', default: 20 })
  allocationNormalRevision: number;

  @Column({ type: 'int', default: 30 })
  allocationBehindCurrent: number;

  @Column({ type: 'int', default: 50 })
  allocationBehindCatchUp: number;

  @Column({ type: 'int', default: 20 })
  allocationBehindRevision: number;

  @Column({ type: 'int', default: 3 })
  behindThresholdTopics: number;

  @Column({ type: 'int', default: 50 })
  behindMasteryAvg: number;

  // simple-json: set object defaults in code (AuthService / seed), not SQL defaults
  @Column({ type: 'simple-json', nullable: true })
  priorityWeights: typeof DEFAULT_PRIORITY_WEIGHTS | null;

  @Column({ type: 'simple-json', nullable: true })
  gradingScale: typeof DEFAULT_GRADING_SCALE | null;

  @UpdateDateColumn()
  updatedAt: Date;
}
