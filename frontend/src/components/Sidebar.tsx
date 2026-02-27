'use client';

import { useAuth } from '@/context/AuthContext';
import { useSidebar } from '@/context/SidebarContext';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

export function Sidebar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { isOpen, toggleSidebar } = useSidebar();
  const pathname = usePathname();
  
  // Hide sidebar on auth pages
  const isAuthPage = pathname?.startsWith('/auth');
  
  if (isAuthPage) {
    return null;
  }

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  return (
    <>
      {/* Sidebar - Desktop only with smooth animation */}
      <aside
        className={`w-64 bg-gray-900 text-white h-screen flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out ${
          isOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 absolute'
        }`}
      >
        {/* Close button in sidebar header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-700">
          <h2 className="text-lg sm:text-xl font-bold">Finance Pro</h2>
          <button
            onClick={toggleSidebar}
            className="text-xl text-gray-300 hover:text-white transition p-1 cursor-pointer"
            title="Close sidebar"
          >
            ✕
          </button>
        </div>
      <div className="p-6 border-b border-gray-700 bg-gray-800">
        <div className="mb-4">
          <p className="text-sm text-gray-400">Logged in as</p>
          <p className="text-lg font-semibold truncate">{user?.name || 'User'}</p>
        </div>
        <div className="space-y-2 text-sm">
          <p className="text-gray-300">
            <span className="text-gray-400">Email:</span> {user?.email}
          </p>
          <p className="text-gray-300">
            <span className="text-gray-400">User ID:</span> <span className="font-mono bg-gray-700 px-2 py-1 rounded">{user?.userId || 'N/A'}</span>
          </p>
          <p className="text-gray-300">
            <span className="text-gray-400">Monthly Income:</span> ₹{user?.monthlyIncome?.toLocaleString() || 'N/A'}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-6 space-y-4">
        <Link
          href="/dashboard"
          className="block px-4 py-2 rounded-lg hover:bg-gray-800 transition"
        >
          Dashboard
        </Link>
        <Link
          href="/dashboard/transactions"
          className="block px-4 py-2 rounded-lg hover:bg-gray-800 transition"
        >
          Transactions
        </Link>
        <Link
          href="/dashboard/analytics"
          className="block px-4 py-2 rounded-lg hover:bg-gray-800 transition"
        >
          Analytics
        </Link>
        <Link
          href="/dashboard/transactions/new"
          className="block px-4 py-2 rounded-lg hover:bg-gray-800 transition"
        >
          Add Transaction
        </Link>
        <Link
          href="/dashboard/import"
          className="block px-4 py-2 rounded-lg hover:bg-gray-800 transition"
        >
          Import CSV
        </Link>
        
        {/* AI Section */}
        <div className="pt-4 border-t border-gray-700">
          <p className="text-xs text-gray-500 uppercase font-semibold px-4 mb-2">AI & Insights</p>
          <Link
            href="/ai-assistant"
            className="block px-4 py-2 rounded-lg hover:bg-gray-800 transition"
          >
            AI Assistant
          </Link>
          <Link
            href="/dashboard/ml-analytics"
            className="block px-4 py-2 rounded-lg hover:bg-gray-800 transition"
          >
            ML Analytics
          </Link>
          <Link
            href="/dashboard/budget-optimizer"
            className="block px-4 py-2 rounded-lg hover:bg-gray-800 transition"
          >
            Budget Optimizer
          </Link>
        </div>
      </nav>

      {/* Logout */}
      <div className="p-6 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition font-medium"
        >
          Logout
        </button>
      </div>
      </aside>

      {/* Toggle button when sidebar closed */}
      {!isOpen && (
        <button
          onClick={toggleSidebar}
          className="fixed top-4 left-4 z-50 p-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition cursor-pointer"
          title="Open sidebar"
        >
          ☰
        </button>
      )}
    </>
  );
}
