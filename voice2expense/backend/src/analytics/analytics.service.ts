import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../common/supabase/supabase.service';

@Injectable()
export class AnalyticsService {
  constructor(private supabase: SupabaseService) {}

  async getSummary(userId: string, from?: string, to?: string) {
    const client = this.supabase.getClient();
    const today = new Date().toISOString().split('T')[0];
    const monthStart = today.slice(0, 7) + '-01';

    let qb = client
      .from('expenses')
      .select('amount, type, source')
      .eq('user_id', userId)
      .gte('date', from || monthStart)
      .lte('date', to || today);

    const { data, error } = await qb;
    if (error) throw new Error(error.message);

    const expenses = (data || []).filter((e) => e.type === 'expense');
    const income = (data || []).filter((e) => e.type === 'income');
    const voiceCount = (data || []).filter((e) => e.source === 'voice').length;

    return {
      total_spent: expenses.reduce((sum, e) => sum + Number(e.amount), 0),
      total_income: income.reduce((sum, e) => sum + Number(e.amount), 0),
      transaction_count: (data || []).length,
      average_expense: expenses.length > 0
        ? expenses.reduce((sum, e) => sum + Number(e.amount), 0) / expenses.length
        : 0,
      voice_ratio: (data || []).length > 0 ? voiceCount / (data || []).length : 0,
    };
  }

  async getBreakdown(userId: string, from?: string, to?: string) {
    const client = this.supabase.getClient();
    const today = new Date().toISOString().split('T')[0];
    const monthStart = today.slice(0, 7) + '-01';

    const { data, error } = await client
      .from('expenses')
      .select('category, amount')
      .eq('user_id', userId)
      .eq('type', 'expense')
      .gte('date', from || monthStart)
      .lte('date', to || today);

    if (error) throw new Error(error.message);

    const categoryMap: Record<string, { total: number; count: number }> = {};
    let grandTotal = 0;

    for (const expense of data || []) {
      if (!categoryMap[expense.category]) {
        categoryMap[expense.category] = { total: 0, count: 0 };
      }
      categoryMap[expense.category].total += Number(expense.amount);
      categoryMap[expense.category].count += 1;
      grandTotal += Number(expense.amount);
    }

    return Object.entries(categoryMap).map(([category, { total, count }]) => ({
      category,
      total,
      count,
      percentage: grandTotal > 0 ? Math.round((total / grandTotal) * 100) : 0,
    }));
  }

  async getTrends(userId: string, from?: string, to?: string) {
    const client = this.supabase.getClient();
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    const { data, error } = await client
      .from('expenses')
      .select('date, amount')
      .eq('user_id', userId)
      .eq('type', 'expense')
      .gte('date', from || thirtyDaysAgo)
      .lte('date', to || today)
      .order('date', { ascending: true });

    if (error) throw new Error(error.message);

    const dateMap: Record<string, number> = {};
    for (const expense of data || []) {
      dateMap[expense.date] = (dateMap[expense.date] || 0) + Number(expense.amount);
    }

    return Object.entries(dateMap).map(([date, amount]) => ({ date, amount }));
  }
}
