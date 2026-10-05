import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { RequirePermission, StaffPermissionGuard, StaffPrincipal } from '../../common/auth/staff-permission.guard';
import { InventoryAdjustmentDto, InventoryRangeDto } from './dto/inventory.dto';
import { InventoryCalendarResponse, InventoryService } from './inventory.service';

type StaffRequest = Request & { user: StaffPrincipal };

@ApiTags('Admin inventory')
@ApiCookieAuth('staywise_staff_sid')
@Controller('admin/room-types/:roomTypeId/inventory')
@UseGuards(StaffPermissionGuard)
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  @Get()
  @RequirePermission('inventory.view')
  @ApiOperation({ summary: 'Read nightly inventory for an exclusive date range' })
  getCalendar(@Param('roomTypeId') roomTypeId: string, @Query() range: InventoryRangeDto, @Req() request: StaffRequest): Promise<InventoryCalendarResponse> {
    return this.inventory.getCalendar(roomTypeId, range, request.user);
  }

  @Post('initialize')
  @RequirePermission('inventory.adjust')
  @ApiOperation({ summary: 'Initialize missing nightly inventory for [from, to)' })
  initialize(@Param('roomTypeId') roomTypeId: string, @Body() range: InventoryRangeDto, @Req() request: StaffRequest) {
    return this.inventory.initialize(roomTypeId, range, request.user);
  }

  @Post(':stayDate/block')
  @RequirePermission('inventory.block')
  @ApiOperation({ summary: 'Block rooms for one local stay date' })
  block(
    @Param('roomTypeId') roomTypeId: string,
    @Param('stayDate') stayDate: string,
    @Body() dto: InventoryAdjustmentDto,
    @Req() request: StaffRequest,
  ) {
    return this.inventory.block(roomTypeId, stayDate, dto, request.user);
  }

  @Post(':stayDate/unblock')
  @RequirePermission('inventory.block')
  @ApiOperation({ summary: 'Release blocked rooms for one local stay date' })
  unblock(
    @Param('roomTypeId') roomTypeId: string,
    @Param('stayDate') stayDate: string,
    @Body() dto: InventoryAdjustmentDto,
    @Req() request: StaffRequest,
  ) {
    return this.inventory.unblock(roomTypeId, stayDate, dto, request.user);
  }
}
