import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';
import { AuthUser } from '@/types';
import { getSupabaseClient } from './supabase';

export interface AuthResult {
  user: AuthUser;
  accessToken: string | null;
  needsEmailConfirmation: boolean;
}

function toAuthUser(user: User): AuthUser {
  const role = user.app_metadata?.role === 'manager' ? 'manager' : 'customer';
  return { id: user.id, username: user.user_metadata?.username || user.email?.split('@')[0] || 'Customer', email: user.email || '', role };
}

export async function getSession(): Promise<AuthResult | null> {
  const { data, error } = await getSupabaseClient().auth.getSession();
  if (error) throw error;
  if (!data.session?.user) return null;
  return { user: toAuthUser(data.session.user), accessToken: data.session.access_token, needsEmailConfirmation: false };
}

export async function login(email: string, password: string): Promise<AuthResult> {
  const { data, error } = await getSupabaseClient().auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
  if (error) throw new Error(error.message);
  if (!data.user || !data.session) throw new Error('Supabase did not return an authenticated session.');
  return { user: toAuthUser(data.user), accessToken: data.session.access_token, needsEmailConfirmation: false };
}

export async function register(username: string, email: string, password: string): Promise<AuthResult> {
  const { data, error } = await getSupabaseClient().auth.signUp({ email: email.trim().toLowerCase(), password, options: { data: { username: username.trim() } } });
  if (error) throw new Error(error.message);
  if (!data.user) throw new Error('Supabase did not create the account.');
  return { user: toAuthUser(data.user), accessToken: data.session?.access_token ?? null, needsEmailConfirmation: !data.session };
}

export async function logout() {
  const { error } = await getSupabaseClient().auth.signOut();
  if (error) throw new Error(error.message);
}

export function subscribe(callback: (result: AuthResult | null) => void) {
  const { data } = getSupabaseClient().auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
    callback(session?.user ? { user: toAuthUser(session.user), accessToken: session.access_token, needsEmailConfirmation: false } : null);
  });
  return () => data.subscription.unsubscribe();
}
