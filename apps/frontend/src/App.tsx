import { BrowserRouter, Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
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
  { to: '/accounts', label: 'Loans', icon: '🏦' },
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
  const { isAuthenticated, logout, user, editMode, setEditMode } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : '?';

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10 flex justify-between items-center">
        <h1 className="text-lg font-bold text-gray-800">FinTrack</h1>
        {isAuthenticated && (
          <div className="flex items-center gap-3">
            {/* Edit mode toggle */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500">Edit</span>
              <button
                onClick={() => setEditMode(!editMode)}
                className={`relative w-9 h-5 rounded-full transition-colors duration-200 focus:outline-none ${
                  editMode ? 'bg-blue-600' : 'bg-gray-300'
                }`}
                aria-label="Toggle edit mode"
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                    editMode ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* User avatar with dropdown */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowUserMenu((v) => !v)}
                className="w-8 h-8 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1"
              >
                {initials}
              </button>
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-36 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
                  <div className="px-3 py-2 border-b border-gray-100">
                    <p className="text-xs text-gray-500">Signed in as</p>
                    <p className="text-xs font-semibold text-gray-800 truncate">{user?.username}</p>
                  </div>
                  <button
                    onClick={() => { setShowUserMenu(false); logout(); }}
                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
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
