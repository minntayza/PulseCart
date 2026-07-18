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
  imageUrl?: string | null;
  stock?: number;
  overview?: string | null;
  howItWorks?: string | null;
  bestFor?: string[];
  limitations?: string[];
  specifications?: ProductSpecification[];
  deliveryEstimate?: string;
  warranty?: string;
  isActive?: boolean;
}

export interface Order {
  id: string;
  userId: string;
  customerName: string;
  items: Product[];
  address: string;
  phone: string;
  total: number;
  status: 'pending' | 'approved' | 'rejected' | 'delivered';
  createdAt: string;
  deliveredAt?: string | null;
}

export interface ProductSpecification { label: string; value: string; explanation?: string }
export interface ProductDetails {
  overview: string;
  howItWorks: string;
  bestFor: string[];
  limitations: string[];
  specifications: ProductSpecification[];
  stock: number;
  deliveryEstimate: string;
  warranty: string;
}

export interface CheckoutInput {
  userId: string;
  customerName: string;
  address: string;
  phone: string;
  items: Product[];
}

export interface SearchResult {
  products: Product[];
  trace: AgentTrace;
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
  theme: 'delivery' | 'pricing' | 'quality' | 'service' | 'other';
  severity: 'low' | 'medium' | 'high';
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

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: 'customer' | 'manager';
}

export interface FeedbackInsights {
  themes: Array<{
    theme: string;
    severity: 'low' | 'medium' | 'high';
    fixSuggestion: string;
    messageCount: number;
  }>;
  totalMessages: number;
  analyzedAt: string;
}
