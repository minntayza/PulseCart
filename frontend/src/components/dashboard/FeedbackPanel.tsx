'use client';

import { feedbackMessages, feedbackThemes } from '@/data/feedback';

export default function FeedbackPanel() {
  const severityColors = {
    high: 'bg-danger/10 text-danger',
    medium: 'bg-accent/10 text-accent',
    low: 'bg-success/10 text-success',
  };

  return (
    <div className="space-y-4">
      {/* Themes */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">Identified Themes</h4>
        <div className="space-y-2">
          {feedbackThemes.map((theme, i) => (
            <div key={i} className="p-3 bg-white/5 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span>{theme.icon}</span>
                  <span className="text-sm font-medium text-text">{theme.theme}</span>
                  <span className="text-xs text-muted">({theme.count} mentions)</span>
                </div>
                <span className={`text-[10px] font-medium px-2 py-1 rounded-full ${severityColors[theme.severity]}`}>
                  {theme.severity}
                </span>
              </div>
              <p className="text-xs text-text/70 ml-6">{theme.suggestedFix}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent messages */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">Recent Feedback</h4>
        <div className="space-y-2">
          {feedbackMessages.slice(0, 5).map((msg) => (
            <div key={msg.id} className="p-2 bg-white/5 rounded-lg text-xs">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-text">{msg.userId}</span>
                <span className="text-muted">· {msg.createdAt}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-muted">{msg.theme}</span>
              </div>
              <p className="text-text/70">{msg.message}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
