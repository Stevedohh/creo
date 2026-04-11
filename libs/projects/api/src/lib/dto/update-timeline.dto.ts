import { IsObject } from 'class-validator';

export class UpdateTimelineDto {
  @IsObject()
  timeline!: Record<string, unknown>;
}
