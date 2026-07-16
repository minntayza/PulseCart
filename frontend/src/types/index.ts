export interface Product {
  id: string;
  name: string;
  category: 'laptops' | 'chairs' | 'headphones' | 'accessories';
  price: number;
  image: string;
  description: string;
  rating: number;
  reviews: number;
  badge?: 'agent' | 'trending' | 'match';
}

export interface Order {
  id: string;
  customerName: string;
  productName: string;
  productImage: string;
  total: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface CompetitorPrice {
  productName: string;
  ourPrice: number;
  competitorPrice: number;
  gapPercent: number;
  recommendation: 'keep' | 'review' | 'bundle';
}

export interface FeedbackMessage {
  id: string;
  userId: string;
  message: string;
  theme: 'delivery' | 'pricing' | 'quality';
  createdAt: string;
}

export interface FeedbackTheme {
  theme: string;
  icon: string;
  count: number;
  severity: 'high' | 'medium' | 'low';
  suggestedFix: string;
}

export interface AgentTrace {
  agentName: string;
  agentIcon: string;
  status: 'active' | 'idle' | 'error';
  lastAction: string;
  lastRun: string;
  logs: TraceLog[];
}

export interface TraceLog {
  timestamp: string;
  type: 'trigger' | 'reasoning' | 'action' | 'result' | 'guardrail';
  text: string;
}

export interface AgentActivity {
  agent: string;
  icon: string;
  text: string;
  color: string;
  timestamp: string;
}

export interface UserProfile {
  id: string;
  name: string;
  interests: Record<string, number>;
}
