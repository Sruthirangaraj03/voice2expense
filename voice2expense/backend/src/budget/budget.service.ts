import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../common/supabase/supabase.service';
import { CreateBudgetDto } from './dto/budget.dto';

@Injectable()
export class BudgetService {
  constructor(private supabase: SupabaseService) {}

  async create(userId: string, dto: CreateBudgetDto) {
    const client = this.supabase.getClient();
    const { data, error } = await client
      .from('budgets')
      .upsert(
        { ...dto, user_id: userId },
        { onConflict: 'user_id,category,month' },
      )
      .select()
      .single();

    if (error) throw new Error(error.message);
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

    if (error) throw new Error(error.message);
    return data;
  }

  async getStatus(userId: string, month?: string) {
    const client = this.supabase.getClient();
    const targetMonth = month || new Date().toISOString().slice(0, 7) + '-01';

    const { data, error } = await client
      .from('budget_status')
      .select('*')
      .eq('user_id', userId)
      .eq('month', targetMonth);

    if (error) throw new Error(error.message);
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
