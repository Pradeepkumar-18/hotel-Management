import { IsISO4217CurrencyCode, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class SetBaseRateDto {
  @IsInt() @Min(0) @Max(9000000000000) amountMinorUnits: number;
  @IsString() @IsISO4217CurrencyCode({ message: 'currency must be a valid ISO 4217 code' }) currency: string;
  @IsOptional() @IsInt() @Min(0) version?: number;
  @IsString() @MinLength(3) @MaxLength(500) reason: string;
}

