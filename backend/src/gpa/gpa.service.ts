import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DEFAULT_GRADING_SCALE } from '../common/enums';
import { Course } from '../courses/entities/course.entity';
import { User } from '../users/entities/user.entity';
import { UserPreferences } from '../users/entities/user-preferences.entity';
import { Grade } from './entities/grade.entity';

type ScaleBand = { letter: string; min: number; points: number };

@Injectable()
export class GpaService {
  constructor(
    @InjectRepository(Grade) private readonly grades: Repository<Grade>,
    @InjectRepository(Course) private readonly courses: Repository<Course>,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(UserPreferences)
    private readonly prefs: Repository<UserPreferences>,
  ) {}

  private async scale(userId: string): Promise<ScaleBand[]> {
    const prefs = await this.prefs.findOne({ where: { userId } });
    return (prefs?.gradingScale as ScaleBand[]) ?? DEFAULT_GRADING_SCALE;
  }

  letterFromMarks(marks: number, scale: ScaleBand[]) {
    const sorted = [...scale].sort((a, b) => b.min - a.min);
    return sorted.find((b) => marks >= b.min) ?? sorted[sorted.length - 1];
  }

  async dashboard(userId: string) {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException();
    const scale = await this.scale(userId);
    const courses = await this.courses.find({ where: { userId } });
    const grades = await this.grades.find({
      where: { userId },
      relations: ['course'],
    });
    const byCourse = new Map(grades.map((g) => [g.courseId, g]));

    let q = 0;
    let c = 0;
    let remainingCredits = 0;
    const rows = [];

    for (const course of courses) {
      const g = byCourse.get(course.id);
      const credits = course.creditHours ?? 3;
      const letter = g?.letterGrade ?? null;
      let points = g?.gradePoints ?? null;
      if (letter && points == null) {
        points = scale.find((s) => s.letter === letter)?.points ?? null;
      }
      if (g?.isFinal && points != null) {
        q += points * credits;
        c += credits;
      } else {
        remainingCredits += credits;
      }
      rows.push({
        courseId: course.id,
        courseName: course.name,
        code: course.code,
        creditHours: credits,
        letterGrade: letter,
        gradePoints: points,
        currentMarks: g?.currentMarks ?? null,
        isFinal: g?.isFinal ?? false,
        semester: g?.semester ?? course.semester,
      });
    }

    const currentGpa = c > 0 ? Math.round((q / c) * 100) / 100 : 0;
    const target = user.targetGpa ?? 4;
    const progressTowardTarget =
      target <= 0 ? 0 : Math.min(100, Math.round((currentGpa / target) * 1000) / 10);

    let requiredAverage: number | null = null;
    let requiredLetter = 'N/A';
    let advisory =
      remainingCredits === 0
        ? 'All recorded courses are graded. Update remaining courses as the semester continues.'
        : '';

    if (remainingCredits > 0) {
      const totalCredits = c + remainingCredits;
      requiredAverage =
        Math.round(((target * totalCredits - q) / remainingCredits) * 100) / 100;
      const maxPoints = Math.max(...scale.map((s) => s.points));
      if (requiredAverage > maxPoints) {
        advisory =
          'With remaining credits alone, the target GPA may be unreachable. This is an estimate, not a guarantee.';
        requiredLetter = scale.find((s) => s.points === maxPoints)?.letter ?? 'A';
      } else {
        const band = [...scale]
          .sort((a, b) => a.points - b.points)
          .find((s) => s.points >= requiredAverage);
        requiredLetter = band?.letter ?? 'A';
        advisory = `Aim for ${requiredLetter} grades in remaining courses. Estimates are advisory only.`;
      }
    }

    return {
      currentGpa,
      targetGpa: target,
      progressTowardTarget,
      completedCredits: c,
      remainingCredits,
      requiredAverage,
      requiredLetter,
      advisory,
      scale,
      courses: rows,
    };
  }

  async upsertGrade(
    userId: string,
    body: {
      courseId: string;
      letterGrade?: string | null;
      gradePoints?: number | null;
      currentMarks?: number | null;
      isFinal?: boolean;
      semester?: string;
    },
  ) {
    const course = await this.courses.findOne({
      where: { id: body.courseId, userId },
    });
    if (!course) throw new NotFoundException('Course not found');
    const scale = await this.scale(userId);
    let row = await this.grades.findOne({
      where: { userId, courseId: body.courseId },
    });
    if (!row) {
      row = this.grades.create({ userId, courseId: body.courseId });
    }
    if (body.letterGrade !== undefined) row.letterGrade = body.letterGrade;
    if (body.gradePoints !== undefined) row.gradePoints = body.gradePoints;
    if (body.currentMarks !== undefined) row.currentMarks = body.currentMarks;
    if (body.isFinal !== undefined) row.isFinal = body.isFinal;
    if (body.semester !== undefined) row.semester = body.semester;

    if (row.currentMarks != null && !row.letterGrade) {
      const band = this.letterFromMarks(row.currentMarks, scale);
      row.letterGrade = band.letter;
      row.gradePoints = band.points;
    }
    if (row.letterGrade && row.gradePoints == null) {
      row.gradePoints =
        scale.find((s) => s.letter === row.letterGrade)?.points ?? null;
    }
    return this.grades.save(row);
  }

  async getScale(userId: string) {
    return this.scale(userId);
  }

  async setScale(userId: string, scale: ScaleBand[]) {
    let prefs = await this.prefs.findOne({ where: { userId } });
    if (!prefs) {
      prefs = this.prefs.create({ userId, gradingScale: scale });
    } else {
      prefs.gradingScale = scale;
    }
    await this.prefs.save(prefs);
    return prefs.gradingScale;
  }

  async setTarget(userId: string, targetGpa: number) {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException();
    user.targetGpa = targetGpa;
    await this.users.save(user);
    return { targetGpa: user.targetGpa };
  }
}
