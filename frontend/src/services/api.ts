import { getSupabaseClient } from './supabase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface ValidationIssue {
  loc?: Array<string | number>;
  msg?: string;
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  let response = await fetch(`${API_URL}${path}`, init);

  // Supabase access tokens expire. Refresh once and retry only requests that
  // already supplied authentication; anonymous 401 responses remain unchanged.
  if (response.status === 401 && new Headers(init?.headers).has('Authorization')) {
    const { data, error } = await getSupabaseClient().auth.refreshSession();
    if (!error && data.session?.access_token) {
      const headers = new Headers(init?.headers);
      headers.set('Authorization', `Bearer ${data.session.access_token}`);
      response = await fetch(`${API_URL}${path}`, { ...init, headers });
    }
  }

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      if (body.detail) {
        if (Array.isArray(body.detail)) {
          message = body.detail.map((issue: ValidationIssue) =>
            `${issue.loc?.join('.') ?? 'request'}: ${issue.msg ?? 'Invalid value'}`,
          ).join(', ');
        } else {
          message = body.detail;
        }
      }
    } catch { /* non-JSON error */ }
    throw new Error(message);
  }
  
  if (response.status === 204) {
    return null as unknown as T;
  }
  
  return response.json() as Promise<T>;
}
