import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { StaffPrincipal, StaffSessionGuard } from '../../common/auth/staff-permission.guard';
import { AuthService } from './auth.service';
import { StaffLoginDto } from './dto/staff-login.dto';
import { StaffSessionService } from './staff-session.service';

type StaffRequest = Request & { user: StaffPrincipal };

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly sessions: StaffSessionService,
  ) {}

  @Post('staff/login')
  @ApiOperation({ summary: 'Sign in a staff user and issue an opaque staff session cookie' })
  login(@Body() dto: StaffLoginDto, @Req() request: Request, @Res({ passthrough: true }) response: Response) {
    return this.auth.login(dto, request, response);
  }

  @Get('me')
  @UseGuards(StaffSessionGuard)
  @ApiOperation({ summary: 'Return the current staff identity and current permissions' })
  me(@Req() request: StaffRequest) {
    const { id, email, roles, permissions, hotelIds } = request.user;
    return { user: { id, email }, roles, permissions, hotelIds };
  }

  @Post('logout')
  @UseGuards(StaffSessionGuard)
  @ApiOperation({ summary: 'Revoke the current staff session' })
  logout(@Req() request: StaffRequest, @Res({ passthrough: true }) response: Response) {
    return this.sessions.logout(request.user, response);
  }

  @Post('logout-all')
  @UseGuards(StaffSessionGuard)
  @ApiOperation({ summary: 'Revoke every active staff session for the current identity' })
  logoutAll(@Req() request: StaffRequest, @Res({ passthrough: true }) response: Response) {
    return this.sessions.logoutAll(request.user, response);
  }
}
