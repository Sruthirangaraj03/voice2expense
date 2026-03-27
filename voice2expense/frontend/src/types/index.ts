export interface Expense {
  id: string;
  user_id?: string;
  amount: number;
  category: string;
  sub_type?: string;
  description?: string;
  source?: string;
  date: string;
  created_at?: string;
  updated_at?: string;
}

export interface BudgetStatus {
  id: string;
  user_id?: string;
  category: string;
  month: string;
  limit_amount: number;
  period_type: "weekly" | "monthly";
  period_start: string;
  period_end: string;
  used_amount: number;
  remaining: number;
  status: "on_track" | "warning" | "exceeded";
  is_active: boolean;
}

export interface AnalyticsSummary {
  total_spent: number;
  transaction_count: number;
  average_expense: number;
  voice_ratio: number;
}

export interface CategoryBreakdown {
  category: string;
  total: number;
  count: number;
  percentage: number;
}

export interface TrendPoint {
  date: string;
  amount: number;
}

export interface Prediction {
  id: string;
  forecast_month: string;
  category: string;
  predicted_amount: number;
  confidence_score: number;
  risk_flag: boolean;
  generated_at: string;
}

export interface ParsedExpense {
  amount: number;
  category: string;
  sub_type?: string;
  date: string;
  description: string;
}
