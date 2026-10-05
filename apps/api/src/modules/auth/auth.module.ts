import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { StaffSessionService } from './staff-session.service';
import { StaffPermissionGuard, StaffSessionGuard } from '../../common/auth/staff-permission.guard';
import { User, UserSchema } from './schemas/user.schema';
import { Role, RoleSchema, Permission, PermissionSchema } from './schemas/role.schema';
import { StaffMembership, StaffMembershipSchema } from './schemas/staff-membership.schema';
import { StaffSession, StaffSessionSchema } from './schemas/staff-session.schema';

@Module({
  imports: [MongooseModule.forFeature([
    { name: User.name, schema: UserSchema },
    { name: Role.name, schema: RoleSchema },
    { name: Permission.name, schema: PermissionSchema },
    { name: StaffMembership.name, schema: StaffMembershipSchema },
    { name: StaffSession.name, schema: StaffSessionSchema },
  ])],
  controllers: [AuthController],
  providers: [AuthService, StaffSessionService, StaffPermissionGuard, StaffSessionGuard],
  exports: [StaffSessionService, StaffPermissionGuard, StaffSessionGuard],
})
export class AuthModule {}

