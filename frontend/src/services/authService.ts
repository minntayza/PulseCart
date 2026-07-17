import { AuthUser } from '@/types';

const SESSION_KEY = 'pulsecart:session';
const ACCOUNTS_KEY = 'pulsecart:mock-accounts';

interface StoredAccount { user: AuthUser; passwordHash: string }

const demoAccounts = [
  { email: 'manager@pulsecart.demo', password: 'Manager123!', user: { id: 'manager-demo', username: 'Manager May', email: 'manager@pulsecart.demo', role: 'manager' as const } },
  { email: 'customer@pulsecart.demo', password: 'Customer123!', user: { id: 'customer-demo', username: 'Demo Customer', email: 'customer@pulsecart.demo', role: 'customer' as const } },
];

export function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  const value = window.sessionStorage.getItem(SESSION_KEY);
  if (!value) return null;
  try { return JSON.parse(value) as AuthUser; } catch { return null; }
}

function saveSession(user: AuthUser) {
  window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
  return user;
}

export async function login(email: string, password: string) {
  const account = demoAccounts.find((candidate) => candidate.email.toLowerCase() === email.trim().toLowerCase() && candidate.password === password);
  if (account) return saveSession(account.user);
  const stored = readAccounts().find((candidate) => candidate.user.email === email.trim().toLowerCase());
  if (!stored || stored.passwordHash !== await hashPassword(password)) throw new Error('Invalid email or password.');
  return saveSession(stored.user);
}

export async function register(username: string, email: string, password: string) {
  const accounts = readAccounts();
  if (demoAccounts.some((account) => account.email.toLowerCase() === email.trim().toLowerCase()) || accounts.some((account) => account.user.email === email.trim().toLowerCase())) throw new Error('An account with this email already exists.');
  const user: AuthUser = { id: `customer-${Date.now()}`, username: username.trim(), email: email.trim().toLowerCase(), role: 'customer' };
  const stored: StoredAccount = { user, passwordHash: await hashPassword(password) };
  window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify([...accounts, stored]));
  return saveSession(user);
}

export function logout() {
  window.sessionStorage.removeItem(SESSION_KEY);
}

function readAccounts(): StoredAccount[] {
  const value = window.localStorage.getItem(ACCOUNTS_KEY);
  if (!value) return [];
  try { return JSON.parse(value) as StoredAccount[]; } catch { return []; }
}

async function hashPassword(password: string) {
  const bytes = new TextEncoder().encode(password);
  const digest = await window.crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}
