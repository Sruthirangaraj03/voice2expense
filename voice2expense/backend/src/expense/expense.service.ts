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
    return data;
  }

  async findAll(userId: string, query: QueryExpensesDto) {
    const client = this.supabase.getClient();
    const { page = 1, limit = 20, category, from, to, sort = 'date:desc' } = query;

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
