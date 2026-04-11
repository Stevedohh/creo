import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { CurrentUser } from '@creo/auth-api';
import { VoiceoverService } from './voiceover.service';
import { CreateVoiceoverDto } from './dto/create-voiceover.dto';

@Controller()
export class VoiceoverController {
  constructor(private readonly voiceoverService: VoiceoverService) {}

  @Post('scripts/:scriptId/voiceovers')
  async create(
    @Param('scriptId') scriptId: string,
    @Body() dto: CreateVoiceoverDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.voiceoverService.create(scriptId, dto.voiceId, userId);
  }

  @Get('scripts/:scriptId/voiceovers')
  async findByScript(
    @Param('scriptId') scriptId: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.voiceoverService.findByScript(scriptId, userId);
  }

  @Get('voiceovers/:id/audio')
  async getAudioUrl(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
  ) {
    const url = await this.voiceoverService.getAudioUrl(id, userId);
    return { url };
  }

  @Delete('voiceovers/:id')
  async delete(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.voiceoverService.delete(id, userId);
  }
}
