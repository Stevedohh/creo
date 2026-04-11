import { IsUUID } from 'class-validator';

export class CreateVoiceoverDto {
  @IsUUID()
  voiceId!: string;
}
