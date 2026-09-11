import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { QuestionType } from '../../common/enums';
import { PastPaper } from './past-paper.entity';
import { Topic } from '../../topics/entities/topic.entity';

@Entity('exam_questions')
export class ExamQuestion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  pastPaperId: string;

  @ManyToOne(() => PastPaper, (p) => p.questions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pastPaperId' })
  pastPaper: PastPaper;

  @Column({ type: 'text' })
  questionText: string;

  @Column({ type: 'real', default: 0 })
  marks: number;

  @Column({ type: 'varchar', default: QuestionType.SHORT })
  questionType: QuestionType;

  @ManyToMany(() => Topic, { cascade: false })
  @JoinTable({ name: 'question_topics' })
  topics: Topic[];
}
