'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthProvider';
import {
  listConversations,
  createConversation,
  getMessages,
  sendMessage,
} from '@/services/chatService';
import type { ChatConversation, ChatMessage, Product } from '@/types';
import { formatPrice } from '@/types';

const QUICK_ACTIONS = [
  '🎮 Gaming setup under $500',
  '🎧 Best headphones',
  '💻 Laptops for work',
  '💰 Budget accessories',
];

type ViewState =
  | { mode: 'list' }
  | { mode: 'chat'; conversationId: string; messages: (ChatMessage & { products?: Product[] })[] }
  | { mode: 'loading' };

export default function ChatPanel({ onClose }: { onClose?: () => void }) {
  const { accessToken } = useAuth();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [view, setView] = useState<ViewState>({ mode: 'list' });
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load conversations on mount
  useEffect(() => {
    if (!accessToken) return;
    listConversations(accessToken)
      .then(setConversations)
      .catch(() => {});
  }, [accessToken]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [view]);

  // Focus input when entering chat mode
  useEffect(() => {
    if (view.mode === 'chat') {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [view]);

  const handleNewChat = async () => {
    if (!accessToken) return;
    setView({ mode: 'loading' });
    try {
      const conv = await createConversation(accessToken);
      setConversations(prev => [conv, ...prev]);
      setView({ mode: 'chat', conversationId: conv.id, messages: [] });
    } catch {
      setError('Failed to create conversation');
      setView({ mode: 'list' });
    }
  };

  const handleSelectConversation = async (conv: ChatConversation) => {
    if (!accessToken) return;
    setView({ mode: 'loading' });
    try {
      const msgs = await getMessages(accessToken, conv.id);
      setView({ mode: 'chat', conversationId: conv.id, messages: msgs });
    } catch {
      setError('Failed to load messages');
      setView({ mode: 'list' });
    }
  };

  const handleSend = async (text?: string) => {
    const content = text || input.trim();
    if (!content || !accessToken || view.mode !== 'chat' || isSending) return;

    setInput('');
    setIsSending(true);
    setError(null);

    // Add user message optimistically
    const userMsg: ChatMessage & { products?: Product[] } = {
      id: `temp-${Date.now()}`,
      conversationId: view.conversationId,
      role: 'user',
      content,
      productIds: [],
      createdAt: new Date().toISOString(),
    };
    setView(v => v.mode === 'chat' ? { ...v, messages: [...v.messages, userMsg] } : v);

    try {
      const result = await sendMessage(accessToken, view.conversationId, content);
      const assistantMsg: ChatMessage & { products?: Product[] } = {
        ...result.message,
        products: result.products,
      };
      setView(v => v.mode === 'chat' ? { ...v, messages: [...v.messages, assistantMsg] } : v);

      // Update conversation list
      setConversations(prev => {
        const updated = prev.map(c =>
          c.id === view.conversationId ? { ...c, updatedAt: new Date().toISOString() } : c,
        );
        return updated.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      });
    } catch {
      setView(v => v.mode === 'chat' ? {
        ...v,
        messages: [...v.messages, {
          id: `err-${Date.now()}`,
          conversationId: view.conversationId,
          role: 'assistant' as const,
          content: 'Something went wrong. Please try again.',
          productIds: [],
          createdAt: new Date().toISOString(),
        }],
      } : v);
    } finally {
      setIsSending(false);
    }
  };

  // ── Conversation List ──
  if (view.mode === 'list') {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div>
            <span className="text-sm font-semibold text-foreground">AI Chat</span>
            <p className="text-xs text-text-muted">Ask about products</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <button
            onClick={handleNewChat}
            className="w-full mb-3 rounded-lg border border-dashed border-border bg-background px-3 py-2.5 text-sm text-text-secondary hover:border-primary/50 hover:text-primary transition-colors"
          >
            + New Chat
          </button>
          {conversations.length === 0 ? (
            <div className="py-8 text-center">
              <div className="text-3xl mb-2">💬</div>
              <p className="text-sm text-text-muted">Start a conversation to get product recommendations.</p>
            </div>
          ) : (
            conversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => handleSelectConversation(conv)}
                className="w-full mb-2 rounded-lg border border-border bg-background px-3 py-2.5 text-left hover:border-primary/30 transition-colors"
              >
                <div className="text-sm font-medium text-foreground truncate">{conv.title}</div>
                <div className="text-xs text-text-muted mt-0.5">
                  {new Date(conv.updatedAt).toLocaleDateString()}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    );
  }

  // ── Loading ──
  if (view.mode === 'loading') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-sm text-text-muted">Loading...</div>
      </div>
    );
  }

  // ── Active Chat ──
  return (
    <div className="flex flex-col h-full">
      {/* Header with back button */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <button
          onClick={() => setView({ mode: 'list' })}
          className="text-text-muted hover:text-foreground text-sm"
        >
          ←
        </button>
        <span className="text-sm font-semibold text-foreground">AI Chat</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {view.messages.length === 0 && (
          <div className="py-4">
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

        {view.messages.map(msg => (
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
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <div className="h-10 w-10 flex-shrink-0 rounded bg-background flex items-center justify-center text-lg">
                        {product.category === 'laptops' ? '💻' : product.category === 'headphones' ? '🎧' : product.category === 'chairs' ? '🪑' : '📦'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">{product.name}</div>
                        <div className="text-xs text-text-muted">{product.category} · {formatPrice(product.price)}</div>
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
