import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { IsString, IsOptional } from 'class-validator';
import { AIService } from './ai.service';
import { ParseTextDto, QueryDto } from './dto/ai.dto';

class VoiceLogDto {
  @IsString()
  audio: string;

  @IsString()
  @IsOptional()
  filename: string;
}

const DEFAULT_USER_ID = '50f6bc48-568f-479e-901d-31eee14511aa';

@Controller('ai')
export class AIController {
  constructor(private aiService: AIService) {}

  @Post('transcribe')
  transcribe(@Body() body: VoiceLogDto) {
    if (!body.audio) throw new BadRequestException('Audio data is required');
    const buffer = Buffer.from(body.audio, 'base64');
    return this.aiService.transcribe(buffer, body.filename || 'recording.wav');
  }

  @Post('parse')
  parse(@Body() dto: ParseTextDto) {
    return this.aiService.parseExpense(dto.text);
  }

  @Post('voice-log')
  voiceLog(@Body() body: VoiceLogDto) {
    if (!body.audio) throw new BadRequestException('Audio data is required');
    const buffer = Buffer.from(body.audio, 'base64');
    return this.aiService.voiceLog(DEFAULT_USER_ID, buffer, body.filename || 'recording.wav');
  }

  @Post('query')
  query(@Body() dto: QueryDto) {
    return this.aiService.query(DEFAULT_USER_ID, dto.question);
  }
}
