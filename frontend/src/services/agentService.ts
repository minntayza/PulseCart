import { AgentTrace } from '@/types';
import { apiRequest } from './api';

export function getAgentTraces(accessToken: string): Promise<AgentTrace[]> {
  return apiRequest<AgentTrace[]>('/agents/traces', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}
