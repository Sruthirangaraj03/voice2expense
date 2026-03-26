import { Injectable, BadRequestException } from '@nestjs/common';
import { SttService } from './stt.service';
import { LlmService } from './llm.service';
import { ExpenseService } from '../expense/expense.service';
import { SupabaseService } from '../common/supabase/supabase.service';

@Injectable()
export class AIService {
  constructor(
    private stt: SttService,
    private llm: LlmService,
    private expenseService: ExpenseService,
    private supabase: SupabaseService,
  ) {}

  async transcribe(audioBuffer: Buffer, filename: string) {
    const text = await this.stt.transcribe(audioBuffer, filename);
    return { transcription: text };
  }

  async parseExpense(text: string) {
    const parsed = await this.llm.parseExpense(text);
    return { parsed };
  }

  async voiceLog(userId: string, audioBuffer: Buffer, filename: string) {
    const transcription = await this.stt.transcribe(audioBuffer, filename);
    if (!transcription || transcription.trim().length === 0) {
      throw new BadRequestException('Could not understand the audio. Please try again.');
    }
    const parsed = await this.llm.parseExpense(transcription);
    const { confidence, ...expenseData } = parsed;

    // Validate parsed data
    const validCategories = ['food', 'transport', 'entertainment', 'shopping', 'bills', 'health', 'education', 'other'];
    if (!expenseData.amount || expenseData.amount <= 0) {
      throw new BadRequestException('Could not determine expense amount from audio.');
    }
    if (!validCategories.includes(expenseData.category)) {
      expenseData.category = 'other';
    }
    if (!['expense', 'income'].includes(expenseData.type)) {
      expenseData.type = 'expense';
    }

    const expense = await this.expenseService.create(userId, {
      ...expenseData,
      source: 'voice',
    });

    return {
      transcription,
      parsed,
      expense_id: expense.id,
      confidence,
    };
  }

  async query(userId: string, question: string) {
    const client = this.supabase.getClient();

    const { data: expenses } = await client
      .from('expenses')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(100);

    const expenseData = JSON.stringify(expenses || [], null, 2);
    const answer = await this.llm.queryExpenses(question, expenseData);

    return { answer };
  }
}
