import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { RequirePermission, StaffPermissionGuard, StaffPrincipal } from '../../common/auth/staff-permission.guard';
import { BulkHotelStatusDto, CreateHotelDto, HotelListQueryDto, SetHotelMediaDto, UpdateHotelDto } from './dto/hotel.dto';
import { StatusChangeDto } from './dto/status-change.dto';
import { HotelService, PublicHotelDetail } from './hotel.service';
import { HotelStatus } from './schemas/hotel.schema';

type StaffRequest = Request & { user: StaffPrincipal };

@ApiTags('Admin hotels')
@ApiCookieAuth('staywise_staff_sid')
@Controller('admin/hotels')
@UseGuards(StaffPermissionGuard)
export class AdminHotelsController {
  constructor(private readonly hotels: HotelService) {}

  @Get()
  @RequirePermission('hotels.view')
  @ApiOperation({ summary: 'List hotels with bounded pagination and filters' })
  list(@Query() query: HotelListQueryDto, @Req() request: StaffRequest) {
    return this.hotels.list(query, request.user);
  }

  @Post()
  @RequirePermission('hotels.create')
  @ApiOperation({ summary: 'Create a draft hotel' })
  create(@Body() dto: CreateHotelDto, @Req() request: StaffRequest) {
    return this.hotels.create(dto, request.user);
  }

  @Patch('bulk-status')
  @RequirePermission('hotels.edit')
  @ApiOperation({ summary: 'Bulk update status for multiple selected hotels' })
  bulkStatus(@Body() dto: BulkHotelStatusDto, @Req() request: StaffRequest) {
    return this.hotels.bulkStatusUpdate(dto, request.user);
  }

  @Get(':id')
  @RequirePermission('hotels.view')
  get(@Param('id') id: string, @Req() request: StaffRequest) {
    return this.hotels.getById(id, request.user);
  }

  @Patch(':id')
  @RequirePermission('hotels.edit')
  update(@Param('id') id: string, @Body() dto: UpdateHotelDto, @Req() request: StaffRequest) {
    return this.hotels.update(id, dto, request.user);
  }

  @Post(':id/media')
  @RequirePermission('hotels.edit')
  @ApiOperation({ summary: 'Update photo gallery and primary image for a hotel' })
  updateMedia(@Param('id') id: string, @Body() dto: SetHotelMediaDto, @Req() request: StaffRequest) {
    return this.hotels.updateMedia(id, dto, request.user);
  }

  @Post(':id/publish')
  @RequirePermission('hotels.publish')
  @ApiOperation({ summary: 'Publish a hotel after catalog, policy, rate, and inventory checks pass' })
  publish(@Param('id') id: string, @Body() dto: StatusChangeDto, @Req() request: StaffRequest) {
    return this.hotels.publish(id, dto.version, request.user);
  }

  @Post(':id/suspend')
  @RequirePermission('hotels.edit')
  suspend(@Param('id') id: string, @Body() dto: StatusChangeDto, @Req() request: StaffRequest) {
    return this.hotels.setStatus(id, HotelStatus.SUSPENDED, dto.version, request.user, dto.reason);
  }

  @Post(':id/archive')
  @RequirePermission('hotels.archive')
  archive(@Param('id') id: string, @Body() dto: StatusChangeDto, @Req() request: StaffRequest) {
    return this.hotels.setStatus(id, HotelStatus.ARCHIVED, dto.version, request.user, dto.reason);
  }
}

@ApiTags('Hotels')
@Controller('hotels')
export class PublicHotelsController {
  constructor(private readonly hotels: HotelService) {}

  @Get(':slug')
  @ApiOperation({ summary: 'Get a published hotel and its active room types' })
  get(@Param('slug') slug: string): Promise<PublicHotelDetail> {
    return this.hotels.getPublicBySlug(slug);
  }
}
