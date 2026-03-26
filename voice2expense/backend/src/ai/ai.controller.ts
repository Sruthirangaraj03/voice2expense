import { Controller, Post, Body, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { AIService } from './ai.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ParseTextDto, QueryDto } from './dto/ai.dto';

@Controller('ai')
@UseGuards(AuthGuard('jwt'))
export class AIController {
  constructor(private aiService: AIService) {}

  @Post('transcribe')
  @UseInterceptors(FileInterceptor('audio', { limits: { fileSize: 10 * 1024 * 1024 } }))
  transcribe(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Audio file is required');
    return this.aiService.transcribe(file.buffer, file.originalname);
  }

  @Post('parse')
  parse(@Body() dto: ParseTextDto) {
    return this.aiService.parseExpense(dto.text);
  }

  @Post('voice-log')
  @UseInterceptors(FileInterceptor('audio', { limits: { fileSize: 10 * 1024 * 1024 } }))
  voiceLog(
    @CurrentUser('sub') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Audio file is required');
    return this.aiService.voiceLog(userId, file.buffer, file.originalname);
  }

  @Post('query')
  query(@CurrentUser('sub') userId: string, @Body() dto: QueryDto) {
    return this.aiService.query(userId, dto.question);
  }
}
