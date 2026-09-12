import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DEFAULT_GRADING_SCALE } from '../common/enums';
import { Course } from '../courses/entities/course.entity';
import { UserPreferences } from '../users/entities/user-preferences.entity';
import { User } from '../users/entities/user.entity';
import {
  UpdateScaleDto,
  UpdateTargetGpaDto,
  UpsertGradeDto,
} from './dto/gpa.dto';
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

  private async loadScale(userId: string): Promise<ScaleBand[]> {
    const prefs = await this.prefs.findOne({ where: { userId } });
    const scale = prefs?.gradingScale ?? DEFAULT_GRADING_SCALE;
    return [...scale].sort((a, b) => b.min - a.min);
  }

  letterFromMarks(marks: number, scale: ScaleBand[]): ScaleBand {
    for (const band of scale) {
      if (marks >= band.min) return band;
    }
    return scale[scale.length - 1];
  }

  async dashboard(userId: string) {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    const scale = await this.loadScale(userId);
    const courses = await this.courses.find({ where: { userId } });
    const grades = await this.grades.find({
      where: { userId },
      relations: ['course'],
    });
    const gradeByCourse = new Map(grades.map((g) => [g.courseId, g]));

    const bySemester = new Map<
      string,
      { quality: number; credits: number; courses: unknown[] }
    >();

    let cumQuality = 0;
    let cumCredits = 0;
    let remCredits = 0;
    const remCourses: {
      courseId: string;
      name: string;
      creditHours: number;
    }[] = [];

    for (const course of courses) {
      const g = gradeByCourse.get(course.id);
      const credits = course.creditHours ?? 3;
      const semester = g?.semester || course.semester || 'Current';

      if (g?.isFinal && g.gradePoints != null) {
        cumQuality += g.gradePoints * credits;
        cumCredits += credits;
        if (!bySemester.has(semester)) {
          bySemester.set(semester, { quality: 0, credits: 0, courses: [] });
        }
        const bucket = bySemester.get(semester)!;
        bucket.quality += g.gradePoints * credits;
        bucket.credits += credits;
        bucket.courses.push({
          courseId: course.id,
          name: course.name,
          code: course.code,
          creditHours: credits,
          letterGrade: g.letterGrade,
          gradePoints: g.gradePoints,
          currentMarks: g.currentMarks,
          isFinal: true,
        });
      } else {
        remCredits += credits;
        remCourses.push({
          courseId: course.id,
          name: course.name,
          creditHours: credits,
        });
        if (g) {
          if (!bySemester.has(semester)) {
            bySemester.set(semester, { quality: 0, credits: 0, courses: [] });
          }
          bySemester.get(semester)!.courses.push({
            courseId: course.id,
            name: course.name,
            code: course.code,
            creditHours: credits,
            letterGrade: g.letterGrade,
            gradePoints: g.gradePoints,
            currentMarks: g.currentMarks,
            isFinal: false,
          });
        }
      }
    }

    const cumulativeGpa =
      cumCredits > 0
        ? Math.round((cumQuality / cumCredits) * 100) / 100
        : null;

    let semesterGpa: number | null = null;
    let semesterLabel = '';
    const preferredSemester = courses[0]?.semester ?? '';
    for (const [label, bucket] of bySemester) {
      if (bucket.credits <= 0) continue;
      const gpa = Math.round((bucket.quality / bucket.credits) * 100) / 100;
      if (
        semesterGpa === null ||
        label === preferredSemester ||
        label.toLowerCase().includes('current')
      ) {
        semesterGpa = gpa;
        semesterLabel = label;
      }
    }

    const target = user.targetGpa ?? 4.0;
    const currentForProgress = cumulativeGpa ?? semesterGpa ?? 0;
    const progressPercent =
      target <= 0
        ? 0
        : Math.min(100, Math.round((currentForProgress / target) * 1000) / 10);

    let requiredPoints: number | null = null;
    let advisory =
      'Add final grades to compute required remaining performance.';
    if (remCredits > 0 && target > 0) {
      requiredPoints =
        (target * (cumCredits + remCredits) - cumQuality) / remCredits;
      requiredPoints = Math.round(requiredPoints * 100) / 100;
      const maxPoints = scale[0]?.points ?? 4;
      if (requiredPoints > maxPoints) {
        advisory = `Target ${target.toFixed(2)} may be unreachable with remaining credits alone (need ${requiredPoints} pts; max ${maxPoints}).`;
      } else if (requiredPoints <= 0) {
        advisory = 'Target already met or exceeded with completed courses.';
      } else {
        const band = [...scale]
          .sort((a, b) => a.points - b.points)
          .find((b) => b.points >= requiredPoints! - 0.05);
        advisory = `Aim for ~${requiredPoints} grade points (${band?.letter ?? 'A'} band) in remaining courses.`;
      }
    } else if (remCredits === 0 && cumulativeGpa != null) {
      advisory =
        cumulativeGpa >= target
          ? 'Target GPA achieved across completed courses.'
          : 'No remaining credits; target not fully met.';
    }

    return {
      targetGpa: target,
      semesterGpa,
      semesterLabel,
      cumulativeGpa,
      progressPercent,
      requiredPoints,
      advisory,
      completedCredits: cumCredits,
      remainingCredits: remCredits,
      remainingCourses: remCourses,
      grades,
      scale,
    };
  }

  async upsertGrade(userId: string, dto: UpsertGradeDto) {
    const course = await this.courses.findOne({
      where: { id: dto.courseId, userId },
    });
    if (!course) throw new NotFoundException('Course not found');

    const scale = await this.loadScale(userId);
    let row = await this.grades.findOne({
      where: { userId, courseId: dto.courseId },
    });
    if (!row) {
      row = this.grades.create({ userId, courseId: dto.courseId });
    }

    if (dto.semester !== undefined) row.semester = dto.semester;
    else if (!row.semester) row.semester = course.semester || '';

    if (dto.currentMarks !== undefined) row.currentMarks = dto.currentMarks;
    if (dto.isFinal !== undefined) row.isFinal = dto.isFinal;
    if (dto.letterGrade !== undefined) row.letterGrade = dto.letterGrade;
    if (dto.gradePoints !== undefined) row.gradePoints = dto.gradePoints;

    if (dto.currentMarks != null) {
      const band = this.letterFromMarks(dto.currentMarks, scale);
      if (dto.letterGrade === undefined) row.letterGrade = band.letter;
      if (dto.gradePoints === undefined) row.gradePoints = band.points;
    } else if (dto.letterGrade && dto.gradePoints === undefined) {
      const band = scale.find(
        (s) => s.letter.toLowerCase() === dto.letterGrade!.toLowerCase(),
      );
      if (band) row.gradePoints = band.points;
    }

    await this.grades.save(row);
    return this.grades.findOne({
      where: { id: row.id },
      relations: ['course'],
    });
  }

  async getGradingScale(userId: string) {
    return { scale: await this.loadScale(userId) };
  }

  async updateScale(userId: string, dto: UpdateScaleDto) {
    let prefs = await this.prefs.findOne({ where: { userId } });
    if (!prefs) {
      prefs = this.prefs.create({
        userId,
        gradingScale: dto.scale,
        priorityWeights: null,
      });
    } else {
      prefs.gradingScale = dto.scale;
    }
    await this.prefs.save(prefs);
    return { scale: prefs.gradingScale };
  }

  async updateTargetGpa(userId: string, dto: UpdateTargetGpaDto) {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    user.targetGpa = dto.targetGpa;
    await this.users.save(user);
    return { targetGpa: user.targetGpa };
  }
}
