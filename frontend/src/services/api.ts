const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, init);
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      if (body.detail) {
        if (Array.isArray(body.detail)) {
          message = body.detail.map((err: any) => `${err.loc.join('.')}: ${err.msg}`).join(', ');
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
