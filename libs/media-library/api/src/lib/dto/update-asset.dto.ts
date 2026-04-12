import { IsArray, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class UpdateAssetDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  tagIds?: string[];
}
