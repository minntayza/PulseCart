import { FeedbackInsights, FeedbackMessage } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function authRequest<T>(path: string, token: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }
  if (response.status === 204) return null as unknown as T;
  return response.json() as Promise<T>;
}

export async function getInsights(token: string): Promise<FeedbackInsights | null> {
  return authRequest<FeedbackInsights | null>('/feedback/insights', token);
}

export async function getFeedback(token: string): Promise<FeedbackMessage[]> {
  return authRequest<FeedbackMessage[]>('/feedback', token);
}

export async function analyzeFeedback(token: string): Promise<FeedbackInsights> {
  const response = await fetch(`${API_URL}/feedback/analyze`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(`Analysis failed (${response.status})`);
  return response.json();
}
