import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  ValidateIf,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { HotelStatus } from '../schemas/hotel.schema';
import { CancellationFeeBasis } from '../schemas/hotel.schema';

export class CancellationFeeRuleDto {
  @IsEnum(CancellationFeeBasis) basis: CancellationFeeBasis;
  @ValidateIf((value) => value.basis === CancellationFeeBasis.FIXED_MINOR_UNITS)
  @IsInt() @Min(0) @Max(9000000000000) amountMinorUnits?: number;
  @ValidateIf((value) => value.basis === CancellationFeeBasis.FIXED_MINOR_UNITS)
  @IsString() @Matches(/^[A-Za-z]{3}$/) currency?: string;
  @ValidateIf((value) => value.basis === CancellationFeeBasis.PERCENTAGE_BPS)
  @IsInt() @Min(0) @Max(10000) percentageBps?: number;
}

export class HotelCancellationPolicyDto {
  @IsString() @Matches(/^\d{4}-\d{2}-\d{2}$/) effectiveFrom: string;
  @IsInt() @Min(0) @Max(8760) freeCancellationHoursBeforeCheckIn: number;
  @ValidateNested() @Type(() => CancellationFeeRuleDto) afterCutoff: CancellationFeeRuleDto;
  @ValidateNested() @Type(() => CancellationFeeRuleDto) noShow: CancellationFeeRuleDto;
}

export class HotelAddressDto {
  @IsString() @MinLength(1) @MaxLength(240) line1: string;
  @IsOptional() @IsString() @MaxLength(240) line2?: string;
  @IsString() @MinLength(1) @MaxLength(120) city: string;
  @IsOptional() @IsString() @MaxLength(120) region?: string;
  @IsString() @MinLength(1) @MaxLength(80) postalCode: string;
  @IsString() @Matches(/^[A-Za-z]{2}$/) countryCode: string;
}

export class HotelContactDto {
  @IsOptional() @IsEmail() @MaxLength(254) email?: string;
  @IsOptional() @IsString() @Matches(/^\+?[0-9().\-\s]{7,32}$/) phone?: string;
}

export class CreateHotelDto {
  @IsString() @MinLength(2) @MaxLength(140) name: string;
  @IsString() @MinLength(2) @MaxLength(160) slug: string;
  @ValidateNested() @Type(() => HotelAddressDto) address: HotelAddressDto;
  @IsString() @MinLength(1) @MaxLength(100) timezone: string;
  @ValidateNested() @Type(() => HotelContactDto) contact: HotelContactDto;
  @IsOptional() @IsString() @MaxLength(5000) description?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) @MaxLength(80, { each: true }) amenities?: string[];
  @IsOptional() @ValidateNested() @Type(() => HotelCancellationPolicyDto) cancellationPolicy?: HotelCancellationPolicyDto;
  @IsOptional() @IsLatitude() latitude?: number;
  @IsOptional() @IsLongitude() longitude?: number;
}

export class UpdateHotelDto {
  @IsInt() @Min(0) version: number;
  @IsOptional() @IsString() @MinLength(2) @MaxLength(140) name?: string;
  @IsOptional() @IsString() @MinLength(2) @MaxLength(160) slug?: string;
  @IsOptional() @ValidateNested() @Type(() => HotelAddressDto) address?: HotelAddressDto;
  @IsOptional() @IsString() @MinLength(1) @MaxLength(100) timezone?: string;
  @IsOptional() @ValidateNested() @Type(() => HotelContactDto) contact?: HotelContactDto;
  @IsOptional() @IsString() @MaxLength(5000) description?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) @MaxLength(80, { each: true }) amenities?: string[];
  @IsOptional() @ValidateNested() @Type(() => HotelCancellationPolicyDto) cancellationPolicy?: HotelCancellationPolicyDto;
  @IsOptional() @IsLatitude() latitude?: number;
  @IsOptional() @IsLongitude() longitude?: number;
}

export class HotelListQueryDto {
  @IsOptional() @IsInt() @Type(() => Number) @Min(1) @Max(100) limit = 25;
  @IsOptional() @IsInt() @Type(() => Number) @Min(0) offset = 0;
  @IsOptional() @IsEnum(HotelStatus) status?: HotelStatus;
  @IsOptional() @IsString() @MaxLength(120) city?: string;
}
