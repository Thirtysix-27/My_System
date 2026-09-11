import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Course } from '../../courses/entities/course.entity';
import { User } from '../../users/entities/user.entity';
import { ExamQuestion } from './exam-question.entity';

@Entity('past_papers')
export class PastPaper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  courseId: string;

  @ManyToOne(() => Course, (c) => c.pastPapers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'courseId' })
  course: Course;

  @Column({ type: 'int' })
  year: number;

  @Column({ default: '' })
  title: string;

  @Column({ type: 'text', default: '' })
  notes: string;

  @OneToMany(() => ExamQuestion, (q) => q.pastPaper, { cascade: true })
  questions: ExamQuestion[];

  @CreateDateColumn()
  createdAt: Date;
}
