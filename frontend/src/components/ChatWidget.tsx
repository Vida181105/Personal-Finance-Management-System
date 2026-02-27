'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { AIChat } from './AIChat';

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  
  // Don't show chat widget on auth pages
  if (pathname?.startsWith('/auth')) {
    return null;
  }

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200 flex items-center justify-center text-2xl z-40"
          title="Open AI Assistant"
        >
          💬
        </button>
      )}

      {/* Chat Widget */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-lg shadow-2xl flex flex-col z-50 border border-gray-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex items-center justify-between rounded-t-lg">
            <div>
              <h3 className="font-bold text-lg">AI Financial Assistant</h3>
              <p className="text-xs text-blue-100">Powered by Gemini</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-blue-800 rounded-full p-1 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Chat Content */}
          <div className="flex-1 overflow-hidden">
            <AIChat />
          </div>
        </div>
      )}
    </>
  );
}
