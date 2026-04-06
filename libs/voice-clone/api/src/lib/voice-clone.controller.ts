import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { CurrentUser } from '@creo/auth-api';
import { VoiceCloneService, CloneVoiceResult } from './voice-clone.service';
import { CloneVoiceDto } from './dto/clone-voice.dto';

@Controller('voices')
export class VoiceCloneController {
  constructor(private readonly voiceCloneService: VoiceCloneService) {}

  @Post('clone')
  async cloneVoice(
    @CurrentUser('userId') userId: string,
    @Body() dto: CloneVoiceDto,
  ): Promise<CloneVoiceResult> {
    return this.voiceCloneService.cloneVoice(userId, dto);
  }

  @Get()
  async getVoices(@CurrentUser('userId') userId: string) {
    return this.voiceCloneService.getVoices(userId);
  }

  @Delete(':id')
  async deleteVoice(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    return this.voiceCloneService.deleteVoice(userId, id);
  }
}
