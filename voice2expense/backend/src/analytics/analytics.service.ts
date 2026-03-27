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

  async getFuturistic(userId: string) {
    const client = this.supabase.getClient();
    const now = new Date();
    const todayDate = now.toISOString().split('T')[0];

    // Compute current week (Mon-Sun) and month boundaries
    const day = now.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() + diffToMonday);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    const weekStartStr = weekStart.toISOString().split('T')[0];
    const weekEndStr = weekEnd.toISOString().split('T')[0];

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const monthStartStr = monthStart.toISOString().split('T')[0];
    const monthEndStr = monthEnd.toISOString().split('T')[0];

    // Days elapsed and remaining
    const daysIntoWeek = Math.max(1, Math.floor((now.getTime() - weekStart.getTime()) / 86400000) + 1);
    const daysLeftWeek = 7 - daysIntoWeek;
    const daysIntoMonth = now.getDate();
    const totalDaysMonth = monthEnd.getDate();
    const daysLeftMonth = totalDaysMonth - daysIntoMonth;

    // Fetch all expenses for current month
    const { data: monthExpenses } = await client
      .from('expenses')
      .select('amount, category, date, sub_type, description')
      .eq('user_id', userId)
      .eq('type', 'expense')
      .gte('date', monthStartStr)
      .lte('date', todayDate);

    const expenses = (monthExpenses || []).map((e) => ({
      amount: Number(e.amount),
      category: String(e.category),
      date: String(e.date).split('T')[0],
      sub_type: e.sub_type ? String(e.sub_type) : undefined,
      description: e.description ? String(e.description) : undefined,
    }));

    // Weekly expenses subset
    const weekExpenses = expenses.filter((e) => e.date >= weekStartStr && e.date <= todayDate);

    // Category-wise breakdown for month
    const catMonth: Record<string, { spent: number; count: number }> = {};
    for (const e of expenses) {
      if (!catMonth[e.category]) catMonth[e.category] = { spent: 0, count: 0 };
      catMonth[e.category].spent += e.amount;
      catMonth[e.category].count += 1;
    }

    // Category-wise breakdown for week
    const catWeek: Record<string, { spent: number; count: number }> = {};
    for (const e of weekExpenses) {
      if (!catWeek[e.category]) catWeek[e.category] = { spent: 0, count: 0 };
      catWeek[e.category].spent += e.amount;
      catWeek[e.category].count += 1;
    }

    // Fetch active budgets
    const { data: budgets } = await client
      .from('budget_status')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    const activeBudgets = (budgets || []).map((b) => ({
      category: String(b.category),
      period_type: String(b.period_type),
      limit_amount: Number(b.limit_amount),
      used_amount: Number(b.used_amount),
    }));

    // Overall predictions
    const monthlySpent = expenses.reduce((s, e) => s + e.amount, 0);
    const dailyRateMonth = daysIntoMonth > 0 ? monthlySpent / daysIntoMonth : 0;
    const projectedMonth = Math.round(dailyRateMonth * totalDaysMonth);

    const weeklySpent = weekExpenses.reduce((s, e) => s + e.amount, 0);
    const dailyRateWeek = daysIntoWeek > 0 ? weeklySpent / daysIntoWeek : 0;
    const projectedWeek = Math.round(dailyRateWeek * 7);

    // Per-category predictions
    const allCategories = new Set([
      ...Object.keys(catMonth),
      ...Object.keys(catWeek),
      ...activeBudgets.map((b) => b.category),
    ]);

    const categoryPredictions = Array.from(allCategories).map((cat) => {
      const monthData = catMonth[cat] || { spent: 0, count: 0 };
      const weekData = catWeek[cat] || { spent: 0, count: 0 };
      const monthBudget = activeBudgets.find((b) => b.category === cat && b.period_type === 'monthly');
      const weekBudget = activeBudgets.find((b) => b.category === cat && b.period_type === 'weekly');

      const catDailyRate = daysIntoMonth > 0 ? monthData.spent / daysIntoMonth : 0;
      const catProjectedMonth = Math.round(catDailyRate * totalDaysMonth);

      const catWeekDailyRate = daysIntoWeek > 0 ? weekData.spent / daysIntoWeek : 0;
      const catProjectedWeek = Math.round(catWeekDailyRate * 7);

      let monthStatus: 'on_track' | 'warning' | 'will_exceed' = 'on_track';
      let weekStatus: 'on_track' | 'warning' | 'will_exceed' = 'on_track';
      let monthInsight = '';
      let weekInsight = '';

      if (monthBudget) {
        const pct = catProjectedMonth / monthBudget.limit_amount;
        if (pct > 1) {
          monthStatus = 'will_exceed';
          monthInsight = `May exceed monthly budget by Rs.${Math.round(catProjectedMonth - monthBudget.limit_amount).toLocaleString('en-IN')}`;
        } else if (pct > 0.8) {
          monthStatus = 'warning';
          monthInsight = `Approaching monthly limit (${Math.round(pct * 100)}% projected)`;
        } else {
          monthInsight = `On track (${Math.round(pct * 100)}% of budget projected)`;
        }
      }

      if (weekBudget) {
        const pct = catProjectedWeek / weekBudget.limit_amount;
        if (pct > 1) {
          weekStatus = 'will_exceed';
          weekInsight = `May exceed weekly budget by Rs.${Math.round(catProjectedWeek - weekBudget.limit_amount).toLocaleString('en-IN')}`;
        } else if (pct > 0.8) {
          weekStatus = 'warning';
          weekInsight = `Approaching weekly limit (${Math.round(pct * 100)}% projected)`;
        } else {
          weekInsight = `On track (${Math.round(pct * 100)}% of budget projected)`;
        }
      }

      return {
        category: cat,
        monthly: {
          spent: monthData.spent,
          projected: catProjectedMonth,
          daily_rate: Math.round(catDailyRate),
          budget_limit: monthBudget?.limit_amount || null,
          status: monthBudget ? monthStatus : null,
          insight: monthInsight || null,
        },
        weekly: {
          spent: weekData.spent,
          projected: catProjectedWeek,
          daily_rate: Math.round(catWeekDailyRate),
          budget_limit: weekBudget?.limit_amount || null,
          status: weekBudget ? weekStatus : null,
          insight: weekInsight || null,
        },
      };
    });

    // Overall insights
    const insights: string[] = [];
    const totalMonthBudget = activeBudgets
      .filter((b) => b.period_type === 'monthly')
      .reduce((s, b) => s + b.limit_amount, 0);
    const totalWeekBudget = activeBudgets
      .filter((b) => b.period_type === 'weekly')
      .reduce((s, b) => s + b.limit_amount, 0);

    // Compute safe daily limits
    const weekRemaining = Math.max(0, totalWeekBudget - weeklySpent);
    const safeDailyWeek = daysLeftWeek > 0 ? Math.round(weekRemaining / daysLeftWeek) : 0;
    const monthRemaining = Math.max(0, totalMonthBudget - monthlySpent);
    const safeDailyMonth = daysLeftMonth > 0 ? Math.round(monthRemaining / daysLeftMonth) : 0;

    if (totalWeekBudget > 0) {
      if (projectedWeek > totalWeekBudget) {
        insights.push(`You spent Rs.${weeklySpent.toLocaleString('en-IN')} in ${daysIntoWeek} day${daysIntoWeek > 1 ? 's' : ''}. At Rs.${Math.round(dailyRateWeek).toLocaleString('en-IN')}/day, you'll hit Rs.${projectedWeek.toLocaleString('en-IN')} by end of week — Rs.${(projectedWeek - totalWeekBudget).toLocaleString('en-IN')} over your Rs.${totalWeekBudget.toLocaleString('en-IN')} budget.`);
        if (daysLeftWeek > 0) {
          insights.push(`To stay within budget, limit spending to Rs.${safeDailyWeek.toLocaleString('en-IN')}/day for the remaining ${daysLeftWeek} day${daysLeftWeek > 1 ? 's' : ''}.`);
        }
      } else {
        insights.push(`Weekly spending is on track. You can spend Rs.${safeDailyWeek.toLocaleString('en-IN')}/day for the next ${daysLeftWeek} day${daysLeftWeek > 1 ? 's' : ''}.`);
      }
    }

    if (totalMonthBudget > 0) {
      if (projectedMonth > totalMonthBudget) {
        insights.push(`Monthly trend: Rs.${monthlySpent.toLocaleString('en-IN')} spent in ${daysIntoMonth} days. Projected Rs.${projectedMonth.toLocaleString('en-IN')} — exceeds budget by Rs.${(projectedMonth - totalMonthBudget).toLocaleString('en-IN')}.`);
        if (daysLeftMonth > 0) {
          insights.push(`Reduce daily spending to Rs.${safeDailyMonth.toLocaleString('en-IN')}/day to stay within Rs.${totalMonthBudget.toLocaleString('en-IN')} budget.`);
        }
      } else {
        insights.push(`Monthly spending is within budget. Safe to spend Rs.${safeDailyMonth.toLocaleString('en-IN')}/day.`);
      }
    }

    // Category-specific warnings
    for (const cp of categoryPredictions) {
      const catName = cp.category.charAt(0).toUpperCase() + cp.category.slice(1);
      if (cp.weekly.status === 'will_exceed' && cp.weekly.budget_limit) {
        const over = cp.weekly.projected - cp.weekly.budget_limit;
        insights.push(`${catName} may exceed weekly budget by Rs.${over.toLocaleString('en-IN')}.`);
      }
      if (cp.monthly.status === 'will_exceed' && cp.monthly.budget_limit) {
        const over = cp.monthly.projected - cp.monthly.budget_limit;
        insights.push(`${catName} may exceed monthly budget by Rs.${over.toLocaleString('en-IN')}.`);
      }
    }

    if (insights.length === 0) {
      insights.push('Add expenses and set budgets to see spending predictions.');
    }

    return {
      today: todayDate,
      overall: {
        weekly: {
          spent: weeklySpent,
          projected: projectedWeek,
          daily_rate: Math.round(dailyRateWeek),
          days_elapsed: daysIntoWeek,
          days_remaining: daysLeftWeek,
          budget: totalWeekBudget || null,
          remaining_budget: totalWeekBudget > 0 ? weekRemaining : null,
          safe_daily_limit: totalWeekBudget > 0 ? safeDailyWeek : null,
          period: `${weekStartStr} to ${weekEndStr}`,
        },
        monthly: {
          spent: monthlySpent,
          projected: projectedMonth,
          daily_rate: Math.round(dailyRateMonth),
          days_elapsed: daysIntoMonth,
          days_remaining: daysLeftMonth,
          budget: totalMonthBudget || null,
          remaining_budget: totalMonthBudget > 0 ? monthRemaining : null,
          safe_daily_limit: totalMonthBudget > 0 ? safeDailyMonth : null,
          period: `${monthStartStr} to ${monthEndStr}`,
        },
      },
      categories: categoryPredictions,
      insights,
    };
  }
}
