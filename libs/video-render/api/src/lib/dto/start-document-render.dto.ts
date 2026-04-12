import { IsObject, IsOptional, IsString } from 'class-validator';
import type { RenderExportSettings } from '../render-settings';

export class StartDocumentRenderDto {
  @IsObject()
  document!: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  exportSettings?: Partial<RenderExportSettings>;

  @IsOptional()
  @IsString()
  name?: string;
}
