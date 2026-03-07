'use client';

import { usePathname } from 'next/navigation';

export function MainContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Check if on auth pages
  const isAuthPage = pathname?.startsWith('/auth');

  return (
    <main className={`relative flex-1 overflow-auto text-gray-900 transition-all duration-300 ease-in-out ${isAuthPage
      ? 'bg-gradient-to-br from-blue-100 via-sky-100 to-indigo-100'
      : 'bg-gray-50'
      }`}>
      {children}
    </main>
  );
}
