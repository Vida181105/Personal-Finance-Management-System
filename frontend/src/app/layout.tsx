import type { Metadata } from 'next';
import { AuthProvider } from '@/context/AuthContext';
import { SidebarProvider } from '@/context/SidebarContext';
import { Sidebar } from '@/components/Sidebar';
import { MainContent } from '@/components/MainContent';
import { ChatWidget } from '@/components/ChatWidget';
import './globals.css';

export const metadata: Metadata = {
  title: 'Finance Pro - Personal Finance Management',
  description: 'Manage your finances with ease',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 overflow-hidden">
        <AuthProvider>
          <SidebarProvider>
            <div className="flex h-screen w-screen">
              <Sidebar />
              <MainContent>{children}</MainContent>
            </div>
            <ChatWidget />
          </SidebarProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
