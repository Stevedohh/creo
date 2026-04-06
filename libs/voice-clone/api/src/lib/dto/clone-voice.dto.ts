import { IsString, IsUrl, Matches, MaxLength, MinLength } from 'class-validator';

export class CloneVoiceDto {
  @IsUrl()
  youtubeUrl!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  voiceName!: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'startTime must be in MM:SS format' })
  startTime!: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'endTime must be in MM:SS format' })
  endTime!: string;
}
