'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthCard from './AuthCard';
import { useAuth } from './AuthProvider';

export default function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const registrationMessage = searchParams.get('registered') === 'confirm'
    ? 'Account created. Check your email to confirm it before signing in.'
    : searchParams.get('registered') === 'ready' ? 'Account created. You can now sign in.' : '';

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError(''); setIsSubmitting(true);
    try {
      const user = await login(email, password);
      const requested = searchParams.get('returnTo');
      const safeReturn = requested?.startsWith('/') && !requested.startsWith('//') ? requested : null;
      router.push(safeReturn ?? (user.role === 'manager' ? '/manager' : '/'));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Login failed.');
    } finally { setIsSubmitting(false); }
  };

  return (
    <AuthCard title="Welcome back" subtitle="Sign in to order products or manage the store." footer={<>New to PulseCart? <Link href="/register" className="text-primary">Create an account</Link></>}>
      <form onSubmit={submit} className="space-y-4">
        {registrationMessage && <p className="rounded-lg bg-success-light p-3 text-xs text-success" role="status">{registrationMessage}</p>}
        <label className="block text-sm">Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" className="mt-1 w-full px-3 py-2 bg-white/5 border border-border rounded-lg" /></label>
        <label className="block text-sm">Password<input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" className="mt-1 w-full px-3 py-2 bg-white/5 border border-border rounded-lg" /></label>
        {error && <p className="text-xs text-danger" role="alert">{error}</p>}
        <button disabled={isSubmitting} className="w-full py-2 bg-primary text-white rounded-lg disabled:opacity-50">{isSubmitting ? 'Signing in…' : 'Sign in'}</button>
      </form>
      <div className="mt-5 p-3 bg-agent/5 border border-agent/20 rounded-lg text-xs text-text-muted space-y-1">
        <p><strong>Manager:</strong> manager@pulsecart.demo / Manager123!</p>
        <p><strong>Customer:</strong> customer@pulsecart.demo / Customer123!</p>
      </div>
    </AuthCard>
  );
}
