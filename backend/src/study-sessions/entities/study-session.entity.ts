import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { StudyCategory, SessionStatus } from '../../common/enums';
import { User } from '../../users/entities/user.entity';
import { Course } from '../../courses/entities/course.entity';
import { Topic } from '../../topics/entities/topic.entity';

@Entity('study_sessions')
export class StudySession {
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

  @Column({ type: 'varchar', default: StudyCategory.CURRENT })
  category: StudyCategory;

  @Column({ type: 'varchar', default: SessionStatus.IN_PROGRESS })
  status: SessionStatus;

  @Column({ type: 'text', default: '' })
  recallNotes: string;

  @Column({ type: 'text', default: '' })
  learnNotes: string;

  @Column({ type: 'text', default: '' })
  practiceNotes: string;

  @Column({ type: 'real', nullable: true })
  testScore: number | null;

  @Column({ type: 'int', default: 0 })
  questionsAttempted: number;

  @Column({ type: 'int', default: 0 })
  questionsCorrect: number;

  @Column({ type: 'text', default: '' })
  understood: string;

  @Column({ type: 'text', default: '' })
  confused: string;

  @Column({ type: 'text', default: '' })
  needReview: string;

  @Column({ type: 'real', default: 0 })
  masteryBefore: number;

  @Column({ type: 'real', nullable: true })
  masteryAfter: number | null;

  @Column({ type: 'int', default: 0 })
  durationMinutes: number;

  @CreateDateColumn()
  startedAt: Date;

  @Column({ type: 'datetime', nullable: true })
  completedAt: Date | null;
}
