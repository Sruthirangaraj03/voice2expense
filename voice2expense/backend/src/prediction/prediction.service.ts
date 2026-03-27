import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../common/supabase/supabase.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PredictionService {
  private apiKey: string;
  private baseUrl = 'https://api.sarvam.ai/v1/chat/completions';

  constructor(
    private supabase: SupabaseService,
    private config: ConfigService,
  ) {
    this.apiKey = this.config.getOrThrow<string>('SARVAM_API_KEY');
  }

  async getForecasts(userId: string) {
    const client = this.supabase.getClient();
    const { data, error } = await client
      .from('predictions')
      .select('*')
      .eq('user_id', userId)
      .order('forecast_month', { ascending: false })
      .limit(20);

    if (error) throw new Error(error.message);
    return data;
  }

  async generate(userId: string) {
    const client = this.supabase.getClient();

    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    const { data: expenses } = await client
      .from('expenses')
      .select('*')
      .eq('user_id', userId)
      .gte('date', ninetyDaysAgo)
      .order('date', { ascending: true });

    if (!expenses || expenses.length < 5) {
      return { message: 'Not enough data for predictions. Log at least 5 expenses.' };
    }

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
            content: `You are a financial prediction engine. Given historical expense data, predict next month's spending per category. Return ONLY a valid JSON array where each element has:
- category (string)
- predicted_amount (number)
- confidence_score (number between 0 and 1)
- risk_flag (boolean, true if predicted to exceed typical spending by >20%)

Return valid JSON array only, no markdown.`,
          },
          {
            role: 'user',
            content: `Historical expenses (last 90 days):\n${JSON.stringify(expenses, null, 2)}`,
          },
        ],
        temperature: 0.2,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Prediction generation failed: ${error}`);
    }

    const result = await response.json();
    const content = result.choices[0].message.content || '[]';

    let predictions: { category: string; predicted_amount: number; confidence_score: number; risk_flag: boolean }[];
    try {
      predictions = JSON.parse(content);
    } catch {
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      try {
        predictions = JSON.parse(cleaned);
      } catch {
        throw new Error('Failed to parse AI response. Please try again.');
      }
    }

    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1, 1);
    const forecastMonth = nextMonth.toISOString().split('T')[0];

    for (const pred of predictions) {
      await client.from('predictions').upsert(
        {
          user_id: userId,
          forecast_month: forecastMonth,
          category: pred.category,
          predicted_amount: pred.predicted_amount,
          confidence_score: pred.confidence_score,
          risk_flag: pred.risk_flag,
          generated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,category,forecast_month' },
      );
    }

    return { predictions, forecast_month: forecastMonth };
  }
}
