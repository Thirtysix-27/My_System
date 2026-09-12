import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  DEFAULT_GRADING_SCALE,
  DEFAULT_PRIORITY_WEIGHTS,
} from '../common/enums';
import { UpdatePreferencesDto, UpdateProfileDto } from './dto/user.dto';
import { UserPreferences } from './entities/user-preferences.entity';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(UserPreferences)
    private readonly prefs: Repository<UserPreferences>,
  ) {}

  async getProfile(userId: string) {
    const user = await this.users.findOne({
      where: { id: userId },
      relations: ['preferences'],
    });
    if (!user) throw new NotFoundException('User not found');
    const { passwordHash: _, ...safe } = user;
    return safe;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (dto.fullName !== undefined) user.fullName = dto.fullName;
    if (dto.targetGpa !== undefined) user.targetGpa = dto.targetGpa;
    await this.users.save(user);
    return this.getProfile(userId);
  }

  async getPreferences(userId: string) {
    return this.ensurePrefs(userId);
  }

  async updatePreferences(userId: string, dto: UpdatePreferencesDto) {
    const prefs = await this.ensurePrefs(userId);
    const {
      priorityWeights,
      allocationNormalCurrent,
      allocationNormalCatchUp,
      allocationNormalRevision,
      allocationBehindCurrent,
      allocationBehindCatchUp,
      allocationBehindRevision,
      behindThresholdTopics,
      behindMasteryAvg,
    } = dto;

    if (allocationNormalCurrent !== undefined)
      prefs.allocationNormalCurrent = allocationNormalCurrent;
    if (allocationNormalCatchUp !== undefined)
      prefs.allocationNormalCatchUp = allocationNormalCatchUp;
    if (allocationNormalRevision !== undefined)
      prefs.allocationNormalRevision = allocationNormalRevision;
    if (allocationBehindCurrent !== undefined)
      prefs.allocationBehindCurrent = allocationBehindCurrent;
    if (allocationBehindCatchUp !== undefined)
      prefs.allocationBehindCatchUp = allocationBehindCatchUp;
    if (allocationBehindRevision !== undefined)
      prefs.allocationBehindRevision = allocationBehindRevision;
    if (behindThresholdTopics !== undefined)
      prefs.behindThresholdTopics = behindThresholdTopics;
    if (behindMasteryAvg !== undefined)
      prefs.behindMasteryAvg = behindMasteryAvg;
    if (priorityWeights) {
      prefs.priorityWeights = {
        ...DEFAULT_PRIORITY_WEIGHTS,
        ...(prefs.priorityWeights ?? {}),
        ...priorityWeights,
      };
    }
    await this.prefs.save(prefs);
    return this.ensurePrefs(userId);
  }

  private async ensurePrefs(userId: string) {
    let prefs = await this.prefs.findOne({ where: { userId } });
    if (!prefs) {
      prefs = await this.prefs.save(
        this.prefs.create({
          userId,
          priorityWeights: { ...DEFAULT_PRIORITY_WEIGHTS },
          gradingScale: DEFAULT_GRADING_SCALE.map((g) => ({ ...g })),
        }),
      );
    }
    return prefs;
  }
}
