import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Course } from '../../courses/entities/course.entity';
import { Subtopic } from './subtopic.entity';
import { TopicMastery } from '../../mastery/entities/topic-mastery.entity';

@Entity('topics')
export class Topic {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  courseId: string;

  @ManyToOne(() => Course, (c) => c.topics, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'courseId' })
  course: Course;

  @Column()
  title: string;

  @Column({ type: 'int', default: 0 })
  orderIndex: number;

  @Column({ type: 'real', default: 1 })
  importanceWeight: number;

  @Column({ type: 'text', default: '' })
  description: string;

  @OneToMany(() => Subtopic, (s) => s.topic, { cascade: true })
  subtopics: Subtopic[];

  @OneToOne(() => TopicMastery, (m) => m.topic, { cascade: true })
  mastery: TopicMastery;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
