import type {
  Account,
  Category,
  Transaction,
  TransactionTemplate,
  TallyResponse,
  SummaryResponse,
} from './types';

// Use environment variable for API URL in production, or /api in development (Vite proxy)
const BASE = import.meta.env.VITE_API_BASE_URL || '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(BASE + url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// --- Accounts ---
export const accountsApi = {
  list: () => request<Account[]>('/accounts'),
  get: (id: number, params?: { date_before?: string; date_to?: string }) => {
    let url = `/accounts/${id}`;
    if (params) {
      const search = new URLSearchParams();
      if (params.date_before) search.set('date_before', params.date_before);
      if (params.date_to) search.set('date_to', params.date_to);
      const qs = search.toString();
      if (qs) url += `?${qs}`;
    }
    return request<Account>(url);
  },
  create: (data: { name: string; type: string; initial_balance: number }) =>
    request<Account>('/accounts', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: { name?: string; is_active?: boolean }) =>
    request<Account>(`/accounts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
};

// --- Categories ---
export const categoriesApi = {
  list: (params?: { entity?: string; nature?: string }) => {
    const search = new URLSearchParams();
    if (params?.entity) search.set('entity', params.entity);
    if (params?.nature) search.set('nature', params.nature);
    const qs = search.toString();
    return request<Category[]>(`/categories${qs ? `?${qs}` : ''}`);
  },
  create: (data: { name: string; entity: string; nature: string }) =>
    request<Category>('/categories', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: { name: string }) =>
    request<Category>(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) =>
    request<void>(`/categories/${id}`, { method: 'DELETE' }),
  createSub: (categoryId: number, data: { name: string }) =>
    request<Category>(`/categories/${categoryId}/subcategories`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateSub: (categoryId: number, subId: number, data: { name: string }) =>
    request<Category>(`/categories/${categoryId}/subcategories/${subId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteSub: (categoryId: number, subId: number) =>
    request<void>(`/categories/${categoryId}/subcategories/${subId}`, {
      method: 'DELETE',
    }),
};

// --- Transactions ---
export const transactionsApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<Transaction[]>(`/transactions${qs}`);
  },
  get: (id: number) => request<Transaction>(`/transactions/${id}`),
  create: (data: Omit<Transaction, 'id' | 'created_at'>) =>
    request<Transaction>('/transactions', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Omit<Transaction, 'id' | 'created_at'>) =>
    request<Transaction>(`/transactions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) =>
    request<void>(`/transactions/${id}`, { method: 'DELETE' }),
};

// --- Templates ---
export const templatesApi = {
  list: () => request<TransactionTemplate[]>('/templates'),
  create: (data: Omit<TransactionTemplate, 'id' | 'created_at'>) =>
    request<TransactionTemplate>('/templates', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id: number) =>
    request<void>(`/templates/${id}`, { method: 'DELETE' }),
  execute: (id: number) =>
    request<Transaction>(`/templates/${id}/execute`, { method: 'POST' }),
};

// --- Tally ---
export const tallyApi = {
  get: (accountId: number) => request<TallyResponse>(`/tally/${accountId}`),
  check: (accountId: number, actualBalance: number) =>
    request<TallyResponse>(`/tally/${accountId}`, {
      method: 'POST',
      body: JSON.stringify({ actual_balance: actualBalance }),
    }),
};

// --- Summary ---
export const summaryApi = {
  get: (month: string) => request<SummaryResponse>(`/summary?month=${month}`),
};
