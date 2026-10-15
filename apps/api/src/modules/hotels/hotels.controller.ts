import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiConsumes, ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, resolve } from 'path';
import * as fs from 'fs';
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

  @Get('metrics')
  @RequirePermission('hotels.view')
  @ApiOperation({ summary: 'Get aggregated hotel count metrics by status' })
  metrics(@Req() request: StaffRequest) {
    return this.hotels.getMetrics(request.user);
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

  @Post('media/upload')
  @RequirePermission('hotels.view')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload an image file for hotel photo gallery' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req: any, file: any, cb: (error: Error | null, destination: string) => void) => {
          const uploadDir = resolve(process.cwd(), 'uploads');
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          cb(null, uploadDir);
        },
        filename: (req: any, file: any, cb: (error: Error | null, filename: string) => void) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `hotel-${uniqueSuffix}${ext}`);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (req: any, file: any, cb: (error: Error | null, acceptFile: boolean) => void) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|webp|gif|avif)$/i)) {
          return cb(new BadRequestException('Only JPG, PNG, WebP, GIF, and AVIF images are allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
  uploadMedia(@UploadedFile() file: any) {
    if (!file) throw new BadRequestException('No image file uploaded');
    return {
      url: `/uploads/${file.filename}`,
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
    };
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
