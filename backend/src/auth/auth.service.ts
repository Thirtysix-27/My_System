import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import {
  DEFAULT_GRADING_SCALE,
  DEFAULT_PRIORITY_WEIGHTS,
} from '../common/enums';
import { User } from '../users/entities/user.entity';
import { UserPreferences } from '../users/entities/user-preferences.entity';
import { LoginDto, RegisterDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(UserPreferences)
    private readonly prefs: Repository<UserPreferences>,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.users.findOne({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const user = this.users.create({
      email: dto.email.toLowerCase(),
      passwordHash: await bcrypt.hash(dto.password, 10),
      fullName: dto.fullName,
      targetGpa: dto.targetGpa ?? 4.0,
    });
    const saved = await this.users.save(user);
    await this.prefs.save(
      this.prefs.create({
        userId: saved.id,
        priorityWeights: { ...DEFAULT_PRIORITY_WEIGHTS },
        gradingScale: DEFAULT_GRADING_SCALE.map((g) => ({ ...g })),
      }),
    );

    return this.tokenResponse(saved);
  }

  async login(dto: LoginDto) {
    const user = await this.users.findOne({
      where: { email: dto.email.toLowerCase() },
    });
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return this.tokenResponse(user);
  }

  async me(userId: string) {
    const user = await this.users.findOne({
      where: { id: userId },
      relations: ['preferences'],
    });
    if (!user) throw new UnauthorizedException();
    const { passwordHash: _, ...safe } = user;
    return safe;
  }

  private tokenResponse(user: User) {
    const accessToken = this.jwt.sign({
      sub: user.id,
      email: user.email,
    });
    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        targetGpa: user.targetGpa,
      },
    };
  }
}
