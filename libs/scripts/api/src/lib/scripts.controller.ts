import { Body, Controller, Delete, Get, Param, Patch, Post, Res } from '@nestjs/common';
import { CurrentUser } from '@creo/auth-api';
import type { Response } from 'express';
import { ScriptsService } from './scripts.service';
import { ScriptsAiService } from './scripts-ai.service';
import { CreateScriptDto } from './dto/create-script.dto';
import { UpdateScriptDto } from './dto/update-script.dto';
import { AiEditDto } from './dto/ai-edit.dto';

@Controller('scripts')
export class ScriptsController {
  constructor(
    private readonly scriptsService: ScriptsService,
    private readonly scriptsAiService: ScriptsAiService,
  ) {}

  @Post()
  async create(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateScriptDto,
  ) {
    return this.scriptsService.create(userId, dto);
  }

  @Get()
  async findAll(@CurrentUser('userId') userId: string) {
    return this.scriptsService.findAll(userId);
  }

  @Get(':id')
  async findOne(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    return this.scriptsService.findOne(userId, id);
  }

  @Patch(':id')
  async update(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateScriptDto,
  ) {
    return this.scriptsService.update(userId, id, dto);
  }

  @Delete(':id')
  async delete(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    return this.scriptsService.delete(userId, id);
  }

  @Post(':id/ai')
  async aiEdit(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: AiEditDto,
    @Res() res: Response,
  ) {
    await this.scriptsService.findOne(userId, id);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = await this.scriptsAiService.process(dto);

    let buffer = '';

    stream.on('data', (chunk: Buffer) => {
      buffer += chunk.toString();

      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;

        const data = trimmed.slice(6);
        if (data === '[DONE]') {
          res.write('data: [DONE]\n\n');
          return;
        }

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            res.write(`data: ${JSON.stringify({ content })}\n\n`);
          }
        } catch {
          // skip unparseable chunks
        }
      }
    });

    stream.on('end', () => {
      res.write('data: [DONE]\n\n');
      res.end();
    });

    stream.on('error', () => {
      res.write(`data: ${JSON.stringify({ error: 'Stream failed' })}\n\n`);
      res.end();
    });
  }
}
