import { Product } from '@/types';
import { apiRequest } from './api';

type ApiProduct = Omit<Product, 'price'> & { price: number | string };
export function normalizeProduct(product: ApiProduct): Product { return { ...product, price: Number(product.price) }; }
export async function getProducts(): Promise<Product[]> { return (await apiRequest<ApiProduct[]>('/products')).map(normalizeProduct); }
export async function getProduct(id: string): Promise<Product> { return normalizeProduct(await apiRequest<ApiProduct>(`/products/${encodeURIComponent(id)}`)); }
