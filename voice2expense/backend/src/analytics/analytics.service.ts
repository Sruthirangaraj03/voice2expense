import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../common/supabase/supabase.service';

@Injectable()
export class AnalyticsService {
  constructor(private supabase: SupabaseService) {}

  async getSummary(userId: string, from?: string, to?: string) {
    const client = this.supabase.getClient();

    let qb = client
      .from('expenses')
      .select('amount, source')
      .eq('user_id', userId);

    if (from) qb = qb.gte('date', from);
    if (to) qb = qb.lte('date', to);

    const { data, error } = await qb;
    if (error) throw new Error(error.message);

    const records = data || [];
    const total_spent = records.reduce((sum, r) => sum + Number(r.amount), 0);
    const transaction_count = records.length;
    const average_expense = transaction_count > 0 ? total_spent / transaction_count : 0;
    const voice_count = records.filter((r) => r.source === 'voice').length;
    const voice_ratio = transaction_count > 0 ? voice_count / transaction_count : 0;

    return {
      total_spent,
      transaction_count,
      average_expense,
      voice_ratio,
    };
  }

  async getBreakdown(userId: string, from?: string, to?: string) {
    const client = this.supabase.getClient();

    let qb = client
      .from('expenses')
      .select('category, amount')
      .eq('user_id', userId);

    if (from) qb = qb.gte('date', from);
    if (to) qb = qb.lte('date', to);

    const { data, error } = await qb;
    if (error) throw new Error(error.message);

    const byCategory: Record<string, number> = {};
    for (const row of data || []) {
      byCategory[row.category] = (byCategory[row.category] || 0) + Number(row.amount);
    }

    return Object.entries(byCategory).map(([category, total]) => ({
      category,
      total,
    }));
  }

  async getTrends(userId: string, from?: string, to?: string) {
    const client = this.supabase.getClient();

    let qb = client
      .from('expenses')
      .select('date, amount')
      .eq('user_id', userId)
      .order('date', { ascending: true });

    if (from) qb = qb.gte('date', from);
    if (to) qb = qb.lte('date', to);

    const { data, error } = await qb;
    if (error) throw new Error(error.message);

    const byMonth: Record<string, number> = {};
    for (const row of data || []) {
      const month = row.date?.slice(0, 7) || 'unknown';
      byMonth[month] = (byMonth[month] || 0) + Number(row.amount);
    }

    return Object.entries(byMonth).map(([month, total]) => ({
      month,
      total,
    }));
  }
}
