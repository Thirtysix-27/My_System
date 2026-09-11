import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Topic } from './topic.entity';

@Entity('subtopics')
export class Subtopic {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  topicId: string;

  @ManyToOne(() => Topic, (t) => t.subtopics, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'topicId' })
  topic: Topic;

  @Column()
  title: string;

  @Column({ type: 'int', default: 0 })
  orderIndex: number;
}
