import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UserPreferences } from './entities/user-preferences.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(UserPreferences)
    private readonly prefs: Repository<UserPreferences>,
  ) {}

  async updateProfile(
    userId: string,
    dto: { fullName?: string; targetGpa?: number },
  ) {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException();
    if (dto.fullName !== undefined) user.fullName = dto.fullName;
    if (dto.targetGpa !== undefined) user.targetGpa = dto.targetGpa;
    await this.users.save(user);
    const { passwordHash: _, ...safe } = user;
    return safe;
  }

  async getPreferences(userId: string) {
    let prefs = await this.prefs.findOne({ where: { userId } });
    if (!prefs) {
      prefs = await this.prefs.save(this.prefs.create({ userId }));
    }
    return prefs;
  }

  async updatePreferences(userId: string, dto: Partial<UserPreferences>) {
    const prefs = await this.getPreferences(userId);
    const allowed: (keyof UserPreferences)[] = [
      'allocationNormalCurrent',
      'allocationNormalCatchUp',
      'allocationNormalRevision',
      'allocationBehindCurrent',
      'allocationBehindCatchUp',
      'allocationBehindRevision',
      'behindThresholdTopics',
      'behindMasteryAvg',
      'priorityWeights',
      'gradingScale',
    ];
    for (const key of allowed) {
      if (dto[key] !== undefined) {
        (prefs as unknown as Record<string, unknown>)[key as string] = dto[key];
      }
    }
    return this.prefs.save(prefs);
  }
}
