import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssessmentsService } from '../assessments/assessments.service';
import { Course } from '../courses/entities/course.entity';
import { GpaService } from '../gpa/gpa.service';
import { PastPapersService } from '../past-papers/past-papers.service';
import { PriorityService } from '../priority/priority.service';
import { TargetStatus } from '../common/enums';
import { WeeklyPlansService } from '../weekly-plans/weekly-plans.service';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Course) private readonly courses: Repository<Course>,
    private readonly gpa: GpaService,
    private readonly priority: PriorityService,
    private readonly weekly: WeeklyPlansService,
    private readonly assessments: AssessmentsService,
    private readonly papers: PastPapersService,
  ) {}

  async home(userId: string) {
    const [gpa, next, allocation, targets, upcoming, courses] =
      await Promise.all([
        this.gpa.dashboard(userId),
        this.priority.studyNext(userId, 5),
        this.priority.allocation(userId),
        this.weekly.list(userId),
        this.assessments.upcoming(userId),
        this.courses.find({
          where: { userId },
          relations: [
            'topics',
            'topics.mastery',
            'lecturerProgress',
            'lecturerProgress.currentTopic',
          ],
        }),
      ]);

    const lecturePositions = courses.map((c) => ({
      courseId: c.id,
      courseName: c.name,
      topic: c.lecturerProgress?.currentTopic?.title ?? null,
      orderIndex: c.lecturerProgress?.currentTopic?.orderIndex ?? null,
    }));

    const gapCandidates: {
      courseName: string;
      title: string;
      gapScore: number;
      classification: string;
      overallMastery: number;
    }[] = [];

    for (const c of courses) {
      const gaps = await this.priority.courseGaps(userId, c.id);
      for (const g of gaps) {
        if (g.classification === 'Exam-ready' || g.classification === 'Strong')
          continue;
        gapCandidates.push({
          courseName: c.name,
          title: g.title,
          gapScore: g.gapScore,
          classification: g.classification,
          overallMastery: g.overallMastery,
        });
      }
    }
    gapCandidates.sort((a, b) => b.gapScore - a.gapScore);

    const scores = courses.flatMap((c) =>
      (c.topics ?? []).map((t) => t.mastery?.overallScore ?? 0),
    );
    const averageMastery =
      scores.length === 0
        ? 0
        : Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) /
          10;

    const completed = targets.filter((t) => t.status === TargetStatus.COMPLETED)
      .length;

    return {
      targetGpa: gpa.targetGpa,
      currentGpa: gpa.currentGpa,
      gpaProgress: gpa.progressTowardTarget,
      gpaAdvisory: gpa.advisory,
      courseCount: courses.length,
      lecturePositions,
      biggestGap: gapCandidates[0] ?? null,
      studyNext: next,
      allocation,
      weeklyProgress: {
        completed,
        total: targets.length,
      },
      upcomingAssessment: upcoming[0] ?? null,
      averageMastery,
    };
  }

  async charts(userId: string) {
    const courses = await this.courses.find({
      where: { userId },
      relations: [
        'topics',
        'topics.mastery',
        'lecturerProgress',
        'lecturerProgress.currentTopic',
      ],
    });
    const masteryByCourse = courses.map((c) => {
      const scores = (c.topics ?? []).map((t) => t.mastery?.overallScore ?? 0);
      const avg =
        scores.length === 0
          ? 0
          : Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) /
            10;
      return { course: c.name, mastery: avg };
    });

    const targets = await this.weekly.list(userId);
    const weeklyProgress = [
      {
        label: 'Completed',
        value: targets.filter((t) => t.status === TargetStatus.COMPLETED).length,
      },
      {
        label: 'Open',
        value: targets.filter((t) => t.status !== TargetStatus.COMPLETED).length,
      },
    ];

    const gpa = await this.gpa.dashboard(userId);
    const assessments = await this.assessments.list(userId);
    const assessmentPerformance = assessments
      .filter((a) => a.actualMark != null)
      .map((a) => ({
        title: a.title,
        actual: a.actualMark,
        expected: a.expectedMark,
        weight: a.weight,
      }));

    const firstCourse = courses[0];
    const frequency = firstCourse
      ? await this.papers.topicFrequency(userId, firstCourse.id)
      : { topics: [] };

    const gapSeries = [];
    for (const c of courses) {
      const gaps = await this.priority.courseGaps(userId, c.id);
      const lecturer = c.lecturerProgress?.currentTopic?.orderIndex ?? 0;
      const studentReady = gaps.filter((g) => g.overallMastery >= 76).length;
      gapSeries.push({
        course: c.name,
        lecturerIndex: lecturer,
        masteredUpToLecturer: studentReady,
        openGaps: gaps.filter(
          (g) => g.classification === 'Weak' || g.classification === 'Developing',
        ).length,
      });
    }

    return {
      masteryByCourse,
      weeklyProgress,
      gpaProgression: [
        { label: 'Current', value: gpa.currentGpa },
        { label: 'Target', value: gpa.targetGpa },
      ],
      assessmentPerformance,
      topicFrequency: frequency.topics.slice(0, 8),
      frequencyDisclaimer:
        'Past-paper frequency is historical evidence, not a prediction.',
      lecturerVsStudent: gapSeries,
    };
  }
}
