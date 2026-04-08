import { IsString, IsOptional, MaxLength, MinLength } from 'class-validator';

export class CreateScriptDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;
}
