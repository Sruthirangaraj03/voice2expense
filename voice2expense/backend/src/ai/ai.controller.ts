import { Controller, Post, Body, BadRequestException, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
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

@UseGuards(AuthGuard('jwt'))
@Controller('ai')
export class AIController {
  constructor(private aiService: AIService) {}

  @Post('transcribe')
  transcribe(@Body() body: VoiceLogDto) {
    if (!body.audio) throw new BadRequestException('Audio data is required');
    const buffer = Buffer.from(body.audio, 'base64');
    if (buffer.length > 5 * 1024 * 1024) throw new BadRequestException('Audio too large. Max 5MB.');
    return this.aiService.transcribe(buffer, body.filename || 'recording.wav');
  }

  @Post('parse')
  parse(@Body() dto: ParseTextDto) {
    return this.aiService.parseExpense(dto.text);
  }

  @Post('voice-log')
  voiceLog(@Request() req: any, @Body() body: VoiceLogDto) {
    if (!body.audio) throw new BadRequestException('Audio data is required');
    const buffer = Buffer.from(body.audio, 'base64');
    if (buffer.length > 5 * 1024 * 1024) throw new BadRequestException('Audio too large. Max 5MB.');
    return this.aiService.voiceLog(req.user.sub, buffer, body.filename || 'recording.wav');
  }

  @Post('voice-budget')
  voiceBudget(@Request() req: any, @Body() body: VoiceLogDto) {
    if (!body.audio) throw new BadRequestException('Audio data is required');
    const buffer = Buffer.from(body.audio, 'base64');
    if (buffer.length > 5 * 1024 * 1024) throw new BadRequestException('Audio too large. Max 5MB.');
    return this.aiService.voiceBudget(req.user.sub, buffer, body.filename || 'recording.wav');
  }

  @Post('query')
  query(@Request() req: any, @Body() dto: QueryDto) {
    return this.aiService.query(req.user.sub, dto.question);
  }
}
