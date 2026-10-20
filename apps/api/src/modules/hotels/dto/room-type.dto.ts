import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  Matches,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { HotelMediaItemDto } from './hotel.dto';

/** Room code: letters/digits in dash-separated groups (stored uppercase). */
const ROOM_CODE = /^\s*[A-Za-z0-9]+(-[A-Za-z0-9]+)*\s*$/;

export class BedConfigurationDto {
  @IsString() @MinLength(1) @MaxLength(40) type: string;
  @IsInt() @Min(1) @Max(20) quantity: number;
}

export class CreateRoomTypeDto {
  @IsString() @MinLength(2) @MaxLength(120) name: string;
  @IsString() @MinLength(1) @MaxLength(32) @Matches(ROOM_CODE, { message: 'code may use letters, digits and single dashes, e.g. DLX-K' }) code: string;
  @IsOptional() @IsString() @MaxLength(3000) description?: string;
  @IsInt() @Min(1) @Max(30) maxAdults: number;
  @IsOptional() @IsInt() @Min(0) @Max(30) maxChildren = 0;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => BedConfigurationDto) beds?: BedConfigurationDto[];
  @IsOptional() @IsArray() @IsString({ each: true }) @MaxLength(80, { each: true }) amenities?: string[];
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => HotelMediaItemDto) media?: HotelMediaItemDto[];
  @IsInt() @Min(0) @Max(10000) totalRooms: number;
}

export class UpdateRoomTypeDto {
  @IsInt() @Min(0) version: number;
  @IsOptional() @IsString() @MinLength(3) @MaxLength(500) reason?: string;
  @IsOptional() @IsString() @MinLength(2) @MaxLength(120) name?: string;
  @IsOptional() @IsString() @MinLength(1) @MaxLength(32) @Matches(ROOM_CODE, { message: 'code may use letters, digits and single dashes, e.g. DLX-K' }) code?: string;
  @IsOptional() @IsString() @MaxLength(3000) description?: string;
  @IsOptional() @IsInt() @Min(1) @Max(30) maxAdults?: number;
  @IsOptional() @IsInt() @Min(0) @Max(30) maxChildren?: number;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => BedConfigurationDto) beds?: BedConfigurationDto[];
  @IsOptional() @IsArray() @IsString({ each: true }) @MaxLength(80, { each: true }) amenities?: string[];
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => HotelMediaItemDto) media?: HotelMediaItemDto[];
  @IsOptional() @IsInt() @Min(0) @Max(10000) totalRooms?: number;
}
