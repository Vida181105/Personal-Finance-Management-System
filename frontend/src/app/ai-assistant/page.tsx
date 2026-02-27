'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AIChat } from '@/components/AIChat';
import { AIInsights } from '@/components/AIInsights';
import Link from 'next/link';

export default function AIAssistantPage() {
  return (
    <ProtectedRoute>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">AI Financial Assistant</h1>
          <p className="text-gray-600 mt-2">Ask questions about your finances. Powered by Google Gemini.</p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat Section - Main */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 h-[700px] flex flex-col overflow-hidden">
              {/* Chat Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4">
                <h2 className="font-bold text-lg">Chat with AI</h2>
                <p className="text-xs text-blue-100">Ask anything about your spending, budgets, or financial insights</p>
              </div>

              {/* Chat Component */}
              <div className="flex-1 overflow-hidden">
                <AIChat />
              </div>
            </div>
          </div>

          {/* Insights Section - Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
              <h2 className="font-bold text-lg text-gray-900 mb-4">Your Insights</h2>
              <div className="space-y-4 max-h-[620px] overflow-y-auto pr-2">
                <AIInsights />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Tips */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Tip: Ask about spending</h3>
            <p className="text-sm text-blue-700">Try asking: "How much did I spend on food?" or "What's my biggest expense category?"</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-2">Tip: Get insights</h3>
            <p className="text-sm text-green-700">Ask the AI to analyze your spending patterns and find savings opportunities.</p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3 className="font-semibold text-purple-900 mb-2">Tip: Budget help</h3>
            <p className="text-sm text-purple-700">Ask for budget recommendations or category breakdowns to improve your finances.</p>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="mt-8 flex gap-4 justify-center">
          <Link
            href="/dashboard"
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            ← Back to Dashboard
          </Link>
          <Link
            href="/dashboard/transactions"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            View Transactions →
          </Link>
        </div>
      </div>
    </ProtectedRoute>
  );
}
