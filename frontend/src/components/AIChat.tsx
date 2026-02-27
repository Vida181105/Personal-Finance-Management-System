'use client';

import { useState, useRef, useEffect } from 'react';
import { aiService } from '@/services/ai';
import { Button } from './Button';
import { Input } from './Input';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  loading?: boolean;
}

export const AIChat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: "Hi! I'm your AI finance assistant. Ask me anything about your spending, budgets, or financial insights.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const suggestions = [
    'What did I spend the most on?',
    'How much did I spend this month?',
    'Show me my spending by category',
    'Any unusual transactions?',
    'How can I save money?',
  ];

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText ?? input.trim();

    if (!text) return;

    // Clear loading state from previous messages
    setError('');

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Call AI service
      const response = await aiService.query(text);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response.answer || 'Sorry, I could not generate a response. Please try again.',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      const statusCode = err.response?.status;
      // Use the server's error message directly, fall back to generic message
      let errorMessage =
        err.response?.data?.message || err.message || 'Failed to get response from AI. Please try again.';

      if (statusCode === 429) {
        errorMessage = err.response?.data?.message || 'Too many requests. Please wait a moment before asking another question.';
      }

      // Add error message
      const errorAssistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `I encountered an error: ${errorMessage}`,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorAssistantMessage]);
      setError(errorMessage);
    } finally {
      setLoading(false);
      // Start 5-second cooldown to avoid hitting Gemini rate limits
      setCooldown(5);
      cooldownRef.current = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(cooldownRef.current!);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-md border border-gray-200">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 border-b border-gray-200">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.type === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-gray-200 text-gray-900 rounded-bl-none'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <p className={`text-xs mt-1 ${message.type === 'user' ? 'text-blue-100' : 'text-gray-600'}`}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-200 text-gray-900 px-4 py-2 rounded-lg rounded-bl-none">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions (shown when no messages yet, or on demand) */}
      {messages.length === 1 && !loading && (
        <div className="px-4 py-3 border-t border-gray-200 bg-white">
          <p className="text-xs text-gray-600 mb-2 font-semibold">Suggested questions:</p>
          <div className="grid grid-cols-1 gap-2">
            {suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(suggestion)}
                className="text-left text-xs p-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded border border-blue-200 transition"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="px-4 py-2 bg-red-50 border-t border-red-200 text-red-700 text-sm">
          <p className="font-semibold">Error</p>
          <p className="text-xs">{error}</p>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4 bg-white rounded-b-lg">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Ask about your spending..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !loading && !cooldown) {
                handleSendMessage();
              }
            }}
            disabled={loading || cooldown > 0}
            className="flex-1"
          />
          <Button
            onClick={() => handleSendMessage()}
            disabled={loading || !input.trim() || cooldown > 0}
            className="px-6"
          >
            {loading ? 'Thinking...' : cooldown > 0 ? `Wait ${cooldown}s` : 'Send'}
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Tip: Ask specific questions like "How much did I spend on food?" for better answers
        </p>
      </div>
    </div>
  );
};
