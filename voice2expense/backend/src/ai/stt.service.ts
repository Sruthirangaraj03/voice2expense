import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SttService {
  private apiKey: string;
  private readonly logger = new Logger(SttService.name);

  constructor(private config: ConfigService) {
    this.apiKey = this.config.getOrThrow<string>('SARVAM_API_KEY');
  }

  async transcribe(audioBuffer: Buffer, filename: string): Promise<string> {
    const formData = new FormData();
    const uint8 = new Uint8Array(audioBuffer);
    const mimeType = filename.endsWith('.mp4') ? 'audio/mp4' : 'audio/webm';
    const blob = new Blob([uint8], { type: mimeType });
    formData.append('file', blob, filename);
    formData.append('model', 'saarika:v2.5');
    formData.append('language_code', 'en-IN');

    this.logger.log(`Transcribing: ${filename}, size: ${audioBuffer.length} bytes, type: ${mimeType}`);

    const response = await fetch('https://api.sarvam.ai/speech-to-text', {
      method: 'POST',
      headers: {
        'api-subscription-key': this.apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`STT failed (${response.status}): ${error}`);
      throw new Error(`Speech-to-text failed: ${response.status}`);
    }

    const data = await response.json();
    this.logger.log(`Transcription result: "${data.transcript}"`);
    return data.transcript;
  }
}
