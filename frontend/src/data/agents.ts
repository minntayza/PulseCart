import { AgentTrace, AgentActivity } from '@/types';

export const agentTraces: AgentTrace[] = [
  {
    agentName: 'Recommender Agent',
    agentIcon: '🎯',
    status: 'active',
    lastAction: 'Re-ranked feed: 12 products adjusted',
    lastRun: '2m ago',
    logs: [
      { timestamp: '00:00.000', type: 'trigger', text: 'Received search event: "gaming laptop"' },
      { timestamp: '00:00.120', type: 'reasoning', text: 'Loading user profile for user_001...' },
      { timestamp: '00:00.340', type: 'action', text: 'Current affinity: { gaming: 0.78, tech: 0.65 }' },
      { timestamp: '00:00.510', type: 'action', text: 'Updating gaming affinity: 0.78 → 0.92' },
      { timestamp: '00:00.680', type: 'action', text: 'Re-ranking 12 products by new affinity scores' },
      { timestamp: '00:00.890', type: 'result', text: 'Feed updated: ROG Strix G16 moved to #1 position' },
    ],
  },
  {
    agentName: 'Market Analyst Agent',
    agentIcon: '📊',
    status: 'active',
    lastAction: 'Report ready: 2 items need price review',
    lastRun: '15m ago',
    logs: [
      { timestamp: '00:01.200', type: 'trigger', text: 'Scheduled analysis triggered (weekly)' },
      { timestamp: '00:01.350', type: 'action', text: 'Normalizing price data for 15 SKUs...' },
      { timestamp: '00:01.800', type: 'action', text: 'Found price gap: Secretlab 10.6% above competitor' },
      { timestamp: '00:02.100', type: 'action', text: 'Generating price review recommendation...' },
      { timestamp: '00:02.400', type: 'result', text: 'Report ready: 2 items need price review' },
    ],
  },
  {
    agentName: 'Order Coordinator',
    agentIcon: '📦',
    status: 'active',
    lastAction: 'Order #ORD-2847 queued for approval',
    lastRun: '2m ago',
    logs: [
      { timestamp: '00:05.000', type: 'trigger', text: 'Checkout initiated: ROG Strix G16' },
      { timestamp: '00:05.150', type: 'action', text: 'Validating item availability...' },
      { timestamp: '00:05.320', type: 'result', text: 'Item in stock ✓' },
      { timestamp: '00:05.500', type: 'action', text: 'Waiting for delivery details...' },
      { timestamp: '00:12.000', type: 'action', text: 'Delivery details received' },
      { timestamp: '00:12.200', type: 'guardrail', text: 'Manager approval required before confirmation' },
      { timestamp: '00:12.400', type: 'action', text: 'Creating approval task #ORD-2847...' },
      { timestamp: '00:12.600', type: 'result', text: 'Order queued for manager review ✓' },
    ],
  },
  {
    agentName: 'Feedback Agent',
    agentIcon: '💬',
    status: 'active',
    lastAction: 'Insights report ready for review',
    lastRun: '15m ago',
    logs: [
      { timestamp: '00:15.000', type: 'trigger', text: 'Weekly analysis triggered' },
      { timestamp: '00:15.200', type: 'action', text: 'Processing 27 feedback messages...' },
      { timestamp: '00:15.800', type: 'action', text: 'Clustering themes: delivery(12), pricing(8), quality(7)' },
      { timestamp: '00:16.200', type: 'result', text: 'Top insight: "delivery visibility" — 12 mentions' },
      { timestamp: '00:16.400', type: 'action', text: 'Generating suggested fix: Add proactive ETA messages' },
      { timestamp: '00:16.600', type: 'result', text: 'Insights report ready for manager ✓' },
    ],
  },
];

export const recentActivity: AgentActivity[] = [
  { agent: 'Recommender', icon: '🎯', text: 'User searched "gaming laptop" — feed re-ranked', color: 'text-indigo-500', timestamp: '2m ago' },
  { agent: 'Order Coordinator', icon: '📦', text: 'New order #ORD-2847 pending approval', color: 'text-amber-500', timestamp: '2m ago' },
  { agent: 'Market Analyst', icon: '📊', text: 'Weekly analysis complete — 2 alerts', color: 'text-purple-500', timestamp: '15m ago' },
  { agent: 'Feedback Agent', icon: '💬', text: '27 messages clustered into 3 themes', color: 'text-emerald-500', timestamp: '15m ago' },
];
