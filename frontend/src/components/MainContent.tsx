'use client';

import { usePathname } from 'next/navigation';
import { ThemeToggle } from './ThemeToggle';

export function MainContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Check if on auth pages
  const isAuthPage = pathname?.startsWith('/auth');

  return (
    <main className={`relative flex-1 overflow-auto text-gray-900 dark:text-gray-100 transition-all duration-300 ease-in-out ${isAuthPage
        ? 'bg-gradient-to-br from-blue-100 via-sky-100 to-indigo-100 dark:from-gray-950 dark:via-slate-900 dark:to-gray-900'
        : 'bg-gray-50 dark:bg-gray-900'
      }`}>
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      {children}
    </main>
  );
}
