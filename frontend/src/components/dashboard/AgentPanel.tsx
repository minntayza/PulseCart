'use client';

import { useCallback, useEffect, useState } from 'react';
import { agentTraces as fixtureTraces } from '@/data/agents';
import { AgentTrace } from '@/types';
import { pulseCartEvents, readTraces } from '@/services/storage';

export default function AgentPanel() {
  const [agentTraces, setAgentTraces] = useState<AgentTrace[]>(fixtureTraces);
  const loadTraces = useCallback(() => {
    const liveTraces = readTraces();
    setAgentTraces(liveTraces.length ? liveTraces : fixtureTraces);
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(loadTraces, 0);
    window.addEventListener(pulseCartEvents.tracesChanged, loadTraces);
    window.addEventListener('storage', loadTraces);
    return () => {
      window.clearTimeout(initialLoad);
      window.removeEventListener(pulseCartEvents.tracesChanged, loadTraces);
      window.removeEventListener('storage', loadTraces);
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
      {agentTraces.map((agent) => (
        <div key={agent.agentName} className="p-3 bg-white/5 rounded-lg">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xl">{agent.agentIcon}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">{agent.agentName}</span>
                <span className={`w-2 h-2 rounded-full ${statusColors[agent.status]}`} />
                <span className="text-[10px] text-text-muted capitalize">{agent.status}</span>
              </div>
              <p className="text-xs text-text-muted">{agent.lastAction} · {agent.lastRun}</p>
            </div>
          </div>

          {/* Logs */}
          <div className="space-y-1 ml-8">
            {agent.logs.map((log, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <span className="text-text-muted font-mono shrink-0">{log.timestamp}</span>
                <span className={`font-medium shrink-0 w-16 ${typeColors[log.type]}`}>{log.type}</span>
                <span className="text-foreground/70">{log.text}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
