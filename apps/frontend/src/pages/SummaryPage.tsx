import { useEffect, useState } from 'react';
import { summaryApi } from '../api/client';
import type { SummaryResponse } from '../api/types';

export default function SummaryPage() {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [data, setData] = useState<SummaryResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await summaryApi.get(month);
        setData(res);
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [month]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800">Monthly Summary</h2>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      {loading ? (
        <p className="text-gray-400 text-center py-8">Loading...</p>
      ) : !data || data.entities.length === 0 ? (
        <p className="text-gray-400 text-center py-8">No transactions for {month}</p>
      ) : (
        <div className="space-y-3">
          {data.entities.map((e) => (
            <div key={e.entity} className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-800 mb-3">{e.entity}</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <Row label="Income" value={e.total_income} color="text-green-600" />
                <Row label="Expense" value={e.total_expense} color="text-red-600" />
                {e.total_emi > 0 && <Row label="EMI Payments" value={e.total_emi} color="text-orange-600" />}
                <div className="col-span-2 border-t border-gray-100 pt-2 mt-1">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">Net Flow</span>
                    <span className={`font-semibold ${e.net_flow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {e.net_flow >= 0 ? '+' : ''}₹{e.net_flow.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Row({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className={`font-medium ${color}`}>₹{value.toLocaleString('en-IN')}</span>
    </div>
  );
}
