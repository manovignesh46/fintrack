import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import TransactionsPage from './pages/TransactionsPage';
import AddTransactionPage from './pages/AddTransactionPage';
import AccountsPage from './pages/AccountsPage';
import AccountDetailsPage from './pages/AccountDetailsPage';
import CategoriesPage from './pages/CategoriesPage';
import CreateCategoryPage from './pages/CreateCategoryPage';
import CreateSubCategoryPage from './pages/CreateSubCategoryPage';
import SummaryPage from './pages/SummaryPage';
import TallyPage from './pages/TallyPage';
import TemplatesPage from './pages/TemplatesPage';
import CreateTemplatePage from './pages/CreateTemplatePage';
import EditTransactionPage from './pages/EditTransactionPage';

const navItems = [
  { to: '/', label: 'Transactions', icon: '📋' },
  { to: '/templates', label: 'Templates', icon: '📝' },
  { to: '/accounts', label: 'Accounts', icon: '🏦' },
  { to: '/summary', label: 'Summary', icon: '📊' },
  { to: '/more', label: 'More', icon: '⋯' },
];

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 pb-20">
        <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
          <h1 className="text-lg font-bold text-gray-800">FinTrack</h1>
        </header>

        <main className="max-w-lg mx-auto px-4 py-4">
          <Routes>
            <Route path="/" element={<TransactionsPage />} />
            <Route path="/add" element={<AddTransactionPage />} />
            <Route path="/edit/:id" element={<EditTransactionPage />} />
            <Route path="/accounts" element={<AccountsPage />} />
            <Route path="/accounts/:id" element={<AccountDetailsPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/categories/new" element={<CreateCategoryPage />} />
            <Route path="/categories/:catId/sub/new" element={<CreateSubCategoryPage />} />
            <Route path="/summary" element={<SummaryPage />} />
            <Route path="/tally" element={<TallyPage />} />
            <Route path="/templates" element={<TemplatesPage />} />
            <Route path="/templates/new" element={<CreateTemplatePage />} />
            <Route path="/more" element={<MorePage />} />
          </Routes>
        </main>

        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10">
          <div className="max-w-lg mx-auto flex justify-around">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex flex-col items-center py-2 px-3 text-xs ${isActive ? 'text-blue-600' : 'text-gray-500'}`
                }
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </BrowserRouter>
  );
}

function MorePage() {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-gray-800">More</h2>
      <NavLink to="/categories" className="block p-4 bg-white rounded-lg border border-gray-200 hover:bg-gray-50">
        📁 Categories & Sub-categories
      </NavLink>
      <NavLink to="/tally" className="block p-4 bg-white rounded-lg border border-gray-200 hover:bg-gray-50">
        ✅ Tally / Reconciliation
      </NavLink>
      <NavLink to="/templates" className="block p-4 bg-white rounded-lg border border-gray-200 hover:bg-gray-50">
        📋 Transaction Templates
      </NavLink>
    </div>
  );
}
