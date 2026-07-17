import { AgentTrace, Order, Product } from '@/types';

const ORDERS_KEY = 'pulsecart:orders';
const TRACES_KEY = 'pulsecart:traces';
const CART_KEY = 'pulsecart:cart';

export const pulseCartEvents = {
  ordersChanged: 'pulsecart:orders-changed',
  tracesChanged: 'pulsecart:traces-changed',
};

function read<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  const value = window.localStorage.getItem(key);
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T, eventName: string) {
  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event(eventName));
}

export function readOrders() {
  return read<Order[]>(ORDERS_KEY, []);
}

export function writeOrders(orders: Order[]) {
  write(ORDERS_KEY, orders, pulseCartEvents.ordersChanged);
}

export function readTraces() {
  return read<AgentTrace[]>(TRACES_KEY, []);
}

export function addTrace(trace: AgentTrace) {
  const traces = [trace, ...readTraces()].slice(0, 20);
  write(TRACES_KEY, traces, pulseCartEvents.tracesChanged);
}

export function readCart() {
  return read<Product[]>(CART_KEY, []);
}

export function writeCart(cart: Product[]) {
  window.localStorage.setItem(CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new CustomEvent('pulsecart:cart-count', { detail: cart.length }));
}

export function clearCart() {
  writeCart([]);
}
