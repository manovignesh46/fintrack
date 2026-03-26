import { useEffect, useState } from 'react';
import { accountsApi, categoriesApi } from '../api/client';
import type { Account, Category, EntityType, TxNature } from '../api/types';
import { ENTITIES, NATURES, PAYMENT_METHODS } from '../api/types';

export interface TransactionFormData {
  title: string;
  amount: string;
  nature: TxNature;
  source_account_id: string;
  target_account_id: string;
  sub_category_id: string;
  entity: EntityType;
  payment_method: string;
  notes: string;
  principal_amount: string;
  interest_amount: string;
  transaction_date: string;
}

const emptyForm = (): TransactionFormData => ({
  title: '',
  amount: '',
  nature: 'EXPENSE',
  source_account_id: '',
  target_account_id: '',
  sub_category_id: '',
  entity: 'PERSONAL',
  payment_method: '',
  notes: '',
  principal_amount: '0',
  interest_amount: '0',
  transaction_date: new Date().toISOString().split('T')[0],
});

interface Props {
  initial?: TransactionFormData;
  onSubmit: (data: TransactionFormData) => Promise<void>;
  submitLabel: string;
}

export { emptyForm };

export default function TransactionForm({ initial, onSubmit, submitLabel }: Props) {
  const [form, setForm] = useState<TransactionFormData>(initial ?? emptyForm());
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    accountsApi.list().then(setAccounts).catch(() => {});
  }, []);

  useEffect(() => {
    categoriesApi.list(form.entity).then(setCategories).catch(() => {});
    // Reset category and sub-category when entity changes
    setSelectedCategoryId('');
    setForm((f) => ({ ...f, sub_category_id: '' }));
  }, [form.entity]);

  // Initialize selected category from initial sub_category_id
  useEffect(() => {
    if (form.sub_category_id && categories.length > 0) {
      const category = categories.find((c) =>
        c.sub_categories?.some((sc) => sc.id === parseInt(form.sub_category_id))
      );
      if (category) {
        setSelectedCategoryId(category.id.toString());
      }
    }
  }, [categories, form.sub_category_id]);

  // Auto-calc amount for EMI
  useEffect(() => {
    if (form.nature === 'EMI_PAYMENT') {
      const p = parseFloat(form.principal_amount) || 0;
      const i = parseFloat(form.interest_amount) || 0;
      setForm((f) => ({ ...f, amount: (p + i).toString() }));
    }
  }, [form.principal_amount, form.interest_amount, form.nature]);

  // Clear irrelevant fields when nature changes
  useEffect(() => {
    if (form.nature === 'TRANSFER' || form.nature === 'EMI_PAYMENT') {
      // Clear category/sub-category for TRANSFER and EMI_PAYMENT
      setSelectedCategoryId('');
      setForm((f) => ({ ...f, sub_category_id: '' }));
    }
    if (form.nature === 'INCOME' || form.nature === 'TRANSFER') {
      // Clear payment method for INCOME and TRANSFER
      setForm((f) => ({ ...f, payment_method: '' }));
    }
  }, [form.nature]);

  const set = (field: keyof TransactionFormData, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await onSubmit(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setSubmitting(false);
    }
  };

  const assetAccounts = accounts.filter((a) => a.type === 'ASSET' && a.is_active);
  const liabilityAccounts = accounts.filter((a) => a.type === 'LIABILITY' && a.is_active);
  const needsTarget = form.nature === 'TRANSFER' || form.nature === 'EMI_PAYMENT';

  // Find selected category and its sub-categories
  const selectedCategory = categories.find((c) => c.id.toString() === selectedCategoryId);
  const availableSubCategories = selectedCategory?.sub_categories ?? [];

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    // Reset sub-category when category changes
    set('sub_category_id', '');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-600 text-sm bg-red-50 p-2 rounded">{error}</p>}

      {/* Entity selector */}
      <div>
        <label className="text-xs text-gray-500 mb-1 block">Entity *</label>
        <div className="flex gap-2">
          {ENTITIES.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => set('entity', e)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                form.entity === e ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-600'
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      {/* Nature selector */}
      <div>
        <label className="text-xs text-gray-500 mb-1 block">Transaction Type *</label>
        <div className="grid grid-cols-4 gap-1">
          {NATURES.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => set('nature', n)}
              className={`py-2 rounded-lg text-xs font-medium ${
                form.nature === n ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-600'
              }`}
            >
              {n === 'EMI_PAYMENT' ? 'EMI' : n}
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="text-xs text-gray-500 mb-1 block">Title *</label>
        <input
          type="text"
          placeholder="e.g. Groceries, Salary"
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          required
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
      </div>

      {/* Amount (hidden for EMI_PAYMENT since it's auto-calculated) */}
      {form.nature !== 'EMI_PAYMENT' && (
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Amount (₹) *</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            placeholder="e.g. 1500.00"
            value={form.amount}
            onChange={(e) => set('amount', e.target.value)}
            required
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
      )}

      {/* EMI split: principal + interest */}
      {form.nature === 'EMI_PAYMENT' && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Principal (₹)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.principal_amount}
              onChange={(e) => set('principal_amount', e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Interest (₹)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.interest_amount}
              onChange={(e) => set('interest_amount', e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <p className="col-span-2 text-xs text-gray-500">
            Total: ₹{(parseFloat(form.principal_amount || '0') + parseFloat(form.interest_amount || '0')).toLocaleString('en-IN')}
          </p>
        </div>
      )}

      {/* Source Account */}
      <div>
        <label className="text-xs text-gray-500 mb-1 block">Source Account *</label>
        <select
          value={form.source_account_id}
          onChange={(e) => set('source_account_id', e.target.value)}
          required
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
        >
          <option value="">Select source account</option>
          {assetAccounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} (₹{a.current_balance.toLocaleString('en-IN')})
            </option>
          ))}
        </select>
      </div>

      {/* Target Account (for Transfer/EMI) */}
      {needsTarget && (
        <div>
          <label className="text-xs text-gray-500 mb-1 block">
            {form.nature === 'EMI_PAYMENT' ? 'Loan Account *' : 'Target Account *'}
          </label>
          <select
            value={form.target_account_id}
            onChange={(e) => set('target_account_id', e.target.value)}
            required
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
          >
            <option value="">
              {form.nature === 'EMI_PAYMENT' ? 'Select loan account' : 'Select target account'}
            </option>
            {(form.nature === 'EMI_PAYMENT' ? liabilityAccounts : assetAccounts).map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} (₹{a.current_balance.toLocaleString('en-IN')})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Category / Sub-category - Only for INCOME and EXPENSE */}
      {(form.nature === 'INCOME' || form.nature === 'EXPENSE') && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Category</label>
            <select
              value={selectedCategoryId}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Sub-category</label>
            <select
              value={form.sub_category_id}
              onChange={(e) => set('sub_category_id', e.target.value)}
              disabled={!selectedCategoryId}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">
                {selectedCategoryId ? 'Select sub-category' : 'Choose category first'}
              </option>
              {availableSubCategories.map((sc) => (
                <option key={sc.id} value={sc.id}>
                  {sc.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Payment method - Only for EXPENSE and EMI_PAYMENT */}
      {(form.nature === 'EXPENSE' || form.nature === 'EMI_PAYMENT') && (
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Payment Method</label>
          <select
            value={form.payment_method}
            onChange={(e) => set('payment_method', e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
          >
            <option value="">No payment method</option>
            {PAYMENT_METHODS.map((pm) => (
              <option key={pm} value={pm}>
                {pm}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Date */}
      <div>
        <label className="text-xs text-gray-500 mb-1 block">Transaction Date *</label>
        <input
          type="date"
          value={form.transaction_date}
          onChange={(e) => set('transaction_date', e.target.value)}
          max={new Date().toISOString().split('T')[0]}
          required
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
      </div>

      {/* Notes */}
      <div>
        <label className="text-xs text-gray-500 mb-1 block">Notes</label>
        <textarea
          placeholder="Additional notes (optional)"
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          rows={2}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50"
      >
        {submitting ? 'Saving...' : submitLabel}
      </button>
    </form>
  );
}
