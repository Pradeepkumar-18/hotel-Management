import { IsIn, IsInt, IsString, Matches, Max, MaxLength, Min, MinLength } from 'class-validator';

export class InventoryRangeDto {
  @IsString() @Matches(/^\d{4}-\d{2}-\d{2}$/) from: string;
  @IsString() @Matches(/^\d{4}-\d{2}-\d{2}$/) to: string;
}

export class InventoryAdjustmentDto {
  @IsInt() @Min(0) version: number;
  @IsInt() @Min(1) @Max(10000) quantity: number;
  @IsString() @MinLength(3) @MaxLength(500) reason: string;
}

export class BatchInventoryAdjustmentDto {
  @IsString() @Matches(/^\d{4}-\d{2}-\d{2}$/) from: string;
  @IsString() @Matches(/^\d{4}-\d{2}-\d{2}$/) to: string;
  @IsIn(['BLOCK', 'UNBLOCK']) action: 'BLOCK' | 'UNBLOCK';
  @IsInt() @Min(1) @Max(10000) quantity: number;
  @IsString() @MinLength(3) @MaxLength(500) reason: string;
}

