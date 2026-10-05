import {
  Injectable,
  Logger,
  HttpException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';
import { AuditService } from '../audit/audit.service';
import { TransactionService } from '../../common/database/transaction.service';
import { StaffLoginDto } from './dto/staff-login.dto';
import { User, UserDocument, UserStatus } from './schemas/user.schema';
import { StaffMembership, StaffMembershipDocument } from './schemas/staff-membership.schema';
import { Role, RoleDocument } from './schemas/role.schema';
import { StaffSession, StaffSessionDocument } from './schemas/staff-session.schema';

const INVALID_LOGIN = { error: 'AUTH_INVALID_CREDENTIALS', message: 'Email or password is incorrect' };

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly attempts = new Map<string, { count: number; expiresAt: number }>();
  private dummyHashPromise?: Promise<string>;

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(StaffMembership.name) private readonly membershipModel: Model<StaffMembershipDocument>,
    @InjectModel(Role.name) private readonly roleModel: Model<RoleDocument>,
    @InjectModel(StaffSession.name) private readonly sessionModel: Model<StaffSessionDocument>,
    private readonly config: ConfigService,
    private readonly audit: AuditService,
    private readonly transactions: TransactionService,
  ) {}

  async login(dto: StaffLoginDto, request: Request, response: Response) {
    const origin = request.get('origin');
    if (origin && !this.config.get<string[]>('corsOrigins', []).includes(origin)) {
      throw new UnauthorizedException({ error: 'AUTH_ORIGIN_REJECTED', message: 'Request origin is not allowed' });
    }
    const email = dto.email.trim().toLowerCase();
    const ip = privacySafeIp(request.ip || request.socket.remoteAddress);
    this.checkRateLimit(`identity:${email}`, 5, 15 * 60_000);
    this.checkRateLimit(`ip:${ip}`, 20, 60 * 60_000);

    const user = await this.userModel.findOne({ normalizedEmail: email, accountType: 'STAFF' }).select('+passwordHash');
    const locked = Boolean(user?.lockUntil && user.lockUntil.getTime() > Date.now());
    const encodedHash = user?.passwordHash || await this.getDummyHash();
    const passwordMatches = await bcrypt.compare(dto.password, encodedHash);
    if (!user || !passwordMatches || user.status !== UserStatus.ACTIVE || locked) {
      await this.recordFailedLogin(user?._id, email, ip);
      throw new UnauthorizedException(INVALID_LOGIN);
    }
    this.attempts.delete(`identity:${email}`);

    if (this.config.get<string>('nodeEnv') === 'production') {
      await this.audit.log({
        actorId: user._id.toString(),
        actorType: 'STAFF',
        action: 'staff.login.blocked_without_mfa',
        resourceType: 'STAFF_USER',
        resourceId: user._id.toString(),
        outcome: 'FAILURE',
        reason: 'MFA_REQUIRED',
        ipAddressPrefix: ip,
      });
      throw new UnauthorizedException({ error: 'AUTH_MFA_REQUIRED', message: 'Privileged production sign-in requires MFA' });
    }

    const membership = await this.membershipModel.findOne({ userId: user._id, status: 'ACTIVE' }).lean();
    const roles = membership?.roleIds?.length
      ? await this.roleModel.find({ _id: { $in: membership.roleIds }, active: true }).lean()
      : [];
    if (!membership || roles.length === 0) {
      await this.recordFailedLogin(user._id, email, ip);
      throw new UnauthorizedException(INVALID_LOGIN);
    }

    const sessionToken = randomBytes(32).toString('base64url');
    const csrfToken = randomBytes(32).toString('base64url');
    const now = new Date();
    const maxAge = this.config.get<number>('auth.staffSessionMaxAge', 43200);
    const sessionExpiry = new Date(now.getTime() + maxAge * 1000);

    await this.transactions.executeInTransaction(async (session) => {
      await this.sessionModel.create([{
        userId: user._id,
        audience: 'STAFF',
        tokenHash: digest(sessionToken),
        lastSeenAt: now,
        expiresAt: sessionExpiry,
        ipAddressPrefix: ip,
        userAgentSummary: (request.get('user-agent') || '').slice(0, 200),
      }], { session });
      await this.userModel.updateOne({ _id: user._id }, { $set: { failedLoginCount: 0, lockUntil: null } }, { session });
      await this.audit.log({
        actorId: user._id.toString(),
        actorType: 'STAFF',
        action: 'staff.login',
        resourceType: 'STAFF_USER',
        resourceId: user._id.toString(),
        outcome: 'SUCCESS',
        ipAddressPrefix: ip,
        session,
      });
    });

    const secure = this.config.get<string>('nodeEnv') === 'production';
    response.cookie(this.config.get<string>('auth.staffCookieName', 'staywise_staff_sid'), sessionToken, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: '/',
      maxAge: maxAge * 1000,
    });
    response.cookie(this.config.get<string>('auth.staffCsrfCookieName', 'staywise_staff_csrf'), csrfToken, {
      httpOnly: false,
      secure,
      sameSite: 'lax',
      path: '/',
      maxAge: maxAge * 1000,
    });

    const roleKeys = roles.map((role) => role.key);
    const permissions = [...new Set(roles.flatMap((role) => role.permissionKeys))];
    return {
      user: { id: user._id.toString(), email: user.normalizedEmail },
      roles: roleKeys,
      permissions,
      hotelIds: membership.hotelIds.map((id) => id.toString()),
      csrfToken,
    };
  }

  async recordFailedLogin(userId: Types.ObjectId | undefined, email: string, ipAddressPrefix?: string) {
    if (userId) {
      const user = await this.userModel.findById(userId).select('failedLoginCount');
      const nextCount = (user?.failedLoginCount || 0) + 1;
      const update: Record<string, unknown> = { $inc: { failedLoginCount: 1 } };
      if (nextCount >= 5) update.$set = { lockUntil: new Date(Date.now() + 15 * 60_000) };
      await this.userModel.updateOne({ _id: userId }, update);
    }
    await this.audit.log({
      actorId: userId?.toString(),
      actorType: userId ? 'STAFF' : 'SYSTEM',
      action: 'staff.login',
      resourceType: 'STAFF_LOGIN',
      resourceId: digest(email).slice(0, 32),
      outcome: 'FAILURE',
      reason: 'INVALID_CREDENTIALS',
      ipAddressPrefix,
    });
  }

  private async getDummyHash() {
    this.dummyHashPromise ||= bcrypt.hash(randomBytes(32).toString('hex'), 12);
    return this.dummyHashPromise;
  }

  private checkRateLimit(key: string, limit: number, windowMs: number) {
    const now = Date.now();
    const current = this.attempts.get(key);
    if (!current || current.expiresAt <= now) {
      this.attempts.set(key, { count: 1, expiresAt: now + windowMs });
      return;
    }
    if (current.count >= limit) {
      throw new HttpException({ error: 'AUTH_RATE_LIMITED', message: 'Try signing in later' }, HttpStatus.TOO_MANY_REQUESTS);
    }
    current.count += 1;
    if (this.attempts.size > 10000) {
      for (const [entryKey, entry] of this.attempts) if (entry.expiresAt <= now) this.attempts.delete(entryKey);
      while (this.attempts.size > 10000) this.attempts.delete(this.attempts.keys().next().value!);
    }
  }
}

export function digest(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

export function privacySafeIp(ip?: string) {
  if (!ip) return undefined;
  const normalized = ip.replace(/^::ffff:/, '');
  if (normalized.includes('.')) return `${normalized.split('.').slice(0, 3).join('.')}.0/24`;
  return `${normalized.split(':').slice(0, 4).join(':')}::/64`;
}
