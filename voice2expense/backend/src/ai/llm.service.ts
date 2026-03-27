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
          content: `You are a precise expense assistant. You ONLY answer about expenses using the data provided. Never estimate or make up numbers.

DATA RULES:
- "summary" = ACTUAL money spent (use for "how much did I spend" questions)
- "category_breakdown_this_month" = per-category spending with individual transactions
- "recent_expenses" = list of individual expense entries
- "budgets" = spending LIMITS (goals, NOT actual spending). Only mention when user asks about budgets.
- NEVER mix budget limits with expense totals.

ACCURACY:
- Every Rs. amount MUST come directly from the data. Zero tolerance for guessing.
- If summary.this_month_total is 2000, say "Rs.2,000" exactly.
- If no data exists, say "No expenses recorded for that period."

RESPONSE FORMAT — always use this structured style:

For total questions:
Total spent this month: Rs.X,XXX (Y transactions)

For category questions:
Category Breakdown:
- Food: Rs.X,XXX (N items)
- Transport: Rs.X,XXX (N items)

For listing expenses:
Date        | Category   | Item         | Amount
27 Mar 2026 | Food       | lunch        | Rs.200
27 Mar 2026 | Transport  | auto         | Rs.50

For budget questions:
Category  | Spent    | Limit    | Status
Food      | Rs.2,000 | Rs.5,000 | 40% used

FORMATTING RULES:
- Plain text only. NO markdown (no **, no #, no *).
- Use "Rs." with Indian number format (Rs.1,200 not Rs.1200).
- Use table-like alignment with | separator for listings.
- Use "- " for simple bullet lists.
- Keep it short. No filler, no preamble, no "Sure!" or "Here you go".
- Start directly with the answer.`,
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
