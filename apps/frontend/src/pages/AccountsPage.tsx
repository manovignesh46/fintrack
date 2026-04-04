import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { accountsApi } from '../api/client';
import type { Account } from '../api/types';

export default function AccountsPage() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<'ASSET' | 'LIABILITY'>('ASSET');
  const [newBalance, setNewBalance] = useState('0');
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    accountsApi.list()
      .then((data) => setAccounts(data || []))
      .catch(() => setAccounts([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const assets = accounts.filter((a) => a.type === 'ASSET');
  const liabilities = accounts.filter((a) => a.type === 'LIABILITY');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await accountsApi.create({ name: newName, type: newType, initial_balance: parseFloat(newBalance) });
      setNewName(''); setNewBalance('0'); setShowAdd(false);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (a: Account) => {
    try {
      await accountsApi.update(a.id, { is_active: !a.is_active });
      load();
    } catch {
      alert('Failed to update');
    }
  };

  const handleDelete = async (a: Account) => {
    if (!window.confirm(`Delete "${a.name}"? This cannot be undone.`)) return;
    try {
      await accountsApi.delete(a.id);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const handleAccountClick = (account: Account) => {
    navigate(`/accounts/${account.id}`);
  };

  if (loading) return <p className="text-gray-400 text-center py-8">Loading...</p>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800">Accounts</h2>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="text-sm text-blue-600 font-medium"
        >
          {showAdd ? 'Cancel' : '+ Add'}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-white border border-gray-200 rounded-lg p-3 space-y-2">
          <input
            type="text" placeholder="Account name" value={newName}
            onChange={(e) => setNewName(e.target.value)} required
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm outline-none"
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as 'ASSET' | 'LIABILITY')}
              className="px-3 py-2 border border-gray-300 rounded text-sm bg-white outline-none"
            >
              <option value="ASSET">Asset</option>
              <option value="LIABILITY">Liability</option>
            </select>
            <input
              type="number" step="0.01" placeholder="Opening balance" value={newBalance}
              onChange={(e) => setNewBalance(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded text-sm outline-none"
            />
          </div>
          <button
            type="submit" disabled={saving}
            className="w-full py-2 bg-blue-600 text-white rounded text-sm font-medium disabled:opacity-50"
          >
            {saving ? 'Adding...' : 'Add Account'}
          </button>
        </form>
      )}

      {/* Asset Accounts */}
      <section>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Asset Accounts</h3>
        <div className="space-y-2">
          {assets.map((a) => (
            <AccountCard 
              key={a.id} 
              account={a} 
              onToggle={handleToggle} 
              onDelete={handleDelete}
              onClick={handleAccountClick}
            />
          ))}
        </div>
      </section>

      {/* Loan Accounts */}
      <section>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Loan Accounts</h3>
        <div className="space-y-2">
          {liabilities.map((a) => (
            <AccountCard 
              key={a.id} 
              account={a} 
              onToggle={handleToggle} 
              onDelete={handleDelete}
              onClick={handleAccountClick}
              colorClass="text-orange-600" 
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function AccountCard({
  account,
  onToggle,
  onDelete,
  onClick,
  colorClass = 'text-green-600',
}: {
  account: Account;
  onToggle: (a: Account) => void;
  onDelete: (a: Account) => void;
  onClick: (a: Account) => void;
  colorClass?: string;
}) {
  return (
    <div 
      className={`bg-white rounded-lg border border-gray-200 p-3 cursor-pointer hover:border-blue-300 transition-colors ${!account.is_active ? 'opacity-50' : ''}`}
      onClick={() => onClick(account)}
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <p className="font-medium text-gray-800 text-sm">{account.name}</p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(account);
            }}
            className="text-gray-300 hover:text-red-500 transition-colors p-1"
            title="Delete Account"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
        <p className={`font-semibold ${colorClass}`}>
          ₹{account.current_balance.toLocaleString('en-IN')}
        </p>
      </div>
      <div className="flex justify-between items-center mt-2">
        <p className="text-xs text-gray-400">
          Opening: ₹{account.initial_balance.toLocaleString('en-IN')}
        </p>
        <label 
          className="flex items-center gap-2 cursor-pointer"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="text-xs text-gray-500">
            {account.is_active ? 'Active' : 'Inactive'}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle(account);
            }}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              account.is_active ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                account.is_active ? 'translate-x-5' : 'translate-x-1'
              }`}
            />
          </button>
        </label>
      </div>
    </div>
  );
}
