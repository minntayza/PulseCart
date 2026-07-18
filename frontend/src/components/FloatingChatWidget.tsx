'use client';

import { useState } from 'react';
import { useAuth } from './AuthProvider';
import { usePathname } from 'next/navigation';

export default function FloatingChatWidget() {
  const { accessToken } = useAuth();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Array<{id: string; text: string; isUser: boolean}>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hide on manager pages
  if (pathname.startsWith('/manager')) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSubmitting) return;

    const userMessage = { id: Date.now().toString(), text: message.trim(), isUser: true };
    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsSubmitting(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken || ''}`,
        },
        body: JSON.stringify({ message: message.trim() }),
      });

      if (response.ok) {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          text: 'Thank you! Your feedback has been recorded and will be analyzed.',
          isUser: false,
        }]);
      } else {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          text: 'Please log in to submit feedback.',
          isUser: false,
        }]);
      }
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, there was an error submitting your feedback.',
        isUser: false,
      }]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed bottom-6 left-6 z-50 max-sm:bottom-4 max-sm:left-4" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      {isOpen && (
        <div className="mb-4 w-80 rounded-2xl border border-border bg-surface shadow-2xl max-sm:w-[calc(100vw-2rem)]">
          <div className="flex items-center gap-2 rounded-t-2xl border-b border-border bg-primary/10 px-4 py-3">
            <span className="text-lg">💬</span>
            <div>
              <span className="text-sm font-semibold text-foreground">Send Feedback</span>
              <p className="text-xs text-text-muted">Help us improve PulseCart</p>
            </div>
            <button onClick={() => setIsOpen(false)} className="ml-auto text-text-muted hover:text-foreground">✕</button>
          </div>
          <div className="h-64 overflow-y-auto p-4">
            {messages.length === 0 && (
              <div className="py-6 text-center">
                <div className="text-3xl mb-2">💭</div>
                <p className="text-sm text-text-secondary font-medium">Got feedback?</p>
                <p className="text-xs text-text-muted mt-1">Tell us about products, delivery, pricing, or service.</p>
              </div>
            )}
            {messages.map(msg => (
              <div key={msg.id} className={`mb-3 ${msg.isUser ? 'text-right' : 'text-left'}`}>
                <div className={`inline-block max-w-[85%] rounded-xl px-3 py-2 text-sm ${msg.isUser ? 'bg-primary text-white' : 'bg-background text-foreground'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={handleSubmit} className="border-t border-border p-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Share your feedback..."
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-text-muted focus:border-primary/50 focus:outline-none"
                disabled={isSubmitting}
              />
              <button
                type="submit"
                disabled={isSubmitting || !message.trim()}
                className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
              >
                {isSubmitting ? '...' : '→'}
              </button>
            </div>
          </form>
        </div>
      )}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-2xl text-white shadow-lg hover:bg-primary/90 transition-transform hover:scale-105"
        >
          💬
        </button>
        {!isOpen && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-agent text-[10px] font-bold text-white">
            ?
          </span>
        )}
      </div>
    </div>
  );
}
