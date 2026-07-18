export function formatPrice(price: number): string {
  return `${price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} MMK`;
}

/** Map backend category names to frontend display labels */
const CATEGORY_DISPLAY: Record<string, string> = {};
export function displayCategory(category: string): string {
  return CATEGORY_DISPLAY[category] ?? category;
}

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
  severity?: 'low' | 'medium' | 'high';
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

export interface GenerateDetailsRequest {
  name: string;
  category: string;
  description: string;
}

export interface GenerateDetailsResponse {
  shortDescription: string;
  overview: string;
  howItWorks: string;
  bestFor: string[];
  limitations: string[];
}

export interface ChatConversation {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  productIds: string[];
  createdAt: string;
}

export interface WantedProduct {
  id: string;
  userId: string;
  productName: string;
  description: string | null;
  mentionCount: number;
  conversationId: string | null;
  createdAt: string;
  updatedAt: string;
  status: 'pending' | 'stocked' | 'dismissed';
}
