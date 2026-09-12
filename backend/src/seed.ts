import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { mkdirSync } from 'fs';
import { join } from 'path';
import { Repository } from 'typeorm';
import { AppModule } from './app.module';
import { Assessment } from './assessments/entities/assessment.entity';
import {
  AssessmentStatus,
  AssessmentType,
  DEFAULT_GRADING_SCALE,
  DEFAULT_PRIORITY_WEIGHTS,
} from './common/enums';
import { addDays, formatDate } from './common/date.util';
import { Course } from './courses/entities/course.entity';
import { LecturerProgress } from './lectures/entities/lecturer-progress.entity';
import { TopicMastery } from './mastery/entities/topic-mastery.entity';
import { Topic } from './topics/entities/topic.entity';
import { UserPreferences } from './users/entities/user-preferences.entity';
import { User } from './users/entities/user.entity';

const DEMO_EMAIL = 'demo@student.edu';
const DEMO_PASSWORD = 'password123';

type CourseSeed = {
  name: string;
  code: string;
  creditHours: number;
  lecturer: string;
  color: string;
  topics: string[];
  lecturerTopicIndex: number;
  masteryScores: number[];
};

const COURSES: CourseSeed[] = [
  {
    name: 'Linux Operating Systems',
    code: 'LINUX301',
    creditHours: 3,
    lecturer: 'Dr. Okello',
    color: '#0f766e',
    topics: [
      'Shell Fundamentals',
      'File Permissions & Ownership',
      'Process Management',
      'Package Management',
      'Networking Basics',
      'Systemd & Services',
    ],
    lecturerTopicIndex: 3,
    masteryScores: [88, 72, 55, 30, 10, 0],
  },
  {
    name: 'Software Engineering',
    code: 'SE210',
    creditHours: 4,
    lecturer: 'Prof. Nambi',
    color: '#1d4ed8',
    topics: [
      'SDLC Models',
      'Requirements Engineering',
      'UML & Design',
      'Agile Practices',
      'Testing Strategies',
      'CI/CD Basics',
    ],
    lecturerTopicIndex: 2,
    masteryScores: [90, 78, 45, 15, 5, 0],
  },
  {
    name: 'Human-Computer Interaction',
    code: 'HCI220',
    creditHours: 3,
    lecturer: 'Ms. Achieng',
    color: '#b45309',
    topics: [
      'Usability Principles',
      'User Research',
      'Interaction Design',
      'Prototyping',
      'Evaluation Methods',
    ],
    lecturerTopicIndex: 2,
    masteryScores: [85, 70, 40, 12, 0],
  },
  {
    name: 'IBM Applied Computing',
    code: 'IBM250',
    creditHours: 3,
    lecturer: 'Mr. Kato',
    color: '#7c3aed',
    topics: [
      'Cloud Foundations',
      'IBM Cloud Services',
      'Watson APIs',
      'DevOps on IBM',
      'Security & Compliance',
    ],
    lecturerTopicIndex: 1,
    masteryScores: [75, 48, 20, 5, 0],
  },
  {
    name: 'Databases',
    code: 'DB240',
    creditHours: 4,
    lecturer: 'Dr. Ssebunya',
    color: '#be123c',
    topics: [
      'Relational Model',
      'SQL Queries',
      'Normalization',
      'Indexing & Performance',
      'Transactions',
      'NoSQL Overview',
    ],
    lecturerTopicIndex: 3,
    masteryScores: [92, 80, 65, 35, 10, 0],
  },
];

async function seed() {
  mkdirSync(join(process.cwd(), 'data'), { recursive: true });

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  const users = app.get<Repository<User>>(getRepositoryToken(User));
  const prefs = app.get<Repository<UserPreferences>>(
    getRepositoryToken(UserPreferences),
  );
  const courses = app.get<Repository<Course>>(getRepositoryToken(Course));
  const topics = app.get<Repository<Topic>>(getRepositoryToken(Topic));
  const mastery = app.get<Repository<TopicMastery>>(
    getRepositoryToken(TopicMastery),
  );
  const progress = app.get<Repository<LecturerProgress>>(
    getRepositoryToken(LecturerProgress),
  );
  const assessments = app.get<Repository<Assessment>>(
    getRepositoryToken(Assessment),
  );

  let user = await users.findOne({ where: { email: DEMO_EMAIL } });
  if (user) {
    console.log(`Demo user ${DEMO_EMAIL} already exists — wiping and reseeding…`);
    await users.delete({ id: user.id });
  }

  user = await users.save(
    users.create({
      email: DEMO_EMAIL,
      passwordHash: await bcrypt.hash(DEMO_PASSWORD, 10),
      fullName: 'Demo Student',
      targetGpa: 3.75,
    }),
  );

  await prefs.save(
    prefs.create({
      userId: user.id,
      priorityWeights: { ...DEFAULT_PRIORITY_WEIGHTS },
      gradingScale: DEFAULT_GRADING_SCALE.map((g) => ({ ...g })),
    }),
  );

  const today = formatDate(new Date());
  const createdCourseIds: string[] = [];

  for (const seedCourse of COURSES) {
    const course = await courses.save(
      courses.create({
        userId: user.id,
        name: seedCourse.name,
        code: seedCourse.code,
        creditHours: seedCourse.creditHours,
        lecturer: seedCourse.lecturer,
        semester: '2026-S1',
        description: `${seedCourse.name} — seeded demo course`,
        objectives: 'Master core topics to exam-ready level',
        color: seedCourse.color,
      }),
    );
    createdCourseIds.push(course.id);

    const topicEntities: Topic[] = [];
    for (let i = 0; i < seedCourse.topics.length; i++) {
      const topic = await topics.save(
        topics.create({
          courseId: course.id,
          title: seedCourse.topics[i],
          orderIndex: i,
          importanceWeight: 1 + (i % 3) * 0.25,
          description: '',
        }),
      );
      topicEntities.push(topic);

      const score = seedCourse.masteryScores[i] ?? 0;
      await mastery.save(
        mastery.create({
          topicId: topic.id,
          userId: user.id,
          overallScore: score,
          understanding: score,
          recall: Math.max(0, score - 5),
          application: Math.max(0, score - 10),
          examQuestions: Math.max(0, score - 8),
          lastReviewedAt: score > 0 ? new Date() : null,
        }),
      );
    }

    const lecturerTopic =
      topicEntities[seedCourse.lecturerTopicIndex] ?? topicEntities[0];
    await progress.save(
      progress.create({
        courseId: course.id,
        currentTopicId: lecturerTopic.id,
      }),
    );
  }

  // A few upcoming assessments across courses
  const assessmentSeeds = [
    {
      courseIndex: 0,
      title: 'Linux Shell Quiz',
      type: AssessmentType.TEST,
      days: 5,
      weight: 10,
    },
    {
      courseIndex: 1,
      title: 'SE Design Assignment',
      type: AssessmentType.ASSIGNMENT,
      days: 12,
      weight: 15,
    },
    {
      courseIndex: 2,
      title: 'HCI Prototype Presentation',
      type: AssessmentType.PRESENTATION,
      days: 18,
      weight: 20,
    },
    {
      courseIndex: 4,
      title: 'Databases Midterm',
      type: AssessmentType.MIDTERM,
      days: 21,
      weight: 25,
    },
  ];

  for (const a of assessmentSeeds) {
    await assessments.save(
      assessments.create({
        userId: user.id,
        courseId: createdCourseIds[a.courseIndex],
        title: a.title,
        type: a.type,
        date: addDays(today, a.days),
        weight: a.weight,
        expectedMark: 75,
        status: AssessmentStatus.UPCOMING,
      }),
    );
  }

  console.log('Seed complete.');
  console.log(`  Email:    ${DEMO_EMAIL}`);
  console.log(`  Password: ${DEMO_PASSWORD}`);
  console.log(`  Courses:  ${COURSES.length}`);
  console.log(`  Target GPA: 3.75`);

  await app.close();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
