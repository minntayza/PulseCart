import { SearchResult } from '@/types';
import { apiRequest } from './api';
import { normalizeProduct } from './productService';

export async function searchProducts(query: string, accessToken?: string | null): Promise<SearchResult> {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  const result = await apiRequest<SearchResult>('/search', { method: 'POST', headers, body: JSON.stringify({ query }) });
  return { ...result, products: result.products.map((product) => normalizeProduct(product)) };
}

export async function trackProductView(productId: string, accessToken: string): Promise<SearchResult> {
  return apiRequest<SearchResult>(`/events/product-view/${encodeURIComponent(productId)}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}
