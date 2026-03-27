import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { SttService } from './stt.service';
import { LlmService } from './llm.service';
import { ExpenseService } from '../expense/expense.service';
import { BudgetService } from '../budget/budget.service';

const VALID_CATEGORIES = ['food', 'transport', 'entertainment', 'shopping', 'bills', 'health', 'education', 'other'];

function sanitizeExpense(data: Record<string, unknown>) {
  // Sanitize amount
  let rawAmount = data.amount;
  if (typeof rawAmount === 'string') {
    rawAmount = parseFloat(String(rawAmount).replace(/[₹Rs.,\s]/g, ''));
  }
  const amount = Number(rawAmount);
  if (!amount || isNaN(amount) || amount <= 0) {
    throw new BadRequestException('Could not determine expense amount.');
  }

  // Sanitize category - lowercase, validate
  let category = String(data.category || 'other').toLowerCase().trim();
  if (!VALID_CATEGORIES.includes(category)) {
    category = 'other';
  }

  // Sanitize date
  let date = String(data.date || '');
  if (!date || date === 'null' || date === 'undefined' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    date = new Date().toISOString().split('T')[0];
  }

  // Sanitize sub_type
  const sub_type = String(data.sub_type || '').toLowerCase().trim() || undefined;

  // Sanitize description
  const description = String(data.description || '').substring(0, 500);

  const confidence = Number(data.confidence) || 0.8;

  return { amount, category, sub_type, date, description, confidence };
}

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);

  constructor(
    private sttService: SttService,
    private llmService: LlmService,
    private expenseService: ExpenseService,
    private budgetService: BudgetService,
  ) {}

  async transcribe(audioBuffer: Buffer, filename: string) {
    const transcript = await this.sttService.transcribe(audioBuffer, filename);
    return { transcript };
  }

  async parseExpense(text: string) {
    const rawList = await this.llmService.parseExpense(text);
    const entries = rawList.map((raw: Record<string, unknown>) => {
      try {
        return sanitizeExpense(raw);
      } catch {
        return null;
      }
    }).filter(Boolean);
    return { entries };
  }

  async voiceLog(userId: string, audioBuffer: Buffer, filename: string) {
    const transcript = await this.sttService.transcribe(audioBuffer, filename);
    this.logger.log(`Voice transcript: "${transcript}"`);

    if (!transcript || transcript.trim().length === 0) {
      throw new BadRequestException('Could not understand the audio. Please try again.');
    }

    const rawList = await this.llmService.parseExpense(transcript);
    const entries = rawList.map((raw: Record<string, unknown>) => {
      try {
        return sanitizeExpense(raw);
      } catch {
        return null;
      }
    }).filter(Boolean);

    if (entries.length === 0) {
      throw new BadRequestException('Could not extract any expense from your speech.');
    }

    // Save all entries directly
    const saved: unknown[] = [];
    for (const entry of entries) {
      const e = entry as { amount: number; category: string; sub_type?: string; description: string; date: string };
      const expense = await this.expenseService.create(userId, {
        amount: e.amount,
        category: e.category,
        sub_type: e.sub_type,
        description: e.description || transcript,
        date: e.date,
        source: 'voice',
      });
      saved.push(expense);
    }

    // Collect budget alerts from saved expenses
    const budget_alerts = saved
      .map((s: any) => s.budget_alert)
      .filter(Boolean);

    return {
      transcription: transcript,
      entries,
      saved_count: saved.length,
      budget_alerts,
    };
  }

  async query(userId: string, question: string) {
    // Fetch all expenses (up to 500) for comprehensive answers
    const { data: expenses } = await this.expenseService.findAll(userId, { limit: 500 });
    let budgetStatus: unknown[] = [];
    try {
      budgetStatus = await this.budgetService.getStatus(userId);
    } catch {
      this.logger.warn('Could not fetch budget status');
    }

    // Pre-compute summaries so the LLM doesn't have to sum numbers
    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7); // YYYY-MM
    const currentMonthStart = `${currentMonth}-01`;
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonth = lastMonthDate.toISOString().slice(0, 7);
    const lastMonthStart = `${lastMonth}-01`;
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];

    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoDate = weekAgo.toISOString().split('T')[0];
    const todayDate = now.toISOString().split('T')[0];

    const typedExpenses = (expenses || []).map((e: Record<string, unknown>) => ({
      amount: Number(e.amount),
      category: String(e.category || ''),
      sub_type: e.sub_type ? String(e.sub_type) : undefined,
      description: e.description ? String(e.description) : undefined,
      date: String(e.date || '').split('T')[0], // ensure YYYY-MM-DD format
      source: e.source ? String(e.source) : undefined,
    }));

    // Current month expenses
    const thisMonthExpenses = typedExpenses.filter(e => e.date >= currentMonthStart && e.date <= todayDate);
    const lastMonthExpenses = typedExpenses.filter(e => e.date >= lastMonthStart && e.date <= lastMonthEnd);
    const thisWeekExpenses = typedExpenses.filter(e => e.date >= weekAgoDate && e.date <= todayDate);

    // Category totals for current month
    const categoryTotals: Record<string, { total: number; count: number; items: string[] }> = {};
    for (const e of thisMonthExpenses) {
      if (!categoryTotals[e.category]) {
        categoryTotals[e.category] = { total: 0, count: 0, items: [] };
      }
      categoryTotals[e.category].total += Number(e.amount);
      categoryTotals[e.category].count += 1;
      const label = e.sub_type || e.description || e.category;
      categoryTotals[e.category].items.push(`Rs.${Number(e.amount)} on ${label} (${e.date})`);
    }

    // Build a structured, pre-computed context
    const sumAmount = (arr: typeof typedExpenses) => arr.reduce((s, e) => s + Number(e.amount), 0);

    const context = {
      today: todayDate,
      current_month: currentMonth,
      summary: {
        this_month_total: sumAmount(thisMonthExpenses),
        this_month_count: thisMonthExpenses.length,
        last_month_total: sumAmount(lastMonthExpenses),
        last_month_count: lastMonthExpenses.length,
        this_week_total: sumAmount(thisWeekExpenses),
        this_week_count: thisWeekExpenses.length,
        all_time_total: sumAmount(typedExpenses),
        all_time_count: typedExpenses.length,
      },
      category_breakdown_this_month: Object.entries(categoryTotals).map(([cat, v]) => ({
        category: cat,
        total: Math.round(v.total * 100) / 100,
        count: v.count,
        transactions: v.items,
      })),
      budgets: budgetStatus,
      recent_expenses: typedExpenses.slice(0, 30).map(e => ({
        amount: e.amount,
        category: e.category,
        sub_type: e.sub_type,
        description: e.description,
        date: e.date,
        source: e.source,
      })),
    };

    const answer = await this.llmService.query(question, JSON.stringify(context, null, 2));
    return { answer };
  }
}
