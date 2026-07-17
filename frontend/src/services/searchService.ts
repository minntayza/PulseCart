import { products } from '@/data/products';
import { SearchResult } from '@/types';
import { addTrace } from './storage';

export async function searchProducts(query: string): Promise<SearchResult> {
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const ranked = products
    .map((product, originalIndex) => {
      const name = product.name.toLowerCase();
      const description = product.description.toLowerCase();
      const category = product.category.toLowerCase();
      const score = terms.reduce((total, term) => {
        if (name.includes(term)) return total + 5;
        if (category.includes(term)) return total + 3;
        if (description.includes(term)) return total + 2;
        return total;
      }, 0);
      return { product, score, originalIndex };
    })
    .sort((a, b) => b.score - a.score || a.originalIndex - b.originalIndex)
    .map(({ product }) => product);

  const topProduct = ranked[0];
  const trace = {
    agentName: 'Recommender Agent',
    agentIcon: '🎯',
    status: 'active' as const,
    lastAction: query ? `Re-ranked ${ranked.length} products for “${query}”` : 'Restored the default feed',
    lastRun: 'just now',
    logs: [
      { timestamp: '00:00.000', type: 'trigger' as const, text: `Received search: “${query || 'all products'}”` },
      { timestamp: '00:00.120', type: 'reasoning' as const, text: terms.length ? `Detected interests: ${terms.join(', ')}` : 'No search interests supplied' },
      { timestamp: '00:00.280', type: 'action' as const, text: `Scored and re-ranked ${ranked.length} products` },
      { timestamp: '00:00.420', type: 'result' as const, text: topProduct ? `${topProduct.name} moved to the top of the feed` : 'Default feed restored' },
      { timestamp: '00:00.500', type: 'guardrail' as const, text: 'No sensitive personal attributes stored' },
    ],
  };
  if (query.trim()) addTrace(trace);
  return { products: ranked, trace };
}
