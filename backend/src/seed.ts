import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AuthService } from './auth/auth.service';
import { CoursesService } from './courses/courses.service';
import { TopicsService } from './topics/topics.service';
import { LecturesService } from './lectures/lectures.service';
import { MasteryService } from './mastery/mastery.service';
import { AssessmentsService } from './assessments/assessments.service';
import { GpaService } from './gpa/gpa.service';
import { PastPapersService } from './past-papers/past-papers.service';
import { RevisionService } from './revision/revision.service';
import { WeeklyPlansService } from './weekly-plans/weekly-plans.service';
import { AssessmentType, TargetStatus } from './common/enums';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const auth = app.get(AuthService);
  const courses = app.get(CoursesService);
  const topics = app.get(TopicsService);
  const lectures = app.get(LecturesService);
  const mastery = app.get(MasteryService);
  const assessments = app.get(AssessmentsService);
  const gpa = app.get(GpaService);
  const papers = app.get(PastPapersService);
  const revision = app.get(RevisionService);
  const weekly = app.get(WeeklyPlansService);

  let userId: string;
  try {
    const registered = await auth.register({
      email: 'demo@student.edu',
      password: 'password123',
      fullName: 'Amina Okoye',
      targetGpa: 4,
    });
    userId = registered.user.id;
  } catch {
    const login = await auth.login({
      email: 'demo@student.edu',
      password: 'password123',
    });
    userId = login.user.id;
    console.log('Demo user already exists — skipping course seed.');
    await app.close();
    return;
  }

  const catalog = [
    {
      name: 'Linux',
      code: 'CSC 310',
      color: '#1c4638',
      lecturer: 'Dr. Mensah',
      topics: [
        'File Permissions',
        'Process Management',
        'Shell Scripting',
        'Networking',
        'Package Management',
        'System Services',
      ],
      mastery: [92, 45, 70, 30, 55, 20],
      lecturerIndex: 4,
    },
    {
      name: 'Software Engineering',
      code: 'CSC 401',
      color: '#b8893d',
      lecturer: 'Prof. Diallo',
      topics: [
        'Requirements',
        'UML',
        'Architecture',
        'Design Patterns',
        'Version Control Workflows',
        'Software Testing',
        'Maintenance',
      ],
      mastery: [88, 38, 72, 60, 50, 20, 0],
      lecturerIndex: 5,
    },
    {
      name: 'Human-Computer Interaction',
      code: 'CSC 330',
      color: '#3f6f58',
      lecturer: 'Dr. Chen',
      topics: [
        'Usability Principles',
        'User Research',
        'Prototyping',
        'Usability Evaluation',
        'Accessibility',
      ],
      mastery: [85, 62, 48, 40, 25],
      lecturerIndex: 3,
    },
    {
      name: 'Information Business Management',
      code: 'IBM 220',
      color: '#5c4033',
      lecturer: 'Ms. Patel',
      topics: [
        'Strategy',
        'Process Modelling',
        'Information Systems',
        'Risk',
        'Governance',
      ],
      mastery: [78, 55, 42, 35, 15],
      lecturerIndex: 3,
    },
    {
      name: 'Databases',
      code: 'CSC 250',
      color: '#2a4a62',
      lecturer: 'Dr. Nkrumah',
      topics: [
        'Relational Model',
        'SQL Queries',
        'Normalisation',
        'Indexing',
        'Transactions',
      ],
      mastery: [90, 80, 65, 40, 22],
      lecturerIndex: 3,
    },
  ];

  const inDays = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  };

  for (const c of catalog) {
    const course = await courses.create(userId, {
      name: c.name,
      code: c.code,
      creditHours: 3,
      lecturer: c.lecturer,
      semester: '2026 S1',
      description: `${c.name} core module`,
      objectives: 'Reach exam-ready mastery without abandoning current lectures.',
      color: c.color,
    });

    const createdTopics = [];
    for (let i = 0; i < c.topics.length; i++) {
      const topic = await topics.create(userId, course.id, {
        title: c.topics[i],
        orderIndex: i,
        importanceWeight: i === 1 ? 1.4 : 1,
      });
      createdTopics.push(topic);
      const score = c.mastery[i];
      await mastery.update(userId, topic.id, {
        understanding: Math.min(100, score + 5),
        recall: Math.max(0, score - 8),
        application: score,
        examQuestions: Math.max(0, score - 12),
      });
      if (score >= 76) {
        await revision.ensureScheduled(userId, topic.id);
      }
    }

    await lectures.upsert(userId, course.id, {
      currentTopicId: createdTopics[c.lecturerIndex].id,
      notes: 'Updated after last lecture',
    });

    if (c.name === 'Linux') {
      await assessments.create(userId, {
        courseId: course.id,
        title: 'Linux Test',
        type: AssessmentType.TEST,
        date: inDays(6),
        weight: 20,
        expectedMark: 80,
      });
      const paper = await papers.create(userId, {
        courseId: course.id,
        year: 2024,
        title: 'Linux Final 2024',
      });
      await papers.addQuestion(userId, paper.id, {
        questionText: 'Explain chmod and sticky bits.',
        marks: 10,
        topicIds: [createdTopics[0].id],
      });
      await papers.addQuestion(userId, paper.id, {
        questionText: 'Compare fork and exec.',
        marks: 12,
        topicIds: [createdTopics[1].id],
      });
      await papers.addQuestion(userId, paper.id, {
        questionText: 'Write a bash loop that monitors processes.',
        marks: 15,
        topicIds: [createdTopics[1].id, createdTopics[2].id],
      });
    }

    if (c.name === 'Software Engineering') {
      await assessments.create(userId, {
        courseId: course.id,
        title: 'SE Assignment — UML',
        type: AssessmentType.ASSIGNMENT,
        date: inDays(10),
        weight: 15,
        expectedMark: 85,
      });
    }

    if (c.name === 'Databases') {
      await gpa.upsertGrade(userId, {
        courseId: course.id,
        letterGrade: 'A-',
        currentMarks: 78,
        isFinal: false,
        semester: '2026 S1',
      });
    }
  }

  const prior = await courses.create(userId, {
    name: 'Discrete Mathematics',
    code: 'CSC 210',
    creditHours: 3,
    lecturer: 'Dr. Owusu',
    semester: '2025 S2',
    description: 'Completed previous semester',
    objectives: 'Foundation for current modules',
  });
  await gpa.upsertGrade(userId, {
    courseId: prior.id,
    letterGrade: 'A',
    gradePoints: 4,
    currentMarks: 84,
    isFinal: true,
    semester: '2025 S2',
  });

  const generated = await weekly.generate(userId);
  for (const t of (generated.targets ?? []).slice(0, 2)) {
    await weekly.update(userId, t.id, { status: TargetStatus.COMPLETED });
  }

  console.log('Seeded demo@student.edu / password123');
  await app.close();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
