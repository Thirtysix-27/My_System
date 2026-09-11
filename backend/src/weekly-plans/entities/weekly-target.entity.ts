import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { StudyCategory, TargetStatus } from '../../common/enums';
import { User } from '../../users/entities/user.entity';
import { Course } from '../../courses/entities/course.entity';
import { Topic } from '../../topics/entities/topic.entity';

@Entity('weekly_targets')
export class WeeklyTarget {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  courseId: string;

  @ManyToOne(() => Course, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'courseId' })
  course: Course;

  @Column()
  topicId: string;

  @ManyToOne(() => Topic, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'topicId' })
  topic: Topic;

  @Column({ type: 'date' })
  weekStart: string;

  @Column({ type: 'varchar', default: StudyCategory.CATCH_UP })
  category: StudyCategory;

  @Column({ type: 'real', default: 80 })
  targetMastery: number;

  @Column({ type: 'real', default: 0 })
  currentMasterySnapshot: number;

  @Column({ type: 'int', default: 10 })
  targetQuestions: number;

  @Column({ type: 'int', default: 50 })
  priority: number;

  @Column({ type: 'varchar', default: TargetStatus.PENDING })
  status: TargetStatus;

  @Column({ type: 'date', nullable: true })
  deadline: string | null;

  @Column({ nullable: true })
  rolledFromId: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
