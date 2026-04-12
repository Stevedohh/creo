import { IsArray, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';

export class UploadInitDto {
  @IsString()
  @MaxLength(255)
  filename!: string;

  @IsString()
  @MaxLength(100)
  contentType!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(5 * 1024 * 1024 * 1024)
  size?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  displayName?: string;

  @IsOptional()
  @IsUUID()
  folderId?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  tagIds?: string[];
}
