'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { getWantedProducts, deleteWantedProduct } from '@/services/chatService';
import type { WantedProduct } from '@/types';

type Severity = 'high' | 'medium' | 'low';

function getSeverity(count: number): Severity {
  if (count >= 3) return 'high';
  if (count >= 2) return 'medium';
  return 'low';
}

const INTEREST_BADGES: Record<Severity, { label: string; gradient: string; text: string; icon: string }> = {
  high:   { label: 'High Interest',   gradient: 'from-rose-500/20 to-rose-500/5', text: 'text-rose-500', icon: '🔴' },
  medium: { label: 'Medium Interest', gradient: 'from-amber-500/20 to-amber-500/5', text: 'text-amber-500', icon: '🟠' },
  low:    { label: 'Low Interest',    gradient: 'from-emerald-500/20 to-emerald-500/5', text: 'text-emerald-500', icon: '🟢' },
};

function ProductAvatar({ name }: { name: string }) {
  const initial = name.charAt(0).toUpperCase();
  const colors = [
    'from-violet-600 to-indigo-700',
    'from-sky-500 to-cyan-600',
    'from-rose-500 to-pink-600',
    'from-amber-500 to-orange-600',
    'from-emerald-500 to-teal-600',
    'from-fuchsia-500 to-purple-600',
  ];
  const idx = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length;

  return (
    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors[idx]} flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform duration-300`}>
      <span className="text-xl font-bold text-white/90 leading-none">{initial}</span>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 col-span-full">
      <div className="w-20 h-20 rounded-3xl bg-surface-alt border border-border flex items-center justify-center mb-6 shadow-sm">
        <span className="text-4xl">🎯</span>
      </div>
      <p className="text-lg font-semibold text-foreground mb-2">No market insights yet</p>
      <p className="text-sm text-text-muted text-center max-w-[300px] leading-relaxed">
        As customers interact with the AI, trending product requests will automatically appear here.
      </p>
    </div>
  );
}

export default function WantedPanel() {
  const { accessToken } = useAuth();
  const [items, setItems] = useState<WantedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!accessToken) return;
    setLoading(true);
    getWantedProducts(accessToken)
      .then(setItems)
      .catch(() => setError('Failed to load wanted products'))
      .finally(() => setLoading(false));
  }, [accessToken]);

  const handleDismiss = async (id: string) => {
    if (!accessToken) return;
    try {
      await deleteWantedProduct(accessToken, id);
      setItems(prev => prev.filter(i => i.id !== id));
    } catch {
      setError('Failed to dismiss insight');
    }
  };

  useEffect(load, [load]);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => b.mentionCount - a.mentionCount);
  }, [items]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-64 rounded-2xl skeleton" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger animate-fade-in">
          <span>⚠</span>
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-danger/60 hover:text-danger">✕</button>
        </div>
      )}

      {sortedItems.length === 0 ? (
        <div className="grid grid-cols-1">
          <EmptyState />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sortedItems.map((item) => {
            const sev = getSeverity(item.mentionCount);
            const badge = INTEREST_BADGES[sev];
            const dateStr = new Date(item.updatedAt || item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

            return (
              <div
                key={item.id}
                className="group relative bg-surface rounded-2xl p-6 border border-border/40 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] hover:border-border transition-all duration-300 flex flex-col transform hover:-translate-y-1 overflow-hidden"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <ProductAvatar name={item.productName} />
                    <div className="min-w-0">
                      <h3 className="text-xl font-bold text-foreground truncate">{item.productName}</h3>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary">
                          AI Insight
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium uppercase tracking-wider bg-surface-alt border border-border/50 text-text-muted">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          {dateStr}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDismiss(item.id)}
                    className="p-1.5 rounded-full text-text-muted/60 hover:bg-danger/10 hover:text-danger transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 -mr-2 -mt-2 shrink-0"
                    title="Dismiss Insight"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r ${badge.gradient} ${badge.text} border border-${badge.text}/10`}>
                    <span className="text-[10px]">{badge.icon}</span>
                    {badge.label}
                  </div>
                  <div className="inline-flex items-center justify-center rounded-full px-3 py-1.5 text-xs font-bold bg-foreground text-background shadow-sm">
                    {item.mentionCount} Mention{item.mentionCount !== 1 ? 's' : ''}
                  </div>
                </div>

                <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap flex-grow">
                  {item.description || 'No detailed description provided by the AI for this insight.'}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
