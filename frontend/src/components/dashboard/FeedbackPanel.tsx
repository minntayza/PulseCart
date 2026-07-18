'use client';

import { useEffect, useState } from 'react';
import { FeedbackInsights, FeedbackMessage } from '@/types';
import { getInsights, getFeedback, analyzeFeedback } from '@/services/feedbackService';
import { useAuth } from '@/components/AuthProvider';

export default function FeedbackPanel() {
  const { accessToken } = useAuth();
  const [insights, setInsights] = useState<FeedbackInsights | null>(null);
  const [messages, setMessages] = useState<FeedbackMessage[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);

  const loading = accessToken ? !hasLoaded : false;

  useEffect(() => {
    if (!accessToken) {
      const timer = window.setTimeout(() => setHasLoaded(true), 0);
      return () => window.clearTimeout(timer);
    }
    let cancelled = false;
    Promise.all([getInsights(accessToken), getFeedback(accessToken)])
      .then(([ins, msgs]) => {
        if (!cancelled) {
          setInsights(ins);
          setMessages(msgs);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setInsights(null);
          setMessages([]);
        }
      })
      .finally(() => { if (!cancelled) setHasLoaded(true); });
    return () => { cancelled = true; };
  }, [accessToken]);

  const severityColors: Record<string, string> = {
    high: 'bg-danger/10 text-danger',
    medium: 'bg-accent/10 text-accent',
    low: 'bg-success/10 text-success',
  };

  const handleAnalyze = async () => {
    if (!accessToken || analyzing) return;
    setAnalyzing(true);
    try {
      const ins = await analyzeFeedback(accessToken);
      setInsights(ins);
    } catch { /* ignore */ }
    setAnalyzing(false);
  };

  const themeIcons: Record<string, string> = {
    delivery: '🚚',
    pricing: '💰',
    quality: '⚡',
    service: '🧑‍💼',
    other: '📝',
  };

  const themeKeywords: Record<string, string[]> = {
    delivery: ['delivery', 'shipping', 'late', 'arrived'],
    pricing: ['price', 'expensive', 'cost', 'cheap'],
    quality: ['quality', 'broken', 'defective', 'broke'],
    service: ['service', 'support', 'staff', 'rude'],
  };

  const matchTheme = (feedback: FeedbackMessage, theme: string): boolean => {
    const lower = feedback.message.toLowerCase();
    const keywords = themeKeywords[theme];
    if (keywords) return keywords.some(k => lower.includes(k));
    if (theme !== 'other') return feedback.theme === theme;
    const matchesKnownTheme = Object.values(themeKeywords).some(words =>
      words.some(keyword => lower.includes(keyword)),
    );
    return feedback.theme === 'other' && !matchesKnownTheme;
  };

  return (
    <div className="space-y-6">
      {/* Themes */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Identified Themes</h4>
          <button
            onClick={handleAnalyze}
            disabled={analyzing || messages.length === 0}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary text-white hover:bg-primary/80 shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {analyzing ? '⏳ Analyzing...' : '🔄 Analyze Now'}
          </button>
        </div>
        {loading ? (
          <p className="text-sm text-text-secondary">Loading insights...</p>
        ) : insights && insights.themes.length > 0 ? (
          <div className="space-y-2">
            {insights.themes.map((theme, i) => {
              const isSelected = selectedTheme === theme.theme;
              const matchingMessages = messages.filter(message => matchTheme(message, theme.theme));
              return (
                <div key={i}>
                  <button
                    onClick={() => setSelectedTheme(isSelected ? null : theme.theme)}
                    className={`w-full text-left p-3 rounded-lg border transition-all duration-200 ${
                      isSelected
                        ? 'bg-primary/5 border-primary/30 shadow-sm'
                        : 'bg-surface-alt border-border-light hover:border-primary/20 hover:bg-surface-alt/80'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{themeIcons[theme.theme] || '📝'}</span>
                        <span className="text-sm font-medium text-text capitalize">{theme.theme === 'other' ? 'Others' : theme.theme}</span>
                        <span className="text-xs text-text-secondary">({theme.messageCount} mentions)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${severityColors[theme.severity]}`}>
                          {theme.severity}
                        </span>
                        <span className={`text-xs text-text-muted transition-transform duration-200 ${isSelected ? 'rotate-180' : ''}`}>▾</span>
                      </div>
                    </div>
                    <p className="text-sm text-text-secondary ml-7">{theme.fixSuggestion}</p>
                  </button>
                  {isSelected && matchingMessages.length > 0 && (
                    <div className="mt-2 ml-4 space-y-1.5 border-l-2 border-primary/20 pl-3 animate-slide-up">
                      {matchingMessages.map(msg => (
                        <div key={msg.id} className="p-2.5 bg-surface rounded-lg border border-border-light">
                          <p className="text-sm text-text-secondary leading-relaxed">{msg.message}</p>
                          <span className="text-[11px] text-text-muted mt-1 inline-block">{new Date(msg.createdAt).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {isSelected && matchingMessages.length === 0 && (
                    <div className="mt-2 ml-4 pl-3 border-l-2 border-primary/20">
                      <p className="text-xs text-text-muted py-2">No individual messages found for this theme.</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center">
            <div className="text-2xl mb-2">📊</div>
            <p className="text-sm text-text-secondary">No insights yet.</p>
            <p className="text-xs text-text-muted mt-1">Feedback will be analyzed automatically when messages arrive.</p>
          </div>
        )}
      </div>

      {/* Recent messages */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-3">Recent Feedback</h4>
        {loading ? (
          <p className="text-sm text-text-secondary">Loading feedback...</p>
        ) : messages.length > 0 ? (
          <div className="space-y-2">
            {messages.slice(0, 10).map((msg) => (
              <div key={msg.id} className="p-3 bg-surface-alt rounded-lg border border-border-light">
                <div className="mb-1.5 text-right text-[11px] text-text-muted">{new Date(msg.createdAt).toLocaleDateString()}</div>
                <p className="text-sm text-text-secondary leading-relaxed">{msg.message}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <div className="text-2xl mb-2">💬</div>
            <p className="text-sm text-text-secondary">No feedback messages yet.</p>
            <p className="text-xs text-text-muted mt-1">Customer feedback will appear here once submitted.</p>
          </div>
        )}
      </div>
    </div>
  );
}
