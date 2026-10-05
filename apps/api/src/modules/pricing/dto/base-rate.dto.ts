import { IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';

export class SetBaseRateDto {
  @IsInt() @Min(0) @Max(9000000000000) amountMinorUnits: number;
  @IsString() @Matches(/^[A-Za-z]{3}$/) currency: string;
  @IsOptional() @IsInt() @Min(0) version?: number;
  @IsString() @Min(3) @MaxLength(500) reason: string;
}

