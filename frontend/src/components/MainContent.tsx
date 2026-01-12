'use client';

import { useSidebar } from '@/context/SidebarContext';
import { usePathname } from 'next/navigation';

export function MainContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Check if on auth pages
  const isAuthPage = pathname?.startsWith('/auth');

  return (
    <main className={`flex-1 overflow-auto transition-all duration-300 ease-in-out ${
      isAuthPage ? 'bg-gradient-to-br from-blue-100 to-purple-100' : 'bg-gray-50'
    }`}>
      {children}
    </main>
  );
}
