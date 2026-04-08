import { IsString, IsOptional, IsInt, Min, Max, MaxLength } from 'class-validator';

export class UpdateScriptDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(5)
  rating?: number;
}
