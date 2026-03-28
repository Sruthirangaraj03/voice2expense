import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

export interface TranscriptionResult {
  text: string;
  language: string;
}

@Injectable()
export class SttService {
  private openai: OpenAI;
  private readonly logger = new Logger(SttService.name);

  constructor(private config: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.config.getOrThrow<string>('OPENAI_API_KEY'),
    });
  }

  async transcribe(audioBuffer: Buffer, filename: string): Promise<TranscriptionResult> {
    this.logger.log(`Transcribing: ${filename}, size: ${audioBuffer.length} bytes`);

    // Detect MIME type from filename
    const ext = filename.split('.').pop()?.toLowerCase() || 'webm';
    const mimeMap: Record<string, string> = {
      wav: 'audio/wav',
      webm: 'audio/webm',
      mp4: 'audio/mp4',
      m4a: 'audio/m4a',
      ogg: 'audio/ogg',
      mp3: 'audio/mpeg',
    };
    const mimeType = mimeMap[ext] || 'audio/webm';

    const uint8 = new Uint8Array(audioBuffer);
    const blob = new Blob([uint8], { type: mimeType });
    const file = new File([blob], filename, { type: mimeType });

    const response = await this.openai.audio.transcriptions.create({
      model: 'gpt-4o-mini-transcribe',
      file,
      prompt: `This audio contains a person describing daily expenses. Listen carefully for numbers, currency amounts, and expense items.

Common English words: rupees, spent, groceries, food, transport, petrol, rent, bill, tea, coffee, auto, bus, lunch, dinner, breakfast, salon, gym, recharge, EMI, electricity, water bill, gas, medicine, doctor, haircut, clothes, movie, ticket.

Hindi: chai, khana, kiraya, bijli, paani, doodh, sabzi, auto, petrol, recharge, dawai, salon, kapde, bill.
Tamil: saapadu, thaeni, bus, auto, petrol, marundu, salon, kadai, bill, rent, paal, kaai kari.
Telugu: bhojanam, tea, auto, petrol, mandhulu, salon, bill, rent, paalu, kooragayalu.
Kannada: oota, tea, auto, petrol, maddu, salon, bill, rent, haalu, tarakari.
Malayalam: bhakshanam, chaya, auto, petrol, marunnu, salon, bill, rent, paal, pachakkari.
Bengali: khabar, cha, auto, petrol, osudh, salon, bill, rent, dudh, sabji.
Gujarati: jaman, chai, auto, petrol, dava, salon, bill, rent, dudh, shaak.
Marathi: jewan, chai, auto, petrol, aushadh, salon, bill, rent, dudh, bhaji.

Example phrases:
"I spent 120 rupees on food"
"Today I spent 500 for petrol"
"Paid 2000 rent"
"chai 20 rupees auto 30 rupees"
"yesterday lunch 150 and dinner 200"
"saapadu 150, bus 30 rubaa"
"khana 200 aur auto 50"

The speaker may use any Indian language or mix languages freely (Hinglish, Tanglish, etc). Pay close attention to EVERY number mentioned. Numbers are critical - never miss or approximate them.`,
    });

    const text = response.text;
    const language = this.detectLanguage(text);

    this.logger.log(`Transcription: "${text}" | Language: ${language}`);
    return { text, language };
  }

  private detectLanguage(text: string): string {
    const scripts: Record<string, RegExp> = {
      hi: /[\u0900-\u097F]/,
      ta: /[\u0B80-\u0BFF]/,
      te: /[\u0C00-\u0C7F]/,
      kn: /[\u0C80-\u0CFF]/,
      ml: /[\u0D00-\u0D7F]/,
      bn: /[\u0980-\u09FF]/,
      gu: /[\u0A80-\u0AFF]/,
      pa: /[\u0A00-\u0A7F]/,
      or: /[\u0B00-\u0B7F]/,
    };

    for (const [lang, regex] of Object.entries(scripts)) {
      if (regex.test(text)) return lang;
    }

    return 'en';
  }
}
