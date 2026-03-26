import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { transactionsApi } from '../api/client';
import type { Transaction, EntityType, TxNature } from '../api/types';
import { ENTITIES } from '../api/types';

const natureColors: Record<TxNature, string> = {
  INCOME: 'text-green-600',
  EXPENSE: 'text-red-600',
  TRANSFER: 'text-blue-600',
  EMI_PAYMENT: 'text-orange-600',
  LOAN_DISBURSEMENT: 'text-purple-600',
};

const natureLabels: Record<TxNature, string> = {
  INCOME: 'Income',
  EXPENSE: 'Expense',
  TRANSFER: 'Transfer',
  EMI_PAYMENT: 'EMI Payment',
  LOAN_DISBURSEMENT: 'Loan Disbursement',
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [entity, setEntity] = useState<EntityType | ''>('');
  const [month, setMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (entity) params.entity = entity;
      
      // Calculate date range for the selected month
      const [year, monthNum] = month.split('-').map(Number);
      const from = `${year}-${monthNum.toString().padStart(2, '0')}-01`;
      const lastDay = new Date(year, monthNum, 0).getDate();
      const to = `${year}-${monthNum.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;
      
      params.date_from = from;
      params.date_to = to;
      
      const data = await transactionsApi.list(params);
      setTransactions(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [entity, month]);

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this transaction?')) return;
    try {
      await transactionsApi.delete(id);
      load();
    } catch {
      alert('Failed to delete');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header and Month filter */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Transactions</h2>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      {/* Entity filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setEntity('')}
          className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${
            entity === '' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-600'
          }`}
        >
          All Entities
        </button>
        {ENTITIES.map((e) => (
          <button
            key={e}
            onClick={() => setEntity(e)}
            className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${
              entity === e ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-600'
            }`}
          >
            {e}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-400 text-center py-8">Loading...</p>
      ) : transactions.length === 0 ? (
        <p className="text-gray-400 text-center py-8">No transactions yet</p>
      ) : (
        <div className="space-y-2">
          {transactions.map((t) => (
            <div
              key={t.id}
              className="bg-white rounded-lg border border-gray-200 p-3"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">{t.title}</p>
                  <p className="text-xs text-gray-500">
                    {t.transaction_date} · {natureLabels[t.nature]} · {t.entity}
                    {t.payment_method && ` · ${t.payment_method}`}
                  </p>
                  {t.nature === 'EMI_PAYMENT' && (
                    <p className="text-xs text-gray-500">
                      P: ₹{t.principal_amount.toLocaleString('en-IN')} + I: ₹{t.interest_amount.toLocaleString('en-IN')}
                    </p>
                  )}
                  {t.notes && <p className="text-xs text-gray-400 mt-1">{t.notes}</p>}
                </div>
                <div className="text-right ml-3">
                  <p className={`font-semibold ${natureColors[t.nature]}`}>
                    {t.nature === 'INCOME' ? '+' : '-'}₹{t.amount.toLocaleString('en-IN')}
                  </p>
                  <div className="flex gap-1 mt-1 justify-end">
                    <button
                      onClick={() => navigate(`/edit/${t.id}`)}
                      className="text-xs text-blue-500 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Del
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => navigate('/add')}
        className="fixed bottom-24 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center text-3xl hover:bg-blue-700 transition-colors z-20"
        aria-label="Add Transaction"
      >
        +
      </button>
    </div>
  );
}
