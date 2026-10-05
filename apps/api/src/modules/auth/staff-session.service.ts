import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { Model } from 'mongoose';
import { timingSafeEqual } from 'crypto';
import { AuditService } from '../audit/audit.service';
import type { StaffPrincipal } from '../../common/auth/staff-permission.guard';
import { digest } from './auth.service';
import { User, UserDocument } from './schemas/user.schema';
import { StaffMembership, StaffMembershipDocument } from './schemas/staff-membership.schema';
import { Role, RoleDocument } from './schemas/role.schema';
import { StaffSession, StaffSessionDocument } from './schemas/staff-session.schema';

const AUTH_REQUIRED = { error: 'AUTH_REQUIRED', message: 'Active staff session required' };

@Injectable()
export class StaffSessionService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(StaffMembership.name) private readonly membershipModel: Model<StaffMembershipDocument>,
    @InjectModel(Role.name) private readonly roleModel: Model<RoleDocument>,
    @InjectModel(StaffSession.name) private readonly sessionModel: Model<StaffSessionDocument>,
    private readonly config: ConfigService,
    private readonly audit: AuditService,
  ) {}

  async authenticate(request: Request): Promise<StaffPrincipal> {
    const cookieName = this.config.get<string>('auth.staffCookieName', 'staywise_staff_sid');
    const csrfCookieName = this.config.get<string>('auth.staffCsrfCookieName', 'staywise_staff_csrf');
    const token = request.cookies?.[cookieName];
    if (typeof token !== 'string' || token.length < 40) throw new UnauthorizedException(AUTH_REQUIRED);

    const now = new Date();
    const idleSeconds = this.config.get<number>('auth.staffSessionIdle', 1800);
    const session = await this.sessionModel.findOne({
      tokenHash: digest(token),
      audience: 'STAFF',
      revokedAt: null,
      expiresAt: { $gt: now },
      lastSeenAt: { $gt: new Date(now.getTime() - idleSeconds * 1000) },
    }).select('_id userId');
    if (!session) throw new UnauthorizedException({ error: 'AUTH_SESSION_EXPIRED', message: 'Staff session is expired or revoked' });

    const user = await this.userModel.findOne({ _id: session.userId, accountType: 'STAFF', status: 'ACTIVE' }).select('_id normalizedEmail');
    if (!user) throw new UnauthorizedException(AUTH_REQUIRED);
    const membership = await this.membershipModel.findOne({ userId: user._id, status: 'ACTIVE' }).lean();
    if (!membership || membership.roleIds.length === 0) throw new UnauthorizedException(AUTH_REQUIRED);
    const roles = await this.roleModel.find({ _id: { $in: membership.roleIds }, active: true }).lean();
    if (roles.length === 0) throw new UnauthorizedException(AUTH_REQUIRED);

    this.assertCsrf(request, csrfCookieName);
    await this.sessionModel.updateOne({ _id: session._id, revokedAt: null }, { $set: { lastSeenAt: now } });

    const roleKeys = roles.map((role) => role.key);
    const isSuperAdmin = roleKeys.includes('SUPER_ADMIN');
    const principal: StaffPrincipal = {
      id: user._id.toString(),
      sessionId: session._id.toString(),
      email: user.normalizedEmail,
      audience: 'STAFF',
      status: 'ACTIVE',
      role: isSuperAdmin ? 'SUPER_ADMIN' : 'HOTEL_MANAGER',
      roles: roleKeys,
      permissions: [...new Set(roles.flatMap((role) => role.permissionKeys))],
      hotelIds: membership.hotelIds.map((id) => id.toString()),
    };
    return principal;
  }

  async logout(principal: StaffPrincipal, response: Response) {
    const secure = this.config.get<string>('nodeEnv') === 'production';
    if (principal.sessionId) {
      await this.sessionModel.updateOne(
        { _id: principal.sessionId, userId: principal.id, revokedAt: null },
        { $set: { revokedAt: new Date(), revokeReason: 'LOGOUT' } },
      );
      await this.audit.log({
        actorId: principal.id,
        actorType: 'STAFF',
        action: 'staff.logout',
        resourceType: 'STAFF_SESSION',
        resourceId: principal.sessionId,
        outcome: 'SUCCESS',
      });
    }
    response.clearCookie(this.config.get<string>('auth.staffCookieName', 'staywise_staff_sid'), {
      httpOnly: true, secure, sameSite: 'lax', path: '/',
    });
    response.clearCookie(this.config.get<string>('auth.staffCsrfCookieName', 'staywise_staff_csrf'), {
      httpOnly: false, secure, sameSite: 'lax', path: '/',
    });
    return { success: true };
  }

  async logoutAll(principal: StaffPrincipal, response: Response) {
    await this.sessionModel.updateMany(
      { userId: principal.id, audience: 'STAFF', revokedAt: null },
      { $set: { revokedAt: new Date(), revokeReason: 'LOGOUT_ALL' } },
    );
    await this.audit.log({
      actorId: principal.id,
      actorType: 'STAFF',
      action: 'staff.logout_all',
      resourceType: 'STAFF_USER',
      resourceId: principal.id,
      outcome: 'SUCCESS',
    });
    this.clearCookies(response);
    return { success: true };
  }

  private clearCookies(response: Response) {
    const secure = this.config.get<string>('nodeEnv') === 'production';
    response.clearCookie(this.config.get<string>('auth.staffCookieName', 'staywise_staff_sid'), {
      httpOnly: true, secure, sameSite: 'lax', path: '/',
    });
    response.clearCookie(this.config.get<string>('auth.staffCsrfCookieName', 'staywise_staff_csrf'), {
      httpOnly: false, secure, sameSite: 'lax', path: '/',
    });
  }

  private assertCsrf(request: Request, csrfCookieName: string) {
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method.toUpperCase())) return;
    const origin = request.get('origin');
    const allowedOrigins = this.config.get<string[]>('corsOrigins', []);
    if (!origin || !allowedOrigins.includes(origin)) throw new UnauthorizedException({ error: 'CSRF_REJECTED', message: 'Request origin is not allowed' });
    const csrfCookie = request.cookies?.[csrfCookieName];
    const csrfHeader = request.get('x-csrf-token');
    if (!constantTimeStringEqual(csrfCookie, csrfHeader)) {
      throw new UnauthorizedException({ error: 'CSRF_REJECTED', message: 'CSRF token is missing or invalid' });
    }
  }
}

function constantTimeStringEqual(left?: string, right?: string) {
  if (!left || !right) return false;
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}
