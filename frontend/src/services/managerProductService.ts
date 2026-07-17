import { Product } from '@/types';
import { apiRequest } from './api';
import { normalizeProduct } from './productService';

export async function createManagerProduct(form: FormData, accessToken: string): Promise<Product> {
  const product = await apiRequest<Omit<Product, 'price'> & { price: number | string }>('/manager/products', { method: 'POST', headers: { Authorization: `Bearer ${accessToken}` }, body: form });
  return normalizeProduct(product);
}

export async function updateManagerProduct(id: string, form: FormData, accessToken: string): Promise<Product> {
  const product = await apiRequest<Omit<Product, 'price'> & { price: number | string }>(`/manager/products/${id}`, { method: 'PUT', headers: { Authorization: `Bearer ${accessToken}` }, body: form });
  return normalizeProduct(product);
}

export async function deleteManagerProduct(id: string, accessToken: string): Promise<void> {
  await apiRequest(`/manager/products/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } });
}
