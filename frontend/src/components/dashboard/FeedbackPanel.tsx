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
    <div className="space-y-10">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h4 className="text-sm font-bold uppercase tracking-widest text-neutral-500">Identified Themes</h4>
          <button
            onClick={handleAnalyze}
            disabled={analyzing || messages.length === 0}
            className="flex items-center justify-center gap-2 text-sm font-bold px-4 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {analyzing ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Analyzing...</>
            ) : (
              <><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z" clipRule="evenodd" /></svg> Analyze Now</>
            )}
          </button>
        </div>
        
        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-24 bg-neutral-100 rounded-2xl w-full"></div>
            <div className="h-24 bg-neutral-100 rounded-2xl w-full"></div>
          </div>
        ) : insights && insights.themes.length > 0 ? (
          <div className="space-y-4">
            {insights.themes.map((theme, i) => {
              const isSelected = selectedTheme === theme.theme;
              const matchingMessages = messages.filter(message => matchTheme(message, theme.theme));
              return (
                <div key={i} className={`rounded-2xl transition-all duration-300 ${isSelected ? 'bg-white shadow-lg shadow-neutral-200/50 border border-neutral-200' : 'bg-neutral-50 border border-neutral-100 hover:border-neutral-200 hover:bg-white'}`}>
                  <button
                    onClick={() => setSelectedTheme(isSelected ? null : theme.theme)}
                    className="w-full text-left p-5 sm:p-6"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center justify-center w-12 h-12 rounded-2xl bg-white shadow-sm border border-neutral-100 text-2xl">{themeIcons[theme.theme] || '📝'}</span>
                        <div>
                          <span className="block text-lg font-bold text-neutral-900 capitalize tracking-tight">{theme.theme === 'other' ? 'Others' : theme.theme}</span>
                          <span className="text-sm font-medium text-neutral-500">{theme.messageCount} mentions</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full ${theme.severity === 'high' ? 'bg-red-50 text-red-600' : theme.severity === 'medium' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                          {theme.severity} Priority
                        </span>
                        <span className={`text-neutral-400 transition-transform duration-300 ${isSelected ? 'rotate-180' : ''}`}>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg>
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-neutral-600 sm:ml-16 leading-relaxed bg-neutral-100/50 p-4 rounded-xl font-medium border border-neutral-100">{theme.fixSuggestion}</p>
                  </button>
                  
                  <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isSelected ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="p-5 sm:p-6 pt-0 sm:pl-22 space-y-3">
                      {matchingMessages.length > 0 ? matchingMessages.map(msg => (
                        <div key={msg.id} className="p-4 bg-neutral-50 rounded-xl border border-neutral-100 relative before:absolute before:left-0 before:top-4 before:bottom-4 before:w-1 before:bg-blue-600 before:rounded-r-md">
                          <p className="text-sm text-neutral-600 leading-relaxed pl-2">{msg.message}</p>
                          <span className="text-[11px] font-medium text-neutral-400 mt-2 block pl-2">{new Date(msg.createdAt).toLocaleDateString()}</span>
                        </div>
                      )) : (
                        <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-100 text-center">
                          <p className="text-sm text-neutral-500 font-medium">No individual messages found for this theme.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-16 text-center border-2 border-dashed border-neutral-200 rounded-3xl bg-neutral-50/50">
            <div className="text-4xl mb-4 opacity-50">📊</div>
            <p className="text-lg font-bold text-neutral-900">No insights yet</p>
            <p className="text-sm text-neutral-500 mt-1">Feedback will be analyzed automatically when messages arrive.</p>
          </div>
        )}
      </div>

      <div>
        <h4 className="text-sm font-bold uppercase tracking-widest text-neutral-500 mb-6">Recent Feedback</h4>
        {loading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-16 bg-neutral-100 rounded-2xl w-full"></div>
            <div className="h-16 bg-neutral-100 rounded-2xl w-full"></div>
          </div>
        ) : messages.length > 0 ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {messages.slice(0, 10).map((msg) => (
              <div key={msg.id} className="p-5 bg-white rounded-2xl border border-neutral-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                <p className="text-sm text-neutral-600 leading-relaxed font-medium">{msg.message}</p>
                <div className="mt-3 text-[11px] font-bold text-neutral-400 tracking-wider uppercase">{new Date(msg.createdAt).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center border-2 border-dashed border-neutral-200 rounded-3xl bg-neutral-50/50">
            <div className="text-4xl mb-4 opacity-50">💬</div>
            <p className="text-lg font-bold text-neutral-900">No feedback messages yet</p>
            <p className="text-sm text-neutral-500 mt-1">Customer feedback will appear here once submitted.</p>
          </div>
        )}
      </div>
    </div>
  );
}
