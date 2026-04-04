export type AccountType = 'ASSET' | 'LIABILITY';
export type EntityType = 'PERSONAL' | 'HOME' | 'LOAN';
export type TxNature = 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'EMI_PAYMENT' | 'LOAN_DISBURSEMENT';

export interface User {
  id: number;
  username: string;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Account {
  id: number;
  user_id: number;
  name: string;
  type: AccountType;
  initial_balance: number;
  current_balance: number;
  interest_rate: number;
  is_active: boolean;
  created_at: string;
}

export interface Category {
  id: number;
  user_id: number;
  name: string;
  entity: EntityType;
  nature: TxNature;
  created_at: string;
  sub_categories?: SubCategory[];
}

export interface SubCategory {
  id: number;
  category_id: number;
  user_id: number;
  name: string;
  created_at: string;
}

export interface Transaction {
  id: number;
  user_id: number;
  title: string;
  amount: number;
  nature: TxNature;
  source_account_id: number;
  target_account_id?: number;
  sub_category_id?: number;
  entity: EntityType;
  payment_method?: string;
  notes?: string;
  principal_amount: number;
  interest_amount: number;
  transaction_date: string;
  created_at: string;
}

export interface TransactionTemplate {
  id: number;
  user_id: number;
  title: string;
  amount: number;
  nature: TxNature;
  source_account_id: number;
  target_account_id?: number;
  sub_category_id?: number;
  entity: EntityType;
  payment_method?: string;
  principal_amount: number;
  interest_amount: number;
  created_at: string;
}

export interface TallyResponse {
  account_id: number;
  account_name: string;
  calculated_balance: number;
  actual_balance: number;
  difference: number;
}

export interface EntitySummary {
  entity: EntityType;
  total_income: number;
  total_expense: number;
  total_emi: number;
  net_flow: number;
}

export interface SummaryResponse {
  month: string;
  entities: EntitySummary[];
}

export interface LoginReq {
  username?: string;
  password?: string;
}

export interface RegisterReq {
  username?: string;
  password?: string;
}

export const PAYMENT_METHODS = [
  'GPay',
  'Amazon Pay',
  'HDFC UPI',
  'Bank Transfer',
  'Cash',
] as const;

export const ENTITIES: EntityType[] = ['PERSONAL', 'HOME', 'LOAN'];
export const NATURES: TxNature[] = ['INCOME', 'EXPENSE', 'EMI_PAYMENT', 'LOAN_DISBURSEMENT'];
