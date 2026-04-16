import { IsArray, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateFromRenderDto {
  @IsUUID()
  renderJobId!: string;

  @IsOptional()
  @IsUUID()
  folderId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  displayName?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  tagIds?: string[];
}
