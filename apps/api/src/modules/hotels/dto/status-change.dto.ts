import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class StatusChangeDto {
  @IsInt() @Min(0) version: number;
  @IsOptional() @IsString() @MaxLength(500) reason?: string;
}

