import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Course } from '../../courses/entities/course.entity';
import { Topic } from '../../topics/entities/topic.entity';

@Entity('lecturer_progress')
export class LecturerProgress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  courseId: string;

  @OneToOne(() => Course, (c) => c.lecturerProgress, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'courseId' })
  course: Course;

  @Column({ nullable: true })
  currentTopicId: string | null;

  @ManyToOne(() => Topic, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'currentTopicId' })
  currentTopic: Topic | null;

  @Column({ type: 'text', default: '' })
  notes: string;

  @UpdateDateColumn()
  updatedAt: Date;
}
