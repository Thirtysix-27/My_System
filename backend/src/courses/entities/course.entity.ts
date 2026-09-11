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
import { User } from '../../users/entities/user.entity';
import { Topic } from '../../topics/entities/topic.entity';
import { LecturerProgress } from '../../lectures/entities/lecturer-progress.entity';
import { Assessment } from '../../assessments/entities/assessment.entity';
import { PastPaper } from '../../past-papers/entities/past-paper.entity';
import { Grade } from '../../gpa/entities/grade.entity';

@Entity('courses')
export class Course {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, (u) => u.courses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  name: string;

  @Column()
  code: string;

  @Column({ type: 'real', default: 3 })
  creditHours: number;

  @Column({ default: '' })
  lecturer: string;

  @Column({ default: '' })
  semester: string;

  @Column({ type: 'text', default: '' })
  description: string;

  @Column({ type: 'text', default: '' })
  objectives: string;

  @Column({ default: '#0f766e' })
  color: string;

  @OneToMany(() => Topic, (t) => t.course, { cascade: true })
  topics: Topic[];

  @OneToOne(() => LecturerProgress, (lp) => lp.course, { cascade: true })
  lecturerProgress: LecturerProgress;

  @OneToMany(() => Assessment, (a) => a.course)
  assessments: Assessment[];

  @OneToMany(() => PastPaper, (p) => p.course)
  pastPapers: PastPaper[];

  @OneToMany(() => Grade, (g) => g.course)
  grades: Grade[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
