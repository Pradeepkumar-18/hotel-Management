import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { StaffSessionService } from '../../modules/auth/staff-session.service';

export const REQUIRED_PERMISSION = 'requiredPermission';
export const RequirePermission = (permission: string) => SetMetadata(REQUIRED_PERMISSION, permission);

export interface StaffPrincipal {
  id: string;
  sessionId?: string;
  email?: string;
  audience: 'STAFF';
  status: 'ACTIVE' | 'SUSPENDED';
  role: 'SUPER_ADMIN' | 'HOTEL_MANAGER';
  roles?: string[];
  permissions: string[];
  hotelIds?: string[];
}

type StaffRequest = Request & { user?: StaffPrincipal };

@Injectable()
export class StaffPermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly sessions: StaffSessionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permission = this.reflector.getAllAndOverride<string>(REQUIRED_PERMISSION, [
      context.getHandler(),
      context.getClass(),
    ]);
    const request = context.switchToHttp().getRequest<StaffRequest>();
    const actor = await this.sessions.authenticate(request);
    request.user = actor;
    if (permission === 'hotels.create' && actor.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException({ error: 'FORBIDDEN', message: 'Only a platform administrator can create hotels' });
    }
    if (permission && !actor.permissions.includes(permission)) {
      throw new ForbiddenException({ error: 'FORBIDDEN', message: 'Required permission is missing' });
    }

    const hotelId = request.params.hotelId;
    if (hotelId && (Array.isArray(hotelId) || (actor.role !== 'SUPER_ADMIN' && !actor.hotelIds?.includes(hotelId)))) {
      throw new ForbiddenException({ error: 'FORBIDDEN', message: 'Hotel is outside the staff member scope' });
    }
    return true;
  }
}

@Injectable()
export class StaffSessionGuard implements CanActivate {
  constructor(private readonly sessions: StaffSessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<StaffRequest>();
    request.user = await this.sessions.authenticate(request);
    return true;
  }
}
