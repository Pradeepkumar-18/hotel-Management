import { Body, Controller, Get, Param, Post, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { RequirePermission, StaffPermissionGuard, StaffPrincipal } from '../../common/auth/staff-permission.guard';
import { CreateRoomTypeDto, UpdateRoomTypeDto } from './dto/room-type.dto';
import { StatusChangeDto } from './dto/status-change.dto';
import { RoomTypeService } from './room-type.service';

type StaffRequest = Request & { user: StaffPrincipal };

@ApiTags('Admin room types')
@ApiCookieAuth('staywise_staff_sid')
@Controller('admin')
@UseGuards(StaffPermissionGuard)
export class AdminRoomTypesController {
  constructor(private readonly roomTypes: RoomTypeService) {}

  @Get('hotels/:hotelId/room-types')
  @RequirePermission('room_types.view')
  @ApiOperation({ summary: 'List room types for a hotel' })
  list(@Param('hotelId') hotelId: string, @Query('includeDisabled') includeDisabled?: string) {
    return this.roomTypes.listForHotel(hotelId, includeDisabled === 'true');
  }

  @Post('hotels/:hotelId/room-types')
  @RequirePermission('room_types.create')
  create(@Param('hotelId') hotelId: string, @Body() dto: CreateRoomTypeDto, @Req() request: StaffRequest) {
    return this.roomTypes.create(hotelId, dto, request.user);
  }

  @Get('room-types/:id')
  @RequirePermission('room_types.view')
  get(@Param('id') id: string, @Req() request: StaffRequest) {
    return this.roomTypes.getById(id, request.user);
  }

  @Patch('room-types/:id')
  @RequirePermission('room_types.edit')
  update(@Param('id') id: string, @Body() dto: UpdateRoomTypeDto, @Req() request: StaffRequest) {
    return this.roomTypes.update(id, dto, request.user);
  }

  @Post('room-types/:id/disable')
  @RequirePermission('room_types.archive')
  disable(@Param('id') id: string, @Body() dto: StatusChangeDto, @Req() request: StaffRequest) {
    return this.roomTypes.disable(id, dto.version, request.user, dto.reason);
  }
}
