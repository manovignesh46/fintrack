import { useEffect, useState } from 'react';
import { templatesApi } from '../api/client';
import type { TransactionTemplate } from '../api/types';

const natureLabels: Record<string, string> = {
  INCOME: 'Income', EXPENSE: 'Expense', TRANSFER: 'Transfer', EMI_PAYMENT: 'EMI',
};

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<TransactionTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    templatesApi.list().then(setTemplates).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleExecute = async (id: number) => {
    setExecuting(id);
    try {
      await templatesApi.execute(id);
      alert('Transaction created successfully!');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed');
    } finally {
      setExecuting(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this template?')) return;
    try {
      await templatesApi.delete(id);
      load();
    } catch { alert('Failed'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800">Templates</h2>
        <p className="text-xs text-gray-400">Add via transaction form</p>
      </div>

      {loading ? (
        <p className="text-gray-400 text-center py-8">Loading...</p>
      ) : templates.length === 0 ? (
        <p className="text-gray-400 text-center py-8">
          No templates yet. Save a transaction as a template from the Add Transaction page.
        </p>
      ) : (
        <div className="space-y-2">
          {templates.map((t) => (
            <div key={t.id} className="bg-white rounded-lg border border-gray-200 p-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-gray-800 text-sm">{t.title}</p>
                  <p className="text-xs text-gray-500">
                    {natureLabels[t.nature]} · {t.entity} · ₹{t.amount.toLocaleString('en-IN')}
                    {t.payment_method && ` · ${t.payment_method}`}
                  </p>
                </div>
                <div className="flex gap-2 ml-3">
                  <button
                    onClick={() => handleExecute(t.id)}
                    disabled={executing === t.id}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-medium disabled:opacity-50"
                  >
                    {executing === t.id ? '...' : 'Use'}
                  </button>
                  <button
                    onClick={() => handleDelete(t.id)}
                    className="px-3 py-1.5 bg-red-100 text-red-600 rounded text-xs font-medium"
                  >
                    Del
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
