'use client';

import { useState } from 'react';
import { AgentActivity } from '@/types';
import { recentActivity } from '@/data/agents';

export default function AgentFeed() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-5 right-5 z-40 flex h-12 items-center gap-2 rounded-full bg-primary px-4 text-xs font-semibold text-white shadow-xl transition hover:-translate-y-0.5 hover:bg-primary-hover max-sm:bottom-20 max-sm:right-4 max-sm:h-10 max-sm:px-3 max-sm:text-[11px]"
      >
        <span className="rounded bg-agent px-1.5 py-0.5 text-[9px] font-black">AI</span> Activity
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 w-80 bg-surface rounded-xl shadow-2xl border border-border overflow-hidden animate-in max-sm:bottom-20 max-sm:right-4 max-sm:w-72">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-agent/10 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-agent animate-pulse" />
          <span className="text-xs font-semibold text-agent">Agent Activity Feed</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-text-muted hover:text-foreground text-xs px-1"
          >
            {isExpanded ? '▼' : '▲'}
          </button>
          <button
            onClick={() => setIsMinimized(true)}
            className="text-text-muted hover:text-foreground text-xs px-1"
          >
            —
          </button>
        </div>
      </div>

      {/* Activity list */}
      {isExpanded && (
        <div className="max-h-64 overflow-y-auto p-2 space-y-1">
          {recentActivity.map((activity, i) => (
            <ActivityItem key={i} activity={activity} />
          ))}
        </div>
      )}
    </div>
  );
}

function ActivityItem({ activity }: { activity: AgentActivity }) {
  return (
    <div className="flex items-start gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors">
      <span className="text-sm shrink-0 mt-0.5">{activity.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold" style={{ color: activity.color }}>
            {activity.agent}
          </span>
          <span className="text-[10px] text-text-muted">· {activity.timestamp}</span>
        </div>
        <p className="text-xs text-foreground/80 leading-relaxed">{activity.text}</p>
      </div>
    </div>
  );
}
