import { SearchResult } from '@/types';
import { apiRequest } from './api';
import { normalizeProduct } from './productService';

export async function searchProducts(query: string): Promise<SearchResult> {
  const result = await apiRequest<SearchResult>('/search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query }) });
  return { ...result, products: result.products.map((product) => normalizeProduct(product)) };
}
