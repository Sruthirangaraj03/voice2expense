export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  currency: string;
  created_at: string;
}

export interface Expense {
  id: string;
  user_id: string;
  amount: number;
  category: string;
  type: 'expense' | 'income';
  description?: string;
  source: 'manual' | 'voice';
  date: string;
  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category: string;
  month: string;
  limit_amount: number;
  created_at: string;
}

export interface BudgetStatus extends Budget {
  used_amount: number;
  remaining: number;
  status: 'on_track' | 'warning' | 'exceeded';
}

export interface Prediction {
  id: string;
  user_id: string;
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
  type: 'expense' | 'income';
  date: string;
  description: string;
}

export interface VoiceLogResponse {
  transcription: string;
  parsed: ParsedExpense;
  expense_id: string;
  confidence: number;
}

export interface AIQueryResponse {
  answer: string;
  data?: Record<string, unknown>;
}

export interface AnalyticsSummary {
  total_spent: number;
  total_income: number;
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

export type ExpenseCategory =
  | 'food'
  | 'transport'
  | 'entertainment'
  | 'shopping'
  | 'bills'
  | 'health'
  | 'education'
  | 'other';
