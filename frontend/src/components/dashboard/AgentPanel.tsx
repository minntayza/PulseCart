'use client';

import { useCallback, useEffect, useState } from 'react';
import { AgentTrace } from '@/types';
import { getAgentTraces } from '@/services/agentService';
import { useAuth } from '@/components/AuthProvider';

export default function AgentPanel() {
  const { accessToken } = useAuth();
  const [agentTraces, setAgentTraces] = useState<AgentTrace[]>([]);
  const loadTraces = useCallback(async () => {
    if (!accessToken) return;
    try { setAgentTraces(await getAgentTraces(accessToken)); } catch { /* keep last successful data */ }
  }, [accessToken]);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void loadTraces(), 0);
    const interval = window.setInterval(() => void loadTraces(), 5000);
    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(interval);
    };
  }, [loadTraces]);
  const statusColors = {
    active: 'bg-success',
    idle: 'bg-muted',
    error: 'bg-danger',
  };

  const typeColors = {
    trigger: 'text-accent',
    reasoning: 'text-agent',
    action: 'text-primary',
    result: 'text-success',
    guardrail: 'text-danger',
  };

  return (
    <div className="space-y-4">
      {agentTraces.map((agent, index) => (
        <div key={`${agent.agentName}-${agent.lastAction}-${index}`} className="p-3 bg-white/5 rounded-lg">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xl">{agent.agentIcon}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-text">{agent.agentName}</span>
                <span className={`w-2 h-2 rounded-full ${statusColors[agent.status]}`} />
                <span className="text-[10px] text-muted capitalize">{agent.status}</span>
              </div>
              <p className="text-xs text-muted">{agent.lastAction} · {agent.lastRun}</p>
            </div>
          </div>

          {/* Logs */}
          <div className="space-y-1 ml-8">
            {agent.logs.map((log, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <span className="text-muted font-mono shrink-0">{log.timestamp}</span>
                <span className={`font-medium shrink-0 w-16 ${typeColors[log.type]}`}>{log.type}</span>
                <span className="text-text/70">{log.text}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
