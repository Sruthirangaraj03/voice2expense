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
    const raw = await this.llmService.parseExpense(text);
    const parsed = sanitizeExpense(raw);
    return { ...parsed, source: 'text' };
  }

  async voiceLog(userId: string, audioBuffer: Buffer, filename: string) {
    const transcript = await this.sttService.transcribe(audioBuffer, filename);
    this.logger.log(`Voice transcript: "${transcript}"`);

    if (!transcript || transcript.trim().length === 0) {
      throw new BadRequestException('Could not understand the audio. Please try again.');
    }

    const raw = await this.llmService.parseExpense(transcript);
    const parsed = sanitizeExpense(raw);

    const expense = await this.expenseService.create(userId, {
      amount: parsed.amount,
      category: parsed.category,
      sub_type: parsed.sub_type,
      description: parsed.description || transcript,
      date: parsed.date,
      source: 'voice',
    });

    return {
      transcription: transcript,
      parsed,
      expense_id: expense.id,
      confidence: parsed.confidence,
    };
  }

  async query(userId: string, question: string) {
    const { data } = await this.expenseService.findAll(userId, { limit: 100 });
    let budgetStatus: unknown[] = [];
    try {
      budgetStatus = await this.budgetService.getStatus(userId);
    } catch {
      this.logger.warn('Could not fetch budget status');
    }
    const context = JSON.stringify(
      { expenses: data, budgets: budgetStatus },
      null,
      2,
    );
    const answer = await this.llmService.query(question, context);
    return { answer };
  }
}
