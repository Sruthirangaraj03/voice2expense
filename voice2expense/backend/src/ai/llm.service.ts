import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LlmService {
  private apiKey: string;
  private baseUrl = 'https://api.sarvam.ai/v1/chat/completions';

  constructor(private config: ConfigService) {
    this.apiKey = this.config.getOrThrow<string>('SARVAM_API_KEY');
  }

  private async chat(messages: { role: string; content: string }[], temperature = 0.2) {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sarvam-m',
        messages,
        temperature,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`LLM request failed: ${error}`);
    }

    const data = await response.json();
    return data.choices[0].message.content || '';
  }

  async parseExpense(text: string): Promise<{
    amount: number;
    category: string;
    type: string;
    date: string;
    description: string;
    confidence: number;
  }> {
    const today = new Date().toISOString().split('T')[0];

    const content = await this.chat([
      {
        role: 'system',
        content: `You are an expense parser. Given a natural language expense description, extract and return ONLY a valid JSON object with these fields:
- amount (number)
- category (one of: food, transport, entertainment, shopping, bills, health, education, other)
- type ("expense" or "income")
- date (ISO date string, default today: ${today})
- description (short summary)
- confidence (number between 0 and 1 indicating how confident you are)

If any field is ambiguous, use your best guess. Always return valid JSON only, no markdown.`,
      },
      { role: 'user', content: text },
    ], 0.1);

    try {
      return JSON.parse(content);
    } catch {
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      try {
        return JSON.parse(cleaned);
      } catch {
        throw new Error('Failed to parse AI response. Please try again.');
      }
    }
  }

  async queryExpenses(question: string, expenseData: string): Promise<string> {
    return this.chat([
      {
        role: 'system',
        content: `You are a financial assistant for a personal expense tracker.
You have access to the user's expense data provided as context.
Answer spending questions concisely with specific numbers.
If you can provide comparisons or trends, do so.
Always mention the time period and currency (INR).
Never fabricate data — only use what is provided.`,
      },
      {
        role: 'user',
        content: `My expense data:\n${expenseData}\n\nQuestion: ${question}`,
      },
    ], 0.3);
  }
}
