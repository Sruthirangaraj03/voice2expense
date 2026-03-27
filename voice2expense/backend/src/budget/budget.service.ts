import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../common/supabase/supabase.service';
import { CreateBudgetDto } from './dto/budget.dto';

@Injectable()
export class BudgetService {
  constructor(private supabase: SupabaseService) {}

  private computePeriod(periodType: string): { period_start: string; period_end: string; month: string } {
    const now = new Date();

    if (periodType === 'weekly') {
      // Week starts Monday, ends Sunday
      const day = now.getDay(); // 0=Sun, 1=Mon...
      const diffToMonday = day === 0 ? -6 : 1 - day;
      const monday = new Date(now);
      monday.setDate(now.getDate() + diffToMonday);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      return {
        period_start: monday.toISOString().split('T')[0],
        period_end: sunday.toISOString().split('T')[0],
        month: `${now.toISOString().slice(0, 7)}-01`,
      };
    }

    // monthly
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      period_start: monthStart.toISOString().split('T')[0],
      period_end: monthEnd.toISOString().split('T')[0],
      month: monthStart.toISOString().split('T')[0],
    };
  }

  async create(userId: string, dto: CreateBudgetDto) {
    const client = this.supabase.getClient();
    const period = this.computePeriod(dto.period_type);

    // Check if an active budget already exists for this category + period
    const { data: existing } = await client
      .from('budgets')
      .select('id')
      .eq('user_id', userId)
      .eq('category', dto.category)
      .eq('period_type', dto.period_type)
      .eq('period_start', period.period_start)
      .maybeSingle();

    if (existing) {
      // Update existing budget
      const { data, error } = await client
        .from('budgets')
        .update({ limit_amount: dto.limit_amount, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw new BadRequestException(error.message);
      return data;
    }

    const { data, error } = await client
      .from('budgets')
      .insert({
        user_id: userId,
        category: dto.category,
        period_type: dto.period_type,
        limit_amount: dto.limit_amount,
        month: period.month,
        period_start: period.period_start,
        period_end: period.period_end,
      })
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async findAll(userId: string, month?: string) {
    const client = this.supabase.getClient();
    const targetMonth = month || new Date().toISOString().slice(0, 7) + '-01';

    const { data, error } = await client
      .from('budgets')
      .select('*')
      .eq('user_id', userId)
      .eq('month', targetMonth);

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async getStatus(userId: string, month?: string) {
    const client = this.supabase.getClient();

    // Return only active budgets (current period)
    let qb = client
      .from('budget_status')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (month) {
      qb = qb.eq('month', month);
    }

    const { data, error } = await qb;
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async getHistory(userId: string) {
    const client = this.supabase.getClient();
    const { data, error } = await client
      .from('budget_status')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', false)
      .order('period_end', { ascending: false })
      .limit(20);

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async remove(userId: string, id: string) {
    const client = this.supabase.getClient();
    const { data, error } = await client
      .from('budgets')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error || !data) throw new NotFoundException('Budget not found');
    return { deleted: true };
  }
}
