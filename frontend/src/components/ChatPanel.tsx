'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthProvider';
import {
  listConversations,
  createConversation,
  getMessages,
  sendMessage,
} from '@/services/chatService';
import type { ChatMessage, Product } from '@/types';
import { formatPrice, displayCategory } from '@/types';

const QUICK_ACTIONS = [
  '🎮 Gaming setup under $500',
  '🎧 Best headphones',
  '💻 Laptops for work',
  '💰 Budget accessories',
];

export default function ChatPanel({ onClose }: { onClose?: () => void }) {
  const { accessToken, user } = useAuth();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<(ChatMessage & { products?: Product[] })[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const initialized = useRef(false);

  // Load or create single conversation on mount
  useEffect(() => {
    if (!accessToken || initialized.current) return;
    initialized.current = true;

    (async () => {
      try {
        const convs = await listConversations(accessToken);
        if (convs.length > 0) {
          // Use existing conversation
          const conv = convs[0];
          setConversationId(conv.id);
          const msgs = await getMessages(accessToken, conv.id);
          setMessages(msgs);
        } else {
          // Create new conversation
          const conv = await createConversation(accessToken);
          setConversationId(conv.id);
        }
      } catch {
        setError('Failed to load chat');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [accessToken]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on load
  useEffect(() => {
    if (!isLoading) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isLoading]);

  const handleSend = async (text?: string) => {
    const content = text || input.trim();
    if (!content || !accessToken || !conversationId || isSending) return;

    setInput('');
    setIsSending(true);
    setError(null);

    // Add user message optimistically
    const userMsg: ChatMessage & { products?: Product[] } = {
      id: `temp-${Date.now()}`,
      conversationId,
      role: 'user',
      content,
      productIds: [],
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      const result = await sendMessage(accessToken, conversationId, content);
      const assistantMsg: ChatMessage & { products?: Product[] } = {
        ...result.message,
        products: result.products,
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch {
      setMessages(prev => [...prev, {
        id: `err-${Date.now()}`,
        conversationId,
        role: 'assistant' as const,
        content: 'Something went wrong. Please try again.',
        productIds: [],
        createdAt: new Date().toISOString(),
      }]);
    } finally {
      setIsSending(false);
    }
  };

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-sm text-text-muted">Loading...</div>
      </div>
    );
  }

  // ── Chat View ──
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-sm font-semibold text-foreground">AI Chat</span>
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="rounded-md bg-background border border-border px-2 py-1 text-xs text-text-muted hover:text-foreground hover:border-primary/30 transition-colors"
          >
            🗑 Clear
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="py-4">
            <div className="rounded-xl bg-background border border-border px-3 py-2 text-sm text-foreground mb-4">
              Hi {user?.username || 'there'}! 👋 I'm your AI shopping assistant. How can I help you find what you're looking for?
            </div>
            <p className="text-sm text-text-muted text-center mb-4">What are you looking for today?</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {QUICK_ACTIONS.map(action => (
                <button
                  key={action}
                  onClick={() => handleSend(action)}
                  className="rounded-full border border-border bg-background px-3 py-1.5 text-xs text-text-secondary hover:border-primary/50 hover:text-primary transition-colors"
                >
                  {action}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] ${msg.role === 'user' ? '' : 'space-y-2'}`}>
              <div
                className={`rounded-xl px-3 py-2 text-sm ${
                  msg.role === 'user'
                    ? 'bg-primary text-white'
                    : 'bg-background text-foreground border border-border'
                }`}
              >
                {msg.content}
              </div>
              {/* Product cards */}
              {msg.products && msg.products.length > 0 && (
                <div className="space-y-1.5 mt-1.5">
                  {msg.products.map(product => (
                    <a
                      key={product.id}
                      href={`/products/${product.id}`}
                      className="flex items-center gap-3 rounded-lg border border-border bg-surface p-2.5 hover:border-primary/30 transition-colors"
                    >
                      <div className="h-10 w-10 flex-shrink-0 rounded bg-background flex items-center justify-center text-lg">
                        {displayCategory(product.category) === 'laptops' ? '💻' : displayCategory(product.category) === 'headphones' ? '🎧' : displayCategory(product.category) === 'chairs' ? '🪑' : '📦'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">{product.name}</div>
                        <div className="text-xs text-text-muted">{displayCategory(product.category)} · {formatPrice(product.price)}</div>
                      </div>
                      <span className="text-xs text-primary">View →</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isSending && (
          <div className="flex justify-start">
            <div className="rounded-xl bg-background border border-border px-3 py-2 text-sm text-text-muted">
              Thinking...
            </div>
          </div>
        )}

        {error && (
          <div className="text-center">
            <span className="text-xs text-red-500">{error}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={e => { e.preventDefault(); handleSend(); }}
        className="border-t border-border p-3"
      >
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask about products..."
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-text-muted focus:border-primary/50 focus:outline-none"
            disabled={isSending}
          />
          <button
            type="submit"
            disabled={isSending || !input.trim()}
            className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
          >
            {isSending ? '...' : '→'}
          </button>
        </div>
      </form>
    </div>
  );
}
