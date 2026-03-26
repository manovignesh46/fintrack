import { BrowserRouter, Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
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
import LoginPage from './pages/LoginPage';
import { AuthProvider, useAuth } from './context/AuthContext';

const navItems = [
  { to: '/', label: 'Transactions', icon: '📋' },
  { to: '/templates', label: 'Templates', icon: '📝' },
  { to: '/accounts', label: 'Accounts', icon: '🏦' },
  { to: '/summary', label: 'Summary', icon: '📊' },
  { to: '/more', label: 'More', icon: '⋯' },
];

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div>Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;

  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </BrowserRouter>
  );
}

function AppShell() {
  const { isAuthenticated, logout, user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10 flex justify-between items-center">
        <h1 className="text-lg font-bold text-gray-800">FinTrack</h1>
        {isAuthenticated && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">Hi, {user?.username}</span>
            <button
              onClick={logout}
              className="text-sm text-red-600 hover:underline"
            >
              Logout
            </button>
          </div>
        )}
      </header>

      <main className="max-w-lg mx-auto px-4 py-4">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ProtectedRoute><TransactionsPage /></ProtectedRoute>} />
          <Route path="/add" element={<ProtectedRoute><AddTransactionPage /></ProtectedRoute>} />
          <Route path="/edit/:id" element={<ProtectedRoute><EditTransactionPage /></ProtectedRoute>} />
          <Route path="/accounts" element={<ProtectedRoute><AccountsPage /></ProtectedRoute>} />
          <Route path="/accounts/:id" element={<ProtectedRoute><AccountDetailsPage /></ProtectedRoute>} />
          <Route path="/categories" element={<ProtectedRoute><CategoriesPage /></ProtectedRoute>} />
          <Route path="/categories/new" element={<ProtectedRoute><CreateCategoryPage /></ProtectedRoute>} />
          <Route path="/categories/:catId/sub/new" element={<ProtectedRoute><CreateSubCategoryPage /></ProtectedRoute>} />
          <Route path="/summary" element={<ProtectedRoute><SummaryPage /></ProtectedRoute>} />
          <Route path="/tally" element={<ProtectedRoute><TallyPage /></ProtectedRoute>} />
          <Route path="/templates" element={<ProtectedRoute><TemplatesPage /></ProtectedRoute>} />
          <Route path="/templates/new" element={<ProtectedRoute><CreateTemplatePage /></ProtectedRoute>} />
          <Route path="/more" element={<ProtectedRoute><MorePage /></ProtectedRoute>} />
        </Routes>
      </main>

      {isAuthenticated && (
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
      )}
    </div>
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
