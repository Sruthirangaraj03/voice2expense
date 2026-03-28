import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../common/supabase/supabase.service';
import { CreateExpenseDto, UpdateExpenseDto, QueryExpensesDto } from './dto/expense.dto';

@Injectable()
export class ExpenseService {
  constructor(private supabase: SupabaseService) {}

  async create(userId: string, dto: CreateExpenseDto) {
    const client = this.supabase.getClient();
    const { data, error } = await client
      .from('expenses')
      .insert({ ...dto, user_id: userId })
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Check budget remaining for this category
    let budget_alert: { category: string; remaining: number; limit: number; period_type: string } | null = null;
    try {
      const { data: budgets } = await client
        .from('budget_status')
        .select('*')
        .eq('user_id', userId)
        .eq('category', dto.category)
        .eq('is_active', true);

      if (budgets && budgets.length > 0) {
        const b = budgets[0];
        const remaining = Number(b.limit_amount) - Number(b.used_amount);
        budget_alert = {
          category: dto.category,
          remaining: Math.max(0, Math.round(remaining)),
          limit: Number(b.limit_amount),
          period_type: String(b.period_type),
        };
      }
    } catch {
      // silently skip budget check
    }

    return { ...data, budget_alert };
  }

  async findAll(userId: string, query: QueryExpensesDto) {
    const client = this.supabase.getClient();
    const { page = 1, limit: rawLimit = 20, category, from, to, sort = 'date:desc' } = query;
    const limit = Math.min(rawLimit, 100);

    let qb = client
      .from('expenses')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    if (category) qb = qb.eq('category', category);
    if (from) qb = qb.gte('date', from);
    if (to) qb = qb.lte('date', to);

    const [field, order] = sort.split(':');
    qb = qb.order(field, { ascending: order === 'asc' });
    qb = qb.range((page - 1) * limit, page * limit - 1);

    const { data, error, count } = await qb;
    if (error) throw new Error(error.message);

    return {
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    };
  }

  async findOne(userId: string, id: string) {
    const client = this.supabase.getClient();
    const { data, error } = await client
      .from('expenses')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !data) throw new NotFoundException('Expense not found');
    return data;
  }

  async update(userId: string, id: string, dto: UpdateExpenseDto) {
    const client = this.supabase.getClient();
    const { data, error } = await client
      .from('expenses')
      .update({ ...dto, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error || !data) throw new NotFoundException('Expense not found');
    return data;
  }

  async remove(userId: string, id: string) {
    const client = this.supabase.getClient();
    const { data, error } = await client
      .from('expenses')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error || !data) throw new NotFoundException('Expense not found');
    return { deleted: true };
  }
}
