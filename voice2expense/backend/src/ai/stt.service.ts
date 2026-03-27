import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class SttService {
  private openai: OpenAI;
  private readonly logger = new Logger(SttService.name);

  constructor(private config: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.config.getOrThrow<string>('OPENAI_API_KEY'),
    });
  }

  async transcribe(audioBuffer: Buffer, filename: string): Promise<string> {
    this.logger.log(`Transcribing: ${filename}, size: ${audioBuffer.length} bytes`);

    const uint8 = new Uint8Array(audioBuffer);
    const blob = new Blob([uint8], { type: 'audio/wav' });
    const file = new File([blob], filename, { type: 'audio/wav' });

    const response = await this.openai.audio.transcriptions.create({
      model: 'gpt-4o-mini-transcribe',
      file,
    });

    this.logger.log(`Transcription result: "${response.text}"`);
    return response.text;
  }
}
