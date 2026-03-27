import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LlmService {
  private apiKey: string;
  private baseUrl = 'https://api.sarvam.ai/v1/chat/completions';
  private readonly logger = new Logger(LlmService.name);

  constructor(private config: ConfigService) {
    this.apiKey = this.config.getOrThrow<string>('SARVAM_API_KEY');
  }

  async parseExpense(text: string) {
    this.logger.log(`Parsing expense from text: "${text}"`);

    const today = new Date();
    const todayDate = today.toISOString().split('T')[0];
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDate = yesterday.toISOString().split('T')[0];

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'api-subscription-key': this.apiKey,
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sarvam-m',
        messages: [
          {
            role: 'system',
            content: `You are an expense parser. Do NOT explain your reasoning. Do NOT use <think> tags. Output ONLY the JSON object, nothing else.

{"amount": NUMBER, "category": "STRING", "sub_type": "STRING", "description": "STRING", "date": "YYYY-MM-DD", "confidence": NUMBER}

Rules:
- amount: plain number, no currency symbols. If user mentions splitting among N people, divide total by N and return per-person share.
  Example: "5 people spent 3180" → amount = 636 (3180/5)
- category: one of food, transport, entertainment, shopping, bills, health, education, other (lowercase)
- sub_type: specific type within category (lowercase). Examples:
  food → snacks, lunch, breakfast, dinner, tea, coffee, groceries
  transport → bike, bus, auto, cab, fuel, train, flight
  entertainment → movie, games, streaming, party
  shopping → clothes, electronics, gifts, household
  bills → rent, electricity, phone, internet, water
  health → medicine, doctor, gym, insurance
  education → books, course, tuition, exam
  other → miscellaneous
- description: brief description. If people count mentioned, include "split among N people" in description
- date: default ${todayDate} if not mentioned. "yesterday" = ${yesterdayDate}, "today" = ${todayDate}, "last week" = 7 days ago
- confidence: 0 to 1

Output ONLY the JSON. No explanation.`,
          },
          {
            role: 'user',
            content: text,
          },
        ],
        temperature: 0.1,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`LLM parse failed (${response.status}): ${error}`);
      throw new Error(`LLM parsing failed: ${response.status} - ${error}`);
    }

    const result = await response.json();
    this.logger.log(`LLM raw response: ${JSON.stringify(result.choices?.[0]?.message?.content || 'EMPTY').substring(0, 300)}`);

    let content = result.choices?.[0]?.message?.content || '{}';

    // Strip <think>...</think> tags from Sarvam model output
    content = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    this.logger.log(`After think strip: ${content.substring(0, 200)}`);

    try {
      return JSON.parse(content);
    } catch {
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      try {
        return JSON.parse(cleaned);
      } catch {
        this.logger.error(`Failed to parse LLM response: ${content}`);
        throw new Error('Failed to parse AI response. Please try again.');
      }
    }
  }

  async query(question: string, context: string) {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'api-subscription-key': this.apiKey,
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sarvam-m',
        messages: [
          {
            role: 'system',
            content: `You are a friendly, human-like financial assistant called "Logger AI" for an expense tracking app.

Rules:
- Be conversational, warm, and concise. Use casual language like a helpful friend.
- Always use INR (Rs.) for amounts and format with Indian number system.
- When asked about overspending: compare expenses against budget limits in the data.
- When asked about categories: break down by sub_type too if available.
- Give actionable advice when appropriate.
- Use simple sentences. No jargon.
- Do NOT include <think> tags or reasoning. Just answer directly.`,
          },
          {
            role: 'user',
            content: `Context (user's expense data):\n${context}\n\nQuestion: ${question}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 512,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Query failed: ${response.status} - ${error}`);
    }

    const result = await response.json();
    let answer = result.choices[0].message.content || '';
    // Strip <think>...</think> tags from Sarvam model output
    answer = answer.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    return answer;
  }
}
