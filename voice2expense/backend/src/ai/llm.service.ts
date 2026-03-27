import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class LlmService {
  private openai: OpenAI;
  private readonly logger = new Logger(LlmService.name);

  constructor(private config: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.config.getOrThrow<string>('OPENAI_API_KEY'),
    });
  }

  async parseExpense(text: string) {
    this.logger.log(`Parsing expense from text: "${text}"`);

    const today = new Date();
    const todayDate = today.toISOString().split('T')[0];
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDate = yesterday.toISOString().split('T')[0];

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4.1-nano',
      messages: [
        {
          role: 'system',
          content: `You are an expense parser. Output ONLY valid JSON, nothing else.

If user mentions MULTIPLE expenses, return a JSON ARRAY. If only ONE expense, still return an ARRAY with one item.

[{"amount": NUMBER, "category": "STRING", "sub_type": "STRING", "description": "STRING", "date": "YYYY-MM-DD", "confidence": NUMBER}]

Example: "10 for tea and 200 for lunch" → [{"amount":10,"category":"food","sub_type":"tea","description":"tea","date":"${todayDate}","confidence":0.95},{"amount":200,"category":"food","sub_type":"lunch","description":"lunch","date":"${todayDate}","confidence":0.95}]

Rules:
- amount: plain number only. If user says "3810 for 15 people" → amount = 254 (auto divide). Never show split math, just the per-person amount.
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

Output ONLY the JSON array. No explanation.`,
        },
        { role: 'user', content: text },
      ],
      temperature: 0.1,
      max_tokens: 1024,
    });

    let content = response.choices[0].message.content || '[]';
    this.logger.log(`LLM response: ${content.substring(0, 300)}`);

    // Strip markdown fences if present
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      this.logger.error(`Failed to parse LLM response: ${content}`);
      throw new Error('Failed to parse AI response. Please try again.');
    }

    if (Array.isArray(parsed)) return parsed;
    return [parsed];
  }

  async query(question: string, context: string) {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4.1-nano',
      messages: [
        {
          role: 'system',
          content: `You are a precise financial assistant. You MUST answer using ONLY the data provided below. Never estimate, guess, or make up numbers.

CRITICAL — UNDERSTAND THE DATA STRUCTURE:
- "summary" and "category_breakdown_this_month" = ACTUAL EXPENSES (real money spent)
- "budgets" = SPENDING LIMITS the user set (goals, NOT actual spending)
- These are COMPLETELY DIFFERENT. Never add budget limits to expense totals.

STRICT RULES:
1. Every number you state MUST come directly from the pre-computed summaries or by adding up individual transactions in the data. Do NOT approximate.
2. If the data shows this_month_total is 4500, say "Rs.4,500" — not "around Rs.4,500" or "approximately Rs.4,500".
3. If asked "how much did I spend" or "what are my expenses" — ONLY use summary totals and category_breakdown. NEVER include budget limit_amount values. Budgets are goals, not spending.
4. When listing category breakdowns, use the exact totals from category_breakdown_this_month.
5. When comparing months, use the exact summary.this_month_total and summary.last_month_total values.
6. ONLY mention budgets when the user specifically asks about budgets, limits, or budget health. Then compare category expense totals against budget limit_amount values.

Formatting:
- Plain text only. NO markdown (no **, no #, no *).
- Use "Rs." with Indian number format (e.g. Rs.1,200 not Rs.1200).
- Use "- " for bullet lists.
- Keep answers short and factual. 2-5 sentences for simple questions.
- Separate sections with a blank line.

Content:
- State facts first, then brief actionable advice if relevant.
- When asked about categories, include sub_type details from the transactions.
- For budget questions, state exact amounts: "You spent Rs.X of your Rs.Y budget (Z% used)."
- Do NOT include reasoning tags, preamble, or filler.`,
        },
        {
          role: 'user',
          content: `DATA (source of truth — use ONLY these numbers):\n${context}\n\nQuestion: ${question}`,
        },
      ],
      temperature: 0.1,
      max_tokens: 512,
    });

    return response.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
  }
}
