import { Body, Controller, Get, Param, Put, Req, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { RequirePermission, StaffPermissionGuard, StaffPrincipal } from '../../common/auth/staff-permission.guard';
import { SetBaseRateDto } from './dto/base-rate.dto';
import { PricingService } from './pricing.service';

type StaffRequest = Request & { user: StaffPrincipal };

@ApiTags('Admin rates')
@ApiCookieAuth('staywise_staff_sid')
@Controller('admin/room-types/:roomTypeId/base-rate')
@UseGuards(StaffPermissionGuard)
export class PricingController {
  constructor(private readonly pricing: PricingService) {}

  @Get()
  @RequirePermission('rates.view')
  @ApiOperation({ summary: 'Read a room type base rate' })
  get(@Param('roomTypeId') roomTypeId: string, @Req() request: StaffRequest) {
    return this.pricing.getBaseRate(roomTypeId, request.user);
  }

  @Put()
  @RequirePermission('rates.edit')
  @ApiOperation({ summary: 'Set or update a room type base rate in minor currency units' })
  set(@Param('roomTypeId') roomTypeId: string, @Body() dto: SetBaseRateDto, @Req() request: StaffRequest) {
    return this.pricing.setBaseRate(roomTypeId, dto, request.user);
  }
}

