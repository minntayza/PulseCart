import { apiRequest } from './api';
import type { ChatConversation, ChatMessage, Product, WantedProduct } from '@/types';

export async function listConversations(token: string): Promise<ChatConversation[]> {
  return apiRequest<ChatConversation[]>('/chat/conversations', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function createConversation(token: string, firstMessage?: string): Promise<ChatConversation> {
  return apiRequest<ChatConversation>('/chat/conversations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ firstMessage: firstMessage || null }),
  });
}

export async function getMessages(token: string, conversationId: string): Promise<ChatMessage[]> {
  return apiRequest<ChatMessage[]>(`/chat/conversations/${conversationId}/messages`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function sendMessage(
  token: string,
  conversationId: string,
  content: string,
): Promise<{ message: ChatMessage; products: Product[] }> {
  return apiRequest<{ message: ChatMessage; products: Product[] }>(
    `/chat/conversations/${conversationId}/messages`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content }),
    },
  );
}

export async function getWantedProducts(token: string): Promise<WantedProduct[]> {
  return apiRequest<WantedProduct[]>('/chat/wanted', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function updateWantedStatus(
  token: string,
  wantedId: string,
  status: string,
): Promise<WantedProduct> {
  return apiRequest<WantedProduct>(`/chat/wanted/${wantedId}?status=${status}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
}
