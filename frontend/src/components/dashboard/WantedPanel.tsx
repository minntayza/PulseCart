'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { getWantedProducts, updateWantedStatus } from '@/services/chatService';
import type { WantedProduct } from '@/types';

/* ─── Severity helpers ─── */
type Severity = 'high' | 'medium' | 'low';

function getSeverity(count: number): Severity {
  if (count >= 3) return 'high';
  if (count >= 2) return 'medium';
  return 'low';
}

const SEVERITY_CONFIG: Record<Severity, { label: string; color: string; bg: string; pulse: string; strip: string }> = {
  high:   { label: 'High demand',   color: 'text-danger',  bg: 'bg-danger/10',  pulse: 'animate-pulse', strip: 'bg-danger' },
  medium: { label: 'Moderate',      color: 'text-accent',  bg: 'bg-accent/10',  pulse: '',               strip: 'bg-accent' },
  low:    { label: 'Single request', color: 'text-success', bg: 'bg-success/10', pulse: '',               strip: 'bg-success/50' },
};

/* ─── Status badge config ─── */
const STATUS_STYLES: Record<string, { classes: string; icon: string }> = {
  pending:   { classes: 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/20',  icon: '⏳' },
  stocked:   { classes: 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/20', icon: '✓' },
  dismissed: { classes: 'bg-white/5 text-white/40 ring-1 ring-white/10',            icon: '—' },
};

/* ─── Sparkline (inline SVG) ─── */
function Sparkline({ dates, width = 120, height = 32 }: { dates: string[]; width?: number; height?: number }) {
  // Group by day for last 7 days
  const now = new Date();
  const buckets = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });
  const counts = buckets.map(b => dates.filter(d => d.startsWith(b)).length);
  const max = Math.max(...counts, 1);

  const points = counts.map((c, i) => {
    const x = (i / (buckets.length - 1)) * width;
    const y = height - (c / max) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="shrink-0">
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill="url(#spark-fill)" />
      <polyline points={points} fill="none" stroke="var(--primary)" strokeWidth="1.5" strokeLinejoin="round" />
      {counts.map((c, i) => c > 0 && (
        <circle
          key={i}
          cx={(i / (buckets.length - 1)) * width}
          cy={height - (c / max) * (height - 4) - 2}
          r="2"
          fill="var(--primary)"
        />
      ))}
    </svg>
  );
}

/* ─── Initial Avatar ─── */
function ProductAvatar({ name }: { name: string }) {
  const initial = name.charAt(0).toUpperCase();
  // Deterministic color from name
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
    <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${colors[idx]} flex items-center justify-center shrink-0`}>
      <span className="text-sm font-bold text-white/90 leading-none">{initial}</span>
    </div>
  );
}

/* ─── Empty State ─── */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6">
      <div className="w-16 h-16 rounded-2xl bg-surface-alt border border-border flex items-center justify-center mb-4">
        <span className="text-3xl">🎯</span>
      </div>
      <p className="text-sm font-medium text-foreground mb-1">No wanted products yet</p>
      <p className="text-xs text-text-muted text-center max-w-[260px] leading-relaxed">
        As customers chat with AI, product requests will surface here for you to review and stock.
      </p>
    </div>
  );
}

/* ─── Main Component ─── */
export default function WantedPanel() {
  const { accessToken } = useAuth();
  const [items, setItems] = useState<WantedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Severity | 'all'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const load = useCallback(() => {
    if (!accessToken) return;
    setLoading(true);
    getWantedProducts(accessToken)
      .then(setItems)
      .catch(() => setError('Failed to load wanted products'))
      .finally(() => setLoading(false));
  }, [accessToken]);

  /* Initial load */
  useEffect(load, [load]);

  /* Auto-refresh every 10 seconds (silent — no loading spinner) */
  useEffect(() => {
    if (!accessToken) return;
    const interval = setInterval(() => {
      getWantedProducts(accessToken)
        .then(setItems)
        .catch(() => {}); // silent — ignore transient errors
    }, 10_000);
    return () => clearInterval(interval);
  }, [accessToken]);

  /* Derived counts */
  const counts = useMemo(() => {
    const severityCounts = { high: 0, medium: 0, low: 0, pending: 0 };
    items.forEach(item => {
      const sev = getSeverity(item.mentionCount);
      severityCounts[sev]++;
      if (item.status === 'pending') severityCounts.pending++;
    });
    return severityCounts;
  }, [items]);

  const totalMentions = useMemo(() => items.reduce((sum, i) => sum + i.mentionCount, 0), [items]);

  /* Filtered items */
  const filtered = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter(i => getSeverity(i.mentionCount) === filter);
  }, [items, filter]);

  /* Actions */
  const handleStatus = async (id: string, status: string) => {
    if (!accessToken) return;
    try {
      const updated = await updateWantedStatus(accessToken, id, status);
      setItems(prev => prev.map(i => i.id === id ? updated : i));
    } catch {
      setError('Failed to update status');
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(i => i.id)));
    }
  };

  const bulkAction = async (status: string) => {
    if (!accessToken || selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    try {
      const results = await Promise.all(ids.map(id => updateWantedStatus(accessToken, id, status)));
      const resultMap = new Map(results.map(r => [r.id, r]));
      setItems(prev => prev.map(i => resultMap.get(i.id) || i));
      setSelectedIds(new Set());
    } catch {
      setError('Failed to update some items');
    }
  };

  /* Loading state */
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 rounded-xl skeleton" />
          ))}
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-14 rounded-lg skeleton" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ─── Filter Metric Cards ─── */}
      <div className="grid grid-cols-4 gap-2.5">
        {/* Total */}
        <button
          onClick={() => setFilter('all')}
          className={`text-left rounded-xl border p-3 transition-all duration-200 ${
            filter === 'all'
              ? 'border-primary/40 bg-primary/5 shadow-sm'
              : 'border-border bg-surface hover:border-border hover:bg-surface-alt'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-2xl font-bold text-foreground">{items.length}</span>
            <span className="text-[11px] text-text-muted font-medium uppercase tracking-wider">All</span>
          </div>
          <div className="text-xs text-text-muted">
            {totalMentions} total mention{totalMentions !== 1 ? 's' : ''}
          </div>
        </button>

        {/* High severity */}
        <button
          onClick={() => setFilter(filter === 'high' ? 'all' : 'high')}
          className={`text-left rounded-xl border p-3 transition-all duration-200 ${
            filter === 'high'
              ? 'border-danger/40 bg-danger/5 shadow-sm'
              : 'border-border bg-surface hover:border-danger/20 hover:bg-surface-alt'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-2xl font-bold text-danger">{counts.high}</span>
            <span className="text-[11px] font-medium uppercase tracking-wider text-danger/70">High</span>
          </div>
          <div className="text-xs text-text-muted">3+ mentions</div>
        </button>

        {/* Medium severity */}
        <button
          onClick={() => setFilter(filter === 'medium' ? 'all' : 'medium')}
          className={`text-left rounded-xl border p-3 transition-all duration-200 ${
            filter === 'medium'
              ? 'border-accent/40 bg-accent/5 shadow-sm'
              : 'border-border bg-surface hover:border-accent/20 hover:bg-surface-alt'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-2xl font-bold text-accent">{counts.medium}</span>
            <span className="text-[11px] font-medium uppercase tracking-wider text-accent/70">Med</span>
          </div>
          <div className="text-xs text-text-muted">2 mentions</div>
        </button>

        {/* Pending review */}
        <button
          onClick={() => setFilter(filter === 'low' ? 'all' : 'low')}
          className={`text-left rounded-xl border p-3 transition-all duration-200 ${
            filter === 'low'
              ? 'border-success/40 bg-success/5 shadow-sm'
              : 'border-border bg-surface hover:border-success/20 hover:bg-surface-alt'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-2xl font-bold text-success">{counts.low}</span>
            <span className="text-[11px] font-medium uppercase tracking-wider text-success/70">Low</span>
          </div>
          <div className="text-xs text-text-muted">1 mention</div>
        </button>
      </div>

      {/* ─── Active filter indicator ─── */}
      {filter !== 'all' && (
        <div className="flex items-center gap-2 text-xs text-text-muted animate-fade-in">
          <span>Showing {filter} demand items ({filtered.length})</span>
          <button
            onClick={() => setFilter('all')}
            className="text-primary hover:text-primary-hover font-medium"
          >
            Clear filter
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-danger/20 bg-danger/5 px-3 py-2 text-sm text-danger">
          <span>⚠</span>
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-danger/60 hover:text-danger">✕</button>
        </div>
      )}

      {/* ─── Bulk action bar ─── */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5 animate-slide-up">
          <span className="text-sm font-medium text-primary">{selectedIds.size} selected</span>
          <div className="flex-1" />
          <button
            onClick={() => bulkAction('stocked')}
            className="rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20 transition-colors"
          >
            ✓ Stock all
          </button>
          <button
            onClick={() => bulkAction('dismissed')}
            className="rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-white/50 hover:bg-white/10 transition-colors"
          >
            Dismiss all
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-xs text-text-muted hover:text-foreground transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {/* ─── Table ─── */}
      {items.length === 0 ? (
        <EmptyState />
      ) : filtered.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-sm text-text-muted">
            No items match <span className="font-medium text-primary">{filter}</span> severity.
          </p>
          <button onClick={() => setFilter('all')} className="mt-2 text-xs text-primary hover:text-primary-hover font-medium">
            Show all items
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-alt/50">
                <th className="w-8 px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === filtered.length && filtered.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-border accent-primary h-3.5 w-3.5"
                  />
                </th>
                <th className="px-3 py-2.5 text-left font-medium text-text-muted text-xs uppercase tracking-wider">Product</th>
                <th className="px-3 py-2.5 text-left font-medium text-text-muted text-xs uppercase tracking-wider hidden sm:table-cell">Description</th>
                <th className="px-3 py-2.5 text-center font-medium text-text-muted text-xs uppercase tracking-wider w-20">Mentions</th>
                <th className="px-3 py-2.5 text-left font-medium text-text-muted text-xs uppercase tracking-wider w-24">Status</th>
                <th className="px-3 py-2.5 text-right font-medium text-text-muted text-xs uppercase tracking-wider w-32">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, idx) => {
                const sev = getSeverity(item.mentionCount);
                const config = SEVERITY_CONFIG[sev];
                const statusConf = STATUS_STYLES[item.status];
                const isEven = idx % 2 === 0;
                const isSelected = selectedIds.has(item.id);

                return (
                  <tr
                    key={item.id}
                    className={`group border-b border-border/40 transition-colors ${
                      isSelected ? 'bg-primary/5' : isEven ? 'bg-surface' : 'bg-surface-alt/30'
                    } hover:bg-surface-alt`}
                  >
                    {/* Pulse strip + checkbox */}
                    <td className="px-3 py-3 relative">
                      <div className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-r ${config.strip} ${sev === 'high' ? 'animate-pulse' : ''}`} />
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(item.id)}
                        className="rounded border-border accent-primary h-3.5 w-3.5 relative z-10"
                      />
                    </td>

                    {/* Product name + avatar */}
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2.5">
                        <ProductAvatar name={item.productName} />
                        <div className="min-w-0">
                          <div className="font-medium text-foreground truncate text-[13px]">{item.productName}</div>
                          <div className="text-[11px] text-text-muted sm:hidden truncate max-w-[160px]">
                            {item.description || 'No description'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Description */}
                    <td className="px-3 py-3 hidden sm:table-cell">
                      <span className="text-xs text-text-muted truncate block max-w-[220px]">
                        {item.description || '—'}
                      </span>
                    </td>

                    {/* Mentions — bold pill */}
                    <td className="px-3 py-3 text-center">
                      <span className={`inline-flex items-center justify-center min-w-[28px] rounded-lg px-2 py-0.5 text-xs font-bold ${config.bg} ${config.color}`}>
                        {item.mentionCount}
                      </span>
                    </td>

                    {/* Status badge */}
                    <td className="px-3 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${statusConf?.classes}`}>
                        <span className="text-[10px]">{statusConf?.icon}</span>
                        {item.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        {item.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleStatus(item.id, 'stocked')}
                              title="Add to inventory"
                              className="rounded-lg p-1.5 text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleStatus(item.id, 'dismissed')}
                              title="Dismiss request"
                              className="rounded-lg p-1.5 text-text-muted hover:bg-danger/10 hover:text-danger transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </>
                        )}
                        {item.status !== 'pending' && (
                          <button
                            onClick={() => handleStatus(item.id, 'pending')}
                            title="Reopen request"
                            className="rounded-lg p-1.5 text-text-muted hover:bg-primary/10 hover:text-primary transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── Sparkline trend (shown when sparse data) ─── */}
      {items.length > 0 && items.length <= 3 && (
        <div className="flex items-center gap-4 rounded-xl border border-border bg-surface p-4">
          <div className="min-w-0">
            <div className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1">Request trend (7 days)</div>
            <div className="text-[11px] text-text-muted">
              {totalMentions} mention{totalMentions !== 1 ? 's' : ''} across {items.length} product{items.length !== 1 ? 's' : ''}
            </div>
          </div>
          <Sparkline dates={items.map(i => i.createdAt)} />
        </div>
      )}
    </div>
  );
}
