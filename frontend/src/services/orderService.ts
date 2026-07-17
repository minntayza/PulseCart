import { CheckoutInput, Order, Product } from '@/types';
import { apiRequest } from './api';
import { normalizeProduct } from './productService';

interface ApiOrderItem {
  product: Omit<Product, 'price'> & { price: number | string };
  quantity: number;
  lineTotal: number | string;
}

interface ApiOrder extends Omit<Order, 'items' | 'total'> {
  items: ApiOrderItem[];
  total: number | string;
}

function authorization(accessToken: string): HeadersInit {
  return {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };
}

function normalizeOrder(order: ApiOrder): Order {
  return {
    ...order,
    total: Number(order.total),
    // Keep the cart-facing Order type compatible while honoring backend quantities.
    items: order.items.flatMap((item) =>
      Array.from({ length: item.quantity }, () => normalizeProduct(item.product)),
    ),
  };
}

function groupedItems(items: Product[]) {
  const quantities = new Map<string, number>();
  for (const product of items) {
    quantities.set(product.id, (quantities.get(product.id) ?? 0) + 1);
  }
  return Array.from(quantities, ([productId, quantity]) => ({ productId, quantity }));
}

export async function createOrder(input: CheckoutInput, accessToken: string): Promise<Order> {
  const order = await apiRequest<ApiOrder>('/orders', {
    method: 'POST',
    headers: authorization(accessToken),
    body: JSON.stringify({
      customerName: input.customerName.trim(),
      address: input.address.trim(),
      phone: input.phone.trim(),
      items: groupedItems(input.items),
    }),
  });
  return normalizeOrder(order);
}

export async function getOrders(accessToken: string): Promise<Order[]> {
  const orders = await apiRequest<ApiOrder[]>('/manager/orders', {
    headers: authorization(accessToken),
  });
  return orders.map(normalizeOrder);
}

export async function getOrdersForUser(accessToken: string): Promise<Order[]> {
  const orders = await apiRequest<ApiOrder[]>('/orders/me', {
    headers: authorization(accessToken),
  });
  return orders.map(normalizeOrder);
}

export async function updateOrderStatus(id: string, status: 'approved' | 'rejected', accessToken: string): Promise<Order> {
  const order = await apiRequest<ApiOrder>(`/manager/orders/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: authorization(accessToken),
    body: JSON.stringify({ status }),
  });
  return normalizeOrder(order);
}

export async function markOrderDelivered(id: string, accessToken: string): Promise<Order> {
  const order = await apiRequest<ApiOrder>(`/manager/orders/${encodeURIComponent(id)}/deliver`, {
    method: 'POST',
    headers: authorization(accessToken),
  });
  return normalizeOrder(order);
}
