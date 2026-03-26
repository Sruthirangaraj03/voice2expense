import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SttService {
  private apiKey: string;

  constructor(private config: ConfigService) {
    this.apiKey = this.config.getOrThrow<string>('SARVAM_API_KEY');
  }

  async transcribe(audioBuffer: Buffer, filename: string): Promise<string> {
    const formData = new FormData();
    const uint8 = new Uint8Array(audioBuffer);
    const blob = new Blob([uint8], { type: 'audio/webm' });
    formData.append('file', blob, filename);
    formData.append('model', 'saarika:v2.5');

    const response = await fetch('https://api.sarvam.ai/speech-to-text', {
      method: 'POST',
      headers: {
        'api-subscription-key': this.apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`STT failed: ${error}`);
    }

    const data = await response.json();
    return data.transcript;
  }
}
