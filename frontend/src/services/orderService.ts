import { CheckoutInput, Order } from '@/types';
import { addTrace, readOrders, writeOrders } from './storage';

function orderId() {
  return `ORD-${Date.now().toString().slice(-6)}`;
}

export async function createOrder(input: CheckoutInput): Promise<Order> {
  const order: Order = {
    id: orderId(),
    userId: input.userId,
    customerName: input.customerName.trim(),
    items: input.items,
    address: input.address.trim(),
    phone: input.phone.trim(),
    total: input.items.reduce((sum, item) => sum + item.price, 0),
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  writeOrders([order, ...readOrders()]);
  addTrace({
    agentName: 'Order Coordinator', agentIcon: '📦', status: 'active',
    lastAction: `Order ${order.id} queued for approval`, lastRun: 'just now',
    logs: [
      { timestamp: '00:00.000', type: 'trigger', text: `Checkout submitted with ${order.items.length} item(s)` },
      { timestamp: '00:00.100', type: 'reasoning', text: 'Address and phone passed validation' },
      { timestamp: '00:00.220', type: 'action', text: `Created approval task ${order.id}` },
      { timestamp: '00:00.320', type: 'guardrail', text: 'Manager approval required before confirmation' },
      { timestamp: '00:00.400', type: 'result', text: 'Order added to the manager queue' },
    ],
  });
  return order;
}

export async function getOrders(): Promise<Order[]> {
  return readOrders().sort((a, b) => {
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (a.status !== 'pending' && b.status === 'pending') return 1;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export async function getOrdersForUser(userId: string): Promise<Order[]> {
  return (await getOrders()).filter((order) => order.userId === userId);
}

export async function updateOrderStatus(id: string, status: 'approved' | 'rejected'): Promise<Order> {
  const orders = readOrders();
  const order = orders.find((candidate) => candidate.id === id);
  if (!order) throw new Error('Order not found');
  const updated = { ...order, status };
  writeOrders(orders.map((candidate) => candidate.id === id ? updated : candidate));
  addTrace({
    agentName: 'Order Coordinator', agentIcon: '📦', status: 'active',
    lastAction: `${id} ${status} by manager`, lastRun: 'just now',
    logs: [
      { timestamp: '00:00.000', type: 'trigger', text: `Manager selected ${status}` },
      { timestamp: '00:00.100', type: 'guardrail', text: 'Human decision received' },
      { timestamp: '00:00.200', type: 'action', text: `Changed ${id} status to ${status}` },
      { timestamp: '00:00.300', type: 'result', text: `Order is now ${status}` },
    ],
  });
  return updated;
}
