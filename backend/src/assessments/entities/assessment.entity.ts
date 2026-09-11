import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AssessmentStatus, AssessmentType } from '../../common/enums';
import { User } from '../../users/entities/user.entity';
import { Course } from '../../courses/entities/course.entity';

@Entity('assessments')
export class Assessment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  courseId: string;

  @ManyToOne(() => Course, (c) => c.assessments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'courseId' })
  course: Course;

  @Column()
  title: string;

  @Column({ type: 'varchar', default: AssessmentType.ASSIGNMENT })
  type: AssessmentType;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'real', default: 0 })
  weight: number;

  @Column({ type: 'real', nullable: true })
  expectedMark: number | null;

  @Column({ type: 'real', nullable: true })
  actualMark: number | null;

  @Column({ type: 'varchar', default: AssessmentStatus.UPCOMING })
  status: AssessmentStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
