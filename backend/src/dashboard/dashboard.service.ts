import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Assessment } from '../assessments/entities/assessment.entity';
import { addDays, formatDate, toMonday } from '../common/date.util';
import {
  AssessmentStatus,
  SessionStatus,
  TargetStatus,
  masteryLevel,
} from '../common/enums';
import { Course } from '../courses/entities/course.entity';
import { GpaService } from '../gpa/gpa.service';
import { PastPapersService } from '../past-papers/past-papers.service';
import { PriorityService } from '../priority/priority.service';
import { StudySession } from '../study-sessions/entities/study-session.entity';
import { User } from '../users/entities/user.entity';
import { WeeklyTarget } from '../weekly-plans/entities/weekly-target.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Course) private readonly courses: Repository<Course>,
    @InjectRepository(Assessment)
    private readonly assessments: Repository<Assessment>,
    @InjectRepository(StudySession)
    private readonly sessions: Repository<StudySession>,
    @InjectRepository(WeeklyTarget)
    private readonly targets: Repository<WeeklyTarget>,
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly priority: PriorityService,
    private readonly gpa: GpaService,
    private readonly pastPapers: PastPapersService,
  ) {}

  async home(userId: string) {
    const user = await this.users.findOne({ where: { id: userId } });
    const courses = await this.courses.find({
      where: { userId },
      relations: [
        'topics',
        'topics.mastery',
        'lecturerProgress',
        'lecturerProgress.currentTopic',
      ],
    });

    const gpaDash = await this.gpa.dashboard(userId);
    const studyNext = await this.priority.studyNext(userId, 5);
    const weekStart = toMonday();
    const weekTargets = await this.targets.find({
      where: { userId, weekStart },
    });
    const completedTargets = weekTargets.filter(
      (t) => t.status === TargetStatus.COMPLETED,
    ).length;
    const weeklyProgress =
      weekTargets.length === 0
        ? 100
        : Math.round((completedTargets / weekTargets.length) * 1000) / 10;

    const today = formatDate(new Date());
    const upcoming = await this.assessments.find({
      where: {
        userId,
        status: AssessmentStatus.UPCOMING,
      },
      relations: ['course'],
      order: { date: 'ASC' },
      take: 5,
    });
    const nextAssessment =
      upcoming.find((a) => a.date >= today) ?? upcoming[0] ?? null;

    const allScores = courses.flatMap((c) =>
      (c.topics ?? []).map((t) => t.mastery?.overallScore ?? 0),
    );
    const averageMastery =
      allScores.length === 0
        ? 0
        : Math.round(
            (allScores.reduce((a, b) => a + b, 0) / allScores.length) * 10,
          ) / 10;

    let biggestGap: {
      courseId: string;
      courseName: string;
      topicId: string;
      title: string;
      overallMastery: number;
      gapScore: number;
    } | null = null;

    for (const course of courses) {
      const gaps = await this.priority.courseGaps(userId, course.id);
      const top = gaps[0];
      if (!top) continue;
      if (!biggestGap || top.gapScore > biggestGap.gapScore) {
        biggestGap = {
          courseId: course.id,
          courseName: course.name,
          topicId: top.topicId,
          title: top.title,
          overallMastery: top.overallMastery,
          gapScore: top.gapScore,
        };
      }
    }

    const lecturePositions = courses.map((c) => ({
      courseId: c.id,
      courseName: c.name,
      courseCode: c.code,
      currentTopic: c.lecturerProgress?.currentTopic
        ? {
            id: c.lecturerProgress.currentTopic.id,
            title: c.lecturerProgress.currentTopic.title,
            orderIndex: c.lecturerProgress.currentTopic.orderIndex,
          }
        : null,
    }));

    return {
      targetGpa: user?.targetGpa ?? 4,
      currentGpa: gpaDash.cumulativeGpa ?? gpaDash.semesterGpa,
      gpa: gpaDash,
      courseCount: courses.length,
      lecturePositions,
      biggestGap,
      studyNextTop: studyNext[0] ?? null,
      studyNext,
      weeklyProgress: {
        weekStart,
        completed: completedTargets,
        total: weekTargets.length,
        percent: weeklyProgress,
      },
      upcomingAssessment: nextAssessment,
      averageMastery,
      averageMasteryLevel: masteryLevel(averageMastery),
    };
  }

  async masteryByCourse(userId: string) {
    const courses = await this.courses.find({
      where: { userId },
      relations: ['topics', 'topics.mastery'],
      order: { name: 'ASC' },
    });
    return courses.map((c) => {
      const scores = (c.topics ?? []).map((t) => t.mastery?.overallScore ?? 0);
      const avg =
        scores.length === 0
          ? 0
          : Math.round(
              (scores.reduce((a, b) => a + b, 0) / scores.length) * 10,
            ) / 10;
      return {
        courseId: c.id,
        name: c.name,
        code: c.code,
        color: c.color,
        averageMastery: avg,
        topicCount: scores.length,
        examReadyCount: scores.filter((s) => s >= 90).length,
      };
    });
  }

  async weeklyProgressChart(userId: string, weeks = 6) {
    const result: {
      weekStart: string;
      sessions: number;
      minutes: number;
      targetsCompleted: number;
      targetsTotal: number;
      completionPercent: number;
    }[] = [];

    let cursor = toMonday();
    for (let i = 0; i < weeks; i++) {
      const weekStart = i === 0 ? cursor : addDays(cursor, -7 * i);
      // build from oldest to newest later
      const weekEnd = addDays(weekStart, 6);
      const sessions = await this.sessions.find({
        where: {
          userId,
          status: SessionStatus.COMPLETED,
          startedAt: Between(
            new Date(`${weekStart}T00:00:00`),
            new Date(`${weekEnd}T23:59:59`),
          ),
        },
      });
      const targets = await this.targets.find({
        where: { userId, weekStart },
      });
      const completed = targets.filter(
        (t) => t.status === TargetStatus.COMPLETED,
      ).length;
      result.push({
        weekStart,
        sessions: sessions.length,
        minutes: sessions.reduce((s, x) => s + (x.durationMinutes ?? 0), 0),
        targetsCompleted: completed,
        targetsTotal: targets.length,
        completionPercent:
          targets.length === 0
            ? 100
            : Math.round((completed / targets.length) * 1000) / 10,
      });
    }

    return result.sort((a, b) => a.weekStart.localeCompare(b.weekStart));
  }

  async gapsSummary(userId: string) {
    const courses = await this.courses.find({ where: { userId } });
    const summary = [];
    for (const course of courses) {
      const gaps = await this.priority.courseGaps(userId, course.id);
      summary.push({
        courseId: course.id,
        courseName: course.name,
        courseCode: course.code,
        weakCount: gaps.filter(
          (g) =>
            g.classification === 'Weak' ||
            g.classification === 'Newly introduced',
        ).length,
        developingCount: gaps.filter((g) => g.classification === 'Developing')
          .length,
        strongCount: gaps.filter(
          (g) =>
            g.classification === 'Strong' ||
            g.classification === 'Exam-ready',
        ).length,
        topGaps: gaps.slice(0, 5),
      });
    }
    return summary;
  }

  async topicFrequencySample(userId: string) {
    const courses = await this.courses.find({
      where: { userId },
      take: 3,
      order: { name: 'ASC' },
    });
    const samples = [];
    for (const c of courses) {
      samples.push(await this.pastPapers.topicFrequency(userId, c.id));
    }
    return {
      evidenceType: 'historical',
      disclaimer:
        'Sample of historical past-paper topic tags — not predictive.',
      courses: samples,
    };
  }

  async assessmentPerformance(userId: string) {
    const rows = await this.assessments.find({
      where: { userId },
      relations: ['course'],
      order: { date: 'ASC' },
    });
    const completed = rows.filter(
      (a) =>
        a.status === AssessmentStatus.COMPLETED && a.actualMark != null,
    );
    const avgActual =
      completed.length === 0
        ? null
        : Math.round(
            (completed.reduce((s, a) => s + (a.actualMark ?? 0), 0) /
              completed.length) *
              10,
          ) / 10;

    return {
      upcomingCount: rows.filter((a) => a.status === AssessmentStatus.UPCOMING)
        .length,
      completedCount: completed.length,
      averageActualMark: avgActual,
      assessments: rows.map((a) => ({
        id: a.id,
        title: a.title,
        type: a.type,
        date: a.date,
        courseName: a.course?.name,
        weight: a.weight,
        expectedMark: a.expectedMark,
        actualMark: a.actualMark,
        status: a.status,
        delta:
          a.actualMark != null && a.expectedMark != null
            ? Math.round((a.actualMark - a.expectedMark) * 10) / 10
            : null,
      })),
    };
  }
}
