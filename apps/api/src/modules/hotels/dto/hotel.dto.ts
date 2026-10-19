import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsIn,
  IsISO31661Alpha2,
  IsISO4217CurrencyCode,
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
  registerDecorator,
  ValidationArguments,
} from 'class-validator';
import { HotelStatus } from '../schemas/hotel.schema';
import { CancellationFeeBasis } from '../schemas/hotel.schema';

/** Postal code rules per country. Only India is enforced today (6-digit PIN, first digit 1–9). */
const POSTAL_PATTERNS: Record<string, RegExp> = { IN: /^[1-9][0-9]{5}$/ };

function IsPostalCodeForCountry() {
  return (object: object, propertyName: string) =>
    registerDecorator({
      name: 'isPostalCodeForCountry',
      target: object.constructor,
      propertyName,
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          const country = String((args.object as { countryCode?: string }).countryCode ?? '').toUpperCase();
          const pattern = POSTAL_PATTERNS[country];
          return !pattern || (typeof value === 'string' && pattern.test(value.trim()));
        },
        defaultMessage: () => 'postalCode must be a 6-digit PIN code for India',
      },
    });
}

export class CancellationFeeRuleDto {
  @IsEnum(CancellationFeeBasis) basis: CancellationFeeBasis;
  @ValidateIf((value) => value.basis === CancellationFeeBasis.FIXED_MINOR_UNITS)
  @IsInt() @Min(0) @Max(9000000000000) amountMinorUnits?: number;
  @ValidateIf((value) => value.basis === CancellationFeeBasis.FIXED_MINOR_UNITS)
  @IsString() @IsISO4217CurrencyCode({ message: 'currency must be a valid ISO 4217 code' }) currency?: string;
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
  @IsString() @MinLength(1) @MaxLength(80) @IsPostalCodeForCountry() postalCode: string;
  @IsString() @IsISO31661Alpha2({ message: 'countryCode must be a valid ISO 3166-1 alpha-2 code' }) countryCode: string;
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

export class HotelMediaItemDto {
  // Older records stored uploads as absolute http(s)://<api-host>/uploads/x; keep only the path.
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().replace(/^https?:\/\/[^/\s]+(\/uploads\/[A-Za-z0-9._-]+)$/, '$1') : value))
  @IsString() @MaxLength(1000)
  @Matches(/^(https:\/\/\S+|\/uploads\/[A-Za-z0-9._-]+)$/, { message: 'url must be an https:// address or an uploaded /uploads/ file' })
  url: string;
  @IsOptional() @IsBoolean() isPrimary?: boolean;
  @IsOptional() @IsString() @MaxLength(200) caption?: string;
  @IsOptional() @IsInt() @Min(0) displayOrder?: number;
}

export class SetHotelMediaDto {
  @IsInt() @Min(0) version: number;
  @IsArray() @ValidateNested({ each: true }) @Type(() => HotelMediaItemDto) media: HotelMediaItemDto[];
}

export class BulkHotelStatusDto {
  @IsArray() @IsString({ each: true }) @ArrayMinSize(1) @ArrayMaxSize(100) hotelIds: string[];
  @IsEnum(HotelStatus) status: HotelStatus;
  @IsOptional() @IsString() @MaxLength(500) reason?: string;
}

export class HotelListQueryDto {
  @IsOptional() @IsInt() @Type(() => Number) @Min(1) @Max(100) limit = 25;
  @IsOptional() @IsInt() @Type(() => Number) @Min(0) offset = 0;
  @IsOptional() @IsEnum(HotelStatus) status?: HotelStatus;
  @IsOptional() @IsString() @MaxLength(120) city?: string;
  @IsOptional() @IsString() @MaxLength(100) search?: string;
  @IsOptional() @IsIn(['COMPLETED', 'IN_PROGRESS']) setupStatus?: 'COMPLETED' | 'IN_PROGRESS';
  @IsOptional() @IsDateString() updatedSince?: string;
}

